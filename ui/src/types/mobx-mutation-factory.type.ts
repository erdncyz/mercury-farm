import type { MobxMutation } from '@/store/mobx-mutation'
import type { DefaultError, MutationObserverOptions } from '@tanstack/react-query'

export type MobxMutationFactory = <TData = unknown, TError = DefaultError, TVariables = void, TContext = unknown>(
  options: MutationObserverOptions<TData, TError, TVariables, TContext>
) => MobxMutation<TData, TError, TVariables, TContext>
