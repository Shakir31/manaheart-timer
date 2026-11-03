import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './styles/tokens.css'
import './styles/global.css'
import { AuthProvider } from './auth/AuthProvider'
import { ManaDataProvider } from './data/ManaDataProvider'
import { FocusTimerProvider } from './focus/FocusTimerProvider'
import { ToastProvider } from './ui/toast/ToastProvider'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ManaDataProvider>
          <FocusTimerProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </FocusTimerProvider>
        </ManaDataProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
