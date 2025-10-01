import { FormattedMessage, useIntl } from 'react-intl'
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
	title,
	description,
	hideWhenUnavailable = false,
	className = '',
}: Props) {
	const { canInstall, promptInstall } = useA2HS()
	const intl = useIntl();
	if (hideWhenUnavailable && !canInstall) return null

	return (

		<div className={className}>
			{/*<section className={`${styles.card} ${className}`}>*/}
			<h3 className={styles.title}>{title ? title : intl.formatMessage({ defaultMessage: "Install this app" })}</h3>
			<p className={styles.text}>{description ? description : intl.formatMessage({ defaultMessage: 'This app works offline and can be installed on your device. Configure matters and kids, then plan each day using the scheduler.' })}</p>

			{canInstall ? (
				<div className={styles.btnRow}>
					<button className={`${styles.btn} ${styles.btnPrimary}`} onClick={promptInstall}>
						<FormattedMessage defaultMessage="Install App" />
					</button>
				</div>
			) : (
				<div className={styles.helper}>
					<small>
						<FormattedMessage defaultMessage="Tip: If you don’t see the install button, your browser may already have the app installed or doesn’t support installation on this device." />
					</small>
				</div>
			)}
			{/* </section> */}
		</div>
	)
}
