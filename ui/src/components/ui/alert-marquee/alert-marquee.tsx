import { observer } from 'mobx-react-lite'
import { useInjection } from 'inversify-react'

import { Marquee } from '@/components/lib/marquee'
import { ConditionalRender } from '@/components/lib/conditional-render'

import { CONTAINER_IDS } from '@/config/inversify/container-ids'

import type { AlertMessageLevel } from '@/generated/types'
import type { MarqueeVariant } from '@/components/lib/marquee'

const ALERT_LEVEL_TO_MARQUEE_VARIANT_MAP: Record<AlertMessageLevel, MarqueeVariant> = {
  ['Critical']: 'Error',
  ['Information']: 'Info',
  ['Warning']: 'Warn',
}

export const AlertMarquee = observer(() => {
  const settingsService = useInjection(CONTAINER_IDS.settingsService)

  return (
    <ConditionalRender conditions={[settingsService.isAlertMessageActive]}>
      <Marquee variant={ALERT_LEVEL_TO_MARQUEE_VARIANT_MAP[settingsService.alertMessage.level || 'Warning']}>
        {settingsService.alertMessage.data}
      </Marquee>
    </ConditionalRender>
  )
})
