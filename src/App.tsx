import { useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Link } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useA2HS } from './hooks/useA2HS'
import MattersPage from './pages/MattersPage'
import KidsPage from './pages/KidsPage'
import TimetableScheduler from './pages/TimetableScheduler'
import logoSvg from '/school-timetable-logo.svg'
import styles from './App.module.css'

/** Create the client once (avoids re-creating on rerenders/HMR) */
const queryClient = new QueryClient()

function Home() {
  const { canInstall, promptInstall } = useA2HS()
  const [count, setCount] = useState(0)

  return (
    <div className={styles.main}>
      <div className={styles.hero}>
        <section className={styles.card}>
          <h1 className={styles.heroTitle}>School Timetable</h1>
          <p className={styles.heroSub}>
            Manage matters, students, and weekly schedules. Drag &amp; drop. Offline-ready. Shareable links.
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <Link className={`${styles.btn} ${styles.btnPrimary}`} to="/timetable-scheduler">
              Open Scheduler
            </Link>
            <button
              className={`${styles.btn} ${styles.btnGhost}`}
              onClick={() => setCount((c) => c + 1)}
            >
              Demo Counter: {count}
            </button>
          </div>
        </section>

        <section className={styles.card}>
          <p>
            This app works offline and can be installed on your device. Configure matters and kids, then plan each day using the scheduler.
          </p>
          {canInstall && (
            <button onClick={promptInstall} className={`${styles.btn} ${styles.btnPrimary}`} style={{ marginTop: 12 }}>
              Install App
            </button>
          )}
        </section>
      </div>
    </div>
  )
}

function About() {
  return (
    <div className={styles.main}>
      <div className={styles.card}>
        <h2>About</h2>
        <p className={styles.heroSub}>Built with React, Vite, and TanStack Query.</p>
      </div>
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
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
                <NavLink to="/about" className={({ isActive }) => `${styles.link} ${isActive ? styles.linkActive : ''}`}>
                  About
                </NavLink>
                <NavLink to="/matters" className={({ isActive }) => `${styles.link} ${isActive ? styles.linkActive : ''}`}>
                  Matters
                </NavLink>
                <NavLink to="/kids" className={({ isActive }) => `${styles.link} ${isActive ? styles.linkActive : ''}`}>
                  Kids
                </NavLink>
                <NavLink to="/timetable-scheduler" className={({ isActive }) => `${styles.link} ${isActive ? styles.linkActive : ''}`}>
                  Scheduler
                </NavLink>
              </nav>

              <div className={styles.actions} />
            </div>
          </header>

          {/* Routed content fills remaining space between header & footer */}
          <main className={styles.mainShell}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/matters" element={<MattersPage />} />
              <Route path="/kids" element={<KidsPage />} />
              <Route path="/timetable-scheduler" element={<TimetableScheduler />} />
            </Routes>
          </main>

          {/* Footer pinned to bottom with minimal height */}
          <footer className={styles.footer}>
            <small>© {new Date().getFullYear()} School Timetable — PWA</small>
          </footer>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
