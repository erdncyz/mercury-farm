import { createColumnHelper } from '@tanstack/react-table'

import { TextWithTranslation } from '@/components/lib/text-with-translation'

import { formatFileSize } from '@/lib/utils/format-file-size.util'
import { dateToFormattedString } from '@/lib/utils/date-to-formatted-string.util'
import { formatPermissionMode } from '@/lib/utils/format-permission-mode.util'

import { FileNameCell } from './cells/file-name-cell/file-name-cell'
import { FileSizeCell } from './cells/file-size-cell'
import { FileExplorerTableColumnIds } from './types'

import type { FSListMessage } from '@/types/fs-list-message.type'

const columnHelper = createColumnHelper<FSListMessage>()

export const FILE_EXPLORER_COLUMNS = [
  columnHelper.accessor((row) => row.name, {
    header: () => <TextWithTranslation name='Name' />,
    id: FileExplorerTableColumnIds.NAME,
    cell: ({ getValue, row }) => <FileNameCell mode={row.original.mode} name={getValue()} />,
  }),
  columnHelper.accessor((row) => formatFileSize(row.size), {
    header: () => <TextWithTranslation name='Size' />,
    id: FileExplorerTableColumnIds.SIZE,
    cell: ({ getValue, row }) => <FileSizeCell formattedSize={getValue()} mode={row.original.mode} />,
  }),
  columnHelper.accessor((row) => dateToFormattedString({ value: row.mtime, needTime: true }), {
    header: () => <TextWithTranslation name='Date' />,
    id: FileExplorerTableColumnIds.DATE,
    cell: ({ getValue }) => getValue(),
  }),
  columnHelper.accessor((row) => formatPermissionMode(row.mode), {
    header: () => <TextWithTranslation name='Permissions' />,
    id: FileExplorerTableColumnIds.PERMISSIONS,
    cell: ({ getValue }) => getValue(),
  }),
]
