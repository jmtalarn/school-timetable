// filepath: src/dataLayer/exportImport.ts
import { type Kid, type Matter, type Timetable, type AppConfig, type Weekday, type TimeBlock, AllWeekdays } from '../types'
import { readDB, writeDB } from './db'
import { ExportBundleSchema, type ExportBundle } from './schemas'
import { fromBase64, toBase64 } from './utils'

// // --- helpers ---
// function normalizeName(n: string) {
// 	return n.trim().toLowerCase()
// }
// function compareHHMM(a: string, b: string) {
// 	const [ah, am] = a.split(':').map(Number)
// 	const [bh, bm] = b.split(':').map(Number)
// 	return (ah * 60 + am) - (bh * 60 + bm)
// }
// function isBeforeISO(a?: string, b?: string) {
// 	if (!a) return false
// 	if (!b) return true
// 	// ISO YYYY-MM-DD compares lexicographically
// 	return a < b
// }
// function isAfterISO(a?: string, b?: string) {
// 	if (!a) return false
// 	if (!b) return true
// 	return a > b
// }
// function uid(prefix = 'id'): string {
// 	if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
// 		return `${prefix}-${(crypto as any).randomUUID()}`
// 	}
// 	return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
// }

// compute set of matterIds used by a list of timetables
// function collectUsedMatterIds(timetables: Timetable[]): Set<string> {
// 	const s = new Set<string>()
// 	for (const tt of timetables) {
// 		for (const dayBlocks of Object.values(tt.days)) {
// 			for (const b of dayBlocks) s.add(b.matterId)
// 		}
// 	}
// 	return s
// }

// --- EXPORTS ---

export function buildExportBundleForKids(kidIds: string[]): ExportBundle {
	const db = readDB()
	const selectedKids = db.kids.filter(k => kidIds.includes(k.id))
	const selectedTimetables = db.timetables.filter(t => kidIds.includes(t.kidId))

	// collect only used matter ids
	const usedMatterIds = new Set<string>()
	for (const tt of selectedTimetables) {
		for (const blocks of Object.values(tt.days)) {
			for (const b of blocks) usedMatterIds.add(b.matterId)
		}
	}
	const selectedMatters = db.matters.filter(m => usedMatterIds.has(m.id))

	// if your ExportBundleSchema already includes config, we include it
	const bundle: ExportBundle = {
		version: 2,
		matters: selectedMatters,
		kids: selectedKids,
		timetables: selectedTimetables,
		config: (db as any).config,
	}
	ExportBundleSchema.parse(bundle)
	return bundle
}

/** Legacy: export everything (kept for compatibility) */
export function buildExportBundle(): ExportBundle {
	const db = readDB()
	const bundle: ExportBundle = {
		version: 2,
		matters: db.matters,
		kids: db.kids,
		timetables: db.timetables,
		config: (db as any).config,
	}
	ExportBundleSchema.parse(bundle)
	return bundle
}

// export function encodeBundleToLink(baseUrl?: string): string {
// 	const payload = JSON.stringify(buildExportBundle())
// 	const encoded = toBase64(payload)
// 	const url = new URL(baseUrl ?? (window.location.origin + '/import'))
// 	url.hash = `#data=${encoded}`
// 	return url.toString()
// }

export function encodeBundleToLinkForKids(kidIds: string[], baseUrl?: string): string {
	const payload = JSON.stringify(buildExportBundleForKids(kidIds))
	const encoded = toBase64(payload)
	const url = new URL(baseUrl ?? (window.location.origin + '/import'))
	url.hash = `#data=${encoded}`
	return url.toString()
}

/** Open native share if available; fallback to copy-to-clipboard */
export async function shareBundleForKids(kidIds: string[]) {
	const url = encodeBundleToLinkForKids(kidIds)

	try {
		// Some TS setups need `as any` to access share()
		const nav: any = navigator
		if (nav.share) {
			await nav.share({
				title: 'School Timetable',
				text: 'Here’s my timetable export.',
				url,
			})
			return { ok: true }
		}
	} catch (err) {
		// if user cancels share or share fails, fall through to clipboard
	}

	try {
		await navigator.clipboard.writeText(url)
		alert('Share link copied to clipboard.')
		return { ok: true }
	} catch {
		// last resort, just show the URL
		prompt('Copy this link:', url)
		return { ok: true }
	}
}

// --- IMPORTS (MERGE RULES) ---

