import type { Device } from '@/generated/types'

export type SettingsDeviceChangeMessage = {
  action: string
  device: Device
  oldOriginGroupId: string
  timeStamp: number
}
