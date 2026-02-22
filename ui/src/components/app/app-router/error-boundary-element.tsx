import { Outlet, useLocation } from 'react-router'
import { ErrorBoundary } from 'react-error-boundary'

import { ErrorFallback } from '@/components/lib/error-fallback'

export const ErrorBoundaryElement = () => {
  const { pathname } = useLocation()

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} resetKeys={[pathname]}>
      <Outlet />
    </ErrorBoundary>
  )
}
