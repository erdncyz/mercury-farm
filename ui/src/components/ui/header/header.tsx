import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import cn from 'classnames'
import { useTranslation } from 'react-i18next'
import { Button, Tappable, Text } from '@vkontakte/vkui'
import {
  Icon16DoorEnterArrowRightOutline,
  Icon16HelpOutline,
  Icon16MailOutline,
  Icon28DevicesOutline,
  Icon28SettingsOutline,
  Icon56WebDeviceOutline,
} from '@vkontakte/icons'

import { ConditionalRender } from '@/components/lib/conditional-render'
import { DynamicLogo } from '@/components/lib/dynamic-logo'
import { WarningModal } from '@/components/ui/modals'

import { getAuthRoute, getDevicesRoute, getMainRoute, getSettingsRoute } from '@/constants/route-paths'

import { useGetAdditionalUrl } from '@/lib/hooks/use-get-additional-url.hook'
import { useGetAuthContact } from '@/lib/hooks/use-get-auth-contact.hook'
import { useGetAuthDocs } from '@/lib/hooks/use-get-auth-docs.hook'
import { useGetAuthUrl } from '@/lib/hooks/use-get-auth-url.hook'
import { authStore } from '@/store/auth-store'

import styles from './header.module.css'

export const Header = () => {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const { data: authUrl } = useGetAuthUrl()
  const { data: authDocs } = useGetAuthDocs()
  const { data: additionalUrl } = useGetAdditionalUrl()
  const { data: authContact } = useGetAuthContact()
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)

  const onLogout = () => {
    if (authUrl?.includes('openid')) {
      setIsConfirmationOpen(true)
      return
    }

    authStore.logout()
    window.location.assign(getAuthRoute())
  }

  return (
    <header className={styles.header} id='mainPageHeader'>
      <div className={styles.leftSide}>
        <Link className={styles.logoLink} to={getMainRoute()}>
          <Tappable activeMode='opacity' focusVisibleMode='outside' hoverMode='opacity'>
            <DynamicLogo className={styles.logo} height={34} width={132} />
          </Tappable>
        </Link>
        <div className={styles.brandMeta}>
          <Text className={styles.brandTitle}>{t('Mercury Device Farm')}</Text>
          <Text className={styles.brandSubtitle}>{t('Realtime control center')}</Text>
        </div>
      </div>

      <nav className={styles.navRail}>
        <ConditionalRender conditions={[!!additionalUrl?.length]}>
          <Link className={cn(styles.navPill, { [styles.activePill]: pathname === additionalUrl })} to={additionalUrl || ''}>
            <Icon56WebDeviceOutline height={18} width={18} />
            <span>{t('Browsers')}</span>
          </Link>
        </ConditionalRender>
        <Link className={cn(styles.navPill, { [styles.activePill]: pathname === getDevicesRoute() })} to={getDevicesRoute()}>
          <Icon28DevicesOutline height={18} width={18} />
          <span>{t('Devices')}</span>
        </Link>
        <Link className={cn(styles.navPill, { [styles.activePill]: pathname.startsWith(getSettingsRoute()) })} to={getSettingsRoute()}>
          <Icon28SettingsOutline height={18} width={18} />
          <span>{t('Settings')}</span>
        </Link>
      </nav>

      <div className={styles.rightSide}>
        <Button
          className={styles.actionButton}
          before={<Icon16MailOutline />}
          Component='a'
          disabled={!authContact}
          href={authContact}
          mode='tertiary'
          size='m'
          target='_blank'
        >
          {t('Support')}
        </Button>
        <Button
          className={styles.actionButton}
          before={<Icon16HelpOutline />}
          Component='a'
          disabled={!authDocs}
          href={authDocs}
          mode='tertiary'
          size='m'
          target='_blank'
        >
          {t('Help')}
        </Button>
        <Button className={styles.logoutButton} before={<Icon16DoorEnterArrowRightOutline />} mode='tertiary' size='m' onClick={onLogout}>
          {t('Logout')}
        </Button>
      </div>

      <WarningModal
        description={t('You are authenticated via an automatic login method')}
        isCancelShown={false}
        isOpen={isConfirmationOpen}
        title={t('Warning')}
        onClose={() => setIsConfirmationOpen(false)}
        onOk={async () => {
          window.location.assign(getMainRoute())
        }}
      />
    </header>
  )
}
