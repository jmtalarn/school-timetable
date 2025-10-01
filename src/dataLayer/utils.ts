// src/dataLayer/utils.ts
import { type TimeBlock } from './schemas'
import { type Weekday } from './schemas'

// Ensure blocks don’t overlap and start<end. Throws with reason if invalid.
export function validateBlocks(blocks: TimeBlock[]) {
    // check start<end and sort by start
    const toMinutes = (t: string) => {
        const [h, m] = t.split(':').map(Number)
        return h * 60 + m
    }
    const sorted = [...blocks].sort((a, b) => toMinutes(a.start) - toMinutes(b.start))
    for (const b of sorted) {
        if (toMinutes(b.start) >= toMinutes(b.end)) {
            throw new Error(`Block ${b.id} has start >= end`)
        }
    }
    for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1]
        const curr = sorted[i]
        if (toMinutes(curr.start) < toMinutes(prev.end)) {
            throw new Error(`Blocks ${prev.id} and ${curr.id} overlap`)
        }
    }
    return sorted
}

export function emptyWeek(): Record<Weekday, TimeBlock[]> {
    return {
        mon: [],
        tue: [],
        wed: [],
        thu: [],
        fri: [],
        sat: [],
        sun: [],
    }
}


