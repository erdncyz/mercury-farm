import { useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useInjection } from 'inversify-react'
import { IconButton, Image, Input, SegmentedControl, Tooltip } from '@vkontakte/vkui'
import { Icon20ClearDataOutline, Icon20GlobeOutline, Icon24OpenIn } from '@vkontakte/icons'

import { ContentCard } from '@/components/lib/content-card'

import { CONTAINER_IDS } from '@/config/inversify/container-ids'

import { BROWSER_ICON_MAP } from '@/constants/browser-icon-map'

import styles from './link-opener-control.module.css'

import type { KeyboardEvent } from 'react'
import type { SegmentedControlValue } from '@vkontakte/vkui'

export const LinkOpenerControl = observer(({ className }: { className?: string }) => {
  const { t } = useTranslation()
  const [url, setUrl] = useState('')
  const textInput = useRef<HTMLInputElement>(null)

  const linkOpenerStore = useInjection(CONTAINER_IDS.linkOpenerStore)
  const deviceBySerialStore = useInjection(CONTAINER_IDS.deviceBySerialStore)

  const { data: device } = deviceBySerialStore.deviceQueryResult()

  const onPressEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      linkOpenerStore.openUrl(url)
    }
  }

  const onBrowserChange = (value: SegmentedControlValue) => {
    if (typeof value === 'string') linkOpenerStore.setCurrentBrowserId(value)

    textInput.current?.focus()
  }

  return (
    <ContentCard
      afterButtonIcon={<Icon20ClearDataOutline />}
      afterTooltipText={t('Reset all browser settings')}
      before={<Icon20GlobeOutline />}
      className={className}
      title={t('Open link or deeplink')}
      onAfterButtonClick={() => linkOpenerStore.clearBrowser()}
    >
      <Input
        getRef={textInput}
        placeholder='https://vk.com'
        value={url}
        after={
          <Tooltip appearance='accent' description={t('Open')} placement='top'>
            <IconButton disabled={!url} label='open browser link' onClick={() => linkOpenerStore.openUrl(url)}>
              <Icon24OpenIn />
            </IconButton>
          </Tooltip>
        }
        onChange={(event) => setUrl(event.target.value)}
        onKeyDown={onPressEnter}
      />
      {device?.browser?.apps?.length && (
        <SegmentedControl
          className={styles.browserList}
          value={linkOpenerStore.currentBrowserId}
          options={device.browser.apps.map(({ id, type, name }) => ({
            label: <Image alt={name} size={20} src={type && BROWSER_ICON_MAP[type]} title={type} noBorder />,
            value: id,
            ['aria-label']: name,
          }))}
          onChange={onBrowserChange}
        />
      )}
    </ContentCard>
  )
})
