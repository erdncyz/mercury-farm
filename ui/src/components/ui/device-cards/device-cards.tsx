import { useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { observer } from 'mobx-react-lite'
import { useInjection } from 'inversify-react'
import { Div, Flex, Placeholder, Text, Title } from '@vkontakte/vkui'
import { Icon56AndroidDeviceOutline, Icon56AppleDeviceOutline, Icon56DevicesOutline, Icon56InboxOutline } from '@vkontakte/icons'

import { DeviceStatusCell, NotesCell } from '@/components/ui/device-table/cells'

import { CONTAINER_IDS } from '@/config/inversify/container-ids'
import { deviceTableState } from '@/store/device-table-state'
import { DeviceState } from '@/types/enums/device-state.enum'
import { getDeviceState } from '@/lib/utils/get-device-state.util'
import { dateToFormattedString } from '@/lib/utils/date-to-formatted-string.util'
import { getExpireTime } from '@/lib/utils/get-expire-time.util'
import { resolveTableFilterValue } from '@/lib/utils/resolve-table-filter-value.util'

import type { DeviceListStore } from '@/store/device-list-store'
import type { ListDevice } from '@/types/list-device.type'

import styles from './device-cards.module.css'

type DeviceInfoItemProps = {
  label: string
  value?: string
  children?: ReactNode
}

enum PlatformIcon {
  ANDROID = 'Android',
  IOS = 'iOS',
  TV_OS = 'tvOS',
}

const getPlatformIcon = (platform?: string): ReactNode => {
  switch (platform) {
    case PlatformIcon.ANDROID:
      return <Icon56AndroidDeviceOutline height={20} width={20} />
    case PlatformIcon.IOS:
      return <Icon56AppleDeviceOutline height={20} width={20} />
    case PlatformIcon.TV_OS:
      return <Icon56DevicesOutline height={20} width={20} />
    default:
      return <Icon56DevicesOutline height={20} width={20} />
  }
}

const DeviceInfoItem = ({ label, value, children }: DeviceInfoItemProps) => (
  <div className={styles.infoItem}>
    <Text className={styles.infoLabel}>{label}</Text>
    {!children && <Text className={styles.infoValue}>{value || '—'}</Text>}
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

const getPlatformCardClass = (platform?: string): string => {
  switch (platform) {
    case PlatformIcon.ANDROID:
      return styles.cardAndroid
    case PlatformIcon.IOS:
      return styles.cardIOS
    default:
      return styles.cardDefault
  }
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

const getBookingExpireTime = (device: ListDevice): Date | null => {
  if (!device.bookedAt || !device.bookedBefore || device.bookedBefore <= 1) return null
  return getExpireTime(device.bookedAt, device.bookedBefore)
}

const isBookingActive = (device: ListDevice): boolean => {
  if (!device.owner?.email) return false
  const expireTime = getBookingExpireTime(device)
  if (!expireTime) return false
  return expireTime.getTime() > Date.now()
}

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
      const hasKnownPlatform = isAndroid || isIOS
      const platformEnabled = hasKnownPlatform
        ? (isAndroid && deviceTableState.platformFilters.android) || (isIOS && deviceTableState.platformFilters.ios)
        : true

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
        const marketName = device.marketName || device.product || device.model || device.name || device.serial
        const activeUser = device.using ? device.owner?.name || device.owner?.email || '—' : t('No active user')

        const bookingActive = isBookingActive(device)
        const bookingExpire = getBookingExpireTime(device)
        const bookingText = bookingActive
          ? `${device.owner?.name || device.owner?.email || '—'} → ${dateToFormattedString({ value: bookingExpire!, needTime: true })}`
          : null

        return (
          <article key={device.serial} className={`${styles.card} ${getPlatformCardClass(device.platform)}`}>
            <Flex align='start' className={styles.cardHeader} justify='space-between'>
              <Flex align='center' className={styles.titleRow}>
                <span className={styles.platformIcon}>{getPlatformIcon(device.platform)}</span>
                <Title className={styles.model} level='3'>
                  {marketName}
                </Title>
              </Flex>
              <span className={`${styles.statePill} ${getStatusColorClass(state)}`}>{getStatusLabel(state, t)}</span>
            </Flex>

            <div className={styles.infoGrid}>
              <DeviceInfoItem label={t('Serial')} value={device.serial} />
              <DeviceInfoItem label={t('Who is using')} value={activeUser} />
              {bookingText && <DeviceInfoItem label={t('Booking')} value={bookingText} />}
              <DeviceInfoItem label={t('Operating System')} value={device.version || '—'} />
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
