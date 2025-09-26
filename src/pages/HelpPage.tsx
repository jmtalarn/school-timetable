import styles from './HelpPage.module.css'
import { Link } from 'react-router-dom'

export default function HelpPage() {
	return (
		<div className={styles.container}>
			<h1 className={styles.title}>Help & User Guide</h1>

			{/* Table of contents */}
			<nav className={styles.card} aria-label="Table of contents">
				<ol className={styles.toc}>
					<li><a href="#quickstart">Quick start</a></li>
					<li><a href="#concepts">Core concepts</a></li>
					<li><a href="#scheduler">Scheduler</a></li>
					<li><a href="#kids">Kids</a></li>
					<li><a href="#matters">Matters</a></li>
					<li><a href="#today">Today & Now/Next</a></li>
					<li><a href="#settings">Settings</a></li>
					<li><a href="#share">Share / Export & Import</a></li>
					<li><a href="#pwa">Install & Offline</a></li>
					<li><a href="#faq">FAQ & Troubleshooting</a></li>
					<li><a href="#privacy">Data & Privacy</a></li>
				</ol>
			</nav>

			{/* Quick start */}
			<section id="quickstart" className={styles.section}>
				<h2>Quick start</h2>
				<div className={styles.card}>
					<ol className={styles.list}>
						<li>
							Go to <Link to="/matters">Matters</Link> and create your subjects/activities.
							Give them a name, a color, and (optionally) a date range during which they’re active.
						</li>
						<li>
							Go to <Link to="/kids">Kids</Link>, add each kid (the app generates an avatar automatically).
						</li>
						<li>
							Open the <Link to="/timetable-scheduler">Scheduler</Link>, pick a kid, then click on empty grid cells to add matters.
							Drag to move; drag the thin bars at the top or bottom to resize.
						</li>
						<li>
							Tune your week in <Link to="/settings">Settings</Link> (start/end hours, hidden weekdays, start of week).
						</li>
						<li>
							Use <Link to="/today">Today</Link> to see a day-at-a-glance (or the Now/Next summary on Home).
						</li>
					</ol>
				</div>
			</section>

			{/* Core concepts */}
			<section id="concepts" className={styles.section}>
				<h2>Core concepts</h2>
				<div className={styles.cardGrid}>
					<article className={styles.card}>
						<h3>Kids</h3>
						<p>People you plan for. Each kid has a name and an avatar. Timetables are per-kid.</p>
					</article>
					<article className={styles.card}>
						<h3>Matters</h3>
						<p>Subjects/activities with a color and optional active dates (start/end). Blocks in the schedule reference a matter.</p>
					</article>
					<article className={styles.card}>
						<h3>Config</h3>
						<p>Global settings: visible hours, hidden weekdays, and the start of the week. These shape the scheduler grid.</p>
					</article>
				</div>
			</section>

			{/* Scheduler */}
			<section id="scheduler" className={styles.section}>
				<h2>Scheduler</h2>
				<div className={styles.card}>
					<p>
						The scheduler shows a week grid. Columns are weekdays (respecting hidden days and the chosen start-of-week).
						Rows are time slots (5-minute steps). Visible vertical range is controlled by Settings.
					</p>

					<ul className={styles.list}>
						<li>
							<strong>Add a block:</strong> click an empty cell → select a matter in the popup.
						</li>
						<li>
							<strong>Move:</strong> drag the block anywhere, even across days.
						</li>
						<li>
							<strong>Resize:</strong> drag the thin handle at the top or bottom. Blocks snap to 5-minute increments.
						</li>
						<li>
							<strong>Delete:</strong> click the 🗑️ icon on a block and confirm.
						</li>
						<li>
							<strong>Hover highlight:</strong> the row under your cursor is subtly highlighted to make dropping easier.
						</li>
						<li>
							<strong>Matter dates:</strong> a matter is only considered “ongoing” between its start and end dates; that affects Today/Now views.
						</li>
					</ul>

					<p className={styles.note}>
						Tip: if you can’t see morning/evening slots you expect, raise the visible range in <Link to="/settings">Settings</Link>.
					</p>
				</div>
			</section>

			{/* Kids */}
			<section id="kids" className={styles.section}>
				<h2>Kids</h2>
				<div className={styles.card}>
					<ul className={styles.list}>
						<li><strong>Add / edit / delete</strong> kids in <Link to="/kids">Kids</Link>.</li>
						<li>Avatars are auto-generated; the selection picker shows avatars and names—click one to select.</li>
						<li>Schedules are per-kid. Switch kids using the avatar picker at the top of the Scheduler.</li>
					</ul>
				</div>
			</section>

			{/* Matters */}
			<section id="matters" className={styles.section}>
				<h2>Matters</h2>
				<div className={styles.card}>
					<ul className={styles.list}>
						<li>Create/edit matters in <Link to="/matters">Matters</Link>.</li>
						<li>Optional <strong>date range</strong> (Start/End) controls when the matter is considered active.</li>
						<li>Color is used to style blocks; keep a consistent palette for readability.</li>
					</ul>
				</div>
			</section>

			{/* Today & Now/Next */}
			<section id="today" className={styles.section}>
				<h2>Today & Now/Next</h2>
				<div className={styles.card}>
					<p>
						The <Link to="/today">Today</Link> view shows a single day with a live “current time” marker.
						Each kid’s card also shows <strong>Now</strong> (with a progress bar) and <strong>Next</strong> matter—only if those matters are within their date ranges.
					</p>
					<ul className={styles.list}>
						<li>Jump between days using ◀︎ / ▶︎ in the Today view; use “Today” to return to the current date.</li>
						<li>If nothing is happening “now”, you’ll only see the “next” matter (if any).</li>
					</ul>
				</div>
			</section>

			{/* Settings */}
			<section id="settings" className={styles.section}>
				<h2>Settings</h2>
				<div className={styles.card}>
					<ul className={styles.list}>
						<li><strong>Scheduler hours:</strong> set the visible start/end time for the grid.</li>
						<li><strong>Visible weekdays:</strong> hide/show days (e.g., weekends).</li>
						<li><strong>Start of week:</strong> choose which day your week begins on; the scheduler reorders columns accordingly.</li>
					</ul>
					<p className={styles.note}>
						The app validates times so end time is always after start time.
					</p>
				</div>
			</section>

			{/* Share / Export & Import */}
			<section id="share" className={styles.section}>
				<h2>Share / Export & Import</h2>
				<div className={styles.card}>
					<p>
						Use the <strong>Share</strong> button (share icon) to export selected kids’
						timetables plus the used matters and global config into a link. On supported browsers,
						the native share sheet opens; otherwise a link is shown for copying.
					</p>

					<h3 className={styles.h3}>What’s exported</h3>
					<ul className={styles.list}>
						<li>Selected kids</li>
						<li>Only the <em>matters used</em> in their timetables</li>
						<li>Global config (hours, hidden weekdays, start of week)</li>
					</ul>

					<h3 className={styles.h3}>Import behavior</h3>
					<ul className={styles.list}>
						<li><strong>Kids:</strong> added if new; if a kid already exists (by name or ID depending on your implementation), they remain, and their timetable is <em>overwritten</em> by the imported one.</li>
						<li><strong>Matters:</strong> matched by name; new ones are added, existing ones reused. Start/end dates are widened only if the incoming range extends earlier/later.</li>
						<li><strong>Config:</strong> start hour lowers only if the incoming one is earlier; end hour raises only if the incoming one is later; hidden weekdays and start-of-week merge sensibly.</li>
					</ul>

					<p className={styles.note}>
						You can also paste a link with <code>#data=…</code> into the address bar; the app’s import gate will let you choose what to bring in.
					</p>
				</div>
			</section>

			{/* PWA */}
			<section id="pwa" className={styles.section}>
				<h2>Install & Offline</h2>
				<div className={styles.card}>
					<ul className={styles.list}>
						<li>Click <strong>Install App</strong> (when offered) to add it to your device.</li>
						<li>The app works offline; your data stays on this device (local storage).</li>
					</ul>
				</div>
			</section>

			{/* FAQ */}
			<section id="faq" className={styles.section}>
				<h2>FAQ & Troubleshooting</h2>
				<div className={styles.card}>
					<dl className={styles.faq}>
						<dt>My blocks don’t show early/late times.</dt>
						<dd>Increase the visible hours in <Link to="/settings">Settings</Link>.</dd>

						<dt>I can’t drop a block exactly where I want.</dt>
						<dd>Blocks snap to 5-minute increments. Try dropping close to the desired time.</dd>

						<dt>Nothing shows in Now/Next.</dt>
						<dd>Check the matter’s start/end dates and today’s date. Matters outside their range are ignored.</dd>

						<dt>I can’t see/share the export link.</dt>
						<dd>Some browsers block the native share sheet; the app falls back to a copyable link in the modal.</dd>

						<dt>How do I reset everything?</dt>
						<dd>Use your browser’s site storage controls to clear local storage for this app (this wipes all data).</dd>
					</dl>
				</div>
			</section>

			{/* Privacy */}
			<section id="privacy" className={styles.section}>
				<h2>Data & Privacy</h2>
				<div className={styles.card}>
					<p>
						All data (kids, matters, timetables, settings) is saved in your browser’s local storage.
						Nothing is sent to a server unless you explicitly share an export link with someone.
					</p>
				</div>
			</section>
		</div>
	)
}
