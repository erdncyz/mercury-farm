import type { GroupListResponseGroupsItem } from '@/generated/types'

export type SettingsGroupChangeMessage = {
  action: string
  devices: string[]
  group: Partial<GroupListResponseGroupsItem>
  isAddedDevice: boolean
  isAddedUser: boolean
  isChangedClass: boolean
  isChangedDates: boolean
  subscribers: string[]
  timeStamp: number
  users: string[]
}