// type ImportResult =
// 	| { ok: true; summary: { kidsAdded: number; mattersAdded: number; timetablesAdded: number; configMerged: boolean } }
// 	| { ok: false; error: string }

// export function tryImportFromURL(urlLike?: string): ImportResult {
// 	try {
// 		const url = new URL(urlLike ?? window.location.href)
// 		const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash
// 		const params = new URLSearchParams(hash)
// 		const b64 = params.get('data')
// 		if (!b64) return { ok: false, error: 'No data found in link' }

// 		const json = fromBase64(b64)
// 		const parsed = ExportBundleSchema.parse(JSON.parse(json))

// 		let kidsAdded = 0
// 		let mattersAdded = 0
// 		let timetablesAdded = 0
// 		let configMerged = false

// 		writeDB(prev => {
// 			// maps
// 			const existingKidsById = new Map(prev.kids.map(k => [k.id, k]))
// 			const existingMattersById = new Map(prev.matters.map(m => [m.id, m]))
// 			const existingMattersByName = new Map(prev.matters.map(m => [normalizeName(m.name), m]))
// 			const existingTimetablesByKid = new Map(prev.timetables.map(t => [t.kidId, t]))

// 			// 1) merge CONFIG (widen)
// 			if ((parsed as any).config) {
// 				const curr = (prev as any).config
// 				const incoming = ConfigSchema.parse((parsed as any).config)
// 				if (curr) {
// 					const next = { ...curr }
// 					// HH:mm widen: start = min, end = max
// 					if (compareHHMM(incoming.startHour, next.startHour) < 0) next.startHour = incoming.startHour
// 					if (compareHHMM(incoming.endHour, next.endHour) > 0) next.endHour = incoming.endHour
// 					// keep other fields as-is (startOfWeek, hiddenWeekdays, etc.)
// 					prev = { ...prev, config: next }
// 					configMerged = true
// 				} else {
// 					// no config yet -> set imported
// 					prev = { ...prev, config: incoming }
// 					configMerged = true
// 				}
// 			}

// 			// 2) merge MATTERS by NAME (case-insensitive). Widen dates.
// 			//    Build matterId mapping: importedId -> resolvedExistingOrNewId
// 			const matterIdMap = new Map<string, string>()
// 			const nextMatters: Matter[] = [...prev.matters]

// 			for (const im of parsed.matters) {
// 				const key = normalizeName(im.name)
// 				const existing = existingMattersByName.get(key)
// 				if (existing) {
// 					// widen dates only
// 					const start = existing.startDate
// 					const end = existing.endDate
// 					const iStart = im.startDate
// 					const iEnd = im.endDate

// 					let changed = false
// 					if (iStart && (!start || isBeforeISO(iStart, start))) {
// 						existing.startDate = iStart
// 						changed = true
// 					}
// 					if (iEnd && (!end || isAfterISO(iEnd, end))) {
// 						existing.endDate = iEnd
// 						changed = true
// 					}
// 					if (changed) {
// 						// replace in array
// 						const idx = nextMatters.findIndex(m => m.id === existing.id)
// 						if (idx >= 0) nextMatters[idx] = { ...existing }
// 					}
// 					matterIdMap.set(im.id, existing.id)
// 				} else {
// 					// add new matter (ensure id uniqueness)
// 					let newId = im.id
// 					if (existingMattersById.has(newId)) newId = uid('matter')
// 					const added: Matter = { ...im, id: newId }
// 					nextMatters.push(added)
// 					existingMattersById.set(newId, added)
// 					existingMattersByName.set(key, added)
// 					matterIdMap.set(im.id, newId)
// 					mattersAdded++
// 				}
// 			}

// 			// 3) merge/add KIDS (never overwrite existing)
// 			const nextKids: Kid[] = [...prev.kids]
// 			const kidIdMap = new Map<string, string>() // importedId -> resolvedId
// 			for (const ik of parsed.kids) {
// 				if (existingKidsById.has(ik.id)) {
// 					// keep existing, map to same id
// 					kidIdMap.set(ik.id, ik.id)
// 				} else {
// 					let newId = ik.id
// 					if (existingKidsById.has(newId)) newId = uid('kid')
// 					const added: Kid = { ...ik, id: newId }
// 					nextKids.push(added)
// 					existingKidsById.set(newId, added)
// 					kidIdMap.set(ik.id, newId)
// 					kidsAdded++
// 				}
// 			}

