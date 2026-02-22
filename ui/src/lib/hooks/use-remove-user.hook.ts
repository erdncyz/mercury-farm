import { useMutation } from '@tanstack/react-query'

import { removeUser } from '@/api/openstf-api'

import { queries } from '@/config/queries/query-key-store'
import { queryClient } from '@/config/queries/query-client'

import type { AxiosError } from 'axios'
import type { RemoveUserArgs } from '@/api/openstf-api/types'
import type { SettingsUser } from '@/types/settings-user.type'
import type { UseMutationResult } from '@tanstack/react-query'
import type { UnexpectedErrorResponse } from '@/generated/types'

export const useRemoveUser = (): UseMutationResult<boolean, AxiosError<UnexpectedErrorResponse>, RemoveUserArgs> =>
  useMutation({
    mutationFn: (data) => removeUser(data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: queries.users.settings.queryKey })
      const previousUsers = queryClient.getQueryData(queries.users.settings.queryKey)

      queryClient.setQueryData<SettingsUser[]>(queries.users.settings.queryKey, (oldData) => {
        if (!oldData) return []

        return oldData.filter((item) => item.email !== data.email)
      })

      return { previousUsers }
    },
    onError: (error, _, context) => {
      queryClient.setQueryData(queries.users.settings.queryKey, context?.previousUsers)

      console.error(error)
    },
  })
