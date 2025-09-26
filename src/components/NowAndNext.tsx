import { useMemo } from 'react'
import Avatar from 'boring-avatars'
import styles from './NowAndNext.module.css'

import { useKids, useMatters, useTimetable } from '../hooks/reactQueryHooks'
import type { Weekday } from '../types'
import { toMin, toTime } from '../utils/time'

/** Map JS Date.getDay() -> your Weekday keys */
const jsToWeekday: Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

/** Inclusive date check (YYYY-MM-DD strings) */
function isWithinDateRange(todayISO: string, start?: string, end?: string) {
	if (start && todayISO < start) return false
	if (end && todayISO > end) return false
	return true
}

type CardProps = {
	kidId: string
	kidName: string
	todayISO: string
	nowMins: number
}

function KidNowNextCard({ kidId, kidName, todayISO, nowMins }: CardProps) {
	const { data: matters = [] } = useMatters()
	const mattersById = useMemo(() => new Map(matters.map(m => [m.id, m])), [matters])

	const { data: timetable, isLoading } = useTimetable(kidId)

	// Today’s weekday key
	const todayKey: Weekday = jsToWeekday[new Date().getDay()]

	// Blocks for today that are valid for matter date range
	const todaysBlocks = useMemo(() => {
		const list = timetable?.days[todayKey] ?? []
		return list
			.filter(b => {
				const m = mattersById.get(b.matterId)
				if (!m) return false
				return isWithinDateRange(todayISO, m.startDate, m.endDate)
			})
			.slice()
			.sort((a, b) => toMin(a.start) - toMin(b.start))
	}, [timetable, todayKey, mattersById, todayISO])

	if (isLoading) {
		return (
			<div className={styles.card}>
				<div className={styles.kidHeader}>
					<Avatar name={kidName} size={40} variant="beam" colors={['#2f2e30', '#e84b2c', '#e6d839', '#7cd164', '#2eb8ac']} />
					<div className={styles.kidName}>{kidName}</div>
				</div>
				<div className={styles.skeleton} />
			</div>
		)
	}

	// Find "now" and "next"
	let currentIdx = -1
	for (let i = 0; i < todaysBlocks.length; i++) {
		const b = todaysBlocks[i]
		if (toMin(b.start) <= nowMins && nowMins < toMin(b.end)) {
			currentIdx = i
			break
		}
	}
	const nextIdx =
		currentIdx >= 0
			? currentIdx + 1
			: todaysBlocks.findIndex(b => toMin(b.start) > nowMins)

	const current = currentIdx >= 0 ? todaysBlocks[currentIdx] : null
	const next = nextIdx >= 0 ? todaysBlocks[nextIdx] : null

	// Progress for current
	let progressPct = 0
	if (current) {
		const dur = toMin(current.end) - toMin(current.start)
		const soFar = nowMins - toMin(current.start)
		progressPct = Math.max(0, Math.min(100, (soFar / Math.max(1, dur)) * 100))
	}

	const currentMatter = current ? mattersById.get(current.matterId) : undefined
	const nextMatter = next ? mattersById.get(next.matterId) : undefined

	return (
		<div className={styles.card}>
			<div className={styles.kidHeader}>
				<Avatar name={kidName} size={40} variant="beam" colors={['#2f2e30', '#e84b2c', '#e6d839', '#7cd164', '#2eb8ac']} />
				<div className={styles.kidName}>{kidName}</div>
			</div>

			{/* NOW */}
			<div className={styles.row}>
				<div className={styles.colTitle}>Now</div>
				{current && currentMatter ? (
					<div className={styles.nowBox}>
						<div className={styles.pill} style={{ borderColor: currentMatter.color || '#e5e7eb' }}>
							<span
								className={styles.dot}
								style={{ background: currentMatter.color || '#94a3b8' }}
							/>
							<span className={styles.pillName}>{currentMatter.name}</span>
							<span className={styles.timeRange}>
								{toTime(toMin(current.start))}–{toTime(toMin(current.end))}
							</span>
						</div>
						<div className={styles.progressTrack} aria-hidden>
							<div className={styles.progressBar} style={{ width: `${progressPct}%` }} />
						</div>
					</div>
				) : (
					<div className={styles.empty}>—</div>
				)}
			</div>

			{/* NEXT */}
			<div className={styles.row}>
				<div className={styles.colTitle}>Next</div>
				{next && nextMatter ? (
					<div className={styles.nextBox}>
						<div className={styles.pill} style={{ borderColor: nextMatter.color || '#e5e7eb' }}>
							<span
								className={styles.dot}
								style={{ background: nextMatter.color || '#94a3b8' }}
							/>
							<span className={styles.pillName}>{nextMatter.name}</span>
							<span className={styles.timeRange}>
								{toTime(toMin(next.start))}–{toTime(toMin(next.end))}
							</span>
						</div>
					</div>
				) : (
					<div className={styles.empty}>No more today</div>
				)}
			</div>
		</div>
	)
}

/** Public component: shows a responsive grid with one card per kid */
export default function NowNext() {
	const { data: kids = [] } = useKids()
	// const { data: cfg } = useConfig()

	const now = new Date()
	const nowMins = now.getHours() * 60 + now.getMinutes()
	const todayISO = now.toISOString().slice(0, 10)

	// If you ever want to restrict “today” to cfg.startHour/endHour, you can do it here.
	// (Right now we just display current & next within the full day.)

	return (
		<div className={styles.wrap}>
			<div className={styles.grid}>
				{kids.map(k => (
					<KidNowNextCard
						key={k.id}
						kidId={k.id}
						kidName={k.name}
						todayISO={todayISO}
						nowMins={nowMins}
					/>
				))}
			</div>
		</div>
	)
}
