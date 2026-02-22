import { useEffect, useState } from 'react'
import { Flex, Tappable } from '@vkontakte/vkui'
import { Icon16PenOutline } from '@vkontakte/icons'

import { ConditionalRender } from '@/components/lib/conditional-render'

import styles from './editable-text.module.css'

import type { ChangeEvent, FormEvent } from 'react'

export type EditableTextProps = {
  type?: 'text' | 'number'
  initialValue?: string
  value?: string
  onChange?: (value?: string) => void
  validateValue?: (value: string) => string
}

export const EditableText = ({ value, onChange, initialValue, validateValue, type = 'text' }: EditableTextProps) => {
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(initialValue)

  const changeName = () => {
    if (error || editedName === initialValue) {
      setIsEditing(false)
      setEditedName(initialValue)
      setError('')

      return
    }

    onChange?.(editedName)
    setIsEditing(false)
  }

  const onChangeEditedName = (event: ChangeEvent<HTMLInputElement>) => {
    setError('')

    const errorMessage = validateValue?.(event.target.value)

    if (errorMessage) setError(errorMessage)

    setEditedName(event.target.value)
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    changeName()
  }

  useEffect(() => {
    setEditedName(initialValue)
  }, [initialValue])

  return (
    <>
      <ConditionalRender conditions={[!isEditing]}>
        <Tappable
          activeMode='opacity'
          focusVisibleMode='outside'
          hoverMode='opacity'
          onClick={(event) => {
            event.stopPropagation()

            setIsEditing(true)
          }}
        >
          <Flex align='center' className={styles.name}>
            {value}
            <Icon16PenOutline className={styles.editIcon} height={14} width={14} />
          </Flex>
        </Tappable>
      </ConditionalRender>
      <ConditionalRender conditions={[isEditing]}>
        <form onSubmit={onSubmit}>
          <input
            className={styles.input}
            min={0}
            spellCheck={false}
            type={type}
            value={editedName}
            autoFocus
            onBlur={changeName}
            onChange={onChangeEditedName}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.key === 'Escape' && setIsEditing(false)}
          />
          <ConditionalRender conditions={[!!error]}>
            <p className={styles.error}>{error}</p>
          </ConditionalRender>
        </form>
      </ConditionalRender>
    </>
  )
}
