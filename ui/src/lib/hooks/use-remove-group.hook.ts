import { useMutation } from '@tanstack/react-query'

import { removeGroup } from '@/api/openstf-api'

import { queries } from '@/config/queries/query-key-store'
import { queryClient } from '@/config/queries/query-client'

import type { AxiosError } from 'axios'
import type { UseMutationResult } from '@tanstack/react-query'
import type { GroupListResponseGroupsItem, UnexpectedErrorResponse } from '@/generated/types'

export const useRemoveGroup = (): UseMutationResult<boolean, AxiosError<UnexpectedErrorResponse>, string> =>
  useMutation({
    mutationFn: (id) => removeGroup(id),
    onMutate: async (removedId) => {
      await queryClient.cancelQueries({ queryKey: queries.groups.all.queryKey })
      const previousGroups = queryClient.getQueryData(queries.groups.all.queryKey)

      queryClient.setQueryData<GroupListResponseGroupsItem[]>(queries.groups.all.queryKey, (oldData) => {
        if (!oldData) return []

        return oldData.filter((item) => item.id !== removedId)
      })

      return { previousGroups }
    },
    onError: (error, _, context) => {
      queryClient.setQueryData(queries.groups.all.queryKey, context?.previousGroups)

      console.error(error)
    },
  })
