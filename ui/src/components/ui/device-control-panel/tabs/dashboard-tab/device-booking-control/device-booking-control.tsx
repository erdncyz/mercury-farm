import { useTranslation } from 'react-i18next'
import { observer } from 'mobx-react-lite'
import { MiniInfoCell } from '@vkontakte/vkui'
import { useInjection } from 'inversify-react'
import { Icon20AddSquareOutline, Icon28StopwatchOutline } from '@vkontakte/icons'

import { ContentCard } from '@/components/lib/content-card'

import { dateToFormattedString } from '@/lib/utils/date-to-formatted-string.util'
import { CONTAINER_IDS } from '@/config/inversify/container-ids'

export const DeviceBookingControl = observer(({ className }: { className?: string }) => {
  const { t } = useTranslation()

  const bookingService = useInjection(CONTAINER_IDS.bookingService)

  return (
    <ContentCard
      afterButtonIcon={<Icon20AddSquareOutline />}
      afterTooltipText={t('Extend booking')}
      before={<Icon28StopwatchOutline height={20} width={20} />}
      className={className}
      title={t('Device booking')}
      onAfterButtonClick={() => bookingService.reBookDevice()}
    >
      <MiniInfoCell>
        {t('Booked before')}
        {': '}
        <time>{dateToFormattedString({ value: bookingService.bookedBeforeTime, onlyTime: true })}</time>
      </MiniInfoCell>
    </ContentCard>
  )
})
