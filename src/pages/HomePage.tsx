import { Link } from 'react-router-dom'
import NowAndNext from '../components/NowAndNext.tsx'

import styles from './HomePage.module.css'

export default function Home() {
	return (
		<div className={styles.container}>
			<h1 className={styles.title}>School Timetable</h1>

			<NowAndNext />
			<div className={styles.groupLinks}>
				<h2 className={styles.lead}>Timetables</h2>

				<nav className={styles.grid} aria-label="App sections">
					<Link to="/today#" className={styles.tile} title="Today">
						<span className={styles.icon} aria-hidden>🗓️</span>
						<span className={styles.label}>Today</span>
					</Link>
					<Link to="/week#" className={styles.tile} title="Weekly">
						<span className={styles.icon} aria-hidden>🗓️</span>
						<span className={styles.label}>Week</span>
					</Link>


				</nav>
			</div>

			<div className={styles.groupLinks}>
				<h2 className={styles.lead}>Configure it</h2>

				<nav className={styles.grid} aria-label="App sections">
					<Link to="/kids#" className={styles.tile} title="Kids">
						<span className={styles.icon} aria-hidden>👧</span>
						<span className={styles.label}>Kids</span>
					</Link>

					<Link to="/matters#" className={styles.tile} title="Matters">
						<span className={styles.icon} aria-hidden>📚</span>
						<span className={styles.label}>Matters</span>
					</Link>

					<Link to="/timetable-scheduler#" className={styles.tile} title="Scheduler">
						<span className={styles.icon} aria-hidden>📅</span>
						<span className={styles.label}>Scheduler</span>
					</Link>



					<Link to="/settings#" className={styles.tile} title="Settings">
						<span className={styles.icon} aria-hidden>⚙️</span>
						<span className={styles.label}>Settings</span>
					</Link>


				</nav>
			</div>

			<div className={styles.groupLinks}>
				<h2 className={styles.lead}>Help</h2>
				<nav className={styles.grid} aria-label="App sections">
					<Link to="/help#" className={styles.tile} title="Help & User Guide">
						<span className={styles.icon} aria-hidden>⁉️</span>
						<span className={styles.label}>Help & User Guide</span>
					</Link>
				</nav>
			</div>
		</div>
	)
}
