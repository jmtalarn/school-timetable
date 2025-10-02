// filepath: netlify/functions/bundles.ts
import { getStore } from '@netlify/blobs'

/**
 * CONFIG
 * - If you create a named Blobs store in the Netlify UI, set BUNDLES_STORE to that name.
 * - Otherwise we use the built-in "site" store that always exists.
 * - For production-only access from the front-end, set APP_ORIGIN to your site origin.
 */
const STORE_NAME = process.env.BUNDLES_STORE || 'site'
const KEY_PREFIX = 'bundles/'
const ALLOW_ORIGIN = process.env.APP_ORIGIN || '*'

// ----- small helpers -----
const baseHeaders = {
	'Access-Control-Allow-Origin': ALLOW_ORIGIN,
	'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type',
}

function json(status: number, data: unknown): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json', ...baseHeaders },
	})
}

function noContent(status = 204): Response {
	return new Response('', { status, headers: baseHeaders })
}

function looksLikeBundle(obj: any): boolean {
	return !!obj && Array.isArray(obj.kids) && Array.isArray(obj.matters) && Array.isArray(obj.timetables)
}

function makeId(): string {
	const uuid = (globalThis.crypto as any)?.randomUUID?.() ?? Math.random().toString(36).slice(2, 10)
	return `${Date.now().toString(36)}-${uuid}`
}

// ----- v2 function: Request → Response -----
export default async function handler(request: Request): Promise<Response> {
	// CORS preflight
	if (request.method === 'OPTIONS') return noContent()

	const store = getStore(STORE_NAME)

	try {
		if (request.method === 'POST') {
			// Accept either the bundle directly or { bundle: … }
			const body = await safeJson(request)
			if (!body.ok) return json(400, { error: body.error })

			const bundle = body.value?.bundle ?? body.value
			if (!looksLikeBundle(bundle)) return json(400, { error: 'Invalid bundle payload' })

			const str = JSON.stringify(bundle)
			if (str.length > 1_000_000) return json(413, { error: 'Bundle too large' }) // ~1MB guard

			const id = makeId()
			await store.set(KEY_PREFIX + id, str, {
				contentType: 'application/json',
				metadata: {
					createdAt: new Date().toISOString(),
					expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 * 3).toISOString(), // 30d * 3
					version: String(bundle.version ?? ''),
				},
			})
			return json(200, { id })
		}

		if (request.method === 'GET') {
			const url = new URL(request.url)
			const id = url.searchParams.get('id')
			if (!id) return json(400, { error: 'Missing ?id' })
			const key = KEY_PREFIX + id
			const bundle = await store.get(key, { type: 'json' })
			if (!bundle) return json(404, { error: 'Not found' })

			const exp = bundle.metadata?.expiresAt && new Date(bundle.metadata.expiresAt as string)
			if (exp && !Number.isNaN(+exp) && Date.now() > +exp) {
				await store.delete(key)
				return json(404, { error: 'Expired' })
			}
			return json(200, bundle)
		}

		return json(405, { error: 'Method Not Allowed' })
	} catch (err: any) {
		return json(500, { error: err?.message || 'Server error' })
	}
}

// Parse JSON safely with a friendly error
async function safeJson(req: Request): Promise<{ ok: true; value: any } | { ok: false; error: string }> {
	const ct = req.headers.get('content-type') || ''
	if (!ct.includes('application/json')) return { ok: false, error: 'Expected application/json' }
	try {
		return { ok: true, value: await req.json() }
	} catch {
		return { ok: false, error: 'Invalid JSON' }
	}
}
