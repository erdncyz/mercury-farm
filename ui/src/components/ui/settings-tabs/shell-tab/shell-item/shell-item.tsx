import { observer } from 'mobx-react-lite'
import { useInjection } from 'inversify-react'
import { useTranslation } from 'react-i18next'
import { Div, Placeholder } from '@vkontakte/vkui'
import { Icon28InboxOutline } from '@vkontakte/icons'

import { ListItem } from '@/components/lib/list-item'
import { OutputLogArea } from '@/components/lib/output-log-area'
import { ConditionalRender } from '@/components/lib/conditional-render'

import { CONTAINER_IDS } from '@/config/inversify/container-ids'

import styles from './shell-item.module.css'

import type { ShellDevice } from '@/types/shell-device.type'

type ShellItemProps = {
  device: ShellDevice
}

export const ShellItem = observer(({ device }: ShellItemProps) => {
  const { t } = useTranslation()

  const shellSettingsService = useInjection(CONTAINER_IDS.shellSettingsService)

  return (
    <ListItem
      extraSubtitle={`${t('Serial')}: ${device.serial} - ${t('OS')}: ${device.version} - SDK: ${device.sdk} - ${t('Location')}: ${device.provider?.name} - ${t('Group Origin')}: ${device.group?.originName}`}
      subtitle={`${t('Storage Id')}: ${device.storageId || t('No value')} - ${t('Place')}: ${device.place || t('No value')}`}
      title={`${device.manufacturer || t('Unknown')} ${device.model || t('Unknown')} (${device.marketName || t('Unknown')})`}
      defaultOpened
    >
      <ConditionalRender conditions={[!!shellSettingsService.shellResults[device.serial]]}>
        <Div>
          <OutputLogArea className={styles.shellResult} text={shellSettingsService.shellResults[device.serial]} />
        </Div>
      </ConditionalRender>
      <ConditionalRender conditions={[!shellSettingsService.shellResults[device.serial]]}>
        <Placeholder icon={<Icon28InboxOutline />}>{t('Empty')}</Placeholder>
      </ConditionalRender>
    </ListItem>
  )
})
