import { Button } from '@vkontakte/vkui'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useInjection } from 'inversify-react'
import { Icon28SyncOutline } from '@vkontakte/icons'

import { ContentCard } from '@/components/lib/content-card'

import { CONTAINER_IDS } from '@/config/inversify/container-ids'

export const ResetSettings = observer(() => {
  const { t } = useTranslation()

  const settingsService = useInjection(CONTAINER_IDS.settingsService)

  return (
    <ContentCard before={<Icon28SyncOutline height={20} width={20} />} title={t('Reset Settings')}>
      <Button size='m' stretched onClick={() => settingsService.resetToDefaults()}>
        {t('Reset general settings')}
      </Button>
    </ContentCard>
  )
})
