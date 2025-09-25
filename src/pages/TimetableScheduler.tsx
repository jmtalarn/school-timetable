import {
	DndContext,
	DragOverlay,
	PointerSensor,
	useDroppable,
	useSensor,
	useSensors,
	type DragEndEvent,
	type DragMoveEvent,
	type DragOverEvent,
	type DragStartEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import React, { useMemo, useRef, useState } from 'react'
import KidSelect from '../components/KidSelect'
import { useConfig, useDeleteBlock, useKids, useMatters, useTimetable } from '../hooks/reactQueryHooks'
import { DefaultConfig, useSchedulerLogic } from '../scheduler/logic'
import styles from './TimetableScheduler.module.css'
// ---- Small draggable wrapper that supports move + resize via handles ----
import { useDraggable } from '@dnd-kit/core'
import { type Weekday } from '../types'
import { reorderWeekdays, weekdayLabels } from '../utils/week'
import { toMin, clamp, snap, toTime, minutesBetween } from '../utils/time'



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
	id, label, color, top, height, isDragging, onDelete,
}: {
	id: string; label: string; color?: string; top: number; height: number; isDragging?: boolean; onDelete?: () => void
}) {
	return (
		<div
			data-block-id={id}
			className={styles.block}
			style={{ top, height, background: color || '#e2e8f0', opacity: isDragging ? 0.5 : 1 }}
		>
			<div className={styles.blockHeader}>
				<span className={styles.blockLabel}>{label}</span>
				<div className={styles.blockRightCol}>
					<span className={styles.grip}>⋮⋮</span>
					<button
						type="button"
						aria-label="Delete block"
						title="Delete"
						onMouseDown={(e) => { e.stopPropagation(); e.preventDefault() }}
						onClick={(e) => { e.stopPropagation(); if (onDelete) onDelete() }}
						className={styles.deleteBtn}
					>
						🗑️
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

	// Build the ordered list of weekdays starting from config
	const orderedWeekdays = useMemo(
		() => reorderWeekdays(appCfg?.startOfWeek ?? 'mon'),
		[appCfg?.startOfWeek]
	)

	// Then apply the “hidden days” filter
	const visibleWeekdays = useMemo(() => {
		console.log({ orderedWeekdays, appCfg })
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
	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

	const gridRef = useRef<HTMLDivElement>(null)
	const colRefs = useRef<Record<Weekday, HTMLDivElement | null>>({ mon: null, tue: null, wed: null, thu: null, fri: null, sat: null, sun: null })

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

	const onEmptyCellClick = (day: Weekday, e: React.MouseEvent) => {
		const tgt = e.target as HTMLElement | null
		if (tgt && tgt.closest('[data-block-id]')) return
		const colEl = colRefs.current[day]
		if (!colEl) return
		const rect = colEl.getBoundingClientRect()
		const y = e.clientY - rect.top
		const row = Math.max(0, Math.min(scheduler.rows, Math.round(y / ROW_HEIGHT)))
		setCreateAt({ day, row })
		setPickerOpen(true)
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
	const openPickerAt = (loc: { day: Weekday; row: number }) => { setCreateAt(loc); setPickerOpen(true) }

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
		const dayStart = DefaultConfig.start
		const containerHeight = scheduler.rows * ROW_HEIGHT

		return (
			<div>
				<DroppableDay id={`col-${day}`} setRef={el => (colRefs.current[day] = el)}>
					<div
						onClick={e => onEmptyCellClick(day, e)}
						onMouseMove={e => onColumnMouseMove(day, e)}
						onMouseLeave={onColumnMouseLeave}
						className={styles.columnInner}
						style={{ height: containerHeight }}
					>
						{/* Horizontal hour lines */}
						{rowLabels.map((label, i) => (
							<div
								key={i}
								className={`${styles.hourLine} ${i % 12 === 0 ? styles.hourLineMajor : ''}`}
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
							const top = (minutesBetween(dayStart, b.start) / DefaultConfig.stepMinutes) * ROW_HEIGHT
							const height = (minutesBetween(b.start, b.end) / DefaultConfig.stepMinutes) * ROW_HEIGHT

							return (
								<DraggableBlock
									key={b.id}
									id={`blk-${b.id}`}
									day={day}
									label={matter?.name || 'Unknown'}
									color={matter?.color}
									top={top}
									height={height}
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
			<h2 className={styles.header}>Timetable</h2>

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
	id, day, label, color, top, height, onDelete,
}: {
	id: string; day: Weekday; label: string; color?: string; top: number; height: number; onDelete?: () => void
}) {
	const move = useDraggable({ id, data: { type: 'move', day, id: id.replace('blk-', '') } })
	const resizeStart = useDraggable({ id: `${id}-rsz-start`, data: { type: 'resize', day, id: id.replace('blk-', ''), anchor: 'start' as const } })
	const resizeEnd = useDraggable({ id: `${id}-rsz-end`, data: { type: 'resize', day, id: id.replace('blk-', ''), anchor: 'end' as const } })

	return (
		<div
			ref={move.setNodeRef}
			className={styles.blockWrap}
			style={{ top, height, transform: CSS.Translate.toString(move.transform) }}
			{...move.listeners}
			{...move.attributes}
		>
			<div className={`${styles.resizeHandle} ${styles.resizeStart}`} ref={resizeStart.setNodeRef} {...resizeStart.listeners} {...resizeStart.attributes} />
			<Block id={id} label={label} color={color} top={0} height={height} onDelete={onDelete} />
			<div className={`${styles.resizeHandle} ${styles.resizeEnd}`} ref={resizeEnd.setNodeRef} {...resizeEnd.listeners} {...resizeEnd.attributes} />
		</div>
	)
}
