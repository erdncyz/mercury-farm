import { useInjection } from 'inversify-react'
import { useTranslation } from 'react-i18next'
import { Group } from '@vkontakte/vkui'
import {
  Icon24MemoryCard,
  Icon16WifiOutline,
  Icon20FlashOutline,
  Icon20CoinsOutline,
  Icon20LocationOutline,
  Icon20SmartphoneOutline,
  Icon20LocationMapOutline,
  Icon28SpeedometerMaxOutline,
  Icon28SmartphoneStarsOutline,
  Icon20ComputerSmartphoneOutline,
} from '@vkontakte/icons'
import { observer } from 'mobx-react-lite'

import { InfoBlock } from '@/components/lib/info-block'
import { ProgressBar } from '@/components/lib/progress-bar'
import { ContentCard } from '@/components/lib/content-card'

import { humanizedBool } from '@/lib/utils/humanized-bool.util'
import { CONTAINER_IDS } from '@/config/inversify/container-ids'
import { ScreenDensity } from '@/types/enums/screen-density.enum'
import { getBatteryLevel } from '@/lib/utils/get-battery-level.util'
import { isBooleanTypeGuard } from '@/lib/utils/is-boolean-type-guard.util'
import { dateToFormattedString } from '@/lib/utils/date-to-formatted-string.util'

import { NETWORK_TYPE_MAP } from '@/constants/network-type-map'
import { POWER_SOURCE_MAP } from '@/constants/power-source-map'
import { BATTERY_HEALTH_MAP } from '@/constants/battery-health-map'
import { BATTERY_STATUS_MAP } from '@/constants/battery-status-map'
import { NETWORK_SUB_TYPE_MAP } from '@/constants/network-sub-type-map'

import styles from './info-tab.module.css'

