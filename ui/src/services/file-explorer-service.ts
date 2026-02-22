import { makeAutoObservable } from 'mobx'
import { inject, injectable } from 'inversify'

import { downloadFile } from '@/api/openstf'
import { FSListMessage } from '@/types/fs-list-message.type'

import { saveFile } from '@/lib/utils/save-file.util'
import { CONTAINER_IDS } from '@/config/inversify/container-ids'
import { DeviceControlStore } from '@/store/device-control-store'
import { deviceConnectionRequired } from '@/config/inversify/decorators'

import { S_IFDIR, S_IFLNK, S_IFMT } from '@/constants/file-bit-masks'

@injectable()
@deviceConnectionRequired()
export class FileExplorerService {
  currentPath = '/'
  fsList: FSListMessage[] = []
  isDirectoryLoading = true

  constructor(@inject(CONTAINER_IDS.deviceControlStore) private deviceControlStore: DeviceControlStore) {
    makeAutoObservable(this)

    this.listDirectory()
  }

  get sortedFsList(): FSListMessage[] {
    return this.fsList.slice().sort((prev, next) => {
      const isPrevDirectory = this.isDirectory(prev.mode)
      const isNextDirectory = this.isDirectory(next.mode)

      if (isPrevDirectory !== isNextDirectory) {
        return isPrevDirectory ? -1 : 1
      }

      return prev.name.localeCompare(next.name)
    })
  }

  get isFsListEmpty(): boolean {
    return this.fsList.length === 0
  }

  setCurrentPath(value: string): void {
    this.currentPath = value

    if (!this.currentPath.startsWith('/')) {
      this.currentPath = `/${this.currentPath}`
    }
  }

  enterDirectoryLocation(): void {
    if (!this.currentPath) return

    this.currentPath = this.currentPath.replace(/\/\/+/g, '/')

    this.listDirectory()
  }

  addSegment(value: string): void {
    this.currentPath = this.appendPathSegment(value)

    this.listDirectory()
  }

  async getFile(fileName: string): Promise<void> {
    try {
      const path = this.appendPathSegment(fileName)

      const fsRetrieveResult = await this.deviceControlStore.fsRetrieve(path)
      const { content } = await fsRetrieveResult.donePromise

      if (!content) return

      const blob = await downloadFile(content.href)

      saveFile(blob, fileName)
    } catch (error) {
      console.error(error)
    }
  }

  goHome(): void {
    this.currentPath = '/'

    this.listDirectory()
  }

  upDirectory(): void {
    if (!this.currentPath) return

    const lastSlashIndex = this.currentPath.lastIndexOf('/')

    if (lastSlashIndex !== -1) {
      this.currentPath = this.currentPath.slice(0, lastSlashIndex)
    }

    if (this.currentPath === '') this.currentPath = '/'

    this.listDirectory()
  }

  isDirectory(value: number): boolean {
    return (value & S_IFMT) === S_IFDIR || (value & S_IFMT) === S_IFLNK
  }

  private appendPathSegment(segment: string): string {
    return this.currentPath === '/' ? `/${segment}` : `${this.currentPath}/${segment}`
  }

  private async listDirectory(): Promise<void> {
    try {
      const fsListResult = await this.deviceControlStore.fsList(this.currentPath)
      const { content } = await fsListResult.donePromise

      if (content) {
        this.fsList = content
        this.isDirectoryLoading = false
      }
    } catch (error) {
      console.error(error)
    }
  }
}
