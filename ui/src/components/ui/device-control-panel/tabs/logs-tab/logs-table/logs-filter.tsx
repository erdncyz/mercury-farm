import { Input } from '@vkontakte/vkui'
import { observer } from 'mobx-react-lite'

import { BaseSelect } from '@/components/lib/base-select'
import { ConditionalRender } from '@/components/lib/conditional-render'

import { LogPriority } from '@/types/enums/log-priority.enum'

import { LogsTableColumnIds } from './types'

import styles from './logs-table.module.css'

import type { Column } from '@tanstack/react-table'
import type { SelectOption } from '@/components/lib/base-select'
import type { LogcatEntryMessage } from '@/types/logcat-entry-message.type'

const PRIORITY_OPTIONS: SelectOption<LogPriority>[] = [
  { name: 'Verbose', value: LogPriority.VERBOSE },
  { name: 'Debug', value: LogPriority.DEBUG },
  { name: 'Info', value: LogPriority.INFO },
  { name: 'Warn', value: LogPriority.WARN },
  { name: 'Error', value: LogPriority.ERROR },
  { name: 'Fatal', value: LogPriority.FATAL },
]

export const LogsFilter = observer(({ column }: { column: Column<LogcatEntryMessage, unknown> }) => {
  const columnFilterValue = column.getFilterValue()
  const { filterPlaceholder } = column.columnDef.meta || {}

  return (
    <>
      <ConditionalRender conditions={[column.id !== LogsTableColumnIds.PRIORITY]}>
        <Input
          align='center'
          className={styles.filter}
          mode='plain'
          placeholder={filterPlaceholder}
          type={column.id === LogsTableColumnIds.PID || column.id === LogsTableColumnIds.TID ? 'number' : 'text'}
          value={columnFilterValue as string}
          onChange={(event) => {
            column.setFilterValue(event.target.value)
          }}
        />
      </ConditionalRender>
      <ConditionalRender conditions={[column.id === LogsTableColumnIds.PRIORITY]}>
        <BaseSelect
          options={PRIORITY_OPTIONS}
          selectType='plain'
          value={columnFilterValue as LogPriority}
          onChange={(value: string) => {
            column.setFilterValue(Number(value))
          }}
        />
      </ConditionalRender>
    </>
  )
})
