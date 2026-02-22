import { useMemo } from 'react'
import cn from 'classnames'
import { observer } from 'mobx-react-lite'
import { useInjection } from 'inversify-react'
import { useTranslation } from 'react-i18next'
import { Placeholder, Skeleton } from '@vkontakte/vkui'
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'

import { ConditionalRender } from '@/components/lib/conditional-render'

import { CONTAINER_IDS } from '@/config/inversify/container-ids'

import { TableRow } from './table-row'
import { FILE_EXPLORER_COLUMNS } from './columns'

import styles from './file-explorer-table.module.css'

import type { FSListMessage } from '@/types/fs-list-message.type'

export const FileExplorerTable = observer(() => {
  const { t } = useTranslation()

  const fileExplorerService = useInjection(CONTAINER_IDS.fileExplorerService)

  const displayData = useMemo<FSListMessage[]>(
    () => (fileExplorerService.isDirectoryLoading ? Array(10).fill({}) : fileExplorerService.sortedFsList),
    [fileExplorerService.isDirectoryLoading, fileExplorerService.sortedFsList]
  )
  const tableColumns = useMemo(
    () =>
      fileExplorerService.isDirectoryLoading
        ? FILE_EXPLORER_COLUMNS.map((column) => ({
            ...column,
            cell: () => <Skeleton height='100%' width='100%' />,
          }))
        : FILE_EXPLORER_COLUMNS,
    [fileExplorerService.isDirectoryLoading, fileExplorerService.sortedFsList]
  )

  const table = useReactTable({
    data: displayData,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <colgroup>
          <col className={styles.name} />
          <col className={styles.size} />
          <col className={styles.date} />
          <col className={styles.permissions} />
        </colgroup>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className={cn({ [styles.stripedRows]: !fileExplorerService.isDirectoryLoading })}>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} row={row} />
          ))}
        </tbody>
      </table>
      <ConditionalRender conditions={[fileExplorerService.isFsListEmpty && !fileExplorerService.isDirectoryLoading]}>
        <Placeholder className={styles.placeholder}>{t('Empty')}</Placeholder>
      </ConditionalRender>
    </div>
  )
})
