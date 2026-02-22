import { Div, Input } from '@vkontakte/vkui'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'

import { deviceTableState } from '@/store/device-table-state'

import styles from './search-device.module.css'

export const SearchDevice = observer(() => {
  const { t } = useTranslation()

  return (
    <Div className={styles.searchDevice}>
      <Input
        className={styles.search}
        placeholder={t('Search device')}
        value={deviceTableState.globalFilter}
        onChange={(event) => deviceTableState.setGlobalFilter(event.target.value)}
      />
    </Div>
  )
})
