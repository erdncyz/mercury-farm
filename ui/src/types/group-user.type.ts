import type { UserGroups, UserGroupsQuotas } from '@/generated/types'

export type GroupUser = {
  name?: string
  email?: string
  privilege?: string
  groups?: Pick<UserGroups, 'subscribed'> & {
    quotas: Pick<UserGroupsQuotas, 'allocated' | 'consumed'>
  }
}
