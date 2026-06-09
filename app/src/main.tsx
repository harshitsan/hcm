import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AppProvider } from './app/store'
import { NotificationsProvider } from './app/notifications'
import { PoliciesProvider } from './app/policies'
import { ToastProvider } from './components/ui'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <AppProvider>
        <NotificationsProvider>
          <PoliciesProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </PoliciesProvider>
        </NotificationsProvider>
      </AppProvider>
    </HashRouter>
  </StrictMode>,
)
