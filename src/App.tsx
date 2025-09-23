import { useA2HS } from './hooks/useA2HS'
import { useState } from 'react'
import logoSvg from '/school-timetable-logo.svg'
import './App.css'

function App() {
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

export default App
