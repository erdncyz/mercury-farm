import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useInjection } from 'inversify-react'
import { Icon20FilterOutline, Icon20SmartphoneOutline } from '@vkontakte/icons'
import { Button, FormItem, FormLayoutGroup, Separator, Spacing, Tooltip } from '@vkontakte/vkui'

import { ListHeader } from '@/components/lib/list-header'
import { ConditionalRender } from '@/components/lib/conditional-render'
import { YesNoAnyRadioGroup } from '@/components/lib/yes-no-any-radio-group'

import { CONTAINER_IDS } from '@/config/inversify/container-ids'
import { useRemoveDevices } from '@/lib/hooks/use-remove-devices.hook'

import { DeviceList } from './device-list'

import styles from './devices-tab.module.css'

import type { DeleteDeviceParams } from '@/generated/types'

export const DevicesTab = observer(() => {
  const { t } = useTranslation()
  const { mutate: removeDevices } = useRemoveDevices()
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [removeFilters, setRemoveFilters] = useState<DeleteDeviceParams>({
    present: false,
    booked: false,
    annotated: false,
    controlled: false,
  })

  const deviceSettingsService = useInjection(CONTAINER_IDS.deviceSettingsService)
  const { isLoading: isDevicesLoading } = deviceSettingsService.devicesQueryResult

  const onRemove = () => {
    removeDevices({ ids: deviceSettingsService.joinedDevicesIds, ...removeFilters })

    deviceSettingsService.clearSelectedItems()
  }

  useEffect(() => {
    deviceSettingsService.addDeviceSettingsListeners()

    return () => {
      deviceSettingsService.removeDeviceSettingsListeners()
    }
  }, [])

  return (
    <ListHeader
      beforeIcon={<Icon20SmartphoneOutline />}
      containerId={CONTAINER_IDS.deviceSettingsService}
      isItemsLoading={isDevicesLoading}
      isRemoveButtonDisabled={!deviceSettingsService.paginatedItems.length}
      skeletonHeight={106}
      title={t('Device list')}
      actions={
        <Tooltip appearance='accent' description={t('Set filters for device removing')}>
          <Button
            activated={isFiltersOpen}
            before={<Icon20FilterOutline height={16} width={16} />}
            mode='tertiary'
            size='s'
            onClick={() => setIsFiltersOpen((prev) => !prev)}
          >
            {t('Remove Filters')}
          </Button>
        </Tooltip>
      }
      beforePagination={
        <ConditionalRender conditions={[isFiltersOpen]}>
          <Spacing size='xl' />
          <FormLayoutGroup mode='horizontal'>
            <FormItem title={t('Device presence state')} top={t('Present')}>
              <YesNoAnyRadioGroup
                className={styles.radioGroup}
                defaultValue={removeFilters.present}
                name='present'
                noDescription={t('The device is absent')}
                yesDescription={t('The device is present')}
                onChange={(data) => setRemoveFilters((prev) => ({ ...prev, present: data }))}
              />
            </FormItem>
            <FormItem title={t('Device booking state')} top={t('Booked')}>
              <YesNoAnyRadioGroup
                className={styles.radioGroup}
                defaultValue={removeFilters.booked}
                name='booked'
                noDescription={t('The device is not booked')}
                yesDescription={t('The device is booked')}
                onChange={(data) => setRemoveFilters((prev) => ({ ...prev, booked: data }))}
              />
            </FormItem>
            <FormItem title={t('Device notes state')} top={t('Annotated')}>
              <YesNoAnyRadioGroup
                className={styles.radioGroup}
                defaultValue={removeFilters.annotated}
                name='annotated'
                noDescription={t('The device does not have notes')}
                yesDescription={t('The device has notes')}
                onChange={(data) => setRemoveFilters((prev) => ({ ...prev, annotated: data }))}
              />
            </FormItem>
            <FormItem title={t('Device controlling state')} top={t('Controlled')}>
              <YesNoAnyRadioGroup
                className={styles.radioGroup}
                defaultValue={removeFilters.controlled}
                name='controlled'
                noDescription={t('The device is not controlled')}
                yesDescription={t('The device is controlled')}
                onChange={(data) => setRemoveFilters((prev) => ({ ...prev, controlled: data }))}
              />
            </FormItem>
          </FormLayoutGroup>
          <Spacing size='xl' />
          <Separator appearance='primary-alpha' />
        </ConditionalRender>
      }
      onRemove={onRemove}
    >
      <DeviceList removeFilters={removeFilters} />
    </ListHeader>
  )
})
