// Headless logic to back a week grid scheduler with 5-minute snapping.
// Works with your existing React Query hooks and Timetable types.

import { useMemo } from 'react'
import { useAddBlock, useUpdateBlock, useDeleteBlock, useSetDayBlocks } from '../hooks/reactQueryHooks'
import type { TimeBlock, Weekday } from '../types'

// // ---- Types (adjust if your app exports these already) ----
// export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

// export type TimeBlock = {
// 	id: string
// 	matterId: string
// 	start: string // "HH:mm"
// 	end: string   // "HH:mm"
// }

// export type Timetable = {
// 	kidId: string
// 	days: Record<Weekday, TimeBlock[]>
// }

// ---- Config ----
export type SchedulerConfig = {
	start: string          // "08:00"
	end: string            // "18:00"
	stepMinutes: number    // 5
	defaultDurationMin: number // 60 (when creating via empty cell click)
	minDurationMin?: number    // optional minimum; default = stepMinutes
}

export const DefaultConfig: SchedulerConfig = {
	start: '08:00',
	end: '18:00',
	stepMinutes: 5,
	defaultDurationMin: 60,
}

// ---- Time utils ----
const toMin = (t: string) => {
	const [h, m] = t.split(':').map(Number)
	return h * 60 + m
}
const toTime = (mins: number) => {
	const h = Math.floor(mins / 60)
	const m = mins % 60
	const HH = String(h).padStart(2, '0')
	const MM = String(m).padStart(2, '0')
	return `${HH}:${MM}`
}
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
const snap = (mins: number, step: number) => Math.round(mins / step) * step

// Returns number of grid rows
export function computeRowCount(cfg: SchedulerConfig) {
	return (toMin(cfg.end) - toMin(cfg.start)) / cfg.stepMinutes
}

// Map between time and row index
export function rowFromTime(t: string, cfg: SchedulerConfig) {
	return (toMin(t) - toMin(cfg.start)) / cfg.stepMinutes
}
export function timeFromRow(row: number, cfg: SchedulerConfig) {
	const mins = toMin(cfg.start) + row * cfg.stepMinutes
	return toTime(mins)
}

// Build HH:mm labels for the left gutter (every N steps if you want)
export function buildRowLabels(cfg: SchedulerConfig, labelEverySteps = 12 /* = 60min */) {
	const rows = computeRowCount(cfg)
	return Array.from({ length: rows + 1 }, (_, r) =>
		r % labelEverySteps === 0 ? timeFromRow(r, cfg) : '',
	)
}

// ---- Collision detection ----
type Range = { startMin: number; endMin: number }

function asRange(b: TimeBlock): Range {
	return { startMin: toMin(b.start), endMin: toMin(b.end) }
}

function rangesOverlap(a: Range, b: Range) {
	return a.startMin < b.endMin && b.startMin < a.endMin
}

function isFree(blocks: TimeBlock[], desired: Range, excludeId?: string) {
	return blocks
		.filter(b => b.id !== excludeId)
		.every(b => !rangesOverlap(asRange(b), desired))
}

// Find nearest available slot >= desired.startMin that can fit duration
export function findSlot(
	blocks: TimeBlock[],
	cfg: SchedulerConfig,
	desiredStartMin: number,
	durationMin: number,
	excludeId?: string,
): Range | null {
	const dayStart = toMin(cfg.start)
	const dayEnd = toMin(cfg.end)
	const step = cfg.stepMinutes
	const min = clamp(snap(desiredStartMin, step), dayStart, dayEnd - durationMin)

	for (let s = min; s + durationMin <= dayEnd; s += step) {
		const cand = { startMin: s, endMin: s + durationMin }
		if (isFree(blocks, cand, excludeId)) return cand
	}
	return null
}

// ---- Headless operations to drive the UI ----
export type SchedulerAPI = {
	cfg: SchedulerConfig
	// rows & labels help layout a grid later
	rows: number
	rowLabels: string[]

	// helpers for your UI engine
	toRow(t: string): number
	toTime(r: number): string

	// interactions
	createFromCell(params: { kidId: string; day: Weekday; row: number; matterId: string }): Promise<{ ok: true } | { ok: false; reason: string }>
	resizeBlock(params: {
		kidId: string; day: Weekday; block: TimeBlock; anchor: 'start' | 'end'; byRows: number; dayBlocks: TimeBlock[];
	}): Promise<{ ok: true } | { ok: false; reason: string }>
	moveBlock(params: {
		kidId: string; fromDay: Weekday; toDay: Weekday; block: TimeBlock; byRows: number; dayBlocksFrom: TimeBlock[]; dayBlocksTo: TimeBlock[];
	}): Promise<{ ok: true } | { ok: false; reason: string }>
	deleteBlock(params: { kidId: string; day: Weekday; id: string }): Promise<void>
}

