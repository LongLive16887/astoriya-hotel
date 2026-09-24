import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/cormorant-garamond/wght.css'
import '@fontsource-variable/cormorant-garamond/wght-italic.css'
import '@fontsource-variable/manrope/wght.css'
import './styles/tokens.css'
import './styles/base.css'
import './site/site.css'
import './i18n'
import App from './App'

// After a new release the old code chunks are gone; reload once to get the fresh version.
window.addEventListener('vite:preloadError', () => {
  try {
    const last = Number(sessionStorage.getItem('astoria:chunk-reload') ?? 0)
    if (Date.now() - last < 60_000) return
    sessionStorage.setItem('astoria:chunk-reload', String(Date.now()))
  } catch {
    return
  }
  window.location.reload()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
