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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
