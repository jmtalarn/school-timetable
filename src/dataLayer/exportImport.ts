import { ExportBundleSchema, type ExportBundle } from './schemas'
import { readDB, STORAGE_KEY } from './db'
import { toBase64, fromBase64 } from './utils'

export function buildExportBundle(): ExportBundle {
	const db = readDB()
	const bundle: ExportBundle = {
		version: 1,
		matters: db.matters,
		kids: db.kids,
		timetables: db.timetables,
	}
	ExportBundleSchema.parse(bundle) // validate
	return bundle
}

export function encodeBundleToLink(baseUrl?: string): string {
	const payload = JSON.stringify(buildExportBundle())
	const encoded = toBase64(payload)
	const url = new URL(baseUrl ?? window.location.origin + window.location.pathname)
	url.hash = `#data=${encoded}`
	return url.toString()
}

export function tryImportFromURL(urlLike?: string): { ok: true } | { ok: false; error: string } {
	try {
		const url = new URL(urlLike ?? window.location.href)
		const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash
		const params = new URLSearchParams(hash)
		const b64 = params.get('data')
		if (!b64) return { ok: false, error: 'No data found in link' }
		const json = fromBase64(b64)
		const parsed = ExportBundleSchema.parse(JSON.parse(json))
		// Write, replacing current DB completely:
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				matters: parsed.matters,
				kids: parsed.kids,
				timetables: parsed.timetables,
			}),
		)
		return { ok: true }
	} catch (e: unknown) {
		return { ok: false, error: e instanceof Error ? e.message : 'Import failed' }
	}
}
