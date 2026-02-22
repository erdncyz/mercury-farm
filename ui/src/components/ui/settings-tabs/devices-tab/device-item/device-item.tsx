import { useEffect, useState } from 'react'
import { Button } from '@vkontakte/vkui'
import { observer } from 'mobx-react-lite'
import { useInjection } from 'inversify-react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Icon20RefreshOutline, Icon24DoneOutline } from '@vkontakte/icons'

import { ListItem } from '@/components/lib/list-item'
import { WarningModal } from '@/components/ui/modals'

import { queries } from '@/config/queries/query-key-store'
import { CONTAINER_IDS } from '@/config/inversify/container-ids'
import { useRemoveDevice } from '@/lib/hooks/use-remove-device.hook'
import { useUpdateDevice } from '@/lib/hooks/use-update-device.hook'
import { useRenewAdbPort } from '@/lib/hooks/use-renew-adb-port.hook'

import { EditableInfo } from './editable-info'
import { validateAdbPort } from './helpers'

import styles from './device-item.module.css'

import type { MouseEvent } from 'react'
import type { SettingsDevice } from '@/types/settings-device.type'
import type { DeleteDeviceParams, UpdateStorageInfoParams } from '@/generated/types'

type DeviceItemProps = {
  device: SettingsDevice
  removeFilters: DeleteDeviceParams
}

export const DeviceItem = observer(({ device, removeFilters }: DeviceItemProps) => {
  const { t } = useTranslation()
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)
  const { mutate: removeDevice } = useRemoveDevice()
  const { mutate: updateDevice } = useUpdateDevice()
  const { data: adbRange } = useQuery(queries.devices.adbRange)
  const {
    data: newAdbPort,
    mutate: renewAdbPort,
    isSuccess: isAdbPortRenewed,
    isPending: isAdbPortPending,
  } = useRenewAdbPort()
  const [updateInfo, setUpdateInfo] = useState<UpdateStorageInfoParams>({
    place: device.place,
    storageId: device.storageId,
    adbPort: device.adbPort,
  })

  const deviceSettingsService = useInjection(CONTAINER_IDS.deviceSettingsService)

  const isUpdatedChanged =
    device.place !== updateInfo.place ||
    device.storageId !== updateInfo.storageId ||
    device.adbPort !== updateInfo.adbPort

  const onSaveClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()

    setIsConfirmationOpen(true)
  }

  const onUpdateAdbPort = () => {
    renewAdbPort(device.serial)
  }

  const onRemove = () => {
    removeDevice({ serial: device.serial, ...removeFilters })

    deviceSettingsService.setSelectedItem(device, false)
  }

  useEffect(() => {
    if (isAdbPortRenewed) {
      setUpdateInfo((prev) => ({ ...prev, adbPort: newAdbPort }))
    }
  }, [newAdbPort])

  return (
    <>
      <ListItem
        extraSubtitle={`${t('Serial')}: ${device.serial} - ${t('OS')}: ${device.version} - SDK: ${device.sdk} - ${t('Location')}: ${device.provider?.name} - ${t('Group Origin')}: ${device.group?.originName}`}
        isNeedConfirmRemove={deviceSettingsService.needConfirm}
        isOpenable={false}
        isSelected={deviceSettingsService.isItemSelected(device.serial)}
        modalDescription={t('Really delete this device')}
        title={`${device.manufacturer || t('Unknown')} ${device.model || t('Unknown')} (${device.marketName || t('Unknown')})`}
        after={
          <Button
            before={<Icon20RefreshOutline />}
            disabled={isAdbPortPending}
            mode='tertiary'
            size='s'
            onClick={onUpdateAdbPort}
          >
            {t('Update ADB Port')}
          </Button>
        }
        indicator={
          <Button
            activated={isUpdatedChanged}
            appearance={!isUpdatedChanged ? 'accent' : 'accent-invariable'}
            before={<Icon24DoneOutline height={20} width={20} />}
            className={styles.saveButton}
            disabled={!isUpdatedChanged}
            mode='tertiary'
            size='s'
            onClick={onSaveClick}
          >
            {t('Save')}
          </Button>
        }
        subtitle={
          <>
            <EditableInfo
              initialValue={device.place}
              title={t('Place')}
              value={updateInfo.place}
              onChange={(data) => setUpdateInfo((prev) => ({ ...prev, place: data }))}
            />
            <EditableInfo
              initialValue={String(device.adbPort || '')}
              title={t('ADB Port')}
              type='number'
              validateValue={(value: string) => validateAdbPort(value, adbRange)}
              value={String(updateInfo.adbPort || '')}
              onChange={(data) => setUpdateInfo((prev) => ({ ...prev, adbPort: Number(data) }))}
            />
            <EditableInfo
              initialValue={device.storageId}
              title={t('Storage Id')}
              value={updateInfo.storageId}
              onChange={(data) => setUpdateInfo((prev) => ({ ...prev, storageId: data }))}
            />
          </>
        }
        onIsSelectedChange={(event) => deviceSettingsService.setSelectedItem(device, event.target.checked)}
        onRemove={onRemove}
      />
      <WarningModal
        description={t('Really update this device')}
        isOpen={isConfirmationOpen}
        title={t('Warning')}
        onClose={() => setIsConfirmationOpen(false)}
        onOk={async () => updateDevice({ serial: device.serial, ...updateInfo })}
      />
    </>
  )
})
