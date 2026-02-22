import cn from 'classnames'
import { NativeSelect } from '@vkontakte/vkui'

import styles from './base-select.module.css'

import type { SelectOption } from './types'

type BaseSelectProps<T> = {
  id?: string
  value: T
  onChange: (value: string) => void
  options: SelectOption<T>[]
  selectType?: 'default' | 'plain' | 'accent'
  stretched?: boolean
  isDisabled?: boolean
}

export const BaseSelect = <T extends string | number | undefined>({
  id,
  value,
  onChange,
  options,
  selectType = 'default',
  stretched = true,
  isDisabled = false,
}: BaseSelectProps<T>) => (
  <NativeSelect
    className={cn({ [styles.compact]: !stretched })}
    disabled={isDisabled}
    id={id}
    selectType={selectType}
    value={value}
    onChange={(event) => {
      onChange(event.target.value)
    }}
  >
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.name}
      </option>
    ))}
  </NativeSelect>
)
