import {
	DndContext,
	DragOverlay,
	PointerSensor,
	TouchSensor,
	useDroppable,
	useSensor,
	useSensors,
	type DragEndEvent,
	type DragMoveEvent,
	type DragOverEvent,
	type DragStartEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import KidSelect from '../components/KidSelect'
import { useConfig, useDeleteBlock, useKids, useMatters, useTimetable } from '../hooks/reactQueryHooks'
import { DefaultConfig, useSchedulerLogic } from '../scheduler/logic'
import styles from './TimetableScheduler.module.css'
// ---- Small draggable wrapper that supports move + resize via handles ----
import { useDraggable } from '@dnd-kit/core'
import { type Weekday } from '../types'
import { reorderWeekdays, useWeekdayLabels } from '../utils/week'
import { toMin, clamp, snap, toTime, minutesBetween } from '../utils/time'
import deleteIcon from '../assets/delete.svg'
import { FormattedMessage } from 'react-intl'


const ROW_HEIGHT = 9 // px per 5 minutes



// ---- Matter picker (headless + minimal UI) ----
function MatterPicker({
	open,
	matters,
	onPick,
	onClose,
}: {
	open: boolean
	matters: { id: string; name: string; color?: string }[] | undefined
	onPick: (id: string) => void
	onClose: () => void
}) {
	if (!open) return null
	return (
		<div role="dialog" aria-modal onClick={onClose} className={styles.pickerOverlay}>
			<div onClick={e => e.stopPropagation()} className={styles.pickerDialog}>
				<h3 className={styles.pickerTitle}>Select a matter</h3>
				<div>
					{matters?.length ? (
						<ul className={styles.pickerList}>
							{matters.map(m => (
								<li key={m.id} className={styles.pickerItem}>
									<button onClick={() => onPick(m.id)} className={styles.pickerBtn}>
										<span className={styles.pickerDot} style={{ background: m.color || '#cbd5e1' }} />
										<span>{m.name}</span>
									</button>
								</li>
							))}
						</ul>
					) : (
						<p className={styles.hint}>No matters yet. Create one first.</p>
					)}
				</div>
				<div className={styles.pickerFooter}>
					<button onClick={onClose} className={styles.button}>Cancel</button>
				</div>
			</div>
		</div>
	)
}

// ---- Draggable block + resize handles ----
function Block({
	id, label, color, top, height, isDragging, showHint, onDelete,
}: {
	id: string; label: string; color?: string; start?: string; end?: string; top: number; height: number; isDragging?: boolean; showHint?: boolean; onDelete?: () => void
}) {
	return (
		<div
			data-block-id={id}
			className={`${styles.block} ${showHint ? styles.showHint : ''}`}
			style={{ top, height, background: color || '#e2e8f0', opacity: isDragging ? 0.5 : 1 }}
		>
			<div className={styles.blockHeader}>
				<span className={styles.blockLabel}>{label}</span>
				<div className={styles.blockRightCol}>
					<span className={styles.grip}></span>
					<button
						type="button"
						aria-label="Delete block"
						title="Delete"
						onPointerDown={(e) => { e.stopPropagation(); e.preventDefault() }}
						onTouchStart={(e) => { e.stopPropagation(); e.preventDefault() }}
						onClick={(e) => { e.stopPropagation(); if (onDelete) onDelete() }}
						className={styles.deleteBtn}
					>
						<img src={deleteIcon} alt="Delete" className={styles.deleteIcon} />
					</button>
				</div>
			</div>
			{/* Resize handles */}
			<div className={`${styles.resizeHandle} ${styles.resizeStart}`} data-resize="start" />
			<div className={`${styles.resizeHandle} ${styles.resizeEnd}`} data-resize="end" />
		</div>
	)
}

// ---- Droppable column helper ----
function DroppableDay({ id, setRef, children }: { id: string; setRef: (el: HTMLDivElement | null) => void; children: React.ReactNode }) {
	const { setNodeRef, isOver } = useDroppable({ id })
	return (
		<div ref={(el) => { setNodeRef(el); setRef(el) }} className={`${styles.droppable} ${isOver ? styles.isOver : ''}`}>
			{children}
		</div>
	)
}

// ---- Main page ----
export default function TimetableScheduler() {
	const { data: kids } = useKids()
	const { data: matters } = useMatters()
	const { data: appCfg } = useConfig();
	const weekdayLabels = useWeekdayLabels();
	// Build the ordered list of weekdays starting from config
	const orderedWeekdays = useMemo(
		() => reorderWeekdays(appCfg?.startOfWeek ?? 'mon'),
		[appCfg?.startOfWeek]
	)
	const tapRef = useRef<{ x: number; y: number; moved: boolean; allowed: boolean } | null>(null)
	const downTimeRef = useRef<number>(0)
	const scrollRef = useRef<{ winY: number; wrapX: number }>({ winY: 0, wrapX: 0 })

	// Then apply the “hidden days” filter
	const visibleWeekdays = useMemo(() => {
		const hidden = new Set(appCfg?.hiddenWeekdays ?? [])
		return orderedWeekdays.filter(d => !hidden.has(d))
	}, [orderedWeekdays, appCfg?.hiddenWeekdays])

	const [selectedKidId, setSelectedKidId] = useState<string | null>(null)
	const [hoverCell, setHoverCell] = useState<null | { day: Weekday; row: number }>(null)
	const timetableQuery = useTimetable(selectedKidId || '')
	const scheduler = useSchedulerLogic({
		...DefaultConfig,
		start: appCfg?.startHour ?? DefaultConfig.start,
		end: appCfg?.endHour ?? DefaultConfig.end,
	})
	const deleteBlock = useDeleteBlock()

	// create popup state
	const [createAt, setCreateAt] = useState<null | { day: Weekday; row: number }>(null)

	// DnD state
	const [activeId, setActiveId] = useState<string | null>(null)
	const [activeMeta, setActiveMeta] = useState<
		| null
		| { type: 'move'; day: Weekday; id: string }
		| { type: 'resize'; day: Weekday; id: string; anchor: 'start' | 'end' }
	>(null)
	const [activeSnap, setActiveSnap] = useState<null | { label: string; color?: string; height: number; startLabel?: string; endLabel?: string }>(null)
	const [activeResizeBase, setActiveResizeBase] = useState<null | { day: Weekday; startMin: number; endMin: number }>(null)
	const [activeMoveBase, setActiveMoveBase] = useState<null | { day: Weekday; startMin: number; endMin: number }>(null)
	const [resizeOffsetRows, setResizeOffsetRows] = useState(0)
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { delay: 140, tolerance: 6 } }),
		useSensor(TouchSensor, { activationConstraint: { delay: 140, tolerance: 6 } }),
	)
	// near other state at top of component
	const [showResizeHint, setShowResizeHint] = useState(false);

	useEffect(() => {
		const KEY = 'st.seenResizeHint';
		const seen = localStorage.getItem(KEY);
		if (!seen) {
			setShowResizeHint(true);
			localStorage.setItem(KEY, '1');
			const t = setTimeout(() => setShowResizeHint(false), 2000);
			return () => clearTimeout(t);
		}
	}, []);
	const gridRef = useRef<HTMLDivElement>(null)
	const colRefs = useRef<Record<Weekday, HTMLDivElement | null>>({ mon: null, tue: null, wed: null, thu: null, fri: null, sat: null, sun: null })

	const TAP_MOVE_TOLERANCE = 6 // px
	const TAP_MAX_DURATION = 250 // ms – > this feels like a tap, longer is likely scroll/press

	const onColumnMouseMove = (day: Weekday, e: React.MouseEvent) => {
		const el = colRefs.current[day]
		if (!el) return
		const rect = el.getBoundingClientRect()
		const y = e.clientY - rect.top
		let row = Math.floor(y / ROW_HEIGHT)
		row = Math.max(0, Math.min(scheduler.rows - 1, row))
		setHoverCell({ day, row })
	}
	const onColumnMouseLeave = () => setHoverCell(null)

	const onEmptyCellClick = (day: Weekday, e: React.MouseEvent | React.PointerEvent) => {
		if (pickerOpen) return
		const tgt = e.target as HTMLElement | null
		if (
			!tgt ||
			tgt.closest('[data-block-id]') ||
			tgt.closest(`.${styles.resizeHandle}`) ||
			tgt.closest(`.${styles.blockWrap}`)
		) return

		const colEl = colRefs.current[day]
		if (!colEl) return
		const rect = colEl.getBoundingClientRect()
		const clientY = 'clientY' in e ? (e as any).clientY : 0
		const y = clientY - rect.top
		const row = Math.max(0, Math.min(scheduler.rows, Math.round(y / ROW_HEIGHT)))

		setCreateAt({ day, row })
		// open on next frame to avoid ghost clicks leaking through
		requestAnimationFrame(() => setPickerOpen(true))
	}


	const blocksFor = (day: Weekday) => timetableQuery.data?.days[day] ?? []

	// Drag helpers
	function dragStart(e: DragStartEvent) {
		const { active } = e
		const data = active.data.current as any
		setActiveId(String(active.id))
		setActiveMeta(data)
		setResizeOffsetRows(0)

		if (data && (data.type === 'move' || data.type === 'resize')) {
			if ('vibrate' in navigator) {
				try { navigator.vibrate?.(10); } catch { }
			}
			const b = blocksFor(data.day).find((x: any) => x.id === data.id)
			if (b) {
				const matter = matters?.find(m => m.id === b.matterId)
				const startMin = toMin(b.start)
				const endMin = toMin(b.end)
				const h = (endMin - startMin) / scheduler.cfg.stepMinutes * ROW_HEIGHT
				setActiveSnap({ label: matter?.name || 'Unknown', color: matter?.color, height: h, startLabel: b.start, endLabel: b.end })
				if (data.type === 'resize') setActiveResizeBase({ day: data.day as Weekday, startMin, endMin })
				else if (data.type === 'move') setActiveMoveBase({ day: data.day as Weekday, startMin, endMin })
			}
		}
	}

	function dragOver(_e: DragOverEvent) { }

	function dragMove(e: DragMoveEvent) {
		const { active, delta } = e
		const meta = active.data.current as
			| { type: 'move'; day: Weekday; id: string }
			| { type: 'resize'; day: Weekday; id: string; anchor: 'start' | 'end' }
			| null

		if (!meta) return

		const step = scheduler.cfg.stepMinutes
		const dayStart = toMin(scheduler.cfg.start)
		const dayEnd = toMin(scheduler.cfg.end)

		const byRows = Math.round(delta.y / ROW_HEIGHT)
		const deltaMin = byRows * step

		if (meta.type === 'resize' && activeResizeBase) {
			const minDur = Math.max(scheduler.cfg.minDurationMin ?? step, step)
			let startMin = activeResizeBase.startMin
			let endMin = activeResizeBase.endMin

			if (meta.anchor === 'start') {
				startMin = clamp(snap(startMin + deltaMin, step), dayStart, endMin - minDur)
				setResizeOffsetRows(0)
			} else {
				endMin = clamp(snap(endMin + deltaMin, step), startMin + minDur, dayEnd)
				setResizeOffsetRows(byRows)
			}

			const height = ((endMin - startMin) / step) * ROW_HEIGHT
			setActiveSnap(prev => prev ? { ...prev, height, startLabel: toTime(startMin), endLabel: toTime(endMin) } : prev)
			return
		}

		if (meta.type === 'move' && activeMoveBase) {
			const dur = activeMoveBase.endMin - activeMoveBase.startMin
			const startMin = clamp(snap(activeMoveBase.startMin + deltaMin, step), dayStart, dayEnd - dur)
			const endMin = startMin + dur
			setActiveSnap(prev => prev ? { ...prev, startLabel: toTime(startMin), endLabel: toTime(endMin) } : prev)
			setResizeOffsetRows(0)
		}
	}

	async function dragEnd(e: DragEndEvent) {
		const { active, delta, over } = e
		const meta = active.data.current as any
		setActiveId(null)
		setActiveMeta(null)
		setActiveSnap(null)
		setActiveResizeBase(null)
		setActiveMoveBase(null)
		setResizeOffsetRows(0)

		if (!selectedKidId || !timetableQuery.data || !meta) return

		const byRows = Math.round(delta.y / ROW_HEIGHT)
		const overId = over?.id as string | undefined
		const dropDay: Weekday | null = overId?.toString().startsWith('col-') ? (overId!.toString().slice(4) as Weekday) : null

		if (meta.type === 'move') {
			const fromDay = meta.day
			const toDay = dropDay ?? fromDay
			await scheduler.moveBlock({
				kidId: selectedKidId,
				fromDay,
				toDay,
				block: blocksFor(fromDay).find(b => b.id === meta.id)!,
				byRows,
				dayBlocksFrom: blocksFor(fromDay),
				dayBlocksTo: blocksFor(toDay),
			})
			return
		}

		if (meta.type === 'resize') {
			await scheduler.resizeBlock({
				kidId: selectedKidId,
				day: meta.day,
				block: blocksFor(meta.day).find(b => b.id === meta.id)!,
				anchor: meta.anchor,
				byRows,
				dayBlocks: blocksFor(meta.day),
			})
			return
		}
	}

	// Create flow
	const [pickerOpen, setPickerOpen] = useState(false)


	const confirmCreate = async (matterId: string) => {
		if (!selectedKidId || !createAt) return
		setPickerOpen(false)
		await scheduler.createFromCell({ kidId: selectedKidId, day: createAt.day, row: createAt.row, matterId })
		setCreateAt(null)
	}

	// Render helpers
	const rowLabels = useMemo(() => scheduler.rowLabels, [scheduler.rowLabels])

	const renderColumn = (day: Weekday) => {
		const blocks = blocksFor(day)
		const step = scheduler.cfg.stepMinutes
		const containerHeight = scheduler.rows * ROW_HEIGHT
		const rowsPerHour = 60 / step

		return (
			<div>
				<DroppableDay id={`col-${day}`} setRef={el => (colRefs.current[day] = el)}>
					<div
						onPointerDown={(e) => {
							const t = e.target as HTMLElement | null
							const onBlockOrHandle =
								t?.closest('[data-block-id]') ||
								t?.closest(`.${styles.resizeHandle}`) ||
								t?.closest(`.${styles.blockWrap}`)

							tapRef.current = {
								x: e.clientX,
								y: e.clientY,
								moved: false,
								allowed: !onBlockOrHandle,
							}
							downTimeRef.current = performance.now()

							// snapshot scroll positions (page Y + horizontal grid wrapper X)
							scrollRef.current.winY = window.scrollY
							scrollRef.current.wrapX = gridRef.current?.scrollLeft ?? 0
						}}
						onPointerMove={(e) => {
							if (!tapRef.current) return
							const dx = Math.abs(e.clientX - tapRef.current.x)
							const dy = Math.abs(e.clientY - tapRef.current.y)
							if (dx > TAP_MOVE_TOLERANCE || dy > TAP_MOVE_TOLERANCE) {
								tapRef.current.moved = true
							}
						}}
						onPointerUp={(e) => {
							e.preventDefault() // suppress synthetic click

							const duration = performance.now() - downTimeRef.current
							const scrolled =
								Math.abs(window.scrollY - scrollRef.current.winY) > 0 ||
								Math.abs((gridRef.current?.scrollLeft ?? 0) - scrollRef.current.wrapX) > 0

							const wasTap =
								tapRef.current?.allowed &&
								!tapRef.current?.moved &&
								!scrolled &&
								duration <= TAP_MAX_DURATION &&
								!activeId &&              // don't create if a drag was active
								!pickerOpen               // don't create if the picker is open

							tapRef.current = null

							if (!wasTap) return

							// real tap → open picker
							onEmptyCellClick(day, e)
						}}
						onPointerCancel={() => { tapRef.current = null }}
						onPointerLeave={() => { tapRef.current = null }}
						onMouseMove={(e) => onColumnMouseMove(day, e)}
						onMouseLeave={onColumnMouseLeave}
						className={styles.columnInner}
						style={{ height: containerHeight }}

					>
						{/* Horizontal hour lines */}
						{rowLabels.map((label, i) => (
							<div
								key={i}
								className={`${styles.hourLine} ${i % rowsPerHour === 0 ? styles.hourLineMajor : ''}`}
								style={{ top: i * ROW_HEIGHT }}
							>
								{label && <span className={styles.hourLabel}>{label}</span>}
							</div>
						))}

						{/* Hover highlight (one 5-minute row) */}
						{hoverCell && hoverCell.day === day && !activeId && (
							<div
								className={styles.hoverBand}
								style={{ top: hoverCell.row * ROW_HEIGHT, height: ROW_HEIGHT }}
							/>
						)}

						{/* Blocks */}
						{blocks.map(b => {
							const matter = matters?.find(m => m.id === b.matterId)
							const top = (minutesBetween(scheduler.cfg.start, b.start) / step) * ROW_HEIGHT
							const height = (minutesBetween(b.start, b.end) / step) * ROW_HEIGHT

							return (
								<DraggableBlock
									key={b.id}
									id={`blk-${b.id}`}
									day={day}
									label={matter?.name || 'Unknown'}
									color={matter?.color}
									top={top}
									start={b.start}
									end={b.end}
									height={height}
									showHint={showResizeHint}
									onDelete={() => {
										if (window.confirm('Delete this block?')) {
											deleteBlock.mutate({ kidId: selectedKidId!, day, id: b.id })
										}
									}}
								/>
							)
						})}
					</div>
				</DroppableDay>
			</div>
		)
	}

	const baseResizeHeightPx =
		activeMeta?.type === 'resize' && activeMeta.anchor === 'end' && activeResizeBase
			? ((activeResizeBase.endMin - activeResizeBase.startMin) / scheduler.cfg.stepMinutes) * ROW_HEIGHT
			: 0

	// --- Render ---
	return (
		<div className={styles.container}>
			<h2 className={styles.header}><FormattedMessage defaultMessage="Timetable" /></h2>

			<div className={styles.kidRow}>

				<KidSelect value={selectedKidId} onChange={setSelectedKidId} kids={kids || []} />

			</div>

			{selectedKidId && timetableQuery.data ? (
				<DndContext sensors={sensors} onDragStart={dragStart} onDragOver={dragOver} onDragMove={dragMove} onDragEnd={dragEnd}>
					<div ref={gridRef} className={styles.gridWrapper}>
						<div className={styles.grid}>
							{visibleWeekdays.map(day => (
								<div key={day}>
									<div className={styles.columnTitle}>{weekdayLabels[day]}</div>
									{renderColumn(day)}
								</div>
							))}
						</div>
					</div>

					<DragOverlay>
						{activeSnap ? (
							<div
								className={styles.overlayBox}
								style={{
									height: activeSnap.height,
									transform:
										activeMeta?.type === 'resize' && activeMeta.anchor === 'end'
											? `translateY(${-(baseResizeHeightPx + resizeOffsetRows * ROW_HEIGHT)}px)`
											: 'none',
								}}
							>
								<Block id={'overlay'} label={activeSnap.label} color={activeSnap.color} top={0} height={activeSnap.height} isDragging />
								{activeSnap.startLabel && (
									<div className={`${styles.timeBadge} ${styles.timeBadgeTop}`}>
										{activeSnap.startLabel}
									</div>
								)}
								{activeSnap.endLabel && (
									<div className={`${styles.timeBadge} ${styles.timeBadgeBottom}`}>
										{activeSnap.endLabel}
									</div>
								)}
							</div>
						) : null}
					</DragOverlay>
				</DndContext>
			) : (
				<p className={styles.hint}>Select a kid to edit the timetable.</p>
			)}

			<MatterPicker
				open={pickerOpen && !!createAt}
				matters={matters}
				onPick={id => confirmCreate(id)}
				onClose={() => { setPickerOpen(false); setCreateAt(null) }}
			/>
		</div>
	)
}


