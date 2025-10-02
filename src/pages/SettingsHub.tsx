import { NavLink, Outlet } from 'react-router-dom'
import styles from './SettingsHub.module.css'
import { FormattedMessage } from 'react-intl'

export default function SettingsHub() {
	return (
		<>
			<div className={styles.wrap}>
				<h2 className={styles.title}>
					<FormattedMessage defaultMessage="Settings" />
				</h2>

				<nav className={styles.tabs} aria-label="Settings sections">
					<NavLink
						to="general"
						end
						className={({ isActive }) =>
							`${styles.tab} ${isActive ? styles.active : ''}`
						}
					>
						<FormattedMessage defaultMessage="General" />
					</NavLink>
					<NavLink
						to="kids"
						className={({ isActive }) =>
							`${styles.tab} ${isActive ? styles.active : ''}`
						}
					>
						<FormattedMessage defaultMessage="Kids" />
					</NavLink>
					<NavLink
						to="matters"
						className={({ isActive }) =>
							`${styles.tab} ${isActive ? styles.active : ''}`
						}
					>
						<FormattedMessage defaultMessage="Matters" />
					</NavLink>
					<NavLink
						to="scheduler"
						className={({ isActive }) =>
							`${styles.tab} ${isActive ? styles.active : ''}`
						}
					>
						<FormattedMessage defaultMessage="Scheduler" />
					</NavLink>
				</nav>
			</div>
			{/* Nested pages render here */}
			<div className={styles.panel}>
				<Outlet />
			</div>
		</>
	)
}
