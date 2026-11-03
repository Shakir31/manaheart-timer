// Renders the whole app (routes, providers) at a URL with a fake signed-in user.
// Tests must vi.mock('../data/api') (relative to the test file) before importing this.
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import App from '../App'
import { AuthContext } from '../auth/context'
import { ManaDataProvider } from '../data/ManaDataProvider'
import { FocusTimerProvider } from '../focus/FocusTimerProvider'
import { ToastProvider } from '../ui/toast/ToastProvider'
import type { AuthValue } from '../auth/context'
import { fakeAuth } from './providers'

export function renderApp(path = '/', state?: unknown, auth: AuthValue = fakeAuth()) {
  return render(
    <MemoryRouter initialEntries={[state === undefined ? path : { pathname: path, state }]}>
      <AuthContext.Provider value={auth}>
        <ManaDataProvider>
          <FocusTimerProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </FocusTimerProvider>
        </ManaDataProvider>
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}
