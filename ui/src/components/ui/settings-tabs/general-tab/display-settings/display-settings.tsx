import { observer } from 'mobx-react-lite'
import { useInjection } from 'inversify-react'
import { useTranslation } from 'react-i18next'
import { Icon28SettingsOutline } from '@vkontakte/icons'
import { FormItem, FormLayoutGroup, Input } from '@vkontakte/vkui'

import { ContentCard } from '@/components/lib/content-card'

import { CONTAINER_IDS } from '@/config/inversify/container-ids'

export const DisplaySettings = observer(() => {
  const { t } = useTranslation()

  const settingsService = useInjection(CONTAINER_IDS.settingsService)

  return (
    <ContentCard before={<Icon28SettingsOutline height={20} width={20} />} title={t('Display Settings')}>
      <FormLayoutGroup>
        <FormItem top={t('Date format')}>
          <Input
            placeholder='e.g. M/d/yy h:mm:ss a'
            value={settingsService.dateFormat}
            onChange={(event) => settingsService.setDateFormat(event.target.value)}
          />
        </FormItem>
        <FormItem top={t('Email address separator')}>
          <Input
            placeholder='e.g. ,'
            value={settingsService.emailSeparator}
            onChange={(event) => settingsService.setEmailSeparator(event.target.value)}
          />
        </FormItem>
      </FormLayoutGroup>
    </ContentCard>
  )
})
