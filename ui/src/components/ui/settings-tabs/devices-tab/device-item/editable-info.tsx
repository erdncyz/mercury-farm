import { Flex } from '@vkontakte/vkui'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'

import { EditableText } from '@/components/lib/editable-text'

import styles from './device-item.module.css'

import type { EditableTextProps } from '@/components/lib/editable-text/editable-text'

type EditableInfoProps = {
  title: string
}

export const EditableInfo = observer(
  ({ title, initialValue, value, type, validateValue, onChange }: EditableInfoProps & EditableTextProps) => {
    const { t } = useTranslation()

    return (
      <Flex align='start'>
        <span className={styles.title}>{title}:</span>
        <EditableText
          initialValue={initialValue}
          type={type}
          validateValue={validateValue}
          value={value || t('No value')}
          onChange={onChange}
        />
      </Flex>
    )
  }
)
