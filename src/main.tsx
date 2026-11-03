import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/global.css'
import { AuthProvider } from './auth/AuthProvider'
import { ManaDataProvider } from './data/ManaDataProvider'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ManaDataProvider>
        <App />
      </ManaDataProvider>
    </AuthProvider>
  </StrictMode>,
)
