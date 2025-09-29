import { FormattedMessage, useIntl } from 'react-intl';
import { NavLink, useLocation } from 'react-router-dom';
import styles from './Navigation.module.css';
import { useState, useId, useEffect } from 'react';

export default function Navigation() {
	const [open, setOpen] = useState(false)
	const loc = useLocation()
	const menuId = useId()

	// Close the mobile menu on route change or Esc
	useEffect(() => { setOpen(false) }, [loc.pathname])
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
		window.addEventListener('keydown', onKey)
		return () => window.removeEventListener('keydown', onKey)
	}, [])


	const intl = useIntl();
	// Route list (add/remove here to change the nav)
	const items: Array<{
		to: string
		end?: boolean
		// Use existing message ids where we already have translations
		id: string
		defaultMessage: string
	}> = [
			{ to: '/', end: true, id: 'home.nav', defaultMessage: intl.formatMessage({ defaultMessage: 'Home' }) },
			{ to: '/today', end: true, id: 'zWgbGg', defaultMessage: intl.formatMessage({ defaultMessage: 'Today' }) },
			{ to: '/week', end: true, id: '/clOBU', defaultMessage: intl.formatMessage({ defaultMessage: 'Weekly' }) },
			{ to: '/kids', id: 'mfuPab', defaultMessage: intl.formatMessage({ defaultMessage: 'Kids' }) },
			{ to: '/matters', id: '9Mt7ON', defaultMessage: intl.formatMessage({ defaultMessage: 'Matters' }) },
			{ to: '/timetable-scheduler', id: '64RmVd', defaultMessage: intl.formatMessage({ defaultMessage: 'Scheduler' }) },
			{ to: '/settings', id: 'D3idYv', defaultMessage: intl.formatMessage({ defaultMessage: 'Settings' }) },
			{ to: '/help', id: 'SENRqu', defaultMessage: intl.formatMessage({ defaultMessage: 'Help' }) },
		]
	return (
		<div className={styles.wrapper}>
			{/* Mobile toggle */}
			<button
				type="button"
				className={styles.toggle}
				aria-expanded={open}
				aria-controls={menuId}
				onClick={() => setOpen(v => !v)}
			>
				<span className={styles.srOnly}>
					<FormattedMessage id="nav.menu" defaultMessage="Menu" />
				</span>
				{open ? (
					// Close (X)
					<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
						<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
					</svg>
				) : (
					// Hamburger
					<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
						<path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
					</svg>
				)}
			</button>

			<nav
				className={`${styles.nav} ${open ? styles.open : ''}`}
				aria-label="Primary"
			>
				{items.map(({ to, end, defaultMessage }) => (
					<NavLink
						key={to}
						to={to}
						end={end}
						className={({ isActive }) =>
							`${styles.link} ${isActive ? styles.linkActive : ''}`
						}
					>
						{defaultMessage}
					</NavLink>
				))}
			</nav>
		</div>
	)

}
