import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { OrderProvider } from './context/OrderContext.jsx'
import { InventoryProvider } from './context/InventoryContext.jsx'

import { AuthProvider } from './context/AuthContext.jsx'

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
