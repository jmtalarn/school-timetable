import React, { useMemo, useState } from 'react'
import styles from './TodayView.module.css'
import KidSelect from '../components/KidSelect'
import { useKids, useMatters, useTimetable, useConfig } from '../hooks/reactQueryHooks'
import { DefaultConfig, useSchedulerLogic } from '../scheduler/logic'
import { toWeekday, weekdayLabels } from '../utils/week'
import { isSameDate, isDateWithin } from '../utils/date'
import { toMin } from '../utils/time'
import ShareExportButton from '../components/ShareExportButton'

/** Layout constants */
const ROW_HEIGHT = 9 // px per 5 minutes





export default function TodayView() {
	const { data: kids } = useKids()
	const { data: matters } = useMatters()
	const { data: cfg } = useConfig()

	// page state
	const [selectedKidId, setSelectedKidId] = useState<string | null>(null)
	const [selectedDate, setSelectedDate] = useState<Date>(() => new Date())

	// derive scheduler window from Settings (fallback to defaults)
	const startHH = cfg?.startHour ?? DefaultConfig.start
	const endHH = cfg?.endHour ?? DefaultConfig.end

	const scheduler = useSchedulerLogic({
		...DefaultConfig,
		start: startHH,
		end: endHH,
	})

	// Which weekday do we show?
	const selectedDay = toWeekday(selectedDate)
	const isTodaySelected = isSameDate(selectedDate, new Date())

	// nice heading label
	const dateLabel = useMemo(() => {
		try {
			return new Intl.DateTimeFormat(undefined, {
				weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
			}).format(selectedDate)
		} catch {
			return selectedDate.toDateString()
		}
	}, [selectedDate])

	// Fetch the kid's timetable (only once kid selected)
	const timetableQuery = useTimetable(selectedKidId || '')
	const dayBlocks = (timetableQuery.data?.days[selectedDay] ?? [])

	// Only show blocks whose matter is active on selectedDate
	const blocks = useMemo(() => {
		if (!matters) return dayBlocks
		return dayBlocks.filter(b => {
			const m = matters.find(x => x.id === b.matterId)
			if (!m) return false
			return isDateWithin(selectedDate, m.startDate, m.endDate)
		})
	}, [dayBlocks, matters, selectedDate])

	// Hour labels & column height
	const rowLabels = useMemo(() => scheduler.rowLabels, [scheduler.rowLabels])
	const containerHeight = scheduler.rows * ROW_HEIGHT

	// Current time line (only when selected day === today and within visible window)
	const nowLineTop = useMemo(() => {
		if (!isTodaySelected) return null
		const now = new Date()
		const nowMin = now.getHours() * 60 + now.getMinutes()
		const startMin = toMin(startHH)
		const endMin = toMin(endHH)
		if (nowMin < startMin || nowMin > endMin) return null
		const elapsed = nowMin - startMin
		const steps = elapsed / scheduler.cfg.stepMinutes
		return steps * ROW_HEIGHT
	}, [isTodaySelected, startHH, endHH, scheduler.cfg.stepMinutes])

	// Controls
	const goPrevDay = () =>
		setSelectedDate(d => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1))
	const goNextDay = () =>
		setSelectedDate(d => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1))
	// below goPrevDay / goNextDay
	const goToday = () => setSelectedDate(new Date())

	return (
		<div className={styles.container}>
			<header className={styles.header}>
				<h2 className={styles.pageTitle}>Today</h2>
				<div className={styles.shareWrapper}>
					<ShareExportButton currentKidId={selectedKidId} />
				</div>
				<div className={styles.dateNav} role="group" aria-label="Pick date">
					<button type="button" className={styles.navBtn} onClick={goPrevDay} aria-label="Previous day">◀</button>
					<div className={styles.dateLabel}>{dateLabel}</div>
					<button type="button" className={styles.navBtn} onClick={goNextDay} aria-label="Next day">▶</button>
					<button
						type="button"
						className={`${styles.navBtn} ${styles.todayBtn}`}
						onClick={goToday}
						disabled={isTodaySelected}
						title="Jump to today"
					>
						Today
					</button>
				</div>
			</header>


			{/* Kid picker */}
			<div className={styles.kidRow}>
				<KidSelect value={selectedKidId} onChange={setSelectedKidId} kids={kids || []} />
			</div>


			{/* Day column */}
			{selectedKidId ? (
				<div className={styles.gridWrapper}>
					<div className={styles.grid}>
						<div>
							<div className={styles.columnTitle}>{weekdayLabels[selectedDay]}</div>
							<div className={styles.columnInner} style={{ height: containerHeight }}>
								{/* hour lines */}
								{rowLabels.map((label, i) => (
									<div
										key={i}
										className={`${styles.hourLine} ${i % 12 === 0 ? styles.hourLineMajor : ''}`}
										style={{ top: i * ROW_HEIGHT }}
									>
										{label && <span className={styles.hourLabel}>{label}</span>}
									</div>
								))}

								{/* now line with left dot (only on actual today) */}
								{nowLineTop !== null && (
									<div className={styles.nowLine} style={{ top: nowLineTop }}>
										<span className={styles.nowDot} />
									</div>
								)}

								{/* blocks */}
								{blocks.map(b => {
									const matter = matters?.find(m => m.id === b.matterId)
									const top = ((toMin(b.start) - toMin(startHH)) / scheduler.cfg.stepMinutes) * ROW_HEIGHT
									const height = ((toMin(b.end) - toMin(b.start)) / scheduler.cfg.stepMinutes) * ROW_HEIGHT
									return (
										<div
											key={b.id}
											className={styles.block}
											style={{
												top,
												height,
												background: matter?.color || '#e2e8f0',
											}}
											title={`${matter?.name ?? 'Unknown'} • ${b.start}–${b.end}`}
										>
											<div className={styles.blockHeader}>
												<span className={styles.blockTime}><span>{b.start}</span><span>{b.end}</span></span>
												<span className={styles.blockLabel}>{matter?.name || 'Unknown'}</span>
											</div>
										</div>
									)
								})}
							</div>
						</div>
					</div>
				</div>
			) : (
				<p className={styles.hint}>Select a kid to see the schedule for this day.</p>
			)}
		</div>
	)
}
