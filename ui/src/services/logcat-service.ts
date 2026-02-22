import { makeAutoObservable } from 'mobx'
import { inject, injectable } from 'inversify'

import { CONTAINER_IDS } from '@/config/inversify/container-ids'
import { DeviceControlStore } from '@/store/device-control-store'
import { deviceConnectionRequired } from '@/config/inversify/decorators'

import { LogsTrackerService } from './logs-tracker-service/logs-tracker-service'

import type { LogcatEntryMessage } from '@/types/logcat-entry-message.type'

@injectable()
@deviceConnectionRequired()
export class LogcatService {
  private visibleLogsSize = 100

  tag = '*'
  priority = 2

  constructor(
    @inject(CONTAINER_IDS.deviceSerial) private serial: string,
    @inject(CONTAINER_IDS.deviceControlStore) private deviceControlStore: DeviceControlStore,
    @inject(CONTAINER_IDS.logsTrackerService) private logsTrackerService: LogsTrackerService
  ) {
    makeAutoObservable(this)

    this.terminateLogcat = this.terminateLogcat.bind(this)

    this.beforeUnloadCleanUp()
  }

  get deviceLogs(): LogcatEntryMessage[] {
    return this.logsTrackerService.logsByDeviceSerial[this.serial]?.logs ?? []
  }

  get isLogsEmpty(): boolean {
    return this.deviceLogs.length === 0
  }

  get visibleLogs(): LogcatEntryMessage[] {
    return this.deviceLogs.slice(-this.visibleLogsSize) ?? []
  }

  get isLogcatStarted(): boolean {
    return this.logsTrackerService.logsByDeviceSerial[this.serial]?.isLogcatStarted ?? false
  }

  setPriority(priority: number): void {
    this.priority = priority
  }

  setTag(tag: string): void {
    this.tag = tag
  }

  clearLogs(): void {
    this.logsTrackerService.clearDeviceLogs(this.serial)
  }

  startLogcat(): void {
    this.logsTrackerService.initializeLogcatTracker(this.serial)

    this.deviceControlStore.startLogcat({ priority: this.priority, tag: this.tag })
  }

  async stopLogcat(): Promise<void> {
    try {
      const stopLogcatResult = await this.deviceControlStore.stopLogcat()
      await stopLogcatResult.donePromise

      this.logsTrackerService.stopLogcatTracker(this.serial)
    } catch (error) {
      console.error(error)
    }
  }

  terminateLogcat(): void {
    this.clearLogs()
    this.stopLogcat()

    window.removeEventListener('beforeunload', this.terminateLogcat)
  }

  private beforeUnloadCleanUp(): void {
    window.addEventListener('beforeunload', this.terminateLogcat)
  }
}
