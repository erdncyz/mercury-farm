import { t } from 'i18next'
import { inject, injectable } from 'inversify'
import { makeAutoObservable, runInAction } from 'mobx'

import { CONTAINER_IDS } from '@/config/inversify/container-ids'
import { deviceConnectionRequired } from '@/config/inversify/decorators'

import { DeviceControlStore } from './device-control-store'

@injectable()
@deviceConnectionRequired()
export class ShellControlStore {
  command = ''
  shellResult = ''

  constructor(@inject(CONTAINER_IDS.deviceControlStore) private deviceControlStore: DeviceControlStore) {
    makeAutoObservable(this)
  }

  setCommand(command: string): void {
    this.command = command
  }

  clear(): void {
    this.command = ''
    this.shellResult = ''
  }

  async runShellCommand(): Promise<void> {
    try {
      const shellResult = await this.deviceControlStore.shell(this.command)

      const output: string[] = []

      shellResult.subscribeToProgress((_, result, seq) => {
        if (result) {
          runInAction(() => {
            output[seq] = result
          })
        }

        if (!result) {
          output[seq] = ''
        }
      })

      await shellResult.donePromise

      this.shellResult = output.join('')
      this.command = ''
    } catch (error) {
      console.error(error)

      this.shellResult = t('Error while getting data')
    }
  }
}
