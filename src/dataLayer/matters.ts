import { z } from 'zod'
import { v4 as uuid } from 'uuid'
import { readDB, writeDB } from './db'
import type { Weekday, Timetable } from '../types'

export const MatterSchema = z.object({
	id: z.string(),
	name: z.string().min(1),
	color: z.string().optional(), // hex or css var (optional)
})

export type Matter = z.infer<typeof MatterSchema>

export function listMatters(): Matter[] {
	return readDB().matters
}

export function createMatter(input: Omit<Matter, 'id'>): Matter {
	const newM: Matter = { id: uuid(), ...input }
	writeDB(db => ({ ...db, matters: [...db.matters, newM] }))
	return newM
}

export function updateMatter(id: string, patch: Partial<Omit<Matter, 'id'>>): Matter {
	let next: Matter | undefined
	writeDB(db => {
		const matters = db.matters.map(m => (m.id === id ? (next = { ...m, ...patch })! : m))
		if (!next) throw new Error('Matter not found')
		return { ...db, matters }
	})
	return next!
}

export function deleteMatter(id: string): void {
	writeDB(db => ({
		...db,
		matters: db.matters.filter(m => m.id !== id),
		timetables: db.timetables.map(tt => ({
			...tt,
			days: Object.fromEntries(
				(Object.keys(tt.days) as Weekday[]).map(d => [
					d,
					tt.days[d].filter(b => b.matterId !== id),
				]),
			) as Timetable['days'],
		})),
	}))
}
