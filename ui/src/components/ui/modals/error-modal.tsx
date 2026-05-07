import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useInjection } from 'inversify-react'
import { Button, ButtonGroup } from '@vkontakte/vkui'
import { Icon20ErrorCircleFillRed } from '@vkontakte/icons'

import { BaseModal } from '@/components/lib/base-modal'

import { queries } from '@/config/queries/query-key-store'
import { queryClient } from '@/config/queries/query-client'
import { CONTAINER_IDS } from '@/config/inversify/container-ids'

import { getDevicesRoute } from '@/constants/route-paths'

import styles from './modal.module.css'

import type { BaseModalProps } from '@/components/lib/base-modal'

export const ErrorModal = ({ ...props }: Omit<BaseModalProps, 'actions' | 'icon'>) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isReconnecting, setIsReconnecting] = useState(false)

  const deviceBySerialStore = useInjection(CONTAINER_IDS.deviceBySerialStore)
  const deviceDisconnection = useInjection(CONTAINER_IDS.deviceDisconnection)
  const deviceLifecycleService = useInjection(CONTAINER_IDS.deviceLifecycleService)

  const { data: device } = deviceBySerialStore.deviceQueryResult()

  return (
    <BaseModal
      {...props}
      icon={<Icon20ErrorCircleFillRed height={56} width={56} />}
      actions={
        <ButtonGroup className={styles.modalActions} stretched>
          <Button
            loading={isReconnecting}
            mode={'secondary'}
            size='l'
            stretched
            onClick={async () => {
              setIsReconnecting(true)

              try {
                await deviceLifecycleService.reconnectDevice()
              } finally {
                setIsReconnecting(false)
              }
            }}
          >
            {t('Try to reconnect')}
          </Button>
          <Button
            disabled={isReconnecting}
            mode='primary'
            size='l'
            stretched
            onClick={async () => {
              try {
                if (device?.channel && device?.serial) {
                  await deviceDisconnection.stopUsingDevice(device.serial, device.channel)
                }
              } catch (error) {
                console.error(error)
              } finally {
                queryClient.invalidateQueries({ queryKey: queries.devices.list.queryKey })
                navigate(getDevicesRoute(), { replace: true })
              }
            }}
          >
            {t('Go to Device List')}
          </Button>
        </ButtonGroup>
      }
    />
  )
}
