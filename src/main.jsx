import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { OrderProvider } from './context/OrderContext.jsx'
import { InventoryProvider } from './context/InventoryContext.jsx'

import { AuthProvider } from './context/AuthContext.jsx'

// Gunakan environment variable jika ada, jika tidak fallback ke localhost atau origin server (karena menggunakan Nginx reverse proxy)
window.API_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:5000' 
    : '' // Kosongkan agar fetch('/api/...') menggunakan host dan port yang sama (port 80 via Nginx)
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <InventoryProvider>
        <OrderProvider>
          <App />
        </OrderProvider>
      </InventoryProvider>
    </AuthProvider>
  </StrictMode>,
)
