// filepath: /school-timetable/school-timetable/src/dataLayer/db.ts
// This file handles the localStorage database operations. It exports functions for reading and writing the database, including the default database structure and the readDB and writeDB functions.

import { type Matter, type Kid, type Timetable } from '../types'
import { MatterSchema, KidSchema, TimetableSchema } from './schemas'

export const STORAGE_KEY = 'school-timetable-db.v1'

type DBShape = {
	matters: Matter[]
	kids: Kid[]
	timetables: Timetable[]
}

const defaultDB = (): DBShape => ({
	matters: [],
	kids: [],
	timetables: [],
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
		return { matters, kids, timetables }
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

export { readDB, writeDB, defaultDB }
