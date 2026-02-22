import { createColumnHelper } from '@tanstack/react-table'

import { TextWithTranslation } from '@/components/lib/text-with-translation'

import { LogPriority } from '@/types/enums/log-priority.enum'
import { toSentenceCase } from '@/lib/utils/to-sentence-case.util'
import { startsWithFilter } from '@/lib/utils/starts-with-filter.util'
import { logPriorityFilter } from '@/lib/utils/log-priority-filter.util'
import { timestampToTimeString } from '@/lib/utils/timestamp-to-time-string.util'

import { LogsTableColumnIds } from './types'

import type { LogcatEntryMessage } from '@/types/logcat-entry-message.type'

const columnHelper = createColumnHelper<LogcatEntryMessage>()

export const LOGS_COLUMNS = [
  columnHelper.accessor((row) => toSentenceCase(LogPriority[row.priority] || ''), {
    header: () => '',
    id: LogsTableColumnIds.PRIORITY,
    filterFn: logPriorityFilter,
    cell: ({ getValue }) => getValue(),
  }),
  columnHelper.accessor((row) => timestampToTimeString(row.date), {
    header: () => <TextWithTranslation name='Time' />,
    id: LogsTableColumnIds.TIME,
    meta: {
      filterPlaceholder: 'e.g. 12:30',
    },
    filterFn: startsWithFilter,
    cell: ({ getValue }) => getValue(),
  }),
  columnHelper.accessor((row) => row.pid, {
    header: () => <TextWithTranslation name='Pid' />,
    id: LogsTableColumnIds.PID,
    meta: {
      filterPlaceholder: 'e.g. 50',
    },
    filterFn: startsWithFilter,
    cell: ({ getValue }) => getValue(),
  }),
  columnHelper.accessor((row) => row.tid, {
    header: () => <TextWithTranslation name='Tid' />,
    id: LogsTableColumnIds.TID,
    meta: {
      filterPlaceholder: 'e.g. 50',
    },
    filterFn: startsWithFilter,
    cell: ({ getValue }) => getValue(),
  }),
  columnHelper.accessor((row) => row.tag, {
    header: () => <TextWithTranslation name='Tag' />,
    id: LogsTableColumnIds.TAG,
    meta: {
      filterPlaceholder: 'e.g. ResourceType',
    },
    filterFn: startsWithFilter,
    cell: ({ getValue }) => getValue(),
  }),
  columnHelper.accessor((row) => row.message, {
    header: () => <TextWithTranslation name='Text' />,
    id: LogsTableColumnIds.TEXT,
    meta: {
      filterPlaceholder: 'e.g. Error',
    },
    filterFn: 'fuzzy',
    cell: ({ getValue }) => getValue(),
  }),
]
