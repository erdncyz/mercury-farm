import { useMutation } from '@tanstack/react-query'

import { createUser } from '@/api/mercury-api'

import type { AxiosError } from 'axios'
import type { CreateUserArgs } from '@/api/mercury-api/types'
import type { UseMutationResult } from '@tanstack/react-query'
import type { UnexpectedErrorResponse } from '@/generated/types'

export const useCreateUser = (): UseMutationResult<boolean, AxiosError<UnexpectedErrorResponse>, CreateUserArgs> =>
  useMutation({
    mutationFn: (data) => createUser(data),
  })
