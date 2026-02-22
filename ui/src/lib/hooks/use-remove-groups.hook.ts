import { useMutation } from '@tanstack/react-query'

import { removeGroups } from '@/api/openstf-api'

import { queries } from '@/config/queries/query-key-store'
import { queryClient } from '@/config/queries/query-client'

import type { AxiosError } from 'axios'
import type { UseMutationResult } from '@tanstack/react-query'
import type { GroupListResponseGroupsItem, UnexpectedErrorResponse } from '@/generated/types'

export const useRemoveGroups = (): UseMutationResult<boolean, AxiosError<UnexpectedErrorResponse>, string> =>
  useMutation({
    mutationFn: (ids) => removeGroups(ids),
    onMutate: async (removedIds) => {
      await queryClient.cancelQueries({ queryKey: queries.groups.all.queryKey })
      const previousGroups = queryClient.getQueryData(queries.groups.all.queryKey)
      const splittedIds = removedIds.split(',')

      queryClient.setQueryData<GroupListResponseGroupsItem[]>(queries.groups.all.queryKey, (oldData) => {
        if (!oldData) return []

        return oldData.filter((item) => !splittedIds.includes(item.id || ''))
      })

      return { previousGroups }
    },
    onError: (error, _, context) => {
      queryClient.setQueryData(queries.groups.all.queryKey, context?.previousGroups)

      console.error(error)
    },
  })
