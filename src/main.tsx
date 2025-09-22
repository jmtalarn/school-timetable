import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import { Workbox } from 'workbox-window'

function setupSW() {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    const wb = new Workbox('/sw.js')
    wb.addEventListener('waiting', () => {
      // A new version is ready; ask user to refresh
      const shouldReload = confirm('A new version is available. Update now?')
      if (shouldReload) wb.messageSkipWaiting()
    })
    wb.addEventListener('controlling', () => window.location.reload())
    wb.register()
  }
}
setupSW()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
