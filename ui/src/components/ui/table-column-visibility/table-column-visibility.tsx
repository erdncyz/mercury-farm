import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Icon24Filter } from '@vkontakte/icons'
import { Button, Checkbox, Flex, FormItem, FormLayoutGroup } from '@vkontakte/vkui'

import { COLUMN_VISIBILITY_DEFAULT } from '@/components/ui/device-table/constants'
import { DEVICE_COLUMNS } from '@/components/ui/device-table/columns'
import { PopoverContainer } from '@/components/lib/popover-container'

import { deviceTableState } from '@/store/device-table-state'

import styles from './table-column-visibility.module.css'

import type { ArrayType } from '@/types/array-type.type'

const COLUMNS_BY_GROUP = Object.groupBy(DEVICE_COLUMNS, (column) => column.meta?.columnGroup || 'Other')
const FIRST_THREE_COLUMN_GROUPS = Object.entries(COLUMNS_BY_GROUP).slice(0, 3)
const OTHER_COLUMN_GROUPS = Object.entries(COLUMNS_BY_GROUP).slice(3)

type RowsGroupProps = {
  columns: ArrayType<typeof DEVICE_COLUMNS>[]
  groupName: string
}

const RowsGroup = observer(({ columns, groupName }: RowsGroupProps) => {
  const { t } = useTranslation()
  const onCheckboxChange = (id: string) => {
    deviceTableState.setColumnVisibility((prevVisibility) => ({ ...prevVisibility, [id]: !prevVisibility[id] }))
  }

  return (
    <FormLayoutGroup>
      <FormItem className={styles.group} top={t(groupName)}>
        {columns?.map(({ id, meta }) =>
          id && meta?.columnName ? (
            <Checkbox
              key={id}
              checked={deviceTableState.columnVisibility[id]}
              value={id}
              onChange={() => onCheckboxChange(id)}
            >
              {t(meta.columnName)}
            </Checkbox>
          ) : null
        )}
      </FormItem>
    </FormLayoutGroup>
  )
})

export const TableColumnVisibility = observer(() => {
  const { t } = useTranslation()

  const onResetClick = (onClose: () => void) => {
    deviceTableState.setColumnVisibility(COLUMN_VISIBILITY_DEFAULT)

    onClose()
  }

  return (
    <PopoverContainer
      content={(onClose) => (
        <>
          <Flex>
            <div>
              {FIRST_THREE_COLUMN_GROUPS.map(([group, columns]) => (
                <RowsGroup key={group} columns={columns} groupName={group} />
              ))}
            </div>
            <div>
              {OTHER_COLUMN_GROUPS.map(([group, columns]) => (
                <RowsGroup key={group} columns={columns} groupName={group} />
              ))}
            </div>
          </Flex>
          <Button className={styles.resetButton} size='s' onClick={() => onResetClick(onClose)}>
            {t('Reset')}
          </Button>
        </>
      )}
    >
      <Button before={<Icon24Filter />} mode='tertiary' size='m'>
        {t('Customize')}
      </Button>
    </PopoverContainer>
  )
})
