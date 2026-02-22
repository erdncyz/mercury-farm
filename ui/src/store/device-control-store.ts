import { action, makeObservable, observable } from 'mobx'
import { inject, injectable } from 'inversify'

import { DeviceControlService } from '@/services/core/device-control-service/device-control-service'

import { CONTAINER_IDS } from '@/config/inversify/container-ids'
import { deviceConnectionRequired } from '@/config/inversify/decorators'

import { DeviceBySerialStore } from './device-by-serial-store'

import type { TransactionFactory } from '@/types/transaction-factory.type'

@injectable()
@deviceConnectionRequired()
export class DeviceControlStore extends DeviceControlService {
  @observable currentQuality = 15

  constructor(
    @inject(CONTAINER_IDS.deviceBySerialStore) deviceBySerialStore: DeviceBySerialStore,
    @inject(CONTAINER_IDS.factoryTransactionService) transactionServiceFactory: TransactionFactory
  ) {
    super(deviceBySerialStore, transactionServiceFactory)

    makeObservable(this)
  }

  async getClipboardContent(): Promise<string> {
    try {
      const copyResult = await this.copy()
      const { data } = await copyResult.donePromise

      if (data) return data

      return 'No clipboard data'
    } catch (error) {
      console.error(error)

      return 'Error while getting data'
    }
  }

  @action
  setCurrentQuality(quality: number): void {
    this.currentQuality = quality
  }

  changeToSmallFont(): void {
    this.fontChange(0.85)
  }

  changeToNormalFont(): void {
    this.fontChange(1.0)
  }

  changeToBigFont(): void {
    this.fontChange(1.3)
  }

  tryToRotate(rotation: 'portrait' | 'landscape'): void {
    if (rotation === 'portrait') {
      this.rotate(0)

      setTimeout(() => {
        if (this.isLandscape()) {
          console.info('tryToRotate but it still landscape')
        }
      }, 400)
    }

    if (rotation === 'landscape') {
      this.rotate(90)

      setTimeout(() => {
        if (this.isPortrait()) {
          console.info('tryToRotate but it still portrait')
        }
      }, 400)
    }
  }

  rotateLeft(): void {
    const { data: device } = this.deviceBySerialStore.deviceQueryResult()

    if (device?.display?.rotation === undefined || device?.display?.rotation === null) return

    if (device.display.rotation === 0) {
      this.rotate(270)

      return
    }

    this.rotate(device.display.rotation - 90)
  }

  rotateRight(): void {
    const { data: device } = this.deviceBySerialStore.deviceQueryResult()

    if (device?.display?.rotation === undefined || device?.display?.rotation === null) return

    if (device.display.rotation === 270) {
      this.rotate(0)

      return
    }

    this.rotate(device.display.rotation + 90)
  }

  changeDeviceQuality(quality: number): void {
    this.changeQuality(quality)

    this.setCurrentQuality(quality)
  }

  autoQuality(): void {
    this.changeQuality(15)
    this.setCurrentQuality(15)
  }

  private isPortrait(): boolean {
    const { data: device } = this.deviceBySerialStore.deviceQueryResult()

    return device?.display?.rotation === 0 || device?.display?.rotation === 180
  }

  private isLandscape(): boolean {
    const { data: device } = this.deviceBySerialStore.deviceQueryResult()

    return device?.display?.rotation === 90 || device?.display?.rotation === 270
  }
}
