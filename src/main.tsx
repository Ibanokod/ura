import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import '@fontsource-variable/manrope'
import './styles/tokens.css'
import './styles/global.css'
import App from './App'

// Service worker (PWA) : en mode « autoUpdate », la page se recharge d'elle-même quand une
// nouvelle version est activée. Sans cela, le téléphone garderait l'ancienne version en
// cache jusqu'à l'ouverture suivante.
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
