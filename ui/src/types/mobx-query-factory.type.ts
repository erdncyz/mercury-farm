import type { MobxQuery } from '@/store/mobx-query'
import type { DefaultError, QueryKey, QueryObserverOptions } from '@tanstack/react-query'

export type MobxQueryFactory = <
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  getOptions: () => QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
) => MobxQuery<TQueryFnData, TError, TData, TQueryData, TQueryKey>
