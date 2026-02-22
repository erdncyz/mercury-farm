import { autorun, createAtom } from 'mobx'
import { MutationObserver } from '@tanstack/react-query'

import type {
  QueryClient,
  DefaultError,
  MutateOptions,
  MutationObserverResult,
  MutationObserverOptions,
} from '@tanstack/query-core'

export class MobxMutation<TData = unknown, TError = DefaultError, TVariables = void, TContext = unknown> {
  private atom = createAtom(
    'MobxMutation',
    () => this.subscribe(),
    () => this.unsubscribe()
  )

  private unsubscribeFn: VoidFunction
  private mutationObserver: MutationObserver<TData, TError, TVariables, TContext>

  constructor(
    private options: MutationObserverOptions<TData, TError, TVariables, TContext>,
    private queryClient: QueryClient
  ) {
    this.mutationObserver = new MutationObserver(this.queryClient, this.options)
    this.unsubscribeFn = (): void => {}
  }

  mutate(variables: TVariables, mutateOptions?: MutateOptions<TData, TError, TVariables, TContext>): Promise<TData> {
    return this.mutationObserver.mutate(variables, mutateOptions)
  }

  public get response(): MutationObserverResult<TData, TError, TVariables, TContext> {
    this.atom.reportObserved()

    return this.mutationObserver.getCurrentResult()
  }

  public get isPending(): boolean {
    return this.response.isPending
  }

  private subscribe(): void {
    const unsubscribeReaction = autorun(() => {
      this.mutationObserver.setOptions(this.options)
    })

    const unsubscribeObserver = this.mutationObserver.subscribe(() => {
      this.atom.reportChanged()
    })

    this.unsubscribeFn = (): void => {
      unsubscribeObserver()
      unsubscribeReaction()
    }
  }

  private unsubscribe(): void {
    this.unsubscribeFn()
  }
}
