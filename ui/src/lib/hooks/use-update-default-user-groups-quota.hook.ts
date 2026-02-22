import { useMutation } from '@tanstack/react-query'

import { updateDefaultUserGroupsQuota } from '@/api/openstf-api'

import { queries } from '@/config/queries/query-key-store'
import { queryClient } from '@/config/queries/query-client'

import type { AxiosError } from 'axios'
import type { UseMutationResult } from '@tanstack/react-query'
import type { UnexpectedErrorResponse, UpdateDefaultUserGroupsQuotasParams } from '@/generated/types'

export const useUpdateDefaultUserGroupsQuota = (): UseMutationResult<
  boolean,
  AxiosError<UnexpectedErrorResponse>,
  UpdateDefaultUserGroupsQuotasParams
> =>
  useMutation({
    mutationFn: (data) => updateDefaultUserGroupsQuota(data),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queries.users.settings.queryKey })
    },
  })
