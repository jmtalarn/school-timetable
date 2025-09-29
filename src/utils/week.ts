import { AllWeekdays, type Weekday } from '../types'
import { useIntl } from 'react-intl'

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

export const useWeekdayLabels = () => {
	const intl = useIntl();
	const d = new Date();
	const weekdayLabels: Record<Weekday, string> = {} as any;

	for (const weekday of AllWeekdays) {
		const dayIdx = (AllWeekdays.indexOf(weekday) + 1) % 7; // AllWeekdays is Mon..Sun, JS Date is Sun..Sat
		d.setUTCDate(d.getUTCDate() - d.getUTCDay() + dayIdx);
		weekdayLabels[weekday] = d.toLocaleString(intl.locale, { weekday: 'long', timeZone: 'UTC' });
	}

	return weekdayLabels;
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
