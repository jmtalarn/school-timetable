import { useState } from 'react';
import { AllWeekdays, DefaultAppConfig } from '../types';
import type { Weekday } from '../types';

import styles from './SettingsPage.module.css';
import { useConfig, useUpdateConfig, useToggleWeekday } from '../hooks/reactQueryHooks';

const weekdayLabel: Record<Weekday, string> = {
	mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday',
	fri: 'Friday', sat: 'Saturday', sun: 'Sunday'
};

export default function SettingsPage() {
	const { data: cfg } = useConfig();
	const update = useUpdateConfig();
	const toggle = useToggleWeekday();

	const [start, setStart] = useState(cfg?.startHour ?? DefaultAppConfig.startHour);
	const [end, setEnd] = useState(cfg?.endHour ?? DefaultAppConfig.endHour);

	// keep local fields synced when cache updates (e.g., first load)
	// optional – safe to omit if you prefer uncontrolled inputs
	if (cfg && (start !== cfg.startHour || end !== cfg.endHour)) {
		// keep responsive: only update after initial load
		// (simple heuristic)
		setTimeout(() => {
			setStart(cfg.startHour);
			setEnd(cfg.endHour);
		}, 0);
	}

	return (
		<div className={styles.container}>
			<h2>App Settings</h2>

			<section className={styles.card}>
				<h3 className={styles.h3}>Scheduler time window</h3>
				<form
					className={styles.timeForm}
					onSubmit={(e) => {
						e.preventDefault();
						update.mutate({ startHour: start, endHour: end });
					}}
				>
					<label className={styles.field}>
						<span>Start</span>
						<input
							type="time"
							value={start}
							onChange={(e) => setStart(e.target.value)}
							required
						/>
					</label>

					<label className={styles.field}>
						<span>End</span>
						<input
							type="time"
							value={end}
							onChange={(e) => setEnd(e.target.value)}
							required
						/>
					</label>

					<div className={styles.actions}>
						<button type="button"
							className="btn"
							onClick={() => {
								setStart(DefaultAppConfig.startHour);
								setEnd(DefaultAppConfig.endHour);
							}}
						>
							Reset
						</button>
						<button type="submit" className="btn btnPrimary">
							Save
						</button>
					</div>
				</form>
			</section>

			<section className={styles.card}>
				<h3 className={styles.h3}>Show / hide weekdays</h3>
				<div className={styles.weekGrid}>
					{AllWeekdays.map((d) => {
						const hidden = cfg?.hiddenWeekdays?.includes(d) ?? false;
						return (
							<label key={d} className={styles.day}>
								<input
									type="checkbox"
									checked={!hidden}
									onChange={() => toggle.mutate(d)}
								/>
								<span>{weekdayLabel[d]}</span>
							</label>
						);
					})}
				</div>
				<p className={styles.hint}>
					Uncheck a day to hide it in the timetable.
				</p>
			</section>
		</div>
	);
}
