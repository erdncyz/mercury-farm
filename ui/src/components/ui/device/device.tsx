import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { Flex } from '@vkontakte/vkui'
import { ErrorBoundary } from 'react-error-boundary'
import { useInjection } from 'inversify-react'

import { ErrorFallback } from '@/components/lib/error-fallback'

import { CONTAINER_IDS } from '@/config/inversify/container-ids'

import { DeviceTopBar } from './device-top-bar'
import { DeviceScreen } from './device-screen'
import { DeviceNavigationButtons } from './device-navigation-buttons'
import styles from './device.module.css'

export const Device = observer(() => {
  const deviceLifecycleService = useInjection(CONTAINER_IDS.deviceLifecycleService)

  useEffect(() => {
    deviceLifecycleService.prepareDevice()

    return () => {
      deviceLifecycleService.cleanupDevice()
    }
  }, [])

  return (
    <Flex className={styles.device} direction='column' noWrap>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <DeviceTopBar />
        <DeviceScreen />
        <DeviceNavigationButtons />
      </ErrorBoundary>
    </Flex>
  )
})