export function useSchedulerLogic(cfg: SchedulerConfig = DefaultConfig): SchedulerAPI {
	const addBlock = useAddBlock()
	const updateBlock = useUpdateBlock()
	const deleteBlock = useDeleteBlock()
	const setDayBlocks = useSetDayBlocks() // to support cross-day moves atomically

	const rows = computeRowCount(cfg)
	const rowLabels = useMemo(() => buildRowLabels(cfg), [cfg.start, cfg.end, cfg.stepMinutes])

	return {
		cfg,
		rows,
		rowLabels,
		toRow: (t: string) => rowFromTime(t, cfg),
		toTime: (r: number) => timeFromRow(r, cfg),

		// Click empty cell -> create a block with default duration, snapped & non-overlapping.
		async createFromCell({ kidId, day, row, matterId }) {
			const startMin = toMin(cfg.start) + row * cfg.stepMinutes
			const duration = Math.max(cfg.defaultDurationMin, cfg.minDurationMin ?? cfg.stepMinutes)
			// UI should supply current day blocks (or fetch after mutation); here we rely on server to reject overlaps.
			const desired = { startMin: snap(startMin, cfg.stepMinutes), endMin: snap(startMin, cfg.stepMinutes) + duration }
			if (desired.endMin > toMin(cfg.end)) return { ok: false as const, reason: 'Out of day range' }

			try {
				await addBlock.mutateAsync({
					kidId,
					day,
					input: { matterId, start: toTime(desired.startMin), end: toTime(desired.endMin) },
				})
				return { ok: true as const }
			} catch (e: unknown) {
				return { ok: false as const, reason: e instanceof Error ? e.message : 'Failed to add block' }
			}
		},

		// Drag top or bottom handle by N rows (positive/negative). Snaps to 5-min, prevents overlap & min duration.
		async resizeBlock({ kidId, day, block, anchor, byRows, dayBlocks }) {
			const step = cfg.stepMinutes
			const deltaMin = byRows * step
			const minDur = Math.max(cfg.minDurationMin ?? step, step)

			const current = asRange(block)
			const next: Range =
				anchor === 'start'
					? { startMin: clamp(snap(current.startMin + deltaMin, step), toMin(cfg.start), current.endMin - minDur), endMin: current.endMin }
					: { startMin: current.startMin, endMin: clamp(snap(current.endMin + deltaMin, step), current.startMin + minDur, toMin(cfg.end)) }

			if (!isFree(dayBlocks, next, block.id)) return { ok: false as const, reason: 'Overlap' }

			try {
				await updateBlock.mutateAsync({
					kidId, day, id: block.id,
					patch: { start: toTime(next.startMin), end: toTime(next.endMin) },
				})
				return { ok: true as const }
			} catch (e: unknown) {
				return { ok: false as const, reason: e instanceof Error ? e.message : 'Failed to resize' }
			}
		},

		// Drag the whole block by N rows, possibly across days (when target column differs).
		async moveBlock({ kidId, fromDay, toDay, block, byRows, dayBlocksFrom, dayBlocksTo }) {
			const step = cfg.stepMinutes
			const dur = asRange(block).endMin - asRange(block).startMin
			const startMinDesired = asRange(block).startMin + byRows * step

			if (fromDay === toDay) {
				const dayStart = toMin(cfg.start)
				const dayEnd = toMin(cfg.end)
				const clampedStart = clamp(snap(startMinDesired, step), dayStart, dayEnd - dur)
				const candidate: Range = { startMin: clampedStart, endMin: clampedStart + dur }
				if (!isFree(dayBlocksFrom, candidate, block.id)) return { ok: false as const, reason: 'Overlap' }

				try {
					await updateBlock.mutateAsync({
						kidId, day: fromDay, id: block.id,
						patch: { start: toTime(candidate.startMin), end: toTime(candidate.endMin) },
					})
					return { ok: true as const }
				} catch (e: unknown) {
					return { ok: false as const, reason: e instanceof Error ? e.message : 'Failed to move' }
				}
			} else {
				// Cross-day move: remove from old day, insert into new day keeping same id atomically.
				// We use setDayBlocks to avoid transient overlap rules firing.
				const slot = findSlot(dayBlocksTo, cfg, startMinDesired, dur, /*excludeId*/ undefined)
				if (!slot) return { ok: false as const, reason: 'No free slot in target day' }

				try {
					// Build new arrays
					const nextFrom = dayBlocksFrom.filter(b => b.id !== block.id)
					const moved: TimeBlock = { ...block, start: toTime(slot.startMin), end: toTime(slot.endMin) }
					const nextTo = [...dayBlocksTo, moved].sort((a, b) => toMin(a.start) - toMin(b.start))

					// Commit two lists
					await Promise.all([
						setDayBlocks.mutateAsync({ kidId, day: fromDay, blocks: nextFrom }),
						setDayBlocks.mutateAsync({ kidId, day: toDay, blocks: nextTo }),
					])
					return { ok: true as const }
				} catch (e: unknown) {
					return { ok: false as const, reason: e instanceof Error ? e.message : 'Failed to move across days' }
				}
			}
		},

		async deleteBlock({ kidId, day, id }) {
			await deleteBlock.mutateAsync({ kidId, day, id })
		},
	}
}
