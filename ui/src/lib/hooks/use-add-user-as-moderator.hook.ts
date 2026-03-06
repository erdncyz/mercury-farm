import { useMutation, useQueryClient } from '@tanstack/react-query'

import { addUserAsModerator } from '@/api/mercury-api'

import { queries } from '@/config/queries/query-key-store'

import type { AxiosError } from 'axios'
import type { UseMutationResult } from '@tanstack/react-query'
import type { GroupUserArgs } from '@/api/mercury-api/types'
import type { UnexpectedErrorResponse } from '@/generated/types'

export const useAddUserAsModerator = (): UseMutationResult<
  boolean,
  AxiosError<UnexpectedErrorResponse>,
  GroupUserArgs
> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (args) => addUserAsModerator(args),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queries.groups.all.queryKey })
    },
  })
}
