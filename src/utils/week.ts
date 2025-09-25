import { AllWeekdays, type Weekday } from '../types'

/**
 * Rotate AllWeekdays so the week starts at `start` (0=Sun..6=Sat).
 * Note: AllWeekdays is ordered Mon..Sun, so we map JS day -> AllWeekdays index.
 */
export function reorderWeekdays(start: Weekday): Weekday[] {
	// Map JS day index (0=Sun..6=Sat) to AllWeekdays index (Mon..Sun)
	const startIdxInAll = (AllWeekdays.indexOf(start) + 7) % 7; // 0->6 (Sun), 1->0 (Mon), ..., 6->5 (Sat)
	return [
		...AllWeekdays.slice(startIdxInAll),
		...AllWeekdays.slice(0, startIdxInAll),
	];
}

/**
 * Returns the 0..6 index of `date` within a week that starts on `start`.
 * Example: if start=1 (Mon), then Mon->0, Tue->1, ..., Sun->6
 */
export function weekIndexFor(date: Date, start: Weekday): number {
	const js = date.getDay(); // 0=Sun..6=Sat
	return (js - AllWeekdays.indexOf(start) + 7) % 7;
}

export const weekdayLabels: Record<Weekday, string> = {
	mon: 'Monday',
	tue: 'Tuesday',
	wed: 'Wednesday',
	thu: 'Thursday',
	fri: 'Friday',
	sat: 'Saturday',
	sun: 'Sunday',
}


// ----------------- date + time helpers -----------------
export const W_TO_JS: Record<Weekday, number> = {
	sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
}
export const JS_TO_W: Record<number, Weekday> = {
	0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat',
}

export function toWeekday(d: Date) {
	return AllWeekdays[d.getDay()] as Weekday
}
