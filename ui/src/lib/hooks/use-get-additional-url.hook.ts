import { useQuery } from '@tanstack/react-query'

import { queries } from '@/config/queries/query-key-store'

import type { UseQueryResult } from '@tanstack/react-query'

export const useGetAdditionalUrl = (): UseQueryResult<string> =>
  useQuery({ ...queries.service.additionalUrl, staleTime: Infinity })
