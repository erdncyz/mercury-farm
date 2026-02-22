import type { ListDevice } from '@/types/list-device.type'

export const deviceServiceToString = (deviceService: ListDevice['service']): string => {
  const services = []

  if (deviceService?.hasGMS) {
    services.push('GMS')
  }

  if (deviceService?.hasHMS) {
    services.push('HMS')
  }

  if (deviceService?.hasAPNS) {
    services.push('APNS')
  }

  return services.join(', ')
}
