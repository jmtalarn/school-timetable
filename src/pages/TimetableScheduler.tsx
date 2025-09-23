import React, { useMemo, useRef, useState } from 'react'
import {
	DndContext,
	DragOverlay,
	useSensor,
	useSensors,
	PointerSensor,
	useDroppable,
	type DragStartEvent,
	type DragEndEvent,
	type DragOverEvent,
	type DragMoveEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useKids, useMatters, useTimetable } from '../hooks/reactQueryHooks'
import { useSchedulerLogic, DefaultConfig } from '../scheduler/logic'

// ---- Local types ----
type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

const weekdays: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const weekdayLabels: Record<Weekday, string> = {
	mon: 'Monday',
	tue: 'Tuesday',
	wed: 'Wednesday',
	thu: 'Thursday',
	fri: 'Friday',
	sat: 'Saturday',
	sun: 'Sunday',
}

const ROW_HEIGHT = 9 // px per 5 minutes (with DefaultConfig.stepMinutes=5 → 12 rows/hour ~ 216px/hour)

// ---- time helpers ----
function toMin(t: string) { const [h, m] = t.split(':').map(Number); return h * 60 + m }
function toTime(mins: number) {
	const h = Math.floor(mins / 60), m = mins % 60
	return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }
function snap(mins: number, step: number) { return Math.round(mins / step) * step }
function minutesBetween(a: string, b: string) { return toMin(b) - toMin(a) }

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
		<div
			role="dialog"
			aria-modal
			onClick={onClose}
			style={{
				position: 'fixed', top: 0, right: 0, bottom: 0, left: 0,
				display: 'flex', alignItems: 'center', justifyContent: 'center',
				backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 50,
			}}
		>
			<div
				onClick={e => e.stopPropagation()}
				style={{ width: 320, borderRadius: 12, background: '#fff', padding: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }}
			>
				<h3 style={{ marginBottom: 8, fontSize: 18, fontWeight: 600 }}>Select a matter</h3>
				<div style={{ maxHeight: 240, overflowY: 'auto' }}>
					{matters?.length ? (
						<ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
							{matters.map(m => (
								<li key={m.id} style={{ marginBottom: 8 }}>
									<button
										onClick={() => onPick(m.id)}
										style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 12, borderRadius: 10, border: '1px solid #e5e7eb', padding: '8px 12px', background: '#fff', textAlign: 'left', cursor: 'pointer' }}
									>
										<span style={{ display: 'inline-block', height: 16, width: 16, borderRadius: 4, background: m.color || '#cbd5e1' }} />
										<span>{m.name}</span>
									</button>
								</li>
							))}
						</ul>
					) : (
						<p style={{ fontSize: 14, color: '#4b5563' }}>No matters yet. Create one first.</p>
					)}
				</div>
				<div style={{ marginTop: 12, textAlign: 'right' }}>
					<button onClick={onClose} style={{ borderRadius: 10, border: '1px solid #e5e7eb', padding: '6px 12px', background: '#fff', cursor: 'pointer' }}>Cancel</button>
				</div>
			</div>
		</div>
	)
}

// ---- Draggable block + resize handles ----
function Block({ id, label, color, top, height, isDragging }: { id: string; label: string; color?: string; top: number; height: number; isDragging?: boolean }) {
	return (
		<div
			data-block-id={id}
			style={{ position: 'absolute', left: 4, right: 4, userSelect: 'none', cursor: 'move', borderRadius: 6, border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 1px 2px rgba(0,0,0,0.06)', background: color || '#e2e8f0', top, height, opacity: isDragging ? 0.5 : 1 }}
		>
			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '4px 8px', height: "100%", fontSize: 12 }}>
				<span style={{ whiteSpace: 'break-spaces', fontWeight: 600 }}>{label}</span>
				<div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column', justifyContent: 'space-between', height: '85%' }}>
					<span style={{ fontSize: 11, color: '#4b5563' }}>⋮⋮</span>
					<span style={{ fontSize: 11, color: '#4b5563', cursor: 'pointer' }}>🗑️</span>
				</div>
			</div>
			{/* Resize handles */}
			<div style={{ position: 'absolute', top: -4, left: 0, right: 0, height: 4, cursor: 'ns-resize' }} data-resize="start" />
			<div style={{ position: 'absolute', bottom: -4, left: 0, right: 0, height: 4, cursor: 'ns-resize' }} data-resize="end" />
		</div>
	)
}

// ---- Droppable column helper ----
function DroppableDay({ id, setRef, children }: { id: string; setRef: (el: HTMLDivElement | null) => void; children: React.ReactNode }) {
	const { setNodeRef, isOver } = useDroppable({ id })
	return (
		<div ref={(el) => { setNodeRef(el); setRef(el) }} style={{ outline: isOver ? '2px solid rgba(56,189,248,0.6)' : 'none', borderRadius: 6 }}>
			{children}
		</div>
	)
}

