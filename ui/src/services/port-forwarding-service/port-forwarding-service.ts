import { makeAutoObservable } from 'mobx'
import { inject, injectable } from 'inversify'

import { CONTAINER_IDS } from '@/config/inversify/container-ids'
import { DeviceControlStore } from '@/store/device-control-store'
import { deviceConnectionRequired } from '@/config/inversify/decorators'

import type { PortForwardEntry } from './types'

@injectable()
@deviceConnectionRequired()
export class PortForwardingService {
  reversePortForwards: Record<string, PortForwardEntry> = {}

  constructor(@inject(CONTAINER_IDS.deviceControlStore) private deviceControlStore: DeviceControlStore) {
    makeAutoObservable(this)

    this.reversePortForwards['_default'] = this.createPortForward('_default')
  }

  get portForwards(): PortForwardEntry[] {
    return Object.values(this.reversePortForwards)
  }

  get isPortForwardsEmpty(): boolean {
    return this.portForwards.length === 0
  }

  setPortForwardValue<T extends keyof PortForwardEntry>(id: string, field: T, value: PortForwardEntry[T]): void {
    this.reversePortForwards[id][field] = value
  }

  addPortForward(): void {
    const id = crypto.randomUUID()

    this.reversePortForwards[id] = this.createPortForward(id)
  }

  removePortForward(id: string): void {
    if (this.reversePortForwards[id].isEnabled) {
      this.deviceControlStore.removeForward(this.reversePortForwards[id])
    }

    delete this.reversePortForwards[id]
  }

  togglePortForward(id: string, isEnabled: boolean): void {
    const portForward = this.reversePortForwards[id]

    this.setPortForwardValue(id, 'isEnabled', isEnabled)

    if (portForward.isEnabled) {
      this.deviceControlStore.createForward(portForward)
    }

    if (!portForward.isEnabled) {
      this.deviceControlStore.removeForward(portForward)
    }
  }

  private createPortForward(id: string): PortForwardEntry {
    return {
      id,
      targetHost: 'localhost',
      targetPort: 8080,
      devicePort: 8080,
      isEnabled: false,
    }
  }
}
