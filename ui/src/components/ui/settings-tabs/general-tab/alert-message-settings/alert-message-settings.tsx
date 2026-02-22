import { observer } from 'mobx-react-lite'
import { useInjection } from 'inversify-react'
import { useTranslation } from 'react-i18next'
import { Icon20InfoCircleOutline } from '@vkontakte/icons'
import { FormItem, FormLayoutGroup, Input, SelectionControl, Spacing, Switch } from '@vkontakte/vkui'

import { BaseSelect } from '@/components/lib/base-select'
import { ContentCard } from '@/components/lib/content-card'

import { SettingsService } from '@/services/settings-service/settings-service'

import { CONTAINER_IDS } from '@/config/inversify/container-ids'

import type { AlertMessageLevel } from '@/generated/types'
import type { SelectOption } from '@/components/lib/base-select'

const SELECT_LEVEL_OPTIONS: SelectOption<AlertMessageLevel>[] = [
  { name: 'Warning', value: 'Warning' },
  { name: 'Critical', value: 'Critical' },
  { name: 'Information', value: 'Information' },
]

export const AlertMessageSettings = observer(({ className }: { className: string }) => {
  const { t } = useTranslation()

  const settingsService = useInjection(CONTAINER_IDS.settingsService)

  return (
    <ContentCard before={<Icon20InfoCircleOutline />} className={className} title={t('Alert Message')}>
      <FormLayoutGroup>
        <FormItem top={t('Text')}>
          <Input
            placeholder='e.g. Site is currently under maintenance'
            value={settingsService.alertMessage.data}
            onChange={(event) => settingsService.setAlertMessage('data', event.target.value)}
          />
        </FormItem>
        <FormItem top={t('Level')}>
          <BaseSelect
            options={SELECT_LEVEL_OPTIONS}
            value={settingsService.alertMessage.level}
            onChange={(value) => settingsService.setAlertMessage('level', value as AlertMessageLevel)}
          />
        </FormItem>
        <Spacing size='2xl' />
        <SelectionControl>
          <Switch
            checked={settingsService.isAlertMessageActive}
            onChange={(event) => {
              settingsService.setAlertMessage('activation', SettingsService.checkedToText(event.target.checked))
            }}
          />
          <SelectionControl.Label description={t('Enable scrolling text')}>{t('Activation')}</SelectionControl.Label>
        </SelectionControl>
      </FormLayoutGroup>
    </ContentCard>
  )
})
