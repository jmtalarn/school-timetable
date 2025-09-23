
import { useA2HS } from './hooks/useA2HS'
import { useState } from 'react'
import logoSvg from '/school-timetable-logo.svg'
import './App.css'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import MattersPage from './pages/MattersPage'
import KidsPage from './pages/KidsPage'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

function Home() {
  const { canInstall, promptInstall } = useA2HS()
  const [count, setCount] = useState(0)
  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={logoSvg} className="logo" alt="Vite logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      <p>
        This app works offline and can be installed on your device.
      </p>
      {canInstall && (
        <button
          onClick={promptInstall}
          className="px-4 py-2 rounded-xl border"
        >
          Install App
        </button>
      )}
    </>
  )
}

function About() {
  return <h2>About Page</h2>
}

function App() {
  const queryClient = new QueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <nav style={{ marginBottom: 16 }}>
    <Link to="/">Home</Link> | <Link to="/about">About</Link> | <Link to="/matters">Matters</Link> | <Link to="/kids">Kids</Link>
        </nav>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
    <Route path="/matters" element={<MattersPage />} />
    <Route path="/kids" element={<KidsPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
