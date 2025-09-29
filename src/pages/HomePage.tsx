import { Link } from 'react-router-dom'
import NowAndNext from '../components/NowAndNext.tsx'

import styles from './HomePage.module.css'
import { FormattedMessage, useIntl } from 'react-intl'

export default function Home() {
	const intl = useIntl();
	return (
		<div className={styles.container}>
			<h1 className={styles.title}><FormattedMessage defaultMessage="School Timetable" /></h1>

			<NowAndNext />
			<div className={styles.groupLinks}>
				<h2 className={styles.lead}><FormattedMessage defaultMessage="Timetables" /></h2>

				<nav className={styles.grid} aria-label="App sections">
					<Link to="/today#" className={styles.tile} title={intl.formatMessage({ defaultMessage: "Today" })}>
						<span className={styles.icon} aria-hidden>🗓️</span>
						<span className={styles.label}><FormattedMessage defaultMessage="Today" /></span>
					</Link>
					<Link to="/week#" className={styles.tile} title={intl.formatMessage({ defaultMessage: "Weekly" })}>
						<span className={styles.icon} aria-hidden>🗓️</span>
						<span className={styles.label}><FormattedMessage defaultMessage="Week" /></span>
					</Link>


				</nav>
			</div>

			<div className={styles.groupLinks}>
				<h2 className={styles.lead}><FormattedMessage defaultMessage="Configure it" /></h2>

				<nav className={styles.grid} aria-label="App sections">
					<Link to="/kids#" className={styles.tile} title={intl.formatMessage({ defaultMessage: "Kids" })}>
						<span className={styles.icon} aria-hidden>👧</span>
						<span className={styles.label}><FormattedMessage defaultMessage="Kids" /></span>
					</Link>

					<Link to="/matters#" className={styles.tile} title={intl.formatMessage({ defaultMessage: "Matters" })}>
						<span className={styles.icon} aria-hidden>📚</span>
						<span className={styles.label}><FormattedMessage defaultMessage="Matters" /></span>
					</Link>

					<Link to="/timetable-scheduler#" className={styles.tile} title={intl.formatMessage({ defaultMessage: "Scheduler" })}>
						<span className={styles.icon} aria-hidden>📅</span>
						<span className={styles.label}><FormattedMessage defaultMessage="Scheduler" /></span>
					</Link>



					<Link to="/settings#" className={styles.tile} title={intl.formatMessage({ defaultMessage: "Settings" })}>
						<span className={styles.icon} aria-hidden>⚙️</span>
						<span className={styles.label}><FormattedMessage defaultMessage="Settings" /></span>
					</Link>


				</nav>
			</div>

			<div className={styles.groupLinks}>
				<h2 className={styles.lead}><FormattedMessage defaultMessage={"Help"} /></h2>
				<nav className={styles.grid} aria-label="App sections">
					<Link to="/help#" className={styles.tile} title={intl.formatMessage({
						defaultMessage: "Help & User Guide"
					})}>
						<span className={styles.icon} aria-hidden>⁉️</span>
						<span className={styles.label}><FormattedMessage defaultMessage="Help & User Guide" /></span>
					</Link>
				</nav>
			</div>
		</div >
	)
}
