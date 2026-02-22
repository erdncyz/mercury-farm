import { useMutation } from '@tanstack/react-query'

import { removeDevices } from '@/api/openstf-api'

import { queries } from '@/config/queries/query-key-store'
import { queryClient } from '@/config/queries/query-client'

import type { AxiosError } from 'axios'
import type { UseMutationResult } from '@tanstack/react-query'
import type { RemoveDevicesArgs } from '@/api/openstf-api/types'
import type { UnexpectedErrorResponse } from '@/generated/types'
import type { SettingsDevice } from '@/types/settings-device.type'

export const useRemoveDevices = (): UseMutationResult<
  boolean,
  AxiosError<UnexpectedErrorResponse>,
  RemoveDevicesArgs
> =>
  useMutation({
    mutationFn: (data) => removeDevices(data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: queries.devices.settings.queryKey })
      const previousDevices = queryClient.getQueryData(queries.devices.settings.queryKey)
      const splittedIds = data.ids.split(',')

      queryClient.setQueryData<SettingsDevice[]>(queries.devices.settings.queryKey, (oldData) => {
        if (!oldData) return []

        return oldData.filter((item) => !splittedIds.includes(item.serial))
      })

      return { previousDevices }
    },
    onError: (error, _, context) => {
      queryClient.setQueryData(queries.devices.settings.queryKey, context?.previousDevices)

      console.error(error)
    },
  })
