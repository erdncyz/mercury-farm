import { List } from '@vkontakte/vkui'
import { observer } from 'mobx-react-lite'
import { useInjection } from 'inversify-react'

import { CONTAINER_IDS } from '@/config/inversify/container-ids'

import { UserItem } from './user-item'

import type { DeleteUsersParams } from '@/generated/types'

type UserListProps = {
  removeFilters: DeleteUsersParams
}

export const UserList = observer(({ removeFilters }: UserListProps) => {
  const userSettingsService = useInjection(CONTAINER_IDS.userSettingsService)

  return (
    <List gap={5}>
      {userSettingsService.paginatedItems.map((user) => (
        <UserItem key={user.email} removeFilters={removeFilters} user={user} />
      ))}
    </List>
  )
})
