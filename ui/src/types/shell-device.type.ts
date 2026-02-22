import type { DeviceDisplay, DeviceGroup, DevicePhone, DeviceProvider } from '@/generated/types'

export type ShellDevice = {
  abi?: string
  cpuPlatform?: string
  openGLESVersion?: string
  phone?: Pick<DevicePhone, 'imei'>
  group?: Pick<DeviceGroup, 'originName'>
  manufacturer?: string
  marketName?: string
  model?: string
  provider?: Pick<DeviceProvider, 'name'>
  display?: Pick<DeviceDisplay, 'width' | 'height'>
  sdk?: string
  serial: string
  version?: string
  storageId?: string
  place?: string
  channel?: string
}
