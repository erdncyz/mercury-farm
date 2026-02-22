import { makeAutoObservable } from 'mobx'
import { inject, injectable } from 'inversify'

import { queries } from '@/config/queries/query-key-store'
import { CONTAINER_IDS } from '@/config/inversify/container-ids'
import i18n, { SUPPORTED_LANGUAGES } from '@/config/i18n/i18n'

import type { User } from '@/generated/types'
import type { QueryObserverResult } from '@tanstack/react-query'
import type { MobxQueryFactory } from '@/types/mobx-query-factory.type'

@injectable()
export class CurrentUserProfileStore {
  private profileQuery

  constructor(@inject(CONTAINER_IDS.factoryMobxQuery) mobxQueryFactory: MobxQueryFactory) {
    makeAutoObservable(this)

    this.profileQuery = mobxQueryFactory(() => ({ ...queries.user.profile, staleTime: Infinity }))
  }

  get profileQueryResult(): QueryObserverResult<User | undefined> {
    return this.profileQuery.result
  }

  get isAdmin(): boolean {
    return this.profileQueryResult.data?.privilege === 'admin'
  }

  async fetch(): Promise<User | undefined> {
    const user = await this.profileQuery.fetch()
    const selectedLanguage = user?.settings?.selectedLanguage

    if (selectedLanguage && SUPPORTED_LANGUAGES.includes(selectedLanguage as (typeof SUPPORTED_LANGUAGES)[number])) {
      void i18n.changeLanguage(selectedLanguage)
    }

    return user
  }
}
