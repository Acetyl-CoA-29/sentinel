import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AccessibilityProvider } from './contexts/AccessibilityContext'
import ColorBlindFilters from './components/accessibility/ColorBlindFilters'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AccessibilityProvider>
      <ColorBlindFilters />
      <App />
    </AccessibilityProvider>
  </StrictMode>,
)
