import { action, makeAutoObservable } from 'mobx'

import type { ColumnFiltersState, Updater } from '@tanstack/react-table'

class LogsTableState {
  globalFilter = ''
  columnFilters: ColumnFiltersState = []

  constructor() {
    makeAutoObservable(this, {
      setColumnFilters: action.bound,
    })
  }

  setColumnFilters(updaterOrValue: Updater<ColumnFiltersState>): void {
    if (updaterOrValue instanceof Function) {
      this.columnFilters = updaterOrValue(this.columnFilters)

      return
    }

    this.columnFilters = updaterOrValue
  }

  setGlobalFilter(filter: string): void {
    this.globalFilter = filter
  }
}

export const logsTableState = new LogsTableState()
