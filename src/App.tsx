import { BrowserRouter, Routes, Route, NavLink, Link } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import MattersPage from './pages/MattersPage'
import KidsPage from './pages/KidsPage'
import TimetableScheduler from './pages/TimetableScheduler'
import SettingsPage from './pages/SettingsPage'
import Today from './pages/TodayView'
import Week from './pages/WeekView'
import Home from './pages/HomePage'
import HelpPage from './pages/HelpPage'
import ImportGate from './pages/ImportGate'
import ScrollManager from './components/ScrollManager'
import logoSvg from '/school-timetable-logo.svg'
import styles from './App.module.css'
import PromptInstall from './components/PromptInstall'

/** Create the client once (avoids re-creating on rerenders/HMR) */
const queryClient = new QueryClient()




function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ScrollManager />

        <div className={styles.app}>
          {/* Header / App bar */}
          <header className={styles.header}>
            <div className={styles.headerInner}>
              <Link to="/" className={styles.brand} aria-label="Home">
                <img src={logoSvg} className={styles.logo} alt="App logo" />
                <span className={styles.title}>School Timetable</span>
              </Link>

              <nav className={styles.nav} aria-label="Primary">
                <NavLink to="/" end className={({ isActive }) => `${styles.link} ${isActive ? styles.linkActive : ''}`}>
                  Home
                </NavLink>
                <NavLink to="/today" end className={({ isActive }) => `${styles.link} ${isActive ? styles.linkActive : ''}`}>
                  Today
                </NavLink>
                <NavLink to="/week" end className={({ isActive }) => `${styles.link} ${isActive ? styles.linkActive : ''}`}>
                  Weekly
                </NavLink>

                <NavLink to="/kids" className={({ isActive }) => `${styles.link} ${isActive ? styles.linkActive : ''}`}>
                  Kids
                </NavLink>
                <NavLink to="/matters" className={({ isActive }) => `${styles.link} ${isActive ? styles.linkActive : ''}`}>
                  Matters
                </NavLink>
                <NavLink to="/timetable-scheduler" className={({ isActive }) => `${styles.link} ${isActive ? styles.linkActive : ''}`}>
                  Scheduler
                </NavLink>
                <NavLink to="/settings" className={({ isActive }) => `${styles.link} ${isActive ? styles.linkActive : ''}`}>
                  Settings
                </NavLink>
                <NavLink to="/help" className={({ isActive }) => `${styles.link} ${isActive ? styles.linkActive : ''}`}>
                  Help
                </NavLink>
              </nav>

              <div className={styles.actions} />
            </div>
          </header>

          {/* Routed content fills remaining space between header & footer */}
          <main className={styles.mainShell}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/today" element={<Today />} />
              <Route path="/week" element={<Week />} />
              <Route path="/matters" element={<MattersPage />} />
              <Route path="/kids" element={<KidsPage />} />
              <Route path="/timetable-scheduler" element={<TimetableScheduler />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/import" element={<ImportGate />} />
              <Route path="/help" element={<HelpPage />} />
            </Routes>
          </main>

          {/* Footer pinned to bottom with minimal height */}
          <footer className={styles.footer}>
            <PromptInstall />
            <small>© <a href="https://www.jmtalarn.com">jmtalarn</a> {new Date().getFullYear()} School Timetable — PWA, jmtalarn</small>
          </footer>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
