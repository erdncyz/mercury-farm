import { inject, injectable } from 'inversify'

import { DeviceConnection } from '@/store/device-connection'
import { CONTAINER_IDS } from '@/config/inversify/container-ids'
import { DeviceBySerialStore } from '@/store/device-by-serial-store'
import { DeviceScreenStore } from '@/store/device-screen-store/device-screen-store'
import { deviceErrorModalStore } from '@/store/device-error-modal-store'

import { LogcatService } from './logcat-service'

@injectable()
export class DeviceLifecycleService {
  constructor(
    @inject(CONTAINER_IDS.logcatService) private logcatService: LogcatService,
    @inject(CONTAINER_IDS.deviceConnection) private deviceConnection: DeviceConnection,
    @inject(CONTAINER_IDS.deviceScreenStore) private deviceScreenStore: DeviceScreenStore,
    @inject(CONTAINER_IDS.deviceBySerialStore) private deviceBySerialStore: DeviceBySerialStore
  ) {}

  prepareDevice(): void {
    this.deviceConnection.useDevice()
    this.deviceBySerialStore.addDeviceChangeListener()
  }

  cleanupDevice(): void {
    this.deviceBySerialStore.removeDeviceChangeListener()
    this.logcatService.terminateLogcat()

    deviceErrorModalStore.clearError()
  }

  async reconnectDevice(): Promise<void> {
    deviceErrorModalStore.clearError()

    const connected = await this.deviceConnection.useDevice()

    if (!connected) return

    try {
      await this.deviceScreenStore.reconnectScreenStreaming()
    } catch (error) {
      deviceErrorModalStore.setError('Connection failed')

      console.error(error)
    }
  }
}
