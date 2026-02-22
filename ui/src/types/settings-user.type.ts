import type { UserGroups } from '@/generated/types'

export type SettingsUser = {
  name?: string
  email?: string
  privilege?: string
  groups?: Pick<UserGroups, 'quotas'>
}
