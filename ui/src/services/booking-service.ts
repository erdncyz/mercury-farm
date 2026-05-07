import { makeAutoObservable } from 'mobx'
import { inject, injectable } from 'inversify'

import { CONTAINER_IDS } from '@/config/inversify/container-ids'
import { DeviceBySerialStore } from '@/store/device-by-serial-store'
import { deviceConnectionRequired } from '@/config/inversify/decorators'
import { bookDevice, releaseBooking } from '@/api/mercury-api'

import { GroupService } from './group-service'

@injectable()
@deviceConnectionRequired()
export class BookingService {
  bookedBeforeTime = ''
  bookedByUser = ''
  isBooked = false

  constructor(
    @inject(CONTAINER_IDS.groupService) private groupService: GroupService,
    @inject(CONTAINER_IDS.deviceBySerialStore) private deviceBySerialStore: DeviceBySerialStore
  ) {
    makeAutoObservable(this)

    this.init()
  }

  async init(): Promise<void> {
    const device = await this.deviceBySerialStore.fetch()
    const bookingSource = (device as { bookingSource?: string | null }).bookingSource

    if (bookingSource === 'manual' && device.statusChangedAt && device.bookedBefore && device.bookedBefore > 1) {
      this.setTime(device.statusChangedAt, device.bookedBefore)
      this.bookedByUser = device.owner?.name || device.owner?.email || ''
      const expireTime = new Date(new Date(device.statusChangedAt).getTime() + device.bookedBefore)
      this.isBooked = expireTime.getTime() > Date.now()
    } else {
      this.isBooked = false
      this.bookedByUser = ''
    }
  }

  async reBookDevice(): Promise<void> {
    const { data: device } = await this.deviceBySerialStore.refetch()

    if (!device || !device.channel || !device.serial) return

    await this.groupService.invite(device.serial, device.channel, device.group)

    if (device.statusChangedAt) {
      this.setTime(device.statusChangedAt, device?.bookedBefore || 0)
    }
  }

  async bookWithDuration(durationMinutes: number): Promise<void> {
    const { data: device } = await this.deviceBySerialStore.refetch()

    if (!device || !device.serial) return

    await bookDevice(device.serial, durationMinutes)
    await this.deviceBySerialStore.refetch()
    await this.init()
  }

  async releaseCurrentBooking(): Promise<void> {
    const { data: device } = await this.deviceBySerialStore.refetch()

    if (!device || !device.serial) return

    await releaseBooking(device.serial)
    this.isBooked = false
    this.bookedBeforeTime = ''
    this.bookedByUser = ''
    await this.deviceBySerialStore.refetch()
  }

  setTime(statusChangedAt: string, bookedBefore: number): void {
    const expireTime = new Date(new Date(statusChangedAt).getTime() + bookedBefore)

    this.bookedBeforeTime = expireTime.toISOString()
  }
}