// 			// 4) timetables: override if kid already exists; insert if kid is new
// 			const nextTimetables: Timetable[] = [...prev.timetables]
// 			for (const it of parsed.timetables) {
// 				// Resolve the kid id (works for both existing and newly-added kids)
// 				const resolvedKidId = kidIdMap.get(it.kidId) ?? it.kidId

// 				// Remap matterIds to the resolved (existing/new) matter ids
// 				const remappedDays: Timetable['days'] = Object.fromEntries(
// 					Object.entries(it.days).map(([day, blocks]) => {
// 						return [
// 							day,
// 							blocks.map(b => ({
// 								...b,
// 								matterId: matterIdMap.get(b.matterId) ?? b.matterId,
// 							})),
// 						]
// 					})
// 				) as Timetable['days']

// 				const remapped: Timetable = { ...it, kidId: resolvedKidId, days: remappedDays }

// 				// If the kid already has a timetable, REPLACE it; otherwise ADD it
// 				const existingIdx = nextTimetables.findIndex(t => t.kidId === resolvedKidId)
// 				if (existingIdx >= 0) {
// 					nextTimetables[existingIdx] = remapped
// 				} else {
// 					nextTimetables.push(remapped)
// 				}

// 				timetablesAdded++ // counts both replacements and new inserts
// 			}

// 			return { ...prev, matters: nextMatters, kids: nextKids, timetables: nextTimetables }
// 		})

// 		return { ok: true, summary: { kidsAdded, mattersAdded, timetablesAdded, configMerged } }
// 	} catch (e: unknown) {
// 		return { ok: false, error: e instanceof Error ? e.message : 'Import failed' }
// 	}
// }
// ---------- NEW: read bundle without applying ----------
export function parseBundleFromURL(urlLike?: string):
	| { ok: true; bundle: ExportBundle }
	| { ok: false; error: string } {
	try {
		const url = new URL(urlLike ?? window.location.href)
		const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash
		const params = new URLSearchParams(hash)
		const b64 = params.get('data')
		if (!b64) return { ok: false, error: 'No data found in link' }
		const json = fromBase64(b64)
		const bundle = ExportBundleSchema.parse(JSON.parse(json))
		return { ok: true, bundle }
	} catch (e: unknown) {
		return { ok: false, error: e instanceof Error ? e.message : 'Invalid import link' }
	}
}

