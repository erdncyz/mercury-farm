import { LogsTableColumnIds } from '@/components/ui/device-control-panel/tabs/logs-tab/logs-table/types'

import { LogPriority } from '@/types/enums/log-priority.enum'

import { isStringTypeGuard } from './is-string-type-guard.util'
import { timestampToTimeString } from './timestamp-to-time-string.util'

import type { ColumnFiltersState } from '@tanstack/react-table'
import type { LogcatEntryMessage } from '@/types/logcat-entry-message.type'

export const filterLogs = (logs: LogcatEntryMessage[], filters: ColumnFiltersState): LogcatEntryMessage[] =>
  logs.filter((item) =>
    filters.reduce((accumulator, filter) => {
      if (filter.id === LogsTableColumnIds.PRIORITY && filter.value === LogPriority.VERBOSE) return accumulator && true

      if (filter.id === LogsTableColumnIds.PRIORITY) {
        return accumulator && item.priority === filter.value
      }

      if (!isStringTypeGuard(filter.value)) return accumulator

      if (filter.id === LogsTableColumnIds.TIME) {
        return accumulator && timestampToTimeString(item.date).startsWith(filter.value)
      }

      if (filter.id === LogsTableColumnIds.PID) {
        return accumulator && String(item.pid).startsWith(filter.value)
      }

      if (filter.id === LogsTableColumnIds.TID) {
        return accumulator && String(item.tid).startsWith(filter.value)
      }

      if (filter.id === LogsTableColumnIds.TAG) {
        return accumulator && item.tag.toLowerCase().startsWith(filter.value.toLowerCase())
      }

      if (filter.id === LogsTableColumnIds.TEXT) {
        return accumulator && item.message.toLowerCase().startsWith(filter.value.toLowerCase())
      }

      return accumulator
    }, true)
  )
