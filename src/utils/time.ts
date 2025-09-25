// ---- time helpers ----
export function toMin(t: string) {
	const [h, m] = t.split(':').map(Number);
	return h * 60 + m
}

export function toTime(mins: number) {
	const h = Math.floor(mins / 60), m = mins % 60
	return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
export function clamp(v: number, lo: number, hi: number) {
	return Math.max(lo, Math.min(hi, v))
}
export function snap(mins: number, step: number) {
	return Math.round(mins / step) * step
}
export function minutesBetween(a: string, b: string) {
	return toMin(b) - toMin(a)
}
