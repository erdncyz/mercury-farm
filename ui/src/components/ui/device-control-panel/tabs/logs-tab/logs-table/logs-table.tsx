import { useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { Placeholder } from '@vkontakte/vkui'
import { useInjection } from 'inversify-react'
import { useTranslation } from 'react-i18next'
import { Icon28HourglassOutline, Icon28InboxOutline, Icon28RectrangleHandPointUp } from '@vkontakte/icons'
import { flexRender, getCoreRowModel, getFilteredRowModel, useReactTable } from '@tanstack/react-table'

import { fuzzyFilter } from '@/components/ui/device-table/helpers'
import { ConditionalRender } from '@/components/lib/conditional-render'

import { logsTableState } from '@/store/logs-table-state'
import { CONTAINER_IDS } from '@/config/inversify/container-ids'
import { useAutoScroll } from '@/lib/hooks/use-auto-scroll.hook'

import { LogsFilter } from './logs-filter'
import { LOGS_COLUMNS } from './columns'
import { TableRow } from './table-row'

import styles from './logs-table.module.css'

export const LogsTable = observer(() => {
  const endOfLogsRef = useRef<HTMLTableRowElement>(null)
  const { t } = useTranslation()

  const logcatService = useInjection(CONTAINER_IDS.logcatService)

  useAutoScroll(endOfLogsRef)

  const table = useReactTable({
    data: logcatService.visibleLogs,
    columns: LOGS_COLUMNS,
    state: {
      columnFilters: logsTableState.columnFilters,
      globalFilter: logsTableState.globalFilter,
    },
    onColumnFiltersChange: logsTableState.setColumnFilters,
    onGlobalFilterChange: logsTableState.setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    getCoreRowModel: getCoreRowModel(),
    globalFilterFn: 'fuzzy',
    filterFns: {
      fuzzy: fuzzyFilter,
    },
  })

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <colgroup>
          <col className={styles.logcatLevel} />
          <col className={styles.time} />
          <col className={styles.pid} />
          <col className={styles.tid} />
          <col className={styles.tag} />
          <col className={styles.text} />
        </colgroup>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getCanFilter() ? <LogsFilter column={header.column} /> : null}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} row={row} />
          ))}
          <tr ref={endOfLogsRef} />
        </tbody>
      </table>
      <ConditionalRender conditions={[logcatService.isLogsEmpty && logcatService.isLogcatStarted]}>
        <Placeholder className={styles.placeholder} icon={<Icon28HourglassOutline />}>
          {t('Waiting for logs')}
        </Placeholder>
      </ConditionalRender>
      <ConditionalRender conditions={[logcatService.isLogsEmpty && !logcatService.isLogcatStarted]}>
        <Placeholder className={styles.placeholder} icon={<Icon28RectrangleHandPointUp />}>
          {t('Click the start button')}
        </Placeholder>
      </ConditionalRender>
      <ConditionalRender conditions={[!logcatService.isLogsEmpty && table.getRowModel().rows.length === 0]}>
        <Placeholder className={styles.placeholder} icon={<Icon28InboxOutline />}>
          {t('Empty')}
        </Placeholder>
      </ConditionalRender>
    </div>
  )
})
