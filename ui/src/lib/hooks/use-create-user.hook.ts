import { useMutation } from '@tanstack/react-query'

import { createUser } from '@/api/openstf-api'

import type { AxiosError } from 'axios'
import type { CreateUserArgs } from '@/api/openstf-api/types'
import type { UseMutationResult } from '@tanstack/react-query'
import type { UnexpectedErrorResponse } from '@/generated/types'

export const useCreateUser = (): UseMutationResult<boolean, AxiosError<UnexpectedErrorResponse>, CreateUserArgs> =>
  useMutation({
    mutationFn: (data) => createUser(data),
  })
