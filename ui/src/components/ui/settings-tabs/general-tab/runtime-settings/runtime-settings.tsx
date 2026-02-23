import { observer } from 'mobx-react-lite'
import { useInjection } from 'inversify-react'
import { useTranslation } from 'react-i18next'
import { Icon28SettingsOutline } from '@vkontakte/icons'
import { FormItem, FormLayoutGroup, Input, SelectionControl, Spacing, Switch } from '@vkontakte/vkui'

import { ContentCard } from '@/components/lib/content-card'
import { BaseSelect } from '@/components/lib/base-select'

import { CONTAINER_IDS } from '@/config/inversify/container-ids'
import { RUNTIME_PROFILE_OPTIONS, RuntimeProfileOption } from '@/services/settings-service/settings-service'

import type { SelectOption } from '@/components/lib/base-select'

const toNumber = (value: string, fallback: number): number => {
  const parsed = Number(value)

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

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

        <FormItem top={t('Android Screen Frame Rate')}>
          <Input
            type='number'
            value={String(settingsService.androidRuntimeSettings.screenFrameRate)}
            onChange={(event) => {
              settingsService.setAndroidRuntimeSetting(
                'screenFrameRate',
                toNumber(event.target.value, settingsService.androidRuntimeSettings.screenFrameRate)
              )
            }}
          />
        </FormItem>

        <FormItem top={t('Android Screen JPEG Quality')}>
          <Input
            type='number'
            value={String(settingsService.androidRuntimeSettings.screenJpegQuality)}
            onChange={(event) => {
              settingsService.setAndroidRuntimeSetting(
                'screenJpegQuality',
                toNumber(event.target.value, settingsService.androidRuntimeSettings.screenJpegQuality)
              )
            }}
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

        <SelectionControl>
          <Switch
            checked={settingsService.iosRuntimeSettings.wdaLeanMode}
            onChange={(event) => settingsService.setIosRuntimeSetting('wdaLeanMode', event.target.checked)}
          />
          <SelectionControl.Label description={t('Compact WDA responses and reduced payload')}>
            {t('iOS WDA Lean Mode')}
          </SelectionControl.Label>
        </SelectionControl>

        <FormItem top={t('iOS WDA MJPEG Quality')}>
          <Input
            type='number'
            value={String(settingsService.iosRuntimeSettings.wdaMjpegQuality)}
            onChange={(event) => {
              settingsService.setIosRuntimeSetting(
                'wdaMjpegQuality',
                toNumber(event.target.value, settingsService.iosRuntimeSettings.wdaMjpegQuality)
              )
            }}
          />
        </FormItem>

        <FormItem top={t('iOS WDA MJPEG Scaling')}>
          <Input
            type='number'
            value={String(settingsService.iosRuntimeSettings.wdaMjpegScaling)}
            onChange={(event) => {
              settingsService.setIosRuntimeSetting(
                'wdaMjpegScaling',
                toNumber(event.target.value, settingsService.iosRuntimeSettings.wdaMjpegScaling)
              )
            }}
          />
        </FormItem>

        <FormItem top={t('iOS WDA Tree Cache (ms)')}>
          <Input
            type='number'
            value={String(settingsService.iosRuntimeSettings.wdaTreeCacheMs)}
            onChange={(event) => {
              settingsService.setIosRuntimeSetting(
                'wdaTreeCacheMs',
                toNumber(event.target.value, settingsService.iosRuntimeSettings.wdaTreeCacheMs)
              )
            }}
          />
        </FormItem>

        <FormItem top={t('iOS Type Key Delay (ms)')}>
          <Input
            type='number'
            value={String(settingsService.iosRuntimeSettings.typeKeyDelayMs)}
            onChange={(event) => {
              settingsService.setIosRuntimeSetting(
                'typeKeyDelayMs',
                toNumber(event.target.value, settingsService.iosRuntimeSettings.typeKeyDelayMs)
              )
            }}
          />
        </FormItem>
      </FormLayoutGroup>
    </ContentCard>
  )
})
