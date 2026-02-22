import { useState } from 'react'
import { useInjection } from 'inversify-react'
import { useTranslation } from 'react-i18next'
import { Button, Flex } from '@vkontakte/vkui'
import { Icon20WrenchOutline } from '@vkontakte/icons'

import { WarningModal } from '@/components/ui/modals'
import { ContentCard } from '@/components/lib/content-card'

import { CONTAINER_IDS } from '@/config/inversify/container-ids'

import styles from './maintenance-control.module.css'

export const MaintenanceControl = ({ className }: { className?: string }) => {
  const { t } = useTranslation()
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)

  const deviceControlStore = useInjection(CONTAINER_IDS.deviceControlStore)

  return (
    <ContentCard before={<Icon20WrenchOutline />} className={className} title={t('Maintenance')}>
      <Flex align='center' justify='center'>
        <Button
          appearance='negative'
          className={styles.restartButton}
          size='m'
          stretched
          onClick={() => setIsConfirmationOpen(true)}
        >
          {t('Restart Device')}
        </Button>
        <WarningModal
          description={`${t('Are you sure you want to reboot this device?')} ${t('The device will be unavailable for a moment')}`}
          isOpen={isConfirmationOpen}
          title={t('Warning')}
          onClose={() => setIsConfirmationOpen(false)}
          onOk={async () => {
            const rebootResult = await deviceControlStore.reboot()
            const { data } = await rebootResult.donePromise

            console.info(data)
          }}
        />
      </Flex>
    </ContentCard>
  )
}
