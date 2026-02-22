import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { View, Panel, Group, Header, Flex, Counter } from '@vkontakte/vkui'

import { DeviceCards } from '@/components/ui/device-cards'
import { SearchDevice } from '@/components/ui/search-device'
import { DeviceStatistics } from '@/components/ui/device-statistics'

import { deviceTableState } from '@/store/device-table-state'

import styles from './devices-page.module.css'

export const DevicesPage = observer(() => {
  const { t } = useTranslation()

  return (
    <View activePanel='main'>
      <Panel className={styles.devicesPage} id='main'>
        <DeviceStatistics />
        <Group
          className={styles.devicesGroup}
          header={
            <Header
              id='devicesListCounter'
              indicator={<Counter size='s'>{deviceTableState.filteredDeviceCount}</Counter>}
              size='s'
            >
              {t('Devices')}
            </Header>
          }
        >
          <Flex align='center'>
            <SearchDevice />
          </Flex>
          <DeviceCards />
        </Group>
      </Panel>
    </View>
  )
})
