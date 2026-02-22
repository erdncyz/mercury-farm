import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { AdaptivityProvider, AppRoot, ConfigProvider } from '@vkontakte/vkui'

import { ConditionalRender } from '@/components/lib/conditional-render'

import { globalToast } from './store/global-toast'
import { ErrorToast } from './components/lib/error-toast'

import type { ReactNode } from 'react'

export const AppWrapper = observer(({ children }: { children: ReactNode }) => {
  const { t } = useTranslation()
  const [isToastVisible, setIsToastVisible] = useState(false)

  useEffect(() => {
    if (globalToast.message && !isToastVisible) {
      setIsToastVisible(true)
    }
  }, [globalToast.message])

  return (
    <ConfigProvider colorScheme='light' platform='vkcom'>
      <AdaptivityProvider>
        <AppRoot>{children}</AppRoot>
        <ConditionalRender conditions={[isToastVisible]}>
          <ErrorToast
            text={globalToast.message}
            title={t('Error')}
            onClose={() => {
              globalToast.setMessage('')
              setIsToastVisible(false)
            }}
          />
        </ConditionalRender>
      </AdaptivityProvider>
    </ConfigProvider>
  )
})
