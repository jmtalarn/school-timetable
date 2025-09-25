import { useMatters, useCreateMatter, useUpdateMatter, useDeleteMatter } from '../hooks/reactQueryHooks'
import { useEffect, useState } from 'react'
import styles from './MattersPage.module.css'

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
		const defaultStartDate =
			matters && matters.length > 0
				? matters[matters.length - 1].startDate || '2025-09-01'
				: '2025-09-01'
		const defaultEndDate =
			matters && matters.length > 0
				? matters[matters.length - 1].endDate || '2026-06-30'
				: '2026-06-30'
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
		<div className={styles.container}>
			<h2>Matters</h2>

			<form
				className={styles.addForm}
				onSubmit={e => {
					e.preventDefault()
					if (!newName) return
					createMatter.mutate({
						name: newName,
						color: newColor,
						startDate: newStartDate,
						endDate: newEndDate,
					})
					setNewName('')
					setNewColor('')
					setNewStartDate(newStartDate)
					setNewEndDate(newEndDate)
				}}
			>
				{/* Row 1: name + color */}
				<div className={styles.rowTop}>
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
						aria-label="Matter color"
					/>
				</div>

				{/* Row 2: dates (equal width) */}
				<div className={styles.rowDates}>
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
				</div>

				{/* Row 3: actions (right-aligned) */}
				<div className={styles.rowActions}>
					<button type="submit">Add Matter</button>
				</div>
			</form>


			<ul>
				{matters?.map(m => (
					<li key={m.id} className={styles.item}>
						{editId === m.id ? (
							<form
								className={styles.editForm}
								onSubmit={e => {
									e.preventDefault()
									updateMatter.mutate({
										id: m.id,
										patch: {
											name: editName,
											color: editColor,
											startDate: editStartDate,
											endDate: editEndDate,
										},
									})
									setEditId(null)
								}}
							>
								{/* Row 1: name + color */}
								<div className={styles.rowTop}>
									<input
										value={editName}
										onChange={e => setEditName(e.target.value)}
										required
										placeholder="Matter name"
									/>
									<input
										value={editColor}
										type="color"
										onChange={e => setEditColor(e.target.value)}
										aria-label="Matter color"
									/>
								</div>

								{/* Row 2: dates (same width) */}
								<div className={styles.rowDates}>
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
								</div>

								{/* Row 3: actions (right-aligned) */}
								<div className={styles.rowActions}>
									<button type="submit">Save</button>
									<button type="button" onClick={() => setEditId(null)}>
										Cancel
									</button>
								</div>
							</form>
						) : (
							<>
								<span className={styles.name}>{m.name}</span>
								{m.color && (
									<span className={styles.dot} style={{ color: m.color }}>
										●
									</span>
								)}
								<div className={styles.dates}>
									{m.startDate && <span>Start date: {m.startDate}</span>}
									{m.endDate && <span>End date: {m.endDate}</span>}
								</div>
								<button
									onClick={() => {
										setEditId(m.id)
										setEditName(m.name)
										setEditColor(m.color || '')
										setEditStartDate(m.startDate || '')
										setEditEndDate(m.endDate || '')
									}}
								>
									Edit
								</button>
								<button
									className={styles.deleteButton}
									onClick={() => deleteMatter.mutate(m.id)}
								>
									Delete
								</button>
							</>
						)}
					</li>
				))}
			</ul>
		</div>
	)
}
