import { inject, injectable } from 'inversify'
import { makeAutoObservable } from 'mobx'

import { socket } from '@/api/socket'
import { ListDevice } from '@/types/list-device.type'
import { DeviceTableRow } from '@/types/device-table-row.type'

import { throttle } from '@/lib/utils/throttle.util'
import { queries } from '@/config/queries/query-key-store'
import { queryClient } from '@/config/queries/query-client'
import { DeviceState } from '@/types/enums/device-state.enum'
import { getDeviceState } from '@/lib/utils/get-device-state.util'
import { normalizeListDevice } from '@/lib/utils/normalize-list-device.util'
import { CONTAINER_IDS } from '@/config/inversify/container-ids'

import type { Device } from '@/generated/types'
import type { QueryObserverResult } from '@tanstack/react-query'
import type { MobxQueryFactory } from '@/types/mobx-query-factory.type'
import type { DeviceChangeMessage } from '@/types/device-change-message.type'

@injectable()
export class DeviceListStore {
  private batchedUpdates: Record<string, Partial<Device>> = {}
  private throttleDelay = 250

  private devicesQuery

  private throttledFlushUpdates = throttle(this.flushUpdates, this.throttleDelay)

  constructor(@inject(CONTAINER_IDS.factoryMobxQuery) mobxQueryFactory: MobxQueryFactory) {
    makeAutoObservable(this)

    this.devicesQuery = mobxQueryFactory(() => ({ ...queries.devices.list, staleTime: Infinity }))

    this.flushUpdates = this.flushUpdates.bind(this)
    this.onDeviceChange = this.onDeviceChange.bind(this)

    this.addDeviceChangeListener()
  }

  addDeviceChangeListener(): void {
    socket.on('device.change', this.onDeviceChange)
  }

  removeDeviceChangeListener(): void {
    socket.off('device.change', this.onDeviceChange)
  }

  get devicesQueryResult(): QueryObserverResult<ListDevice[]> {
    return this.devicesQuery.result
  }

  get visibleDevices(): ListDevice[] {
    return (this.devicesQuery.data || [])
      .filter((item) => getDeviceState(item) !== DeviceState.ABSENT)
      .map((item) => normalizeListDevice(item))
  }

  get busyDevicesCount(): number | undefined {
    return this.visibleDevices.reduce(
      (accumulator, item) => (getDeviceState(item) === DeviceState.BUSY ? accumulator + 1 : accumulator),
      0
    )
  }

  get totalNumberDevices(): number | undefined {
    return this.visibleDevices.length
  }

  get usableDevicesCount(): number | undefined {
    return this.visibleDevices.reduce(
      (accumulator, item) => (getDeviceState(item) === DeviceState.AVAILABLE ? accumulator + 1 : accumulator),
      0
    )
  }

  get usingDevicesCount(): number | undefined {
    return this.visibleDevices.reduce((accumulator, item) => (item.using ? accumulator + 1 : accumulator), 0)
  }

  private async onDeviceChange({ data: changedData }: DeviceChangeMessage<Partial<Device>>): Promise<void> {
    if (changedData.serial) {
      this.batchedUpdates[changedData.serial] = changedData
    }

    this.throttledFlushUpdates()
  }

  private flushUpdates(): void {
    const batchedUpdates = this.batchedUpdates
    let hasUnknownDeviceUpdate = false

    queryClient.setQueryData<DeviceTableRow[] | undefined>(queries.devices.list.queryKey, (oldData) => {
      if (!oldData) {
        hasUnknownDeviceUpdate = true

        return oldData
      }

      const knownSerials = new Set(oldData.map((item) => item.serial))

      hasUnknownDeviceUpdate = Object.keys(batchedUpdates).some((serial) => !knownSerials.has(serial))

      return oldData.map((item): DeviceTableRow => {
        const updateData = batchedUpdates[item.serial]

        if (updateData) {
          /* NOTE: needUpdate determine if the row needs to be rerendered */
          return { ...item, ...updateData, needUpdate: Date.now() }
        }

        return item
      })
    })

    this.batchedUpdates = {}

    if (hasUnknownDeviceUpdate) {
      queryClient.invalidateQueries({ queryKey: queries.devices.list.queryKey })
    }
  }
}
