import { memo } from 'react'
import { useInjection } from 'inversify-react'

import { CONTAINER_IDS } from '@/config/inversify/container-ids'

type FileSizeCellProps = {
  mode: number
  formattedSize: string
}

export const FileSizeCell = memo(({ formattedSize, mode }: FileSizeCellProps) => {
  const fileExplorerService = useInjection(CONTAINER_IDS.fileExplorerService)

  const isDirectory = fileExplorerService.isDirectory(mode)

  return <>{isDirectory ? '--' : formattedSize}</>
})
