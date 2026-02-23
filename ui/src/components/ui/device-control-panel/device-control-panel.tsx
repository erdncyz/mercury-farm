import { useMemo } from 'react'
import { useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Panel, View } from '@vkontakte/vkui'
import {
  Icon20HomeOutline,
  Icon24InfoCircleOutline,
} from '@vkontakte/icons'

import { TabsPanel } from '@/components/lib/tabs-panel'

import {
  getControlRoute,
  getControlInfoRoute,
} from '@/constants/route-paths'

import { InfoTab } from './tabs/info-tab'
import { DashboardTab } from './tabs/dashboard-tab'

import styles from './device-control-panel.module.css'

import type { TabsContent } from '@/components/lib/tabs-panel'

export const DeviceControlPanel = () => {
  const { t } = useTranslation()
  const { serial = '' } = useParams()

  const tabsContent = useMemo<TabsContent[]>(
    () => [
      {
        id: getControlRoute(serial),
        title: t('Dashboard'),
        before: <Icon20HomeOutline height={17} width={17} />,
        ariaControls: 'tab-content-dashboard',
        content: <DashboardTab />,
      },
      {
        id: getControlInfoRoute(serial),
        title: t('Info'),
        before: <Icon24InfoCircleOutline height={17} width={17} />,
        ariaControls: 'tab-content-info',
        content: <InfoTab />,
      },
    ],
    [t, serial]
  )

  return (
    <View activePanel='control'>
      <Panel className={styles.deviceControlPanel} id='control'>
        <TabsPanel content={tabsContent} routeSync />
      </Panel>
    </View>
  )
}
