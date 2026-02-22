import type { Row } from '@tanstack/react-table'

export const startsWithFilter = <T, RowData>(row: Row<RowData>, columnId: string, filterValue: string): boolean => {
  const value = row.getValue<T>(columnId)

  if (typeof value === 'number') {
    return String(value).startsWith(filterValue)
  }

  if (typeof value === 'string') {
    return value.toLowerCase().startsWith(filterValue.toLowerCase())
  }

  return false
}
