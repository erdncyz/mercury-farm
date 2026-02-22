import type { ListDevice } from '@/types/list-device.type'

export const normalizeListDevice = (device: ListDevice): ListDevice => {
  return {
    ...device,
  }
}