// ---- Main page ----
export default function TimetableScheduler() {
	const { data: kids } = useKids()
	const { data: matters } = useMatters()

	const [selectedKidId, setSelectedKidId] = useState<string | null>(null)
	const timetableQuery = useTimetable(selectedKidId || '')
	const scheduler = useSchedulerLogic(DefaultConfig)

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
	const [activeMoveBase, setActiveMoveBase] =
		useState<null | { day: Weekday; startMin: number; endMin: number }>(null)
	const [resizeOffsetRows, setResizeOffsetRows] = useState(0)
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
	)

	const gridRef = useRef<HTMLDivElement>(null)
	const colRefs = useRef<Record<Weekday, HTMLDivElement | null>>({ mon: null, tue: null, wed: null, thu: null, fri: null, sat: null, sun: null })

	const onEmptyCellClick = (day: Weekday, e: React.MouseEvent) => {
		const colEl = colRefs.current[day]
		if (!colEl) return
		const rect = colEl.getBoundingClientRect()
		const y = e.clientY - rect.top
		const row = Math.max(0, Math.min(scheduler.rows, Math.round(y / ROW_HEIGHT)))
		setCreateAt({ day, row })
	}

	const blocksFor = (day: Weekday) => timetableQuery.data?.days[day] ?? []

	// Drag helpers
	function dragStart(e: DragStartEvent) {
		const { active } = e
		const data = active.data.current as any
		setActiveId(String(active.id))
		setActiveMeta(data)
		setResizeOffsetRows(0) // reset

		// Build overlay snapshot and base times
		if (data && (data.type === 'move' || data.type === 'resize')) {
			const b = blocksFor(data.day).find((x: any) => x.id === data.id)
			if (b) {
				const matter = matters?.find(m => m.id === b.matterId)
				const startMin = toMin(b.start)
				const endMin = toMin(b.end)
				const h = (endMin - startMin) / scheduler.cfg.stepMinutes * ROW_HEIGHT
				setActiveSnap({ label: matter?.name || 'Unknown', color: matter?.color, height: h, startLabel: b.start, endLabel: b.end })
				// baseline for resize OR move
				if (data.type === 'resize') {
					setActiveResizeBase({ day: data.day as Weekday, startMin, endMin })
				} else if (data.type === 'move') {
					setActiveMoveBase({ day: data.day as Weekday, startMin, endMin })
				}
			}
		}
	}

	function dragOver(_e: DragOverEvent) {
		// Droppable highlight is handled by DroppableDay via isOver
	}

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

		// ----- Resize preview (update height + start/end labels) -----
		if (meta.type === 'resize' && activeResizeBase) {
			const minDur = Math.max(scheduler.cfg.minDurationMin ?? step, step)
			let startMin = activeResizeBase.startMin
			let endMin = activeResizeBase.endMin

			if (meta.anchor === 'start') {
				// moving TOP handle: bottom must remain visually fixed
				startMin = clamp(snap(startMin + deltaMin, step), dayStart, endMin - minDur)
				setResizeOffsetRows(0) // no counter-translate needed
			} else {
				// moving BOTTOM handle: top must remain visually fixed
				endMin = clamp(snap(endMin + deltaMin, step), startMin + minDur, dayEnd)
				setResizeOffsetRows(byRows) // counter-translate overlay by this many rows
			}

			const height = ((endMin - startMin) / step) * ROW_HEIGHT
			setActiveSnap(prev =>
				prev ? { ...prev, height, startLabel: toTime(startMin), endLabel: toTime(endMin) } : prev
			)
			return
		}

		// ----- Move preview (keep height; update start/end labels) -----
		if (meta.type === 'move' && activeMoveBase) {
			const dur = activeMoveBase.endMin - activeMoveBase.startMin
			const startMin = clamp(snap(activeMoveBase.startMin + deltaMin, step), dayStart, dayEnd - dur)
			const endMin = startMin + dur

			setActiveSnap(prev =>
				prev ? { ...prev, startLabel: toTime(startMin), endLabel: toTime(endMin) } : prev
			)
			setResizeOffsetRows(0) // not resizing
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
		setResizeOffsetRows(0) // reset

		if (!selectedKidId || !timetableQuery.data || !meta) return

		const byRows = Math.round(delta.y / ROW_HEIGHT)

		// Determine drop day using the droppable id
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
		console.log()
		return (
			<div style={{ position: 'relative', width: "100%" }}>
				<DroppableDay id={`col-${day}`} setRef={el => (colRefs.current[day] = el)}>
					<div
						onClick={e => onEmptyCellClick(day, e)}
						style={{ position: 'relative', height: containerHeight, cursor: 'crosshair', borderRadius: 6, background: '#fff', overflow: 'visible' }}
					>
						{/* Horizontal hour lines */}
						{rowLabels.map((label, i) => (
							<div key={i} style={{ position: 'absolute', left: 0, right: 0, top: i * ROW_HEIGHT, borderTop: `1px solid ${i % 12 === 0 ? '#e5e7eb' : '#f3f4f6'}` }}>
								{label && (
									<span style={{ position: 'absolute', left: 0, top: -9, fontSize: 11, color: '#6b7280', zIndex: 6 }}>{label}</span>
								)}
							</div>
						))}

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
			: 0;

	// --- Render ---
	return (
		<div style={{ maxWidth: "100%", margin: '0', padding: 16 }}>
			<h2 style={{ marginBottom: 12, fontSize: 24, fontWeight: 700 }}>Timetable</h2>

			<div style={{ marginBottom: 12 }}>
				<label style={{ fontSize: 14, fontWeight: 500 }}>Kid:&nbsp;</label>
				<select value={selectedKidId || ''} onChange={e => setSelectedKidId(e.target.value)} style={{ borderRadius: 6, border: '1px solid #e5e7eb', padding: '4px 8px' }}>
					<option value="" disabled> Select a kid </option>
					{kids?.map(k => (<option key={k.id} value={k.id}>{k.name}</option>))}
				</select>
			</div>

			{selectedKidId && timetableQuery.data ? (
				<DndContext sensors={sensors} onDragStart={dragStart} onDragOver={dragOver} onDragMove={dragMove} onDragEnd={dragEnd}>
					<div ref={gridRef} style={{ overflow: 'auto', borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb', padding: 8 }}>
						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', columnGap: 12 }}>
							{weekdays.map(day => (
								<div key={day}>
									<div style={{ marginBottom: 4, textAlign: 'center', fontSize: 14, fontWeight: 600 }}>{weekdayLabels[day]}</div>
									{renderColumn(day)}
								</div>
							))}
						</div>
					</div>

					<DragOverlay>
						{activeSnap ? (
							<div
								style={{
									position: 'relative',
									// width: 150,
									height: activeSnap.height,
									// If resizing from bottom: shift up by the original block height
									// AND also cancel the snapped pointer delta so the top edge stays fixed.
									transform:
										activeMeta?.type === 'resize' && activeMeta.anchor === 'end'
											? `translateY(${-(baseResizeHeightPx + resizeOffsetRows * ROW_HEIGHT)}px)`
											: 'none',
								}}
							>
								<Block id={'overlay'} label={activeSnap.label} color={activeSnap.color} top={0} height={activeSnap.height} isDragging />
								{activeSnap.startLabel && (
									<div style={{ position: 'absolute', top: -22, left: 0, fontSize: 11, color: '#fff', background: 'rgba(0,0,0,0.75)', padding: '2px 6px', borderRadius: 4 }}>
										{activeSnap.startLabel}
									</div>
								)}
								{activeSnap.endLabel && (
									<div style={{ position: 'absolute', bottom: -22, right: 0, fontSize: 11, color: '#fff', background: 'rgba(0,0,0,0.75)', padding: '2px 6px', borderRadius: 4 }}>
										{activeSnap.endLabel}
									</div>
								)}
							</div>
						) : null}
					</DragOverlay>
				</DndContext>
			) : (
				<p style={{ fontSize: 14, color: '#4b5563' }}>Select a kid to edit the timetable.</p>
			)}

			<MatterPicker
				open={pickerOpen && !!createAt}
				matters={matters}
				onPick={id => confirmCreate(id)}
				onClose={() => { setPickerOpen(false); setCreateAt(null) }}
			/>

			{/* Invisible button to open the picker when clicking an empty cell */}
			{createAt && !pickerOpen && (
				<div style={{ marginTop: 8 }}>
					<button onClick={() => openPickerAt(createAt)} style={{ borderRadius: 6, border: '1px solid #e5e7eb', padding: '4px 12px', background: '#fff', cursor: 'pointer' }}>
						Select matter for {weekdayLabels[createAt.day]} at {toTime(toMin(scheduler.cfg.start) + createAt.row * scheduler.cfg.stepMinutes)}
					</button>
				</div>
			)}
		</div>
	)
}

// ---- Small draggable wrapper that supports move + resize via handles ----
import { useDraggable } from '@dnd-kit/core'

function DraggableBlock({ id, day, label, color, top, height }: { id: string; day: Weekday; label: string; color?: string; top: number; height: number }) {
	const move = useDraggable({ id, data: { type: 'move', day, id: id.replace('blk-', '') } })
	// resize handles: two invisible bars that start drags with a different payload
	const resizeStart = useDraggable({ id: `${id}-rsz-start`, data: { type: 'resize', day, id: id.replace('blk-', ''), anchor: 'start' as const } })
	const resizeEnd = useDraggable({ id: `${id}-rsz-end`, data: { type: 'resize', day, id: id.replace('blk-', ''), anchor: 'end' as const } })

	return (
		<div
			ref={move.setNodeRef}
			style={{ position: 'absolute', top, height, transform: CSS.Translate.toString(move.transform), left: 0, right: 0, zIndex: 5 }}
			{...move.listeners}
			{...move.attributes}
		>
			<div style={{ position: 'absolute', left: 0, right: 0, top: -4, zIndex: 10, height: 8, cursor: 'ns-resize' }} ref={resizeStart.setNodeRef} {...resizeStart.listeners} {...resizeStart.attributes} />
			<Block id={id} label={label} color={color} top={0} height={height} />
			<div style={{ position: 'absolute', left: 0, right: 0, bottom: -4, zIndex: 10, height: 8, cursor: 'ns-resize' }} ref={resizeEnd.setNodeRef} {...resizeEnd.listeners} {...resizeEnd.attributes} />
		</div>
	)
}
