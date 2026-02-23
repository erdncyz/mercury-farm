import { observer } from 'mobx-react-lite'
import { useInjection } from 'inversify-react'
import { useTranslation } from 'react-i18next'
import { Icon28SettingsOutline } from '@vkontakte/icons'
import { FormItem, FormLayoutGroup, Spacing } from '@vkontakte/vkui'

import { ContentCard } from '@/components/lib/content-card'
import { BaseSelect } from '@/components/lib/base-select'

import { CONTAINER_IDS } from '@/config/inversify/container-ids'
import { RUNTIME_PROFILE_OPTIONS, RuntimeProfileOption } from '@/services/settings-service/settings-service'

import type { SelectOption } from '@/components/lib/base-select'

export const RuntimeSettings = observer(() => {
  const { t } = useTranslation()
  const settingsService = useInjection(CONTAINER_IDS.settingsService)
  const profileOptions: SelectOption<RuntimeProfileOption>[] = RUNTIME_PROFILE_OPTIONS.map((item) => ({
    name: `${t(`Runtime profile.${item}`)} — ${t(`Runtime profile.description.${item}`)}`,
    value: item,
  }))

  return (
    <ContentCard before={<Icon28SettingsOutline height={20} width={20} />} title={t('Device Runtime Settings')}>
      <FormLayoutGroup>
        <FormItem top={t('Android Profile')}>
          <BaseSelect
            options={profileOptions}
            value={settingsService.androidRuntimeProfile}
            onChange={(value) => settingsService.setAndroidRuntimeProfile(value as RuntimeProfileOption)}
          />
        </FormItem>

        <Spacing size='2xl' />

        <FormItem top={t('iOS Profile')}>
          <BaseSelect
            options={profileOptions}
            value={settingsService.iosRuntimeProfile}
            onChange={(value) => settingsService.setIosRuntimeProfile(value as RuntimeProfileOption)}
          />
        </FormItem>
      </FormLayoutGroup>
    </ContentCard>
  )
})
