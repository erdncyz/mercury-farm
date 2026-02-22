import { List } from '@vkontakte/vkui'
import { observer } from 'mobx-react-lite'
import { useInjection } from 'inversify-react'

import { CONTAINER_IDS } from '@/config/inversify/container-ids'

import { ShellItem } from './shell-item'

export const ShellList = observer(() => {
  const shellSettingsService = useInjection(CONTAINER_IDS.shellSettingsService)

  return (
    <List gap={5}>
      {shellSettingsService.paginatedItems.map((device) => (
        <ShellItem key={device.serial} device={device} />
      ))}
    </List>
  )
})
