import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
// import { initTelemetry } from '@/services/telemetry.service'
import { ErrorBoundary } from '@/components/common/error-boundary'
import { GeneralError } from '@/features/errors/components/general-error'
import { DirectionProvider } from './context/direction-provider'
import { FontProvider } from './context/font-provider'
import { ReactQueryProvider, queryClient } from './context/react-query-provider'
import { RoleProvider } from './context/role-context'
import { ThemeProvider } from './context/theme-provider'
// Generated Routes
import { routeTree } from './routeTree.gen'
// Styles
import './styles/index.css'

// Initialize telemetry
// initTelemetry()

// Create a new router instance
const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Render the app
const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <ErrorBoundary fallback={<GeneralError minimal />}>
        <ReactQueryProvider>
          <ThemeProvider>
            <FontProvider>
              <DirectionProvider>
                <RoleProvider>
                  <RouterProvider router={router} />
                </RoleProvider>
              </DirectionProvider>
            </FontProvider>
          </ThemeProvider>
        </ReactQueryProvider>
      </ErrorBoundary>
    </StrictMode>
  )
}
