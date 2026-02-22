import { memo } from 'react'
import { flexRender } from '@tanstack/react-table'

import type { Row } from '@tanstack/react-table'
import type { FSListMessage } from '@/types/fs-list-message.type'

export const TableRow = memo(({ row }: { row: Row<FSListMessage> }) => (
  <tr>
    {row.getVisibleCells().map((cell) => (
      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
    ))}
  </tr>
))
