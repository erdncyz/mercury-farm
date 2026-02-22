import { inject, injectable } from 'inversify'
import { computed, makeObservable } from 'mobx'

import { socket } from '@/api/socket'
import { SettingsDeviceChangeMessage } from '@/types/settings-device-change-message.type'

import { queries } from '@/config/queries/query-key-store'
import { CONTAINER_IDS } from '@/config/inversify/container-ids'
import { queryClient } from '@/config/queries/query-client'

import { ListManagementService } from './list-management-service'

import type { QueryObserverResult } from '@tanstack/react-query'
import type { SettingsDevice } from '@/types/settings-device.type'
import type { MobxQueryFactory } from '@/types/mobx-query-factory.type'

@injectable()
export class DeviceSettingsService extends ListManagementService<'serial', SettingsDevice> {
  private devicesQuery

  constructor(@inject(CONTAINER_IDS.factoryMobxQuery) mobxQueryFactory: MobxQueryFactory) {
    super('serial')

    makeObservable(this)

    this.devicesQuery = mobxQueryFactory(() => ({ ...queries.devices.settings }))

    this.onDeviceCreate = this.onDeviceCreate.bind(this)
    this.onDeviceDelete = this.onDeviceDelete.bind(this)
    this.onDeviceChange = this.onDeviceChange.bind(this)
  }

  @computed
  get devicesQueryResult(): QueryObserverResult<SettingsDevice[]> {
    return this.devicesQuery.result
  }

  @computed
  get items(): SettingsDevice[] {
    return this.devicesQueryResult.data?.filter((item) => this.filterDevice(item)) || []
  }

  @computed
  get joinedDevicesIds(): string {
    return this.selectedItems.map((item) => item.serial).join(',')
  }

  addDeviceSettingsListeners(): void {
    socket.on('user.settings.devices.created', this.onDeviceCreate)
    socket.on('user.settings.devices.deleted', this.onDeviceDelete)
    socket.on('user.settings.devices.updated', this.onDeviceChange)
  }

  removeDeviceSettingsListeners(): void {
    socket.off('user.settings.devices.created', this.onDeviceCreate)
    socket.off('user.settings.devices.deleted', this.onDeviceDelete)
    socket.off('user.settings.devices.updated', this.onDeviceChange)
  }

  private filterDevice(item: SettingsDevice): boolean {
    if (!this.globalFilter) return true

    if (
      this.startsWithFilter(item.sdk) ||
      this.startsWithFilter(item.place) ||
      this.startsWithFilter(item.model) ||
      this.startsWithFilter(item.serial) ||
      this.startsWithFilter(item.version) ||
      this.startsWithFilter(item.storageId) ||
      this.startsWithFilter(item.marketName) ||
      this.startsWithFilter(item.manufacturer) ||
      this.startsWithFilter(item.provider?.name) ||
      this.startsWithFilter(String(item.adbPort)) ||
      this.startsWithFilter(item.group?.originName)
    ) {
      return true
    }

    return false
  }

  private onDeviceChange({ device }: SettingsDeviceChangeMessage): void {
    queryClient.setQueryData<SettingsDevice[]>(queries.devices.settings.queryKey, (oldData) => {
      if (!oldData) return []

      return oldData.map((item): SettingsDevice => {
        if (item.serial === device.serial) {
          return { ...item, ...device }
        }

        return item
      })
    })
  }

  private onDeviceCreate({ device }: SettingsDeviceChangeMessage): void {
    queryClient.setQueryData<SettingsDevice[]>(queries.devices.settings.queryKey, (oldData) => {
      if (!oldData) return []

      const isDeviceAlreadyExist = oldData.findIndex((item) => item.serial === device.serial) !== -1

      if (isDeviceAlreadyExist) return oldData

      return [...oldData, device as SettingsDevice]
    })
  }

  private onDeviceDelete({ device }: SettingsDeviceChangeMessage): void {
    queryClient.setQueryData<SettingsDevice[]>(queries.devices.settings.queryKey, (oldData) => {
      if (!oldData) return []

      return oldData.filter((item) => item.serial !== device.serial)
    })
  }
}
