import { List } from '@vkontakte/vkui'
import { observer } from 'mobx-react-lite'
import { useInjection } from 'inversify-react'

import { CONTAINER_IDS } from '@/config/inversify/container-ids'

import { DeviceItem } from './device-item'

import type { DeleteDeviceParams } from '@/generated/types'

type DeviceListProps = {
  removeFilters: DeleteDeviceParams
}

export const DeviceList = observer(({ removeFilters }: DeviceListProps) => {
  const deviceSettingsService = useInjection(CONTAINER_IDS.deviceSettingsService)

  return (
    <List gap={5}>
      {deviceSettingsService.paginatedItems.map((device) => (
        <DeviceItem key={device.serial} device={device} removeFilters={removeFilters} />
      ))}
    </List>
  )
})
