import React from 'react'
import { useA2HS } from '../hooks/useA2HS'
import styles from './PromptInstall.module.css'

type Props = {
	title?: string
	description?: string
	/** Hide the whole card when install is not available (default: false) */
	hideWhenUnavailable?: boolean
	/** Add extra className to the outer card if needed */
	className?: string
}

export default function PromptInstallCard({
	title = 'Install this app',
	description = 'This app works offline and can be installed on your device. Configure matters and kids, then plan each day using the scheduler.',
	hideWhenUnavailable = false,
	className = '',
}: Props) {
	const { canInstall, promptInstall } = useA2HS()

	if (hideWhenUnavailable && !canInstall) return null

	return (

		<div className={className}>
			{/*<section className={`${styles.card} ${className}`}>*/}
			<h3 className={styles.title}>{title}</h3>
			<p className={styles.text}>{description}</p>

			{canInstall ? (
				<div className={styles.btnRow}>
					<button className={`${styles.btn} ${styles.btnPrimary}`} onClick={promptInstall}>
						Install App
					</button>
				</div>
			) : (
				<div className={styles.helper}>
					<small>
						Tip: If you don’t see the install button, your browser may already have the app
						installed or doesn’t support installation on this device.
					</small>
				</div>
			)}
			{/* </section> */}
		</div>
	)
}
