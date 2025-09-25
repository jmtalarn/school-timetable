import React, { useMemo, useState } from 'react'
import styles from './WeekView.module.css'
import KidSelect from '../components/KidSelect'
import { useKids, useMatters, useTimetable, useConfig } from '../hooks/reactQueryHooks'
import { DefaultConfig } from '../scheduler/logic'
import { type Weekday } from '../types'
import { JS_TO_W } from '../utils/week'
import { startOfWeek, addDays, weekdayFromDate, fmtISO, fmtPretty } from '../utils/date'
import { minutesBetween, toMin } from '../utils/time'

/** Visual row height (matches scheduler) */
const ROW_HEIGHT = 9 // px per 5 minutes




// ----------------- component -----------------
export default function WeekView() {
	const { data: kids } = useKids()
	const { data: matters } = useMatters()
	const { data: cfg } = useConfig()

	const [selectedKidId, setSelectedKidId] = useState<string | null>(null)
	const [viewAnchor, setViewAnchor] = useState<Date>(() => {
		const t = new Date()
		t.setHours(0, 0, 0, 0)
		return t
	})

	const timetableQuery = useTimetable(selectedKidId || '')

	// derive scheduler window from settings (fallback to defaults)
	const startHour = cfg?.startHour ?? DefaultConfig.start
	const endHour = cfg?.endHour ?? DefaultConfig.end
	const stepMin = DefaultConfig.stepMinutes
	const rows = Math.round(minutesBetween(startHour, endHour) / stepMin)
	const containerHeight = rows * ROW_HEIGHT

	// week layout derived from settings
	const startOfWeekSetting: Weekday = cfg?.startOfWeek ?? 'mon'
	const weekStart = useMemo(() => startOfWeek(viewAnchor, startOfWeekSetting), [viewAnchor, startOfWeekSetting])
	const weekDaysAll: { date: Date; w: Weekday }[] = useMemo(
		() => Array.from({ length: 7 }, (_, i) => {
			const date = addDays(weekStart, i)
			return { date, w: weekdayFromDate(date) }
		}),
		[weekStart]
	)

	// respect hidden weekdays (if any)
	const visibleDays = useMemo(() => {
		if (!cfg?.hiddenWeekdays?.length) return weekDaysAll
		const hidden = new Set(cfg.hiddenWeekdays)
		return weekDaysAll.filter(d => !hidden.has(d.w))
	}, [cfg?.hiddenWeekdays, weekDaysAll])

	// quick matter lookup + active check on specific date
	const matterById = useMemo(() => {
		const map = new Map<string, (typeof matters extends Array<any> ? never : any)>()
		matters?.forEach(m => map.set(m.id, m))
		return map
	}, [matters])

	const isMatterActiveOn = (matterId: string, on: Date) => {
		const m = matterById.get(matterId)
		if (!m) return true
		const iso = fmtISO(on)
		if (m.startDate && iso < m.startDate) return false
		if (m.endDate && iso > m.endDate) return false
		return true
	}

	// now-line only if week contains today and inside the visible window
	const now = new Date()
	const todayISO = fmtISO(now)
	const showNowIn = useMemo(() => {
		const s = fmtISO(weekStart)
		const e = fmtISO(addDays(weekStart, 6))
		if (todayISO < s || todayISO > e) return null
		const mins = now.getHours() * 60 + now.getMinutes()
		const y = (mins - toMin(startHour))
		if (y < 0 || (mins > toMin(endHour))) return null
		return {
			top: Math.round((y / stepMin) * ROW_HEIGHT),
			dayKey: weekdayFromDate(now) as Weekday,
		}
	}, [weekStart, startHour, endHour, stepMin])

	// header title like: "Sep 9–15, 2025"
	const headerTitle = useMemo(() => {
		const left = weekStart
		const right = addDays(weekStart, 6)
		const sameYear = left.getFullYear() === right.getFullYear()
		return `${fmtPretty(left)}–${fmtPretty(right)}${sameYear ? `, ${left.getFullYear()}` : ''}`
	}, [weekStart])

	return (
		<div className={styles.container}>
			<h2 className={styles.pageTitle}>Weekly</h2>
			<header className={styles.toolbar}>
				<div className={styles.kidSlot}>
					<KidSelect value={selectedKidId} onChange={setSelectedKidId} kids={kids || []} />
				</div>

				<div className={styles.dateNav}>
					<button
						type="button"
						className={styles.navBtn}
						aria-label="Previous week"
						onClick={() => setViewAnchor(addDays(weekStart, -7))}
					>
						◀
					</button>
					<div className={styles.when}>
						<strong>{headerTitle}</strong>
					</div>
					<button
						type="button"
						className={styles.navBtn}
						aria-label="Next week"
						onClick={() => setViewAnchor(addDays(weekStart, 7))}
					>
						▶
					</button>
					<button
						type="button"
						className={`${styles.navBtn} ${styles.todayBtn}`}
						onClick={() => setViewAnchor(new Date())}
						title="Jump to current week"
					>
						Today
					</button>
				</div>

			</header>

			{!selectedKidId || !timetableQuery.data ? (
				<p className={styles.hint}>Pick a kid to view the weekly timetable.</p>
			) : (
				<div className={styles.gridWrapper}>
					<div className={styles.grid}>
						{visibleDays.map(({ date, w }) => {
							const dayBlocks = (timetableQuery.data?.days?.[w] ?? []).filter(b => isMatterActiveOn(b.matterId, date))
							return (
								<div key={fmtISO(date)}>
									<div className={styles.columnTitle}>
										<div className={styles.dayName}>
											{date.toLocaleDateString(undefined, { weekday: 'long' })}
										</div>
										<div className={styles.dayDate}>
											{date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
										</div>
									</div>

									<div className={styles.columnInner} style={{ height: containerHeight }}>
										{/* Hour grid */}
										{Array.from({ length: rows + 1 }).map((_, i) => {
											const top = i * ROW_HEIGHT
											const isMajor = i % (60 / stepMin) === 0 // each 60min
											const hh = Math.floor((toMin(startHour) + i * stepMin) / 60)
											const label = isMajor ? `${String(hh).padStart(2, '0')}:00` : ''
											return (
												<div
													key={i}
													className={`${styles.hourLine} ${isMajor ? styles.hourLineMajor : ''}`}
													style={{ top }}
												>
													{label && <span className={styles.hourLabel}>{label}</span>}
												</div>
											)
										})}

										{/* Now line (only on today's column in this week) */}
										{showNowIn && JS_TO_W[new Date(date).getDay()] === showNowIn.dayKey && (
											<div className={styles.nowLine} style={{ top: showNowIn.top }}>
												<span className={styles.nowDot} />
											</div>
										)}

										{/* Blocks */}
										{dayBlocks.map((b: any) => {
											const matter = matters?.find(m => m.id === b.matterId)
											const top = (minutesBetween(startHour, b.start) / stepMin) * ROW_HEIGHT
											const height = (minutesBetween(b.start, b.end) / stepMin) * ROW_HEIGHT
											return (
												<div
													key={b.id}
													className={styles.block}
													style={{
														top,
														height,
														background: matter?.color || '#e2e8f0',
													}}
													title={`${matter?.name || 'Block'} • ${b.start}–${b.end}`}
												>
													<div className={styles.blockTime}>
														{b.start}
													</div>
													<div className={styles.blockLabel}>
														{matter?.name || 'Unknown'}
													</div>
													<div className={styles.blockTime}>
														{b.end}
													</div>
												</div>
											)
										})}
									</div>
								</div>
							)
						})}
					</div>
				</div>
			)}
		</div>
	)
}
