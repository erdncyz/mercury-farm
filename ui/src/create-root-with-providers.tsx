import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Provider as DIContainerProvider } from 'inversify-react'

import { enableMocking } from '@/__mocks__/enable-mocking'
import { queryClient } from '@/config/queries/query-client'
import { globalContainer } from '@/config/inversify/global-container'

import { AppWrapper } from './app-wrapper'

import type { ReactNode } from 'react'

import '@vkontakte/vkui/dist/cssm/styles/themes.css'
import '@/styles/index.css'
import '@/config/i18n/i18n'

export const createRootWithProviders = (children: ReactNode): void => {
  enableMocking().then(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <DIContainerProvider container={globalContainer}>
            <AppWrapper>{children}</AppWrapper>
          </DIContainerProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </StrictMode>
    )
  })
}
