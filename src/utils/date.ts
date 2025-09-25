/** Date helpers */

import type { Weekday } from "../types"
import { W_TO_JS, JS_TO_W } from "./week"


export function isSameDate(a: Date, b: Date) {
	return a.getFullYear() === b.getFullYear()
		&& a.getMonth() === b.getMonth()
		&& a.getDate() === b.getDate()
}

export function parseDateOnly(yyyy_mm_dd: string | undefined) {
	if (!yyyy_mm_dd) return null
	// Safe local-date parse (no TZ surprises at midnight)
	const [y, m, d] = yyyy_mm_dd.split('-').map(Number)
	if (!y || !m || !d) return null
	return new Date(y, m - 1, d)
}

export function isDateWithin(date: Date, start?: string, end?: string) {
	const s = parseDateOnly(start)
	const e = parseDateOnly(end)
	if (s && date < s) return false
	if (e && date > e) return false
	return true
}



export function fmtISO(d: Date) {
	const y = d.getFullYear()
	const m = `${d.getMonth() + 1}`.padStart(2, '0')
	const dd = `${d.getDate()}`.padStart(2, '0')
	return `${y}-${m}-${dd}`
}
export function fmtPretty(d: Date) {
	return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
export function startOfWeek(anchor: Date, start: Weekday) {
	const want = W_TO_JS[start] // 0..6
	const curr = anchor.getDay() // 0..6 (Sun..Sat)
	const diff = (curr - want + 7) % 7
	const out = new Date(anchor)
	out.setHours(0, 0, 0, 0)
	out.setDate(out.getDate() - diff)
	return out
}
export function addDays(d: Date, n: number) {
	const out = new Date(d)
	out.setDate(out.getDate() + n)
	return out
}
export function weekdayFromDate(d: Date): Weekday {
	return JS_TO_W[d.getDay()]
}
