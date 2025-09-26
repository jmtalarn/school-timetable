// src/components/ShareExportButton.tsx
import { useEffect, useState } from 'react'
import { shareBundleForKids } from '../dataLayer/exportImport'
import { useKids } from '../hooks/reactQueryHooks'
import styles from './ShareExportButton.module.css'
import ShareIcon from '../assets/share.svg'

type ShareExportButtonProps = {
	currentKidId?: string | null
	onClose?: () => void // optional notify when modal closes
}

export default function ShareExportButton({ currentKidId, onClose }: ShareExportButtonProps) {
	const { data: kids = [] } = useKids()
	const [open, setOpen] = useState(false)
	const [selected, setSelected] = useState<string[]>([])
	const [sharing, setSharing] = useState(false)

	// Pre-select current kid when opened
	useEffect(() => {
		if (!open) return
		setSelected(currentKidId ? [currentKidId] : [])
		setSharing(false)
	}, [open, currentKidId])

	const toggleKid = (id: string) => {
		setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
	}

	const canShare = selected.length > 0

	const close = () => {
		setOpen(false)
		onClose?.()
	}

	const doShare = async () => {
		if (!canShare || sharing) return
		setSharing(true)
		try {
			await shareBundleForKids(selected)
			// shareBundleForKids handles native share, and falls back to clipboard/prompt.
			// Close the dialog afterwards.
			close()
		} finally {
			setSharing(false)
		}
	}

	return (
		<>
			<button
				type="button"
				className={styles.iconBtn}
				title="Share/Export"
				aria-label="Share / Export"
				onClick={() => setOpen(true)}
			>
				<img className={styles.shareIcon} src={ShareIcon} alt="Your SVG" />

			</button>

			{open && (
				<div className={styles.overlay} role="dialog" aria-modal onClick={close}>
					<div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
						<div className={styles.header}>
							<h3 className={styles.title}>Share / Export</h3>
							<button className={styles.close} onClick={close} aria-label="Close">✕</button>
						</div>

						<div className={styles.body}>
							<p className={styles.muted}>
								Choose one or more kids to include. Only their used matters and the app config are bundled.
							</p>

							<ul className={styles.kidList}>
								{kids.map(k => {
									const checked = selected.includes(k.id)
									return (
										<li key={k.id}>
											<label className={styles.kidRow}>
												<input
													type="checkbox"
													checked={checked}
													onChange={() => toggleKid(k.id)}
												/>
												<span className={styles.kidName}>{k.name}</span>
											</label>
										</li>
									)
								})}
							</ul>

							<div className={styles.actions}>
								<button type="button" className={styles.btn} onClick={close}>
									Cancel
								</button>
								<button
									className={`${styles.btn} ${styles.btnPrimary}`}
									onClick={doShare}
									disabled={!canShare || sharing}
									aria-busy={sharing}
								>
									{sharing ? 'Sharing…' : 'Share'}
								</button>
							</div>

							<p className={styles.mutedSmall}>
								We’ll open your device’s share sheet (or copy a link if sharing isn’t available).
							</p>
						</div>
					</div>
				</div>
			)
			}
		</>
	)
}
