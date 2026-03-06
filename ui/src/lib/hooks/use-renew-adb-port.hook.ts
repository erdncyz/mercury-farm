import { useMutation } from '@tanstack/react-query'

import { renewAdbPort } from '@/api/mercury-api'

import type { AxiosError } from 'axios'
import type { UseMutationResult } from '@tanstack/react-query'
import type { UnexpectedErrorResponse } from '@/generated/types'

export const useRenewAdbPort = (): UseMutationResult<number, AxiosError<UnexpectedErrorResponse>, string> =>
  useMutation({
    mutationFn: (data) => renewAdbPort(data),
  })
