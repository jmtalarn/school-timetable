import { useKids, useCreateKid, useUpdateKid, useDeleteKid } from '../hooks/reactQueryHooks'
import { useState } from 'react'
import Avatar from 'boring-avatars'
import styles from './KidsPage.module.css'
import { FormattedMessage, useIntl } from 'react-intl'

const avatarPalette = ["#2f2e30", "#e84b2c", "#e6d839", "#7cd164", "#2eb8ac"]

export default function KidsPage() {
	const { data: kids, isLoading } = useKids()
	const createKid = useCreateKid()
	const updateKid = useUpdateKid()
	const deleteKid = useDeleteKid()

	const [newName, setNewName] = useState('')
	const [editId, setEditId] = useState<string | null>(null)
	const [editName, setEditName] = useState('')
	const intl = useIntl();

	if (isLoading) return <div>Loading...</div>

	return (
		<div className={styles.container}>
			<h2 className={styles.title}><FormattedMessage defaultMessage="Kids" /></h2>

			{/* Add kid form */}
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
					className={styles.inputGrow}
					value={newName}
					onChange={e => setNewName(e.target.value)}
					placeholder={intl.formatMessage({ defaultMessage: "Kid name" })}
					required
				/>
				<div className={styles.avatarPreview}>
					<Avatar name={newName || 'kid'} size={48} variant="beam" colors={avatarPalette} />
				</div>
				<button type="submit" className={styles.addBtn}><FormattedMessage defaultMessage="Add Kid" /></button>
			</form>

			{/* List */}
			<ul className={styles.list}>
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
								<div className={styles.itemLeft}>
									<div className={styles.avatar}>
										<Avatar name={editName || k.name} size={48} variant="beam" colors={avatarPalette} />
									</div>
									<input
										className={styles.inputGrow}
										value={editName}
										onChange={e => setEditName(e.target.value)}
										required
									/>
								</div>
								<div className={styles.itemActions}>
									<button type="submit"><FormattedMessage defaultMessage="Save" /></button>
									<button type="button" onClick={() => setEditId(null)} className={styles.ghostBtn}><FormattedMessage defaultMessage="Cancel" /></button>
								</div>
							</form>
						) : (
							<>
								<div className={styles.itemLeft}>
									<div className={styles.avatar}>
										<Avatar name={k.name} size={48} variant="beam" colors={avatarPalette} />
									</div>
									<span className={styles.name}>{k.name}</span>
								</div>
								<div className={styles.itemActions}>
									<button
										onClick={() => {
											setEditId(k.id)
											setEditName(k.name)
										}}
									>
										<FormattedMessage defaultMessage="Edit" />
									</button>
									<button
										className={styles.deleteButton}
										onClick={() => deleteKid.mutate(k.id)}
									>
										<FormattedMessage defaultMessage="Delete" />
									</button>
								</div>
							</>
						)}
					</li>
				))}
			</ul>
		</div>
	)
}
