// filepath: src/pages/ImportGate.tsx
import { useEffect, useMemo, useState } from 'react'
import { importBundleWithOptions } from '../dataLayer/exportImport'
import type { ExportBundle } from '../dataLayer/schemas'
import styles from './ImportGate.module.css'
import { useNavigate } from 'react-router-dom'
import { FormattedMessage } from 'react-intl'

export default function ImportGate() {
	const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'done'>('loading')
	const [error, setError] = useState<string>('')
	const [bundle, setBundle] = useState<ExportBundle | null>(null)

	// Selections
	const [selectedKidIds, setSelectedKidIds] = useState<string[]>([])
	const [applyConfig, setApplyConfig] = useState(true)

	const navigate = useNavigate()

	useEffect(() => {
		let alive = true
			; (async () => {
				setStatus('loading')

				const key = getKeyFromHash()
				if (!key) {
					if (alive) {
						setError('Missing key in URL')
						setStatus('error')
					}
					return
				}

				try {
					const res = await fetch('/.netlify/functions/bundles?id=' + encodeURIComponent(key))
					if (!res.ok) {
						const msg = await readErr(res)
						throw new Error(msg || `Fetch failed (${res.status})`)
					}
					const b = (await res.json()) as ExportBundle
					if (!alive) return
					setBundle(b)
					setSelectedKidIds(b.kids.map(k => k.id)) // preselect all
					setStatus('ready')
				} catch (e: any) {
					if (!alive) return
					setError(e?.message || 'Invalid import link')
					setStatus('error')
				}
			})()
		return () => { alive = false }
	}, [])

	const toggleKid = (id: string) => {
		setSelectedKidIds(prev =>
			prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
		)
	}

	const canImport = useMemo(() => {
		return status === 'ready' && bundle !== null && selectedKidIds.length > 0
	}, [status, bundle, selectedKidIds])

	const incomingHoursText = useMemo(() => {
		if (!bundle?.config) return null
		return `${bundle.config.startHour} → ${bundle.config.endHour}`
	}, [bundle])

	const doImport = () => {
		if (!bundle) return
		setStatus('loading')
		try {
			importBundleWithOptions(bundle, {
				kidIds: selectedKidIds,
				applyConfig,
			})
			setStatus('done')
			setTimeout(() => navigate('/timetable-scheduler'), 400)
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : 'Import failed')
			setStatus('error')
		}
	}

	if (status === 'loading') {
		return (
			<div className={styles.page}>
				<div className={styles.card}>
					<FormattedMessage defaultMessage="Reading link…" />
				</div>
			</div>
		)
	}

	if (status === 'error') {
		return (
			<div className={styles.page}>
				<div className={styles.card}>
					<h2 className={styles.title}><FormattedMessage defaultMessage="Import data" /></h2>
					<p className={styles.error}>{error}</p>
					<div className={styles.rowEnd}>
						<button className="btn" onClick={() => navigate('/')}><FormattedMessage defaultMessage="Back" /></button>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className={styles.page}>
			<div className={styles.card}>
				<h2 className={styles.title}><FormattedMessage defaultMessage="Import data" /></h2>

				<section className={styles.section}>
					<h3 className={styles.sectionTitle}><FormattedMessage defaultMessage="Kids in this link" /></h3>
					<ul className={styles.kidList}>
						{bundle!.kids.map(k => {
							const checked = selectedKidIds.includes(k.id)
							return (
								<li key={k.id} className={styles.kidItem}>
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
					<p className={styles.muted}>
						<FormattedMessage defaultMessage="Timetables for selected kids will replace existing ones with the same name; new kids will be added." />
					</p>
				</section>

				<section className={styles.section}>
					<label className={styles.configRow}>
						<input
							type="checkbox"
							checked={applyConfig}
							onChange={(e) => setApplyConfig(e.target.checked)}
						/>
						<div>
							<div className={styles.configTitle}>
								<FormattedMessage defaultMessage="Apply imported scheduler hours" />
							</div>
							<div className={styles.muted}>
								{incomingHoursText ? (
									<FormattedMessage
										defaultMessage="Incoming: {incomingHoursText} (will only widen your current range)"
										values={{ incomingHoursText }}
									/>
								) : (
									<FormattedMessage defaultMessage="No hours provided in link" />
								)}
							</div>
						</div>
					</label>
				</section>

				<div className={styles.rowEnd}>
					<button className="btn" onClick={() => navigate('/')}><FormattedMessage defaultMessage="Cancel" /></button>
					<button className="btn btnPrimary" disabled={!canImport} onClick={doImport}>
						<FormattedMessage defaultMessage="Import" />
					</button>
				</div>
			</div>
		</div>
	)
}

function getKeyFromHash(): string | null {
	// Expecting /import#key=XXXXX
	const hash = window.location.hash.startsWith('#')
		? window.location.hash.slice(1)
		: window.location.hash
	const params = new URLSearchParams(hash)
	return params.get('key')
}

async function readErr(res: Response): Promise<string | null> {
	try {
		const j = await res.json()
		return (j && (j.error || j.message)) || null
	} catch {
		return null
	}
}
