import { observer } from 'mobx-react-lite'
import { useWindowVirtualizer } from '@tanstack/react-virtual'

import { deviceTableState } from '@/store/device-table-state'

import { ROW_HEIGHT } from './constants'

import { TableRow } from './table-row'

import type { Row } from '@tanstack/react-table'
import type { DeviceState } from '@/types/enums/device-state.enum'
import type { DeviceTableRow } from '@/types/device-table-row.type'

type TableBodyProps = {
  rows: Row<DeviceTableRow>[]
  isDataLoaded: boolean
}

export const TableBody = observer(({ rows, isDataLoaded }: TableBodyProps) => {
  const virtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
    scrollMargin: 0,
  })

  return (
    <tbody>
      {virtualizer.getVirtualItems().map((virtualRow, index) => {
        const row = rows[virtualRow.index]
        const deviceState = row.getValue<DeviceState>('state')
        const needUpdate = row.original.needUpdate

        return (
          <TableRow
            key={row.id}
            cells={row.getVisibleCells()}
            columnVisibility={deviceTableState.columnVisibility}
            deviceState={deviceState}
            isDataLoaded={isDataLoaded}
            needUpdate={needUpdate}
            rowSize={virtualRow.size}
            transformValue={virtualRow.start - index * virtualRow.size}
          />
        )
      })}
    </tbody>
  )
})
