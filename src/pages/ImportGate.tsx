import { useEffect, useMemo, useState } from 'react'
import { parseBundleFromURL, importBundleWithOptions } from '../dataLayer/exportImport'
import type { ExportBundle } from '../dataLayer/schemas'
import styles from './ImportGate.module.css'
import { useNavigate } from 'react-router-dom'

export default function ImportGate() {
	const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'done'>('loading')
	const [error, setError] = useState<string>('')
	const [bundle, setBundle] = useState<ExportBundle | null>(null)

	// Selections
	const [selectedKidIds, setSelectedKidIds] = useState<string[]>([])
	const [applyConfig, setApplyConfig] = useState(true)

	const navigate = useNavigate()

	useEffect(() => {
		const res = parseBundleFromURL()
		if (!res.ok) {
			setError(res.error)
			setStatus('error')
			return
		}
		setBundle(res.bundle)
		// Preselect all kids in the bundle
		setSelectedKidIds(res.bundle.kids.map(k => k.id))
		setStatus('ready')
	}, [])

	const toggleKid = (id: string) => {
		setSelectedKidIds(prev =>
			prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
		)
	}

	const canImport = useMemo(() => {
		return status === 'ready' && bundle && selectedKidIds.length > 0
	}, [status, bundle, selectedKidIds])

	const incomingHoursText = useMemo(() => {
		if (!bundle?.config) return null
		return `${bundle.config.startHour} → ${bundle.config.endHour}`
	}, [bundle])

	const doImport = () => {
		if (!bundle) return
		setStatus('loading')
		try {
			const report = importBundleWithOptions(bundle, {
				kidIds: selectedKidIds,
				applyConfig,
			})
			setStatus('done')
			// optional: toast / message could use `report`
			setTimeout(() => navigate('/timetable-scheduler'), 400)
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : 'Import failed')
			setStatus('error')
		}
	}

	if (status === 'loading') {
		return <div className={styles.page}><div className={styles.card}>Reading link…</div></div>
	}

	if (status === 'error') {
		return (
			<div className={styles.page}>
				<div className={styles.card}>
					<h2 className={styles.title}>Import data</h2>
					<p className={styles.error}>{error}</p>
					<div className={styles.rowEnd}><button className="btn" onClick={() => navigate('/')}>Back</button></div>
				</div>
			</div>
		)
	}

	return (
		<div className={styles.page}>
			<div className={styles.card}>
				<h2 className={styles.title}>Import data</h2>

				<section className={styles.section}>
					<h3 className={styles.sectionTitle}>Kids in this link</h3>
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
						Timetables for selected kids will <strong>replace</strong> existing ones with the same name; new kids will be added.
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
							<div className={styles.configTitle}>Apply imported scheduler hours</div>
							<div className={styles.muted}>
								{incomingHoursText ? `Incoming: ${incomingHoursText} (will only widen your current range)` : 'No hours provided in link'}
							</div>
						</div>
					</label>
				</section>

				<div className={styles.rowEnd}>
					<button className="btn" onClick={() => navigate('/')}>Cancel</button>
					<button className="btn btnPrimary" disabled={!canImport} onClick={doImport}>
						Import
					</button>
				</div>
			</div>
		</div>
	)
}
