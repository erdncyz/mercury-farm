import { LogPriority } from '@/types/enums/log-priority.enum'

import type { Row } from '@tanstack/react-table'
import type { LogcatEntryMessage } from '@/types/logcat-entry-message.type'

export const logPriorityFilter = (row: Row<LogcatEntryMessage>, _: string, filterValue: LogPriority): boolean => {
  const priority = row.original.priority

  if (filterValue === LogPriority.VERBOSE) return true

  if (LogPriority[filterValue] === LogPriority[priority]) return true

  return false
}
