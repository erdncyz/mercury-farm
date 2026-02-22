import { makeAutoObservable } from 'mobx'
import { makePersistable } from 'mobx-persist-store'

import { COLUMN_VISIBILITY_DEFAULT } from '@/components/ui/device-table/constants'

import type { VisibilityState } from '@tanstack/react-table'

class DeviceTableState {
  globalFilter = ''
  filteredDeviceCount = 0
  platformFilters = {
    ios: true,
    android: true,
  }
  columnVisibility: VisibilityState = COLUMN_VISIBILITY_DEFAULT

  constructor() {
    makeAutoObservable(this)
    makePersistable(this, { name: 'columnVisibility', properties: ['columnVisibility'], storage: window.localStorage })
  }

  setGlobalFilter(filter: string): void {
    this.globalFilter = filter
  }

  setFilteredDeviceCount(value: number): void {
    this.filteredDeviceCount = value
  }

  setPlatformFilter(platform: 'ios' | 'android'): void {
    this.platformFilters = {
      ...this.platformFilters,
      [platform]: !this.platformFilters[platform],
    }
  }

  setColumnVisibility(visibility: VisibilityState | ((visibility: VisibilityState) => VisibilityState)): void {
    if (typeof visibility === 'function') {
      this.columnVisibility = visibility(this.columnVisibility)

      return
    }

    this.columnVisibility = { ...this.columnVisibility, ...visibility }
  }
}

export const deviceTableState = new DeviceTableState()
