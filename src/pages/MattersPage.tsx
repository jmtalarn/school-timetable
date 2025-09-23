import { useMatters, useCreateMatter, useUpdateMatter, useDeleteMatter } from '../hooks/reactQueryHooks'
import { useEffect, useState } from 'react'

export default function MattersPage() {
	const { data: matters, isLoading } = useMatters()
	const createMatter = useCreateMatter()
	const updateMatter = useUpdateMatter()
	const deleteMatter = useDeleteMatter()

	const [newName, setNewName] = useState('')
	const [newColor, setNewColor] = useState('')
	// Default date logic
	const [newStartDate, setNewStartDate] = useState('2025-09-01')
	const [newEndDate, setNewEndDate] = useState('2026-06-30')

	useEffect(() => {
		const defaultStartDate = (matters && matters.length > 0) ? (matters[matters.length - 1].startDate || '2025-09-01') : '2025-09-01'
		const defaultEndDate = (matters && matters.length > 0) ? (matters[matters.length - 1].endDate || '2026-06-30') : '2026-06-30'
		setNewStartDate(defaultStartDate)
		setNewEndDate(defaultEndDate)
	}, [matters])

	const [editId, setEditId] = useState<string | null>(null)
	const [editName, setEditName] = useState('')
	const [editColor, setEditColor] = useState('')
	const [editStartDate, setEditStartDate] = useState('')
	const [editEndDate, setEditEndDate] = useState('')

	if (isLoading) return <div>Loading...</div>

	return (
		<div style={{ maxWidth: 500, margin: '0 auto' }}>
			<h2>Matters</h2>
			<form
				onSubmit={e => {
					e.preventDefault()
					if (!newName) return
					createMatter.mutate({ name: newName, color: newColor, startDate: newStartDate, endDate: newEndDate })
					setNewName('')
					setNewColor('')
					setNewStartDate(newStartDate)
					setNewEndDate(newEndDate)
				}}
				style={{ marginBottom: 24 }}
			>
				<input
					value={newName}
					onChange={e => setNewName(e.target.value)}
					placeholder="Matter name"
					required
				/>
				<input
					value={newColor}
					type="color"
					onChange={e => setNewColor(e.target.value)}
					placeholder="Color (optional)"
				/>
				<input
					type="date"
					value={newStartDate}
					onChange={e => setNewStartDate(e.target.value)}
					placeholder="Start date"
				/>
				<input
					type="date"
					value={newEndDate}
					onChange={e => setNewEndDate(e.target.value)}
					placeholder="End date"
				/>
				<button type="submit">Add Matter</button>
			</form>
			<ul>
				{matters?.map(m => (
					<li key={m.id} style={{ marginBottom: 8 }}>
						{editId === m.id ? (
							<form
								onSubmit={e => {
									e.preventDefault()
									updateMatter.mutate({ id: m.id, patch: { name: editName, color: editColor, startDate: editStartDate, endDate: editEndDate } })
									setEditId(null)
								}}
								style={{ display: 'inline' }}
							>
								<input
									value={editName}
									onChange={e => setEditName(e.target.value)}
									required
								/>
								<input
									value={editColor}
									type="color"
									onChange={e => setEditColor(e.target.value)}
								/>
								<input
									type="date"
									value={editStartDate}
									onChange={e => setEditStartDate(e.target.value)}
									placeholder="Start date"
								/>
								<input
									type="date"
									value={editEndDate}
									onChange={e => setEditEndDate(e.target.value)}
									placeholder="End date"
								/>
								<button type="submit">Save</button>
								<button type="button" onClick={() => setEditId(null)}>Cancel</button>
							</form>
						) : (
							<>
								<span style={{ marginRight: 8 }}>{m.name}</span>
								{m.color && <span style={{ color: m.color, marginRight: 8 }}>●</span>}
								{m.startDate && <span style={{ marginRight: 8 }}>Start: {m.startDate}</span>}
								{m.endDate && <span style={{ marginRight: 8 }}>End: {m.endDate}</span>}
								<button onClick={() => {
									setEditId(m.id)
									setEditName(m.name)
									setEditColor(m.color || '')
									setEditStartDate(m.startDate || '')
									setEditEndDate(m.endDate || '')
								}}>Edit</button>
								<button onClick={() => deleteMatter.mutate(m.id)} style={{ marginLeft: 4 }}>Delete</button>
							</>
						)}
					</li>
				))}
			</ul>
		</div>
	)
}
