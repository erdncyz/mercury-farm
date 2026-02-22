import { Outlet } from 'react-router'
import cn from 'classnames'
import { observer } from 'mobx-react-lite'
import { useInjection } from 'inversify-react'

import { Header } from '@/components/ui/header'
import { AlertMarquee } from '@/components/ui/alert-marquee'

import { CONTAINER_IDS } from '@/config/inversify/container-ids'

import styles from './main-layout.module.css'

export const MainLayout = observer(() => {
  const settingsService = useInjection(CONTAINER_IDS.settingsService)

  return (
    <div className={styles.appShell}>
      <div className={styles.aurora} />
      <Header />
      <AlertMarquee />
      <main className={cn('pageWrapper', styles.content, { marqueeOffset: settingsService.isAlertMessageActive })}>
        <Outlet />
      </main>
    </div>
  )
})
