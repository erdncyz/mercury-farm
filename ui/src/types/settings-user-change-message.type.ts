import type { User } from '@/generated/types'

export type SettingsUserChangeMessage = {
  action: string
  groups: unknown[]
  isAddedGroup: false
  targets: string[]
  timeStamp: number
  user: User
}
