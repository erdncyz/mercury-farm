import { useMutation } from '@tanstack/react-query'

import { removeUsers } from '@/api/openstf-api'

import { queries } from '@/config/queries/query-key-store'
import { queryClient } from '@/config/queries/query-client'

import type { AxiosError } from 'axios'
import type { RemoveUsersArgs } from '@/api/openstf-api/types'
import type { UseMutationResult } from '@tanstack/react-query'
import type { SettingsUser } from '@/types/settings-user.type'
import type { UnexpectedErrorResponse } from '@/generated/types'

export const useRemoveUsers = (): UseMutationResult<boolean, AxiosError<UnexpectedErrorResponse>, RemoveUsersArgs> =>
  useMutation({
    mutationFn: (data) => removeUsers(data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: queries.users.settings.queryKey })
      const previousUsers = queryClient.getQueryData(queries.users.settings.queryKey)
      const splittedEmails = data.emails.split(',')

      queryClient.setQueryData<SettingsUser[]>(queries.users.settings.queryKey, (oldData) => {
        if (!oldData) return []

        return oldData.filter((item) => !splittedEmails.includes(item.email || ''))
      })

      return { previousUsers }
    },
    onError: (error, _, context) => {
      queryClient.setQueryData(queries.users.settings.queryKey, context?.previousUsers)

      console.error(error)
    },
  })
