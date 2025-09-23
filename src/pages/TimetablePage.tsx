import { useKids, useMatters, useTimetable, useAddBlock, useUpdateBlock, useDeleteBlock } from '../hooks/reactQueryHooks'
import { useState } from 'react'

const weekdays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
const weekdayLabels = {
	mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday'
}

export default function TimetablePage() {
	const { data: kids } = useKids()
	const { data: matters } = useMatters()
	const [selectedKidId, setSelectedKidId] = useState<string | null>(null)
	const timetableQuery = useTimetable(selectedKidId || '')
	const addBlock = useAddBlock()
	const updateBlock = useUpdateBlock()
	const deleteBlock = useDeleteBlock()

	const [formDay, setFormDay] = useState('mon')
	const [formMatterId, setFormMatterId] = useState('')
	const [formStart, setFormStart] = useState('08:00')
	const [formEnd, setFormEnd] = useState('09:00')

	return (
		<div style={{ maxWidth: 900, margin: '0 auto' }}>
			<h2>Edit Timetable</h2>
			<div style={{ marginBottom: 16 }}>
				<label>Kid:&nbsp;
					<select value={selectedKidId || ''} onChange={e => setSelectedKidId(e.target.value)}>
						<option value="" disabled>Select a kid</option>
						{kids?.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
					</select>
				</label>
			</div>
			{selectedKidId && timetableQuery.data && (
				<div style={{ display: 'flex', gap: 16, overflowX: 'auto' }}>
					{weekdays.map(day => (
						<div key={day} style={{ minWidth: 120, border: '1px solid #ccc', borderRadius: 8, padding: 8 }}>
							<h4 style={{ textAlign: 'center' }}>{weekdayLabels[day]}</h4>
							<ul style={{ minHeight: 40 }}>
								{timetableQuery.data.days[day].map(block => {
									const matter = matters?.find(m => m.id === block.matterId)
									return (
										<li key={block.id} style={{ marginBottom: 8, background: '#f9f9f9', borderRadius: 4, padding: 4 }}>
											<span>{matter?.name || 'Unknown'}</span>
											<span style={{ marginLeft: 8 }}>{block.start} - {block.end}</span>
											<button style={{ marginLeft: 8 }} onClick={() => deleteBlock.mutate({ kidId: selectedKidId, day, id: block.id })}>Delete</button>
										</li>
									)
								})}
							</ul>
							<form
								onSubmit={e => {
									e.preventDefault()
									if (!formMatterId) return
									addBlock.mutate({ kidId: selectedKidId, day, input: { matterId: formMatterId, start: formStart, end: formEnd } })
								}}
								style={{ marginTop: 8 }}
							>
								<select value={formMatterId} onChange={e => setFormMatterId(e.target.value)} required>
									<option value="" disabled>Select matter</option>
									{matters?.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
								</select>
								<input type="time" value={formStart} onChange={e => setFormStart(e.target.value)} required style={{ marginLeft: 4 }} />
								<input type="time" value={formEnd} onChange={e => setFormEnd(e.target.value)} required style={{ marginLeft: 4 }} />
								<button type="submit" style={{ marginLeft: 4 }}>Add</button>
							</form>
						</div>
					))}
				</div>
			)}
		</div>
	)
}
