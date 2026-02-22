import { injectable } from 'inversify'
import { makeAutoObservable } from 'mobx'

import { socket } from '@/api/socket'
import { AdbKeysChangedMessage } from '@/types/adb-keys-changed-message.type'
import { User, UserAdbKeysItem } from '@/generated/types'

import { queries } from '@/config/queries/query-key-store'
import { queryClient } from '@/config/queries/query-client'

@injectable()
export class AdbKeyService {
  private adbKeyToDelete: UserAdbKeysItem = { fingerprint: '', title: '' }

  deviceKey = ''
  deviceTitle = ''
  errorMessage = ''
  isAddAdbKeyOpen = false

  constructor() {
    makeAutoObservable(this)

    this.onAdbKeysAdded = this.onAdbKeysAdded.bind(this)
    this.onAdbKeysRemoved = this.onAdbKeysRemoved.bind(this)
    this.onAdbKeysError = this.onAdbKeysError.bind(this)
  }

  private extractHostNameFromKey(key: string): string {
    if (key.match(/\S+\s+(.+)/)) {
      return key.replace(/\S+\s+(.+)/g, '$1')
    }

    return ''
  }

  setDeviceKey(value: string): void {
    this.deviceKey = value
    this.errorMessage = ''

    this.deviceTitle = this.extractHostNameFromKey(value)
  }

  setIsAddAdbKeyOpen(addKeyOpen: boolean | ((isOpen: boolean) => boolean)): void {
    if (typeof addKeyOpen === 'function') {
      this.isAddAdbKeyOpen = addKeyOpen(this.isAddAdbKeyOpen)

      return
    }

    this.isAddAdbKeyOpen = addKeyOpen
  }

  setDeviceTitle(value: string): void {
    this.deviceTitle = value
  }

  setAdbKeyToDelete(data: UserAdbKeysItem): void {
    this.adbKeyToDelete = data
  }

  addAdbKeysListeners(): void {
    socket.on('user.keys.adb.added', this.onAdbKeysAdded)
    socket.on('user.keys.adb.removed', this.onAdbKeysRemoved)
    socket.on('user.keys.adb.error', this.onAdbKeysError)
  }

  removeAdbKeysListeners(): void {
    socket.off('user.keys.adb.added', this.onAdbKeysAdded)
    socket.off('user.keys.adb.removed', this.onAdbKeysRemoved)
    socket.off('user.keys.adb.error', this.onAdbKeysError)
  }

  addAdbKey(): void {
    socket.emit('user.keys.adb.add', { key: this.deviceKey, title: this.deviceTitle })
  }

  removeAdbKey(): void {
    socket.emit('user.keys.adb.remove', this.adbKeyToDelete)
  }

  private onAdbKeysAdded({ title, fingerprint }: AdbKeysChangedMessage): void {
    queryClient.setQueryData<User>(queries.user.profile.queryKey, (oldData) => {
      const adbKey: UserAdbKeysItem = { title, fingerprint }

      if (!oldData?.adbKeys) return { ...oldData, adbKeys: [adbKey] }

      return { ...oldData, adbKeys: [adbKey, ...oldData.adbKeys] }
    })

    this.setIsAddAdbKeyOpen(false)
    this.setDeviceTitle('')
    this.setDeviceKey('')
  }

  private onAdbKeysRemoved({ fingerprint }: AdbKeysChangedMessage): void {
    queryClient.setQueryData<User>(queries.user.profile.queryKey, (oldData) => {
      if (!oldData?.adbKeys) return { ...oldData, adbKeys: [] }

      return { ...oldData, adbKeys: oldData.adbKeys.filter((item) => item.fingerprint !== fingerprint) }
    })
  }

  private onAdbKeysError({ message }: { message: string }): void {
    this.errorMessage = message
  }
}
