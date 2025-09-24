import { useKids, useCreateKid, useUpdateKid, useDeleteKid } from '../hooks/reactQueryHooks'
import { useState } from 'react'
import styles from './KidsPage.module.css'

export default function KidsPage() {
	const { data: kids, isLoading } = useKids()
	const createKid = useCreateKid()
	const updateKid = useUpdateKid()
	const deleteKid = useDeleteKid()

	const [newName, setNewName] = useState('')
	const [editId, setEditId] = useState<string | null>(null)
	const [editName, setEditName] = useState('')

	if (isLoading) return <div>Loading...</div>

	return (
		<div className={styles.container}>
			<h2>Kids</h2>

			<form
				className={styles.addForm}
				onSubmit={e => {
					e.preventDefault()
					if (!newName) return
					createKid.mutate({ name: newName })
					setNewName('')
				}}
			>
				<input
					value={newName}
					onChange={e => setNewName(e.target.value)}
					placeholder="Kid name"
					required
				/>
				<button type="submit">Add Kid</button>
			</form>

			<ul>
				{kids?.map(k => (
					<li key={k.id} className={styles.item}>
						{editId === k.id ? (
							<form
								className={styles.editForm}
								onSubmit={e => {
									e.preventDefault()
									updateKid.mutate({ id: k.id, patch: { name: editName } })
									setEditId(null)
								}}
							>
								<input
									value={editName}
									onChange={e => setEditName(e.target.value)}
									required
								/>
								<button type="submit">Save</button>
								<button type="button" onClick={() => setEditId(null)}>Cancel</button>
							</form>
						) : (
							<>
								<span className={styles.name}>{k.name}</span>
								<button
									onClick={() => {
										setEditId(k.id)
										setEditName(k.name)
									}}
								>
									Edit
								</button>
								<button
									className={styles.deleteButton}
									onClick={() => deleteKid.mutate(k.id)}
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
