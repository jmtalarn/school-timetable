// src/pages/SettingsPage.tsx
import { useEffect, useMemo, useState } from 'react'
import { useConfig, useUpdateConfig, useToggleWeekday } from '../hooks/reactQueryHooks'
import { AllWeekdays, type Weekday } from '../types'
import styles from './SettingsPage.module.css'
import { useWeekdayLabels } from '../utils/week'
import LanguageSelect from '../components/LanguageSwitcher'
import { FormattedMessage, useIntl } from 'react-intl'




export default function SettingsPage() {
	const { data: cfg, isLoading } = useConfig()
	const updateConfig = useUpdateConfig()
	const toggleWeekday = useToggleWeekday()
	const intl = useIntl();
	const [startHour, setStartHour] = useState('08:00')
	const [endHour, setEndHour] = useState('18:00')
	const [startOfWeek, setStartOfWeek] = useState<Weekday>('mon')
	const weekdayLabels = useWeekdayLabels();

	useEffect(() => {
		if (cfg) {
			setStartHour(cfg.startHour)
			setEndHour(cfg.endHour)
			setStartOfWeek(cfg.startOfWeek ?? 'mon')
		}
	}, [cfg])

	const saving = updateConfig.isPending
	const errorMsg = (updateConfig.error as Error | undefined)?.message

	const isVisible = (day: Weekday) => (cfg ? !cfg.hiddenWeekdays.includes(day) : true)

	const timesChanged = useMemo(() => {
		if (!cfg) return false
		return cfg.startHour !== startHour || cfg.endHour !== endHour
	}, [cfg, startHour, endHour])

	const startWeekChanged = useMemo(() => {
		if (!cfg) return false
		return cfg.startOfWeek !== startOfWeek
	}, [cfg, startOfWeek])

	if (isLoading || !cfg) {
		return <div className={styles.loading}>Loading settings…</div>
	}

	return (
		<div className={styles.container}>
			<h2 className={styles.title}><FormattedMessage defaultMessage="General" /></h2>

			<form
				className={styles.form}
				onSubmit={(e) => {
					e.preventDefault()
					updateConfig.mutate({ startHour, endHour, startOfWeek })
				}}
			>
				{/* Time range */}
				<section className={styles.section}>
					<div className={styles.sectionTitle}><FormattedMessage defaultMessage="Scheduler hours" /></div>
					<div className={styles.timeGrid}>
						<label className={styles.fieldLabel}>
							<span className={styles.fieldCaption}><FormattedMessage defaultMessage="Start time" /></span>
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
						<FormattedMessage defaultMessage="These define the visible vertical window in the scheduler (e.g. from 08:00 to 18:00).
						The app enforces that start time must be before end time." />
					</p>

					<div className={styles.actions}>
						<button type="submit" className="btn btnPrimary" disabled={!timesChanged || saving}>
							{saving ? <FormattedMessage defaultMessage="Saving…" /> : <FormattedMessage defaultMessage="Save" />}
						</button>
					</div>
				</section>
				<section className={styles.section}>
					<div className={styles.sectionTitle}>
						<FormattedMessage defaultMessage="Week starts on" />
					</div>

					<label className={styles.fieldLabel}>
						<span className={styles.fieldCaption}>
							<FormattedMessage defaultMessage="Weekday" />
						</span>
						<select
							className={styles.select}
							value={startOfWeek}
							onChange={(e) => setStartOfWeek(e.target.value as Weekday)}
							aria-label={intl.formatMessage({ defaultMessage: "Week starts on" })}
						>
							{AllWeekdays.map(d => {
								console.log(d, weekdayLabels[d])
								return (
									<option key={d} value={d}>{weekdayLabels[d]}</option>
								)
							})}
						</select>
					</label>

					<p className={styles.hint}>
						<FormattedMessage defaultMessage="Changes the first column in the weekly scheduler." />
					</p>

					<div className={styles.actions}>
						<button type="submit" className="btn btnPrimary" disabled={!startWeekChanged || saving}>
							{saving ? <FormattedMessage defaultMessage="Saving…" /> : <FormattedMessage defaultMessage="Save" />}
						</button>
					</div>
				</section>

				{/* Visible weekdays */}
				<section className={styles.section}>
					<div className={styles.sectionTitle}><FormattedMessage defaultMessage="Visible weekdays" /></div>
					<div className={styles.weekdayGrid}>
						{AllWeekdays.map((d) => (
							<label className={styles.weekdayChip} key={d} title={weekdayLabels[d]}>
								<input
									type="checkbox"
									checked={isVisible(d)}
									onChange={() => toggleWeekday.mutate(d)}
								/>
								<span>{weekdayLabels[d]}</span>
							</label>
						))}
					</div>
					<p className={styles.hint}>
						<FormattedMessage defaultMessage="Uncheck a day to hide it in the scheduler." />
					</p>
				</section>
				<section className={styles.section}>
					<div className={styles.sectionTitle}>
						<FormattedMessage defaultMessage="Language" />
					</div>
					<LanguageSelect />
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
