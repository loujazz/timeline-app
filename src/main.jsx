import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App'

// Set favicon dynamically using Vite base URL
const link = document.createElement('link')
link.rel = 'icon'
link.href = `${import.meta.env.BASE_URL}favicon.ico`
document.head.appendChild(link)

// Apple touch icon for iOS home screen
const touchIcon = document.createElement('link')
touchIcon.rel = 'apple-touch-icon'
touchIcon.href = `${import.meta.env.BASE_URL}apple-touch-icon.png`
document.head.appendChild(touchIcon)

// Web App Manifest for Android home screen
const manifest = document.createElement('link')
manifest.rel = 'manifest'
manifest.href = `${import.meta.env.BASE_URL}manifest.json`
document.head.appendChild(manifest)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
