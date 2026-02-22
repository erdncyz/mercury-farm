import { useMutation } from '@tanstack/react-query'

import { createGroup } from '@/api/openstf-api'

import type { AxiosError } from 'axios'
import type { UseMutationResult } from '@tanstack/react-query'
import type { UnexpectedErrorResponse } from '@/generated/types'

export const useCreateGroup = (): UseMutationResult<boolean, AxiosError<UnexpectedErrorResponse>, void> =>
  useMutation({
    mutationFn: () => createGroup(),
  })
