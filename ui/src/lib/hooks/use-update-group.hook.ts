import { useInjection } from 'inversify-react'
import { useMutation } from '@tanstack/react-query'

import { updateGroup } from '@/api/openstf-api'

import { queries } from '@/config/queries/query-key-store'
import { queryClient } from '@/config/queries/query-client'
import { CONTAINER_IDS } from '@/config/inversify/container-ids'

import type { AxiosError } from 'axios'
import type { UseMutationResult } from '@tanstack/react-query'
import type { ConflictsResponse, GroupListResponseGroupsItem, GroupPayload } from '@/generated/types'

export const useUpdateGroup = (
  groupId: string
): UseMutationResult<boolean, AxiosError<ConflictsResponse>, Partial<GroupPayload>> => {
  const groupItemService = useInjection(CONTAINER_IDS.groupItemService)

  return useMutation({
    mutationFn: (data) => updateGroup(groupId, data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: queries.groups.all.queryKey })
      const previousGroups = queryClient.getQueryData(queries.groups.all.queryKey)

      queryClient.setQueryData<GroupListResponseGroupsItem[]>(queries.groups.all.queryKey, (oldData) => {
        if (!oldData) return []

        return oldData.map((item): GroupListResponseGroupsItem => {
          if (item.id === groupId) {
            const changedData: Partial<GroupListResponseGroupsItem> = {
              ...(data.class && { class: data.class }),
              ...(data.name && { name: data.name }),
              ...(data.repetitions && { repetitions: data.repetitions }),
              ...(data.startTime && data.stopTime && { dates: [{ start: data.startTime, stop: data.stopTime }] }),
              ...(data.state && { state: data.state }),
            }

            return { ...item, ...changedData }
          }

          return item
        })
      })

      return { previousGroups }
    },
    onError: (error, _, context) => {
      queryClient.setQueryData(queries.groups.all.queryKey, context?.previousGroups)

      if (error.response?.status === 409) {
        groupItemService.setConflicts(error.response.data.conflicts)
      }

      console.error(error)
    },
  })
}
