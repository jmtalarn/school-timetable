import { Link } from 'react-router-dom'
import styles from './HomePage.module.css'

export default function Home() {
	return (
		<div className={styles.container}>
			<h1 className={styles.title}>School Timetable</h1>
			<p className={styles.lead}>Quick links</p>

			<nav className={styles.grid} aria-label="App sections">
				<Link to="/today" className={styles.tile} title="Today">
					<span className={styles.icon} aria-hidden>🗓️</span>
					<span className={styles.label}>Today</span>
				</Link>

				<Link to="/timetable-scheduler" className={styles.tile} title="Scheduler">
					<span className={styles.icon} aria-hidden>📅</span>
					<span className={styles.label}>Scheduler</span>
				</Link>

				<Link to="/kids" className={styles.tile} title="Kids">
					<span className={styles.icon} aria-hidden>👧</span>
					<span className={styles.label}>Kids</span>
				</Link>

				<Link to="/matters" className={styles.tile} title="Matters">
					<span className={styles.icon} aria-hidden>📚</span>
					<span className={styles.label}>Matters</span>
				</Link>

				<Link to="/settings" className={styles.tile} title="Settings">
					<span className={styles.icon} aria-hidden>⚙️</span>
					<span className={styles.label}>Settings</span>
				</Link>

				<Link to="/about" className={styles.tile} title="About">
					<span className={styles.icon} aria-hidden>ℹ️</span>
					<span className={styles.label}>About</span>
				</Link>
			</nav>
		</div>
	)
}
