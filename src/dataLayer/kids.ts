// src/dataLayer/kids.ts
import { v4 as uuid } from 'uuid'
import { readDB, writeDB } from './db'
import { type Kid } from './schemas'
import { emptyWeek } from './utils'

// Kids
export type { Kid };

export function listKids(): Kid[] {
	return readDB().kids
}

export function createKid(input: Omit<Kid, 'id'>): Kid {
	const newK: Kid = { id: uuid(), ...input }
	writeDB(db => ({
		...db,
		kids: [...db.kids, newK],
		timetables: [
			...db.timetables,
			{ kidId: newK.id, days: emptyWeek() }, // create empty timetable
		],
	}))
	return newK
}

export function updateKid(id: string, patch: Partial<Omit<Kid, 'id'>>): Kid {
	let next: Kid | undefined
	writeDB(db => {
		const kids = db.kids.map(k => (k.id === id ? (next = { ...k, ...patch })! : k))
		if (!next) throw new Error('Kid not found')
		return { ...db, kids }
	})
	return next!
}

export function deleteKid(id: string): void {
	writeDB(db => ({
		...db,
		kids: db.kids.filter(k => k.id !== id),
		timetables: db.timetables.filter(tt => tt.kidId !== id),
	}))
}
