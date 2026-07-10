import { type QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { logger } from '@/lib/logger'
import { Toaster } from '@/components/ui/sonner'
import { NavigationProgress } from '@/components/common/navigation-progress'
import { GeneralError, NotFoundError } from '@/features/errors'
import { WorkflowEditorProvider } from '@/features/workflows/components/workflow-editor-context'

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  component: () => {
    return (
      <>
        <NavigationProgress />
        <WorkflowEditorProvider>
          <Outlet />
        </WorkflowEditorProvider>
        <Toaster duration={5000} position='bottom-center' />
        {import.meta.env.VITE_MODE === 'development' && (
          <>
            <ReactQueryDevtools buttonPosition='bottom-right' />
            <TanStackRouterDevtools position='bottom-right' />
          </>
        )}
      </>
    )
  },
  notFoundComponent: NotFoundError,
  errorComponent: GeneralError,
  onCatch(error) {
    logger.error({ message: error.message, error, category: 'client_error' })
  },
})
