import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useInjection } from 'inversify-react'
import { Icon20CopyOutline } from '@vkontakte/icons'

import { OutputField } from '@/components/lib/output-field'
import { ContentCard } from '@/components/lib/content-card'

import { CONTAINER_IDS } from '@/config/inversify/container-ids'

export const ClipboardControl = observer(({ className }: { className?: string }) => {
  const { t } = useTranslation()
  const [clipboardContent, setClipboardContent] = useState('')

  const deviceControlStore = useInjection(CONTAINER_IDS.deviceControlStore)

  const onGetClipboardContent = async () => {
    const data = await deviceControlStore.getClipboardContent()

    if (data) {
      setClipboardContent(data)
    }
  }

  return (
    <ContentCard before={<Icon20CopyOutline />} className={className} title={t('Clipboard')}>
      <OutputField
        afterButtonClick={onGetClipboardContent}
        text={t(clipboardContent)}
        tooltipText={t('Get clipboard contents')}
      />
    </ContentCard>
  )
})
