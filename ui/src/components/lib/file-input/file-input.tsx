import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon24Upload } from '@vkontakte/icons'
import { DropZone, Placeholder, VisuallyHidden } from '@vkontakte/vkui'

import styles from './file-input.module.css'

import type { ChangeEvent, DragEvent } from 'react'

type FileInputProps = {
  accept?: string[]
  onError?: (message: string) => void
  onChange?: (file: File) => void
}

export const FileInput = ({ onChange, accept }: FileInputProps) => {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)

  const onDragOver = (event: DragEvent) => {
    event.preventDefault()
  }

  const onChangeWithValidation = (files: FileList) => {
    onChange?.(files[0])
  }

  const onDrop = (event: DragEvent) => {
    event.preventDefault()

    if (inputRef.current) {
      inputRef.current.files = event.dataTransfer.files

      onChangeWithValidation(inputRef.current.files)
    }
  }

  const onFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      onChangeWithValidation(event.target.files)
    }
  }

  const supportedExtensions = accept?.filter((item) => item.startsWith('.')).join(', ')

  return (
    <DropZone
      className={styles.fileInput}
      onClick={() => inputRef.current?.click()}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {({ active }) => (
        <Placeholder.Container>
          <VisuallyHidden
            accept={accept?.join(',')}
            Component='input'
            getRootRef={inputRef}
            type='file'
            onChange={onFileInputChange}
          />
          <Placeholder.Icon>
            <Icon24Upload fill={active ? 'var(--vkui--color_icon_accent)' : undefined} height={56} width={56} />
          </Placeholder.Icon>
          <Placeholder.Title>{t('Drop file to upload')}</Placeholder.Title>
          <Placeholder.Description>{`${t('Supported extensions')}: ${supportedExtensions}`}</Placeholder.Description>
        </Placeholder.Container>
      )}
    </DropZone>
  )
}
