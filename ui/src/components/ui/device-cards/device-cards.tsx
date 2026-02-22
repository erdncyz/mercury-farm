import { useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { observer } from 'mobx-react-lite'
import { useInjection } from 'inversify-react'
import { Div, Flex, Placeholder, Text, Title } from '@vkontakte/vkui'
import { Icon56InboxOutline } from '@vkontakte/icons'

import { BrowserCell, DeviceStatusCell, NotesCell } from '@/components/ui/device-table/cells'

import { CONTAINER_IDS } from '@/config/inversify/container-ids'
import { deviceTableState } from '@/store/device-table-state'
import { DeviceState } from '@/types/enums/device-state.enum'
import { getDeviceState } from '@/lib/utils/get-device-state.util'
import { dateToFormattedString } from '@/lib/utils/date-to-formatted-string.util'
import { getExpireTime } from '@/lib/utils/get-expire-time.util'
import { resolveTableFilterValue } from '@/lib/utils/resolve-table-filter-value.util'
import { deviceServiceToString } from '@/lib/utils/device-service-to-string.util'

import type { DeviceListStore } from '@/store/device-list-store'
import type { ListDevice } from '@/types/list-device.type'

import styles from './device-cards.module.css'

type DeviceInfoItemProps = {
  label: string
  value?: string
  children?: ReactNode
}

const DeviceInfoItem = ({ label, value, children }: DeviceInfoItemProps) => (
  <div className={styles.infoItem}>
    <Text className={styles.infoLabel}>{label}</Text>
    <Text className={styles.infoValue}>{value || '—'}</Text>
    {children}
  </div>
)

const getStatusLabel = (state: DeviceState, t: (name: string) => string): string => {
  const labels: Record<DeviceState, string> = {
    [DeviceState.ABSENT]: t('Disconnected'),
    [DeviceState.OFFLINE]: t('Offline'),
    [DeviceState.UNAUTHORIZED]: t('Unauthorized'),
    [DeviceState.PREPARING]: t('Preparing'),
    [DeviceState.BUSY]: t('Busy'),
    [DeviceState.AVAILABLE]: t('Available'),
    [DeviceState.USING]: t('Using'),
    [DeviceState.AUTOMATION]: t('Automation'),
    [DeviceState.PRESENT]: t('Connected'),
    [DeviceState.UNHEALTHY]: t('Unhealthy'),
  }

  return labels[state]
}

const getStatusColorClass = (state: DeviceState): string => {
  const stateClassMap: Record<DeviceState, string> = {
    [DeviceState.AVAILABLE]: styles.stateAvailable,
    [DeviceState.PREPARING]: styles.statePreparing,
    [DeviceState.BUSY]: styles.stateBusy,
    [DeviceState.USING]: styles.stateBusy,
    [DeviceState.AUTOMATION]: styles.stateBusy,
    [DeviceState.PRESENT]: styles.stateNeutral,
    [DeviceState.UNHEALTHY]: styles.stateDanger,
    [DeviceState.OFFLINE]: styles.stateDanger,
    [DeviceState.UNAUTHORIZED]: styles.stateDanger,
    [DeviceState.ABSENT]: styles.stateNeutral,
  }

  return stateClassMap[state]
}

const getSearchableText = (device: ListDevice): string =>
  [
    device.name,
    device.model,
    device.serial,
    device.manufacturer,
    device.platform,
    device.marketName,
    device.product,
    device.version,
    device.sdk,
    device.notes,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

export const DeviceCards = observer(() => {
  const { t } = useTranslation()
  const deviceListStore = useInjection<DeviceListStore>(CONTAINER_IDS.deviceListStore)
  const { devicesQueryResult } = deviceListStore

  const filteredDevices = useMemo(() => {
    const { globalFilter } = resolveTableFilterValue(deviceTableState.globalFilter)
    const normalizedFilter = globalFilter.trim().toLowerCase()

    return deviceListStore.visibleDevices.filter((item) => {
      const isAndroid = item.platform === 'Android'
      const isIOS = item.platform === 'iOS'
      const platformEnabled =
        (isAndroid && deviceTableState.platformFilters.android) || (isIOS && deviceTableState.platformFilters.ios)

      if (!platformEnabled) return false
      if (!normalizedFilter) return true

      return getSearchableText(item).includes(normalizedFilter)
    })
  }, [
    deviceListStore.visibleDevices,
    deviceTableState.globalFilter,
    deviceTableState.platformFilters.android,
    deviceTableState.platformFilters.ios,
  ])

  useEffect(() => {
    deviceTableState.setFilteredDeviceCount(filteredDevices.length)
  }, [filteredDevices.length])

  if (devicesQueryResult.isSuccess && filteredDevices.length === 0) {
    return (
      <Placeholder icon={<Icon56InboxOutline />} className={styles.placeholder}>
        {t('No devices connected')}
      </Placeholder>
    )
  }

  return (
    <Div className={styles.grid}>
      {filteredDevices.map((device) => {
        const state = getDeviceState(device)
        const bookedBeforeDate =
          device.statusChangedAt && device.bookedBefore
            ? dateToFormattedString({ value: getExpireTime(device.statusChangedAt, device.bookedBefore), needTime: true })
            : t('Not booked')

        return (
          <article key={device.serial} className={styles.card}>
            <Flex align='start' className={styles.cardHeader} justify='space-between'>
              <div>
                <Title className={styles.model} level='3'>
                  {device.name || device.model || device.serial}
                </Title>
                <Text className={styles.subtitle}>
                  {device.manufacturer || '—'} · {device.platform || '—'}
                </Text>
              </div>
              <span className={`${styles.statePill} ${getStatusColorClass(state)}`}>{getStatusLabel(state, t)}</span>
            </Flex>

            <div className={styles.infoGrid}>
              <DeviceInfoItem label={t('Serial')} value={device.serial} />
              <DeviceInfoItem label={t('Market Name')} value={device.marketName || device.product || device.model} />
              <DeviceInfoItem label={t('Operating System')} value={device.version || '—'} />
              <DeviceInfoItem label='SDK' value={device.sdk || '—'} />
              <DeviceInfoItem label={t('Mobile Service')} value={deviceServiceToString(device.service) || '—'} />
              <DeviceInfoItem label={t('Browser')}>
                <BrowserCell apps={device.browser?.apps} />
              </DeviceInfoItem>
              <DeviceInfoItem label={t('Previously booked')} value={bookedBeforeDate} />
              <DeviceInfoItem label={t('Notes')}>
                <NotesCell notes={device.notes} serial={device.serial} />
              </DeviceInfoItem>
            </div>

            <div className={styles.actionRow}>
              <DeviceStatusCell channel={device.channel} deviceState={state} serial={device.serial} />
            </div>
          </article>
        )
      })}
    </Div>
  )
})
