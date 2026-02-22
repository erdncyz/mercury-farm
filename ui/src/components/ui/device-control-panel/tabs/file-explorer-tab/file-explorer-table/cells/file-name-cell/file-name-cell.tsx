import { memo } from 'react'
import { useInjection } from 'inversify-react'
import { EllipsisText, Button } from '@vkontakte/vkui'
import { Icon20DocumentOutline, Icon20FolderFill } from '@vkontakte/icons'

import { CONTAINER_IDS } from '@/config/inversify/container-ids'

import styles from './file-name-cell.module.css'

type FileNameCellProps = {
  name: string
  mode: number
}

export const FileNameCell = memo(({ name, mode }: FileNameCellProps) => {
  const fileExplorerService = useInjection(CONTAINER_IDS.fileExplorerService)

  const isDirectory = fileExplorerService.isDirectory(mode)

  const onButtonClick = () => {
    if (isDirectory) {
      fileExplorerService.addSegment(name)
    }

    if (!isDirectory) {
      fileExplorerService.getFile(name)
    }
  }

  const beforeButtonIcon = isDirectory ? <Icon20FolderFill /> : <Icon20DocumentOutline />

  return (
    <Button align='left' before={beforeButtonIcon} hasHover={false} mode='tertiary' size='s' onClick={onButtonClick}>
      <EllipsisText className={styles.name}>{name}</EllipsisText>
    </Button>
  )
})