// ---------- NEW: selective import with merge rules ----------
export function importBundleWithOptions(
	bundle: ExportBundle,
	opts: {
		kidIds: string[]            // which kids from bundle to import
		applyConfig: boolean        // whether to apply/merge incoming config
	}
): {
	kidsAdded: number
	timetablesReplaced: number
	mattersAdded: number
	mattersUpdated: number
	configUpdated: boolean
} {
	const current = readDB()

	// Index current by name (case-insensitive) for matching
	const norm = (s: string) => s.trim().toLowerCase()

	const kidsByName = new Map(current.kids.map(k => [norm(k.name), k]))
	const kidsById = new Map(current.kids.map(k => [k.id, k]))
	const mattersByName = new Map(current.matters.map(m => [norm(m.name), m]))
	const mattersById = new Map(current.matters.map(m => [m.id, m]))
	const timetablesByKidId = new Map(current.timetables.map(t => [t.kidId, t]))

	// Only consider selected kids from bundle
	const selectedKids = bundle.kids.filter(k => opts.kidIds.includes(k.id))

	// Determine matters referenced by selected kids' timetables
	const selectedKidIdSet = new Set(selectedKids.map(k => k.id))
	const usedMatterIds = new Set<string>()
	for (const tb of bundle.timetables) {
		if (!selectedKidIdSet.has(tb.kidId)) continue
		for (const dayBlocks of Object.values(tb.days)) {
			for (const b of dayBlocks) usedMatterIds.add(b.matterId)
		}
	}
	const incomingMattersMap = new Map(bundle.matters.map(m => [m.id, m]))

	// MERGE MATTERS (by name). Add if not exists; if exists, keep existing id but widen dates.
	let mattersAdded = 0
	let mattersUpdated = 0
	const resolvedMatterId = new Map<string, string>() // oldId(from bundle) -> newId(in current DB)
	for (const mid of usedMatterIds) {
		const inc = incomingMattersMap.get(mid)
		if (!inc) continue
		const key = norm(inc.name)
		const existing = mattersByName.get(key)
		if (!existing) {
			// Add new matter
			const newMatter: Matter = {
				id: inc.id, // keep id unless collision
				name: inc.name,
				color: inc.color,
				startDate: inc.startDate,
				endDate: inc.endDate,
			}
			// avoid id collision
			if (mattersById.has(newMatter.id)) {
				newMatter.id = `${newMatter.id}-${Date.now()}`
			}
			current.matters.push(newMatter)
			mattersByName.set(key, newMatter)
			mattersById.set(newMatter.id, newMatter)
			resolvedMatterId.set(inc.id, newMatter.id)
			mattersAdded++
		} else {
			// Update dates only if they widen the range
			const prevStart = existing.startDate ?? ''
			const prevEnd = existing.endDate ?? ''
			const nextStart = inc.startDate ?? prevStart
			const nextEnd = inc.endDate ?? prevEnd

			// earlier start = smaller string if YYYY-MM-DD format (lex order works)
			let changed = false
			if (nextStart && (!prevStart || nextStart < prevStart)) {
				existing.startDate = nextStart
				changed = true
			}
			if (nextEnd && (!prevEnd || nextEnd > prevEnd)) {
				existing.endDate = nextEnd
				changed = true
			}
			if (changed) mattersUpdated++
			resolvedMatterId.set(inc.id, existing.id)
		}
	}

	// MERGE KIDS & TIMETABLES
	let kidsAdded = 0
	let timetablesReplaced = 0

	// Create a helper to remap a timetable using our resolved matter ids and target kid id
	const remapTimetable = (tb: Timetable, targetKidId: string): Timetable => {
		const remappedDays: Record<Weekday, TimeBlock[]> = AllWeekdays.reduce((acc, day) => {
			acc[day] = tb.days[day].map(b => ({
				...b,
				matterId: resolvedMatterId.get(b.matterId) ?? b.matterId,
			}))
			return acc
		}, {} as Record<Weekday, TimeBlock[]>)

		return {
			kidId: targetKidId,

			days: remappedDays,
		}
	}

	for (const incKid of selectedKids) {
		const key = norm(incKid.name)
		const existingKid = kidsByName.get(key)

		let targetKidId: string
		if (!existingKid) {
			// Add new kid. Avoid id collision.
			let newKid: Kid = { id: incKid.id, name: incKid.name }
			if (kidsById.has(newKid.id)) {
				newKid = { ...newKid, id: `${newKid.id}-${Date.now()}` }
			}
			current.kids.push(newKid)
			kidsByName.set(key, newKid)
			kidsById.set(newKid.id, newKid)
			targetKidId = newKid.id
			kidsAdded++
		} else {
			targetKidId = existingKid.id
		}

		// Find imported timetable for this kid
		const incomingTb = bundle.timetables.find(t => t.kidId === incKid.id)
		if (incomingTb) {
			// Rule: override timetable if kid exists (or set if new)
			const remapped = remapTimetable(incomingTb, targetKidId)
			// replace or insert
			if (timetablesByKidId.has(targetKidId)) {
				const idx = current.timetables.findIndex(t => t.kidId === targetKidId)
				if (idx >= 0) current.timetables[idx] = remapped
			} else {
				current.timetables.push(remapped)
			}
			timetablesByKidId.set(targetKidId, remapped)
			timetablesReplaced++
		}
	}

	// MERGE CONFIG (if present & allowed)
	let configUpdated = false
	if (opts.applyConfig && bundle.config) {
		const cur = (current as any).config as AppConfig | undefined
		const inc = bundle.config as AppConfig
		if (!cur) {
			// If your DB always has config, this path likely won’t happen,
			// but keep it for safety.
			(current as any).config = inc
			configUpdated = true
		} else {
			const next: AppConfig = { ...cur }
			// widen hours: earlier start, later end
			if (inc.startHour && (!cur.startHour || inc.startHour < cur.startHour)) {
				next.startHour = inc.startHour
			}
			if (inc.endHour && (!cur.endHour || inc.endHour > cur.endHour)) {
				next.endHour = inc.endHour
			}
			// we keep startOfWeek/hiddenWeekdays as-is (as per your rules)
			if (next.startHour !== cur.startHour || next.endHour !== cur.endHour) {
				(current as any).config = next
				configUpdated = true
			}
		}
	}

	writeDB(() => current)
	return { kidsAdded, timetablesReplaced, mattersAdded, mattersUpdated, configUpdated }
}
