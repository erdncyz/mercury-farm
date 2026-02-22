import { useMutation } from '@tanstack/react-query'

import { updateUserGroupQuota } from '@/api/openstf-api'

import { queries } from '@/config/queries/query-key-store'
import { queryClient } from '@/config/queries/query-client'

import type { AxiosError } from 'axios'
import type { SettingsUser } from '@/types/settings-user.type'
import type { UseMutationResult } from '@tanstack/react-query'
import type { UpdateUserGroupQuotaArgs } from '@/api/openstf-api/types'
import type { UnexpectedErrorResponse, UserGroupsQuotas } from '@/generated/types'

export const useUpdateUserGroupQuota = (): UseMutationResult<
  boolean,
  AxiosError<UnexpectedErrorResponse>,
  UpdateUserGroupQuotaArgs
> =>
  useMutation({
    mutationFn: (data) => updateUserGroupQuota(data),
    onMutate: async ({ email, number, repetitions, duration }) => {
      await queryClient.cancelQueries({ queryKey: queries.users.settings.queryKey })
      const previousUsers = queryClient.getQueryData(queries.users.settings.queryKey)

      queryClient.setQueryData<SettingsUser[]>(queries.users.settings.queryKey, (oldData) => {
        if (!oldData) return []

        return oldData.map((item): SettingsUser => {
          if (item.email === email) {
            const changedData: Partial<UserGroupsQuotas> = {
              ...(duration && { duration }),
              ...(number && { number }),
              ...(repetitions && { repetitions }),
            }

            return { ...item, groups: { ...item.groups, ...changedData } }
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
