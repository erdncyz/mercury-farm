import type { UserGroups } from '@/generated/types'

export type UserSettingsUpdateMessage = {
  user: {
    email: string
    name: string
    privilege: string
    groups: UserGroups
    settings: {
      alertMessage: {
        activation: string
        data: string
        level: 'Information' | 'Warning' | 'Critical'
      }
    }
  }
  isAddedGroup: boolean
  groups: unknown[]
  action: string
  targets: string[]
  timeStamp: number
}
