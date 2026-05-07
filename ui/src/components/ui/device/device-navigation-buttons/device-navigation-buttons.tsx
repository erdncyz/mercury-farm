import { Flex } from '@vkontakte/vkui'
import { observer } from 'mobx-react-lite'
import { useInjection } from 'inversify-react'
import { useTranslation } from 'react-i18next'
import { Icon24SquareOutline, Icon28ArrowUturnLeftOutline, Icon28HomeOutline, Icon28Menu } from '@vkontakte/icons'

import { ConditionalRender } from '@/components/lib/conditional-render'

import { CONTAINER_IDS } from '@/config/inversify/container-ids'

import { NavigationButton } from './navigation-button'

import styles from './device-navigation-buttons.module.css'

const OpenAppsIcon = () => (
  <svg aria-hidden='true' height='24' viewBox='0 0 24 24' width='24'>
    <rect fill='none' height='10' rx='2' stroke='currentColor' strokeWidth='2' width='10' x='4' y='7' />
    <rect fill='none' height='10' rx='2' stroke='currentColor' strokeWidth='2' width='10' x='10' y='5' />
  </svg>
)

export const DeviceNavigationButtons = observer(() => {
  const { t } = useTranslation()

  const deviceControlStore = useInjection(CONTAINER_IDS.deviceControlStore)
  const deviceBySerialStore = useInjection(CONTAINER_IDS.deviceBySerialStore)

  const { data: device } = deviceBySerialStore.deviceQueryResult()
  const isIosDevice =
    (device?.platform || '').toLowerCase() === 'ios' ||
    (device?.platform || '').toLowerCase() === 'tvos' ||
    (device?.manufacturer || '').toLowerCase() === 'apple'

  return (
    <Flex align='center' className={styles.deviceNavigationButtons} justify='space-around'>
      <ConditionalRender conditions={[isIosDevice]}>
        <NavigationButton
          beforeIcon={<Icon24SquareOutline />}
          title={`${t('Home')}`}
          onClick={() => {
            deviceControlStore.home()
          }}
        />
        <NavigationButton
          beforeIcon={<OpenAppsIcon />}
          title={`${t('Open apps')}`}
          onClick={() => {
            deviceControlStore.appSwitch()
          }}
        />
      </ConditionalRender>
      <ConditionalRender conditions={[!isIosDevice]}>
        <NavigationButton
          beforeIcon={<Icon28Menu />}
          title={`${t('Menu')}`}
          onClick={() => {
            deviceControlStore.menu()
          }}
        />
        <NavigationButton
          beforeIcon={<Icon28HomeOutline />}
          title={`${t('Home')}`}
          onClick={() => {
            deviceControlStore.home()
          }}
        />
        <NavigationButton
          beforeIcon={<Icon24SquareOutline height={28} width={28} />}
          title={`${t('App switch')}`}
          onClick={() => {
            deviceControlStore.appSwitch()
          }}
        />
        <NavigationButton
          beforeIcon={<Icon28ArrowUturnLeftOutline />}
          title={`${t('Back')}`}
          onClick={() => {
            deviceControlStore.back()
          }}
        />
      </ConditionalRender>
    </Flex>
  )
})