export const InfoTab = observer(() => {
  const { t } = useTranslation()

  const infoService = useInjection(CONTAINER_IDS.infoService)
  const deviceBySerialStore = useInjection(CONTAINER_IDS.deviceBySerialStore)

  const { data: device } = deviceBySerialStore.deviceQueryResult()

  return (
    <div className={styles.infoTabContainer}>
      <div className={styles.infoTab}>
        <ContentCard
          afterButtonIcon={<Icon20LocationMapOutline />}
          afterTooltipText={t('Find Device')}
          before={<Icon20LocationOutline color='#FF5287' />}
          className={styles.physicalDevice}
          title={t('Physical Device')}
          separator
          onAfterButtonClick={() => infoService.findDevice()}
        >
          <Group mode='plain'>
            <InfoBlock title={t('Place')}>{device?.provider?.name}</InfoBlock>
          </Group>
        </ContentCard>
        <ContentCard
          before={<Icon20FlashOutline color='#FFCC00' />}
          className={styles.battery}
          title={t('Battery')}
          separator
        >
          <Group mode='plain'>
            <InfoBlock title={t('Health')}>
              {device?.battery?.health && t(BATTERY_HEALTH_MAP[device.battery.health])}
            </InfoBlock>
            <InfoBlock title={t('Power Source')}>
              {device?.battery?.source && t(POWER_SOURCE_MAP[device.battery.source])}
            </InfoBlock>
            <InfoBlock title={t('Status')}>
              {device?.battery?.status && t(BATTERY_STATUS_MAP[device.battery.status])}
            </InfoBlock>
            <InfoBlock title={t('Level')}>
              <ProgressBar
                value={
                  typeof device?.battery?.level === 'number' && typeof device?.battery?.scale === 'number'
                    ? getBatteryLevel(device.battery.level, device.battery.scale)
                    : 0
                }
              />
            </InfoBlock>
            <InfoBlock title={t('Temperature')} unit='°C'>
              {device?.battery?.temp}
            </InfoBlock>
            <InfoBlock title={t('Voltage')} unit='V'>
              {device?.battery?.voltage}
            </InfoBlock>
          </Group>
        </ContentCard>
        <ContentCard
          before={<Icon20SmartphoneOutline color='#1fb3b8' />}
          className={styles.display}
          title={t('Display')}
          separator
        >
          <Group mode='plain'>
            <InfoBlock title={t('Size')} unit='″'>
              {device?.display?.inches}
            </InfoBlock>
            <InfoBlock title={t('Density')}>
              {device?.display?.density && ScreenDensity[device.display.density]}
            </InfoBlock>
            <InfoBlock title='FPS'>{device?.display?.fps}</InfoBlock>
            <InfoBlock title={t('Width')} unit='px'>
              {device?.display?.width}
            </InfoBlock>
            <InfoBlock title={t('Height')} unit='px'>
              {device?.display?.height}
            </InfoBlock>
            <InfoBlock title='ID'>{device?.display?.id}</InfoBlock>
            <InfoBlock title={t('Orientation')} unit='°'>
              {device?.display?.rotation}
            </InfoBlock>
            <InfoBlock title={t('Encrypted')}>
              {isBooleanTypeGuard(device?.display?.secure) && t(humanizedBool(device.display.secure))}
            </InfoBlock>
            <InfoBlock title='X DPI'>{device?.display?.xdpi}</InfoBlock>
            <InfoBlock title='Y DPI'>{device?.display?.ydpi}</InfoBlock>
          </Group>
        </ContentCard>
        <ContentCard
          before={<Icon16WifiOutline color='#0C7AFF' height={20} width={20} />}
          className={styles.network}
          title={t('Network')}
          separator
        >
          <Group mode='plain'>
            <InfoBlock title={t('Connected')}>
              {isBooleanTypeGuard(device?.network?.connected) && t(humanizedBool(device.network.connected))}
            </InfoBlock>
            <InfoBlock title={t('Airplane Mode')}>
              {isBooleanTypeGuard(device?.airplaneMode) && t(humanizedBool(device.airplaneMode))}
            </InfoBlock>
            <InfoBlock title={t('Using Fallback')}>
              {isBooleanTypeGuard(device?.network?.failover) && t(humanizedBool(device.network.failover))}
            </InfoBlock>
            <InfoBlock title={t('Roaming')}>
              {isBooleanTypeGuard(device?.network?.roaming) && t(humanizedBool(device.network.roaming))}
            </InfoBlock>
            <InfoBlock title={t('Type')}>{device?.network?.type && NETWORK_TYPE_MAP[device.network.type]}</InfoBlock>
            <InfoBlock title={t('Sub Type')}>
              {device?.network?.subtype && NETWORK_SUB_TYPE_MAP[device.network.subtype]}
            </InfoBlock>
          </Group>
        </ContentCard>
        <ContentCard
          before={<Icon28SmartphoneStarsOutline color='#ca9ce1' height={20} width={20} />}
          className={styles.hardware}
          title={t('Hardware')}
          separator
        >
          <Group mode='plain'>
            <InfoBlock title={t('Manufacturer')}>{device?.manufacturer}</InfoBlock>
            <InfoBlock title={t('Product')}>{device?.name}</InfoBlock>
            <InfoBlock title={t('Model')}>{device?.model}</InfoBlock>
            <InfoBlock title={t('Serial')}>{device?.serial}</InfoBlock>
            <InfoBlock title={t('Released')}>
              {device?.releasedAt && dateToFormattedString({ value: device.releasedAt, needTime: true })}
            </InfoBlock>
          </Group>
        </ContentCard>
        <ContentCard
          before={<Icon24MemoryCard color='#9ac4f8' height={20} width={20} />}
          className={styles.sim}
          title={t('SIM')}
          separator
        >
          <Group mode='plain'>
            <InfoBlock title={t('Carrier')}>{device?.operator}</InfoBlock>
            <InfoBlock title={t('Network')}>{device?.phone?.network}</InfoBlock>
            <InfoBlock title={t('Number')}>{device?.phone?.phoneNumber}</InfoBlock>
            <InfoBlock title='IMEI'>{device?.phone?.imei}</InfoBlock>
            <InfoBlock title='IMSI'>{device?.phone?.imsi}</InfoBlock>
            <InfoBlock title='ICCID'>{device?.phone?.iccid}</InfoBlock>
          </Group>
        </ContentCard>
        <ContentCard
          before={<Icon20CoinsOutline color='#FFA101' />}
          className={styles.memory}
          title={t('Memory')}
          separator
        >
          <Group mode='plain'>
            <InfoBlock title='RAM' unit='MB'>
              {device?.memory?.ram}
            </InfoBlock>
            <InfoBlock title='ROM' unit='MB'>
              {device?.memory?.rom}
            </InfoBlock>
            <InfoBlock title={t('SD Card Mounted')}>
              {isBooleanTypeGuard(infoService.sdCardMounted) && t(humanizedBool(infoService.sdCardMounted))}
            </InfoBlock>
          </Group>
        </ContentCard>
        <ContentCard
          before={<Icon20ComputerSmartphoneOutline color='#00cc66' />}
          className={styles.platform}
          title={t('Platform')}
          separator
        >
          <Group mode='plain'>
            <InfoBlock title={t('OS')}>{device?.platform}</InfoBlock>
            <InfoBlock title={t('Version')}>{device?.version}</InfoBlock>
            <InfoBlock title='SDK'>{device?.sdk}</InfoBlock>
            <InfoBlock title='ABI'>{device?.abi}</InfoBlock>
          </Group>
        </ContentCard>
        <ContentCard
          before={<Icon28SpeedometerMaxOutline color='#f24236' height={20} width={20} />}
          className={styles.cpu}
          title='CPU'
          separator
        >
          <Group mode='plain'>
            <InfoBlock title={t('Name')}>{device?.cpu?.name}</InfoBlock>
            <InfoBlock title={t('Cores')}>{device?.cpu?.cores}</InfoBlock>
            <InfoBlock title={t('Frequency')} unit='GHz'>
              {device?.cpu?.freq}
            </InfoBlock>
          </Group>
        </ContentCard>
      </div>
    </div>
  )
})
