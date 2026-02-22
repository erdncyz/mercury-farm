import type {
  DeviceGroup,
  DeviceOwner,
  DevicePhone,
  DeviceService,
  DeviceBattery,
  DeviceBrowser,
  DeviceDisplay,
  DeviceNetwork,
  DeviceProvider,
} from '@/generated/types'

export type ListDevice = {
  abi?: string
  battery?: Omit<DeviceBattery, 'voltage'>
  bookedBefore?: number
  browser?: Omit<DeviceBrowser, 'selected'>
  channel?: string
  cpuPlatform?: string
  createdAt?: string
  display?: Pick<DeviceDisplay, 'width' | 'height' | 'rotation' | 'url'>
  group?: DeviceGroup
  ios?: boolean
  macAddress?: string
  manufacturer?: string
  marketName?: string
  model?: string
  name?: string
  network?: Pick<DeviceNetwork, 'type' | 'subtype'>
  notes?: string
  openGLESVersion?: string
  operator?: string | null
  owner?: DeviceOwner | null
  phone?: Omit<DevicePhone, 'network'>
  place?: string
  platform?: string
  present?: boolean
  product?: string
  provider?: Pick<DeviceProvider, 'name'>
  ready?: boolean
  releasedAt?: string
  sdk?: string
  serial: string
  service?: DeviceService
  status?: number
  statusChangedAt?: string
  storageId?: string
  usage?: string | null
  using?: boolean
  version?: string
}
