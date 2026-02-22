import { memo } from 'react'
import { flexRender, type Row } from '@tanstack/react-table'

import { LogPriority } from '@/types/enums/log-priority.enum'

import styles from './logs-table.module.css'

import type { LogcatEntryMessage } from '@/types/logcat-entry-message.type'

const PRIORITY_COLOR_MAP: Record<LogPriority, string> = {
  [LogPriority.UNKNOWN]: styles.unknown,
  [LogPriority.DEFAULT]: styles.silent,
  [LogPriority.VERBOSE]: styles.verbose,
  [LogPriority.DEBUG]: styles.debug,
  [LogPriority.INFO]: styles.info,
  [LogPriority.WARN]: styles.warn,
  [LogPriority.ERROR]: styles.error,
  [LogPriority.FATAL]: styles.fatal,
  [LogPriority.SILENT]: styles.silent,
}

export const TableRow = memo(({ row }: { row: Row<LogcatEntryMessage> }) => (
  <tr>
    {row.getVisibleCells().map((cell) => (
      <td key={cell.id} className={PRIORITY_COLOR_MAP[row.original.priority]}>
        {flexRender(cell.column.columnDef.cell, cell.getContext())}
      </td>
    ))}
  </tr>
))
