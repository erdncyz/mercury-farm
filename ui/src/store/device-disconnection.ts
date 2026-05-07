import { makeAutoObservable } from 'mobx'
import { inject, injectable } from 'inversify'

import { GroupService } from '@/services/group-service'

import { CONTAINER_IDS } from '@/config/inversify/container-ids'

@injectable()
export class DeviceDisconnection {
  private readonly stopUsingTimeout = 5000

  constructor(@inject(CONTAINER_IDS.groupService) private groupService: GroupService) {
    makeAutoObservable(this)
  }

  async stopUsingDevice(serial: string, channel: string): Promise<unknown> {
    return Promise.race([
      this.groupService.kick(serial, channel),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Stop using device timed out')), this.stopUsingTimeout)
      }),
    ])
  }
}
