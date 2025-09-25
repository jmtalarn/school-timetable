// src/pages/SettingsPage.tsx
import { useEffect, useMemo, useState } from 'react'
import { useConfig, useUpdateConfig, useToggleWeekday } from '../hooks/reactQueryHooks'
import { weekdays, type Weekday } from '../types'
import styles from './SettingsPage.module.css'


const labels: Record<Weekday, string> = {
	mon: 'Monday',
	tue: 'Tuesday',
	wed: 'Wednesday',
	thu: 'Thursday',
	fri: 'Friday',
	sat: 'Saturday',
	sun: 'Sunday',
}

export default function SettingsPage() {
	const { data: cfg, isLoading } = useConfig()
	const updateConfig = useUpdateConfig()
	const toggleWeekday = useToggleWeekday()

	const [startHour, setStartHour] = useState('08:00')
	const [endHour, setEndHour] = useState('18:00')

	useEffect(() => {
		if (cfg) {
			setStartHour(cfg.startHour)
			setEndHour(cfg.endHour)
		}
	}, [cfg])

	const saving = updateConfig.isPending
	const errorMsg = (updateConfig.error as Error | undefined)?.message

	const isVisible = (day: Weekday) => (cfg ? !cfg.hiddenWeekdays.includes(day) : true)

	const timesChanged = useMemo(() => {
		if (!cfg) return false
		return cfg.startHour !== startHour || cfg.endHour !== endHour
	}, [cfg, startHour, endHour])

	if (isLoading || !cfg) {
		return <div className={styles.loading}>Loading settings…</div>
	}

	return (
		<div className={styles.container}>
			<h2 className={styles.title}>Settings</h2>

			<form
				className={styles.form}
				onSubmit={(e) => {
					e.preventDefault()
					updateConfig.mutate({ startHour, endHour })
				}}
			>
				{/* Time range */}
				<section className={styles.section}>
					<div className={styles.sectionTitle}>Scheduler hours</div>
					<div className={styles.timeGrid}>
						<label className={styles.fieldLabel}>
							<span className={styles.fieldCaption}>Start time</span>
							<input
								type="time"
								value={startHour}
								onChange={(e) => setStartHour(e.target.value)}
							/>
						</label>
						<label className={styles.fieldLabel}>
							<span className={styles.fieldCaption}>End time</span>
							<input
								type="time"
								value={endHour}
								onChange={(e) => setEndHour(e.target.value)}
							/>
						</label>
					</div>
					<p className={styles.hint}>
						These define the visible vertical window in the scheduler (e.g. 08:00 → 18:00).
						The app enforces that start &lt; end.
					</p>
					<div className={styles.actions}>
						<button type="submit" className="btn btnPrimary" disabled={!timesChanged || saving}>
							{saving ? 'Saving…' : 'Save'}
						</button>
					</div>
				</section>

				{/* Visible weekdays */}
				<section className={styles.section}>
					<div className={styles.sectionTitle}>Visible weekdays</div>
					<div className={styles.weekdayGrid}>
						{weekdays.map((d) => (
							<label className={styles.weekdayChip} key={d} title={labels[d]}>
								<input
									type="checkbox"
									checked={isVisible(d)}
									onChange={() => toggleWeekday.mutate(d)}
								/>
								<span>{labels[d]}</span>
							</label>
						))}
					</div>
					<p className={styles.hint}>Uncheck a day to hide it in the scheduler.</p>
				</section>

				{errorMsg && (
					<div role="alert" className={styles.alert}>
						{errorMsg}
					</div>
				)}


			</form>
		</div>
	)
}
