import { useMutation } from '@tanstack/react-query'

import { revokeAdmin } from '@/api/openstf-api'

import { queries } from '@/config/queries/query-key-store'
import { queryClient } from '@/config/queries/query-client'

import type { AxiosError } from 'axios'
import type { SettingsUser } from '@/types/settings-user.type'
import type { UseMutationResult } from '@tanstack/react-query'
import type { UnexpectedErrorResponse } from '@/generated/types'

export const useRevokeAdmin = (): UseMutationResult<boolean, AxiosError<UnexpectedErrorResponse>, string> =>
  useMutation({
    mutationFn: (data) => revokeAdmin(data),
    onMutate: async (email) => {
      await queryClient.cancelQueries({ queryKey: queries.users.settings.queryKey })
      const previousUsers = queryClient.getQueryData(queries.users.settings.queryKey)

      queryClient.setQueryData<SettingsUser[]>(queries.users.settings.queryKey, (oldData) => {
        if (!oldData) return []

        return oldData.map((item): SettingsUser => {
          if (item.email === email) {
            return { ...item, privilege: 'user' }
          }

          return item
        })
      })

      return { previousUsers }
    },
    onError: (error, _, context) => {
      queryClient.setQueryData(queries.users.settings.queryKey, context?.previousUsers)

      console.error(error)
    },
  })
