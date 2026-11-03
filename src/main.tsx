import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './styles/tokens.css'
import './styles/global.css'
import { AuthProvider } from './auth/AuthProvider'
import { ManaDataProvider } from './data/ManaDataProvider'
import { FocusTimerProvider } from './focus/FocusTimerProvider'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ManaDataProvider>
          <FocusTimerProvider>
            <App />
          </FocusTimerProvider>
        </ManaDataProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
