// src/components/ShareExportButton.tsx
import { useEffect, useState } from 'react'
import { useKids } from '../hooks/reactQueryHooks'
import styles from './ShareExportButton.module.css'
import ShareIcon from '../assets/share.svg'
import { FormattedMessage, useIntl } from 'react-intl'

// we only need this one helper to build the bundle locally
import { buildExportBundleForKids } from '../dataLayer/exportImport'

type ShareExportButtonProps = {
	currentKidId?: string | null
	onClose?: () => void // optional notify when modal closes
}

export default function ShareExportButton({ currentKidId, onClose }: ShareExportButtonProps) {
	const { data: kids = [] } = useKids()
	const [open, setOpen] = useState(false)
	const [selected, setSelected] = useState<string[]>([])
	const [sharing, setSharing] = useState(false)
	const intl = useIntl()

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

	async function postBundleAndGetKey(kidIds: string[]): Promise<string> {
		// 1) build the bundle locally from IndexedDB (or your data layer)
		const bundle = buildExportBundleForKids(kidIds)

		// 2) POST it to the Netlify v2 function (which stores it in Netlify Blobs)
		const res = await fetch('/.netlify/functions/bundles', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			// Function accepts either {bundle} or the bundle itself; we send the bundle directly
			body: JSON.stringify(bundle),
		})
		if (!res.ok) {
			const err = await safeError(res)
			throw new Error(err || `Share failed (${res.status})`)
		}
		const { id } = (await res.json()) as { id: string }
		return id
	}

	async function shareUrl(url: string) {
		try {
			const anyNav: any = navigator
			if (anyNav.share) {
				await anyNav.share({ title: 'School Timetable', text: 'Here’s my timetable export.', url })
				return
			}
		} catch {
			// if user cancels share or it fails, we fall back to clipboard
		}

		try {
			await navigator.clipboard.writeText(url)
			alert(intl.formatMessage({ defaultMessage: 'Share link copied to clipboard.' }))
		} catch {
			// last resort

			prompt('Copy this link:', url)
		}
	}

	const doShare = async () => {
		if (!canShare || sharing) return
		setSharing(true)
		try {
			const key = await postBundleAndGetKey(selected)
			const importUrl = `${window.location.origin}/import#key=${encodeURIComponent(key)}`
			await shareUrl(importUrl)
			close()
		} catch (err: any) {
			alert(err?.message || 'Failed to share')
		} finally {
			setSharing(false)
		}
	}

	return (
		<>
			<button
				type="button"
				className={styles.iconBtn}
				title={intl.formatMessage({ defaultMessage: 'Share/Export' })}
				aria-label="Share / Export"
				onClick={() => setOpen(true)}
			>
				<img className={styles.shareIcon} src={ShareIcon} alt="Share" />
			</button>

			{open && (
				<div className={styles.overlay} role="dialog" aria-modal onClick={close}>
					<div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
						<div className={styles.header}>
							<h3 className={styles.title}><FormattedMessage defaultMessage="Share / Export" /></h3>
							<button className={styles.close} onClick={close} aria-label="Close">✕</button>
						</div>

						<div className={styles.body}>
							<p className={styles.muted}>
								<FormattedMessage defaultMessage="Choose one or more kids to include. Only their used matters and the app config are bundled." />
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
									{sharing ? <FormattedMessage defaultMessage="Sharing…" /> : <FormattedMessage defaultMessage="Share" />}
								</button>
							</div>

							<p className={styles.mutedSmall}>
								<FormattedMessage defaultMessage="We’ll open your device’s share sheet (or copy a link if sharing isn’t available)." />
							</p>
						</div>
					</div>
				</div>
			)}
		</>
	)
}

async function safeError(res: Response): Promise<string | null> {
	try {
		const j = await res.json()
		return (j && (j.error || j.message)) || null
	} catch {
		return null
	}
}
