// src/dataLayer/timetables.ts
import { v4 as uuid } from 'uuid'
import { type TimeBlock, type Timetable, type Weekday } from './schemas'
import { validateBlocks, emptyWeek } from './utils'
import { readDB, writeDB } from './db'

export function getTimetable(kidId: string): Timetable {
	const db = readDB()
	const tt = db.timetables.find(t => t.kidId === kidId)
	if (tt) return tt
	const fresh: Timetable = { kidId, days: emptyWeek() }
	writeDB(prev => ({ ...prev, timetables: [...prev.timetables, fresh] }))
	return fresh
}

export function setDayBlocks(params: {
	kidId: string
	day: Weekday
	blocks: TimeBlock[]
}): Timetable {
	const verified = validateBlocks(params.blocks)
	let updated!: Timetable
	writeDB(db => {
		const timetables = db.timetables.map(tt => {
			if (tt.kidId !== params.kidId) return tt
			updated = {
				...tt,
				days: { ...tt.days, [params.day]: verified },
			}
			return updated
		})
		return { ...db, timetables }
	})
	return updated
}

export function addBlock(params: {
	kidId: string
	day: Weekday
	input: Omit<TimeBlock, 'id'>
}): TimeBlock {
	const newB: TimeBlock = { id: uuid(), ...params.input }
	const tt = getTimetable(params.kidId)
	const next = validateBlocks([...tt.days[params.day], newB])
	setDayBlocks({ kidId: params.kidId, day: params.day, blocks: next })
	return newB
}

export function updateBlock(params: {
	kidId: string
	day: Weekday
	id: string
	patch: Partial<Omit<TimeBlock, 'id'>>
}): TimeBlock {
	const tt = getTimetable(params.kidId)
	const blocks = tt.days[params.day]
	let nextBlock!: TimeBlock
	const next = blocks.map(b => {
		if (b.id !== params.id) return b
		nextBlock = { ...b, ...params.patch }
		return nextBlock
	})
	const verified = validateBlocks(next)
	setDayBlocks({ kidId: params.kidId, day: params.day, blocks: verified })
	return nextBlock
}

export function deleteBlock(params: { kidId: string; day: Weekday; id: string }) {
	const tt = getTimetable(params.kidId)
	const next = tt.days[params.day].filter(b => b.id !== params.id)
	setDayBlocks({ kidId: params.kidId, day: params.day, blocks: next })
}