function DraggableBlock({
	id, day, label, color, top, start, end, height, showHint, onDelete,
}: {
	id: string; day: Weekday; label: string; start: string; end: string; color?: string; top: number; height: number; showHint?: boolean; onDelete?: () => void
}) {
	const move = useDraggable({
		id,
		data: { type: 'move', day, id: id.replace('blk-', '') },
	})
	const resizeStart = useDraggable({ id: `${id}-rsz-start`, data: { type: 'resize', day, id: id.replace('blk-', ''), anchor: 'start' as const } })
	const resizeEnd = useDraggable({ id: `${id}-rsz-end`, data: { type: 'resize', day, id: id.replace('blk-', ''), anchor: 'end' as const } })

	return (
		<div
			ref={move.setNodeRef}
			className={styles.blockWrap}
			style={{ top, height, transform: CSS.Translate.toString(move.transform) }}
			// IMPORTANT: no move.listeners / move.attributes here
			onMouseDown={(e) => e.stopPropagation()}
			onTouchStart={(e) => e.stopPropagation()}
		>
			<div
				className={`${styles.resizeHandle} ${styles.resizeStart}`}
				ref={resizeStart.setNodeRef}
				{...resizeStart.listeners}
				{...resizeStart.attributes}
				onMouseDown={(e) => e.stopPropagation()}
				onTouchStart={(e) => e.stopPropagation()}
			/>
			<Block
				id={id}
				label={label}
				color={color}
				top={0}
				height={height}
				start={start}
				end={end}
				showHint={showHint}
				onDelete={onDelete}
			/>
			<div
				className={`${styles.resizeHandle} ${styles.resizeEnd}`}
				ref={resizeEnd.setNodeRef}
				{...resizeEnd.listeners}
				{...resizeEnd.attributes}
				onMouseDown={(e) => e.stopPropagation()}
				onTouchStart={(e) => e.stopPropagation()}
			/>

			{/* DRAG HANDLE – attach the move listeners/attributes here */}
			<button
				className={styles.dragHandle}
				aria-label="Drag"
				{...move.listeners}
				{...move.attributes}
				onMouseDown={(e) => e.stopPropagation()}
				onTouchStart={(e) => e.stopPropagation()}
			>
				⋮⋮
			</button>
		</div>
	)
}
