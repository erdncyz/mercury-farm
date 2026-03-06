import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { observer } from 'mobx-react-lite'
import { Button, Flex, MiniInfoCell } from '@vkontakte/vkui'
import { useInjection } from 'inversify-react'
import { Icon28StopwatchOutline } from '@vkontakte/icons'

import { ContentCard } from '@/components/lib/content-card'

import { dateToFormattedString } from '@/lib/utils/date-to-formatted-string.util'
import { CONTAINER_IDS } from '@/config/inversify/container-ids'

import styles from './device-booking-control.module.css'

const BOOKING_DURATION_OPTIONS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 h', value: 60 },
  { label: '2 h', value: 120 },
  { label: '4 h', value: 240 },
  { label: '8 h', value: 480 },
  { label: '24 h', value: 1440 },
]

export const DeviceBookingControl = observer(({ className }: { className?: string }) => {
  const { t } = useTranslation()
  const bookingService = useInjection(CONTAINER_IDS.bookingService)
  const [selectedDuration, setSelectedDuration] = useState(60)
  const [isLoading, setIsLoading] = useState(false)

  const handleBook = async () => {
    setIsLoading(true)
    try {
      await bookingService.bookWithDuration(selectedDuration)
    } catch (error) {
      console.error('Booking failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRelease = async () => {
    setIsLoading(true)
    try {
      await bookingService.releaseCurrentBooking()
    } catch (error) {
      console.error('Release failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ContentCard
      before={<Icon28StopwatchOutline height={20} width={20} />}
      className={className}
      title={t('Device booking')}
    >
      {bookingService.isBooked ? (
        <div className={styles.bookingContent}>
          <MiniInfoCell>
            {t('Booked by')}: <strong>{bookingService.bookedByUser}</strong>
          </MiniInfoCell>
          <MiniInfoCell>
            {t('Booked until')}: <time><strong>{dateToFormattedString({ value: bookingService.bookedBeforeTime, needTime: true })}</strong></time>
          </MiniInfoCell>
          <Flex className={styles.actions}>
            <Button
              appearance='negative'
              disabled={isLoading}
              mode='outline'
              size='s'
              onClick={handleRelease}
            >
              {isLoading ? t('Releasing...') : t('Release booking')}
            </Button>
          </Flex>
        </div>
      ) : (
        <div className={styles.bookingContent}>
          <Flex align='center' className={styles.pickerRow} gap={8}>
            <select
              className={styles.durationSelect}
              value={selectedDuration}
              onChange={(e) => setSelectedDuration(Number(e.target.value))}
            >
              {BOOKING_DURATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Button
              appearance='positive'
              disabled={isLoading}
              mode='primary'
              size='s'
              onClick={handleBook}
            >
              {isLoading ? '...' : t('Book device')}
            </Button>
          </Flex>
        </div>
      )}
    </ContentCard>
  )
})
