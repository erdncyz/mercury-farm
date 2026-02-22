import { makeAutoObservable } from 'mobx'

class DeviceErrorModalStore {
  isModalOpen = false
  fatalMessage = ''

  constructor() {
    makeAutoObservable(this)
  }

  setError(message: string): void {
    this.fatalMessage = message
    this.isModalOpen = true
  }

  closeModal(): void {
    this.isModalOpen = false
  }

  clearError(): void {
    this.fatalMessage = ''
    this.isModalOpen = false
  }
}

export const deviceErrorModalStore = new DeviceErrorModalStore()
