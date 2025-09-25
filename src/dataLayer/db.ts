// filepath: /school-timetable/school-timetable/src/dataLayer/db.ts
// This file handles the localStorage database operations. It exports functions for reading and writing the database, including the default database structure and the readDB and writeDB functions.

import { type Matter, type Kid, type Timetable, type AppConfig, DefaultAppConfig } from '../types'
import { MatterSchema, KidSchema, TimetableSchema, ConfigSchema } from './schemas'

export const STORAGE_KEY = 'school-timetable-db.v1'

type DBShape = {
	matters: Matter[]
	kids: Kid[]
	timetables: Timetable[]
	config: AppConfig
}

const defaultDB = (): DBShape => ({
	matters: [],
	kids: [],
	timetables: [],
	config: DefaultAppConfig,
})

function readDB(): DBShape {
	const raw = localStorage.getItem(STORAGE_KEY)
	if (!raw) return defaultDB()
	try {
		const parsed = JSON.parse(raw) as DBShape
		const matters = MatterSchema.array().safeParse(parsed.matters).success
			? (parsed.matters as Matter[])
			: []
		const kids = KidSchema.array().safeParse(parsed.kids).success ? (parsed.kids as Kid[]) : []
		const timetables = TimetableSchema.array().safeParse(parsed.timetables).success
			? (parsed.timetables as Timetable[])
			: []
		// ✅ validate config; fall back to defaults if missing/invalid
		// normalize/migrate config
		const cRaw = parsed.config ?? {}
		const normalized: AppConfig = {
			startHour: toHHMM(cRaw.startHour, '08:00'),
			endHour: toHHMM(cRaw.endHour, '18:00'),
			hiddenWeekdays: Array.isArray(cRaw.hiddenWeekdays) ? cRaw.hiddenWeekdays : [],
			startOfWeek: cRaw.startOfWeek
		}
		const config = ConfigSchema.safeParse(normalized).success ? normalized : DefaultAppConfig

		return { matters, kids, timetables, config }
	} catch {
		return defaultDB()
	}
}

function writeDB(updater: (prev: DBShape) => DBShape): DBShape {
	const curr = readDB()
	const next = updater(curr)
	localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
	return next
}

function toHHMM(v: unknown, fallback: string): string {
	if (typeof v === 'string') {
		// accept only valid HH:mm
		const ok = /^([01]\d|2[0-3]):[0-5]\d$/.test(v)
		return ok ? v : fallback
	}
	if (typeof v === 'number' && Number.isFinite(v)) {
		// interpret as hour, clamp to 0..23 and add ":00"
		const h = Math.max(0, Math.min(23, Math.floor(v)))
		return String(h).padStart(2, '0') + ':00'
	}
	return fallback
}


export { readDB, writeDB, defaultDB }
