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
