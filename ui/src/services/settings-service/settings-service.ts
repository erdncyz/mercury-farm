import { makeAutoObservable, runInAction } from 'mobx'
import { inject, injectable } from 'inversify'

import { socket } from '@/api/socket'

import { debounce } from '@/lib/utils/debounce.util'
import { CONTAINER_IDS } from '@/config/inversify/container-ids'
import { queryClient } from '@/config/queries/query-client'
import { queries } from '@/config/queries/query-key-store'

import type { AlertMessage, User } from '@/generated/types'
import type { MobxQueryFactory } from '@/types/mobx-query-factory.type'
import type { CurrentUserProfileStore } from '@/store/current-user-profile-store'
import type { UserSettingsUpdateMessage } from '@/types/user-settings-update-message.type'

const DEFAULT_DATE_FORMAT = 'M/d/yy h:mm:ss a'
const DEFAULT_EMAIL_SEPARATOR = ','
export const RUNTIME_PROFILE_OPTIONS = ['aggressive', 'balanced', 'quality'] as const
export type RuntimeProfileOption = (typeof RUNTIME_PROFILE_OPTIONS)[number]

const ANDROID_RUNTIME_PRESETS: Record<RuntimeProfileOption, { screenFrameRate: number; screenJpegQuality: number }> = {
  aggressive: {
    screenFrameRate: 20,
    screenJpegQuality: 10,
  },
  balanced: {
    screenFrameRate: 25,
    screenJpegQuality: 15,
  },
  quality: {
    screenFrameRate: 30,
    screenJpegQuality: 30,
  },
}

const IOS_RUNTIME_PRESETS: Record<
  RuntimeProfileOption,
  {
    touchWatchdogTimeoutMs: number
    wdaRequestTimeoutMs: number
    wdaSessionTimeoutMs: number
    actionTimeoutRecoveryThreshold: number
    touchRecoveryCooldownMs: number
    wdaLeanMode: boolean
    wdaMjpegQuality: number
    wdaMjpegScaling: number
    wdaTreeCacheMs: number
    typeKeyDelayMs: number
  }
> = {
  aggressive: {
    touchWatchdogTimeoutMs: 7000,
    wdaRequestTimeoutMs: 12000,
    wdaSessionTimeoutMs: 25000,
    actionTimeoutRecoveryThreshold: 2,
    touchRecoveryCooldownMs: 3000,
    wdaLeanMode: true,
    wdaMjpegQuality: 15,
    wdaMjpegScaling: 30,
    wdaTreeCacheMs: 500,
    typeKeyDelayMs: 60,
  },
  balanced: {
    touchWatchdogTimeoutMs: 10000,
    wdaRequestTimeoutMs: 15000,
    wdaSessionTimeoutMs: 30000,
    actionTimeoutRecoveryThreshold: 3,
    touchRecoveryCooldownMs: 5000,
    wdaLeanMode: true,
    wdaMjpegQuality: 40,
    wdaMjpegScaling: 50,
    wdaTreeCacheMs: 500,
    typeKeyDelayMs: 80,
  },
  quality: {
    touchWatchdogTimeoutMs: 15000,
    wdaRequestTimeoutMs: 25000,
    wdaSessionTimeoutMs: 45000,
    actionTimeoutRecoveryThreshold: 4,
    touchRecoveryCooldownMs: 7000,
    wdaLeanMode: false,
    wdaMjpegQuality: 85,
    wdaMjpegScaling: 100,
    wdaTreeCacheMs: 1000,
    typeKeyDelayMs: 120,
  },
}

const DEFAULT_ANDROID_RUNTIME_SETTINGS = {
  ...ANDROID_RUNTIME_PRESETS.aggressive,
}
const DEFAULT_IOS_RUNTIME_SETTINGS = {
  ...IOS_RUNTIME_PRESETS.aggressive,
}
const DEFAULT_ALERT_MESSAGE: AlertMessage = {
  data: '*** This site is currently under maintenance, please wait ***',
  activation: 'False',
  level: 'Critical',
}

@injectable()
export class SettingsService {
  static checkedToText(checked: boolean): string {
    return checked === true ? 'True' : 'False'
  }
  private alertMessageQuery
  private debounceDelay = 250

  dateFormat = DEFAULT_DATE_FORMAT
  emailSeparator = DEFAULT_EMAIL_SEPARATOR
  alertMessage = DEFAULT_ALERT_MESSAGE
  androidRuntimeSettings = DEFAULT_ANDROID_RUNTIME_SETTINGS
  iosRuntimeSettings = DEFAULT_IOS_RUNTIME_SETTINGS
  androidRuntimeProfile: RuntimeProfileOption = 'aggressive'
  iosRuntimeProfile: RuntimeProfileOption = 'aggressive'

  private debouncedAlertMessage = debounce(this.updateAlertMessage, this.debounceDelay)
  private debouncedDateFormat = debounce(this.updateDateFormat, this.debounceDelay)
  private debouncedEmailSeparator = debounce(this.updateEmailSeparator, this.debounceDelay)
  private debouncedAndroidRuntimeSettings = debounce(this.updateAndroidRuntimeSettings, this.debounceDelay)
  private debouncedIosRuntimeSettings = debounce(this.updateIosRuntimeSettings, this.debounceDelay)

  constructor(
    @inject(CONTAINER_IDS.currentUserProfileStore) private currentUserProfileStore: CurrentUserProfileStore,
    @inject(CONTAINER_IDS.factoryMobxQuery) mobxQueryFactory: MobxQueryFactory
  ) {
    makeAutoObservable(this)

    this.updateEmailSeparator = this.updateEmailSeparator.bind(this)
    this.onUserSettingsUpdate = this.onUserSettingsUpdate.bind(this)
    this.updateDateFormat = this.updateDateFormat.bind(this)
    this.updateAndroidRuntimeSettings = this.updateAndroidRuntimeSettings.bind(this)
    this.updateIosRuntimeSettings = this.updateIosRuntimeSettings.bind(this)

    this.alertMessageQuery = mobxQueryFactory(() => ({ ...queries.users.alertMessage }))

    this.addUserSettingsUpdateListeners()

    this.init()
  }

  get isAlertMessageActive(): boolean {
    return this.alertMessage.activation === 'True'
  }

  async init(): Promise<void> {
    const user = await this.currentUserProfileStore.fetch()
    const settings = user?.settings
    const alertMessage = await this.alertMessageQuery.fetch()
    const runtimeSettingsSource = settings as Record<string, unknown> | undefined
    const androidRuntimeSettings = runtimeSettingsSource?.androidRuntimeSettings as Record<string, unknown> | undefined
    const iosRuntimeSettings = runtimeSettingsSource?.iosRuntimeSettings as Record<string, unknown> | undefined

    runInAction(() => {
      if (settings?.dateFormat) {
        this.dateFormat = settings.dateFormat
      }

      if (settings?.emailAddressSeparator) {
        this.emailSeparator = settings.emailAddressSeparator
      }

      if (alertMessage) {
        this.alertMessage = { ...this.alertMessage, ...alertMessage }
      }

      if (androidRuntimeSettings) {
        const incomingAndroidProfile = String(androidRuntimeSettings.profile || '')
        if (RUNTIME_PROFILE_OPTIONS.includes(incomingAndroidProfile as RuntimeProfileOption)) {
          this.androidRuntimeProfile = incomingAndroidProfile as RuntimeProfileOption
          this.androidRuntimeSettings = { ...ANDROID_RUNTIME_PRESETS[this.androidRuntimeProfile] }
        } else {
          this.androidRuntimeSettings = { ...ANDROID_RUNTIME_PRESETS[this.androidRuntimeProfile] }
        }
      }

      if (iosRuntimeSettings) {
        const incomingIosProfile = String(iosRuntimeSettings.profile || '')
        if (RUNTIME_PROFILE_OPTIONS.includes(incomingIosProfile as RuntimeProfileOption)) {
          this.iosRuntimeProfile = incomingIosProfile as RuntimeProfileOption
          this.iosRuntimeSettings = { ...IOS_RUNTIME_PRESETS[this.iosRuntimeProfile] }
        } else {
          this.iosRuntimeSettings = { ...IOS_RUNTIME_PRESETS[this.iosRuntimeProfile] }
        }
      }
    })
  }

  addUserSettingsUpdateListeners(): void {
    socket.on('user.settings.users.updated', this.onUserSettingsUpdate)
    socket.on('user.view.users.updated', this.onUserSettingsUpdate)
  }

  removeUserSettingsUpdateListeners(): void {
    socket.off('user.settings.users.updated', this.onUserSettingsUpdate)
    socket.off('user.view.users.updated', this.onUserSettingsUpdate)
  }

  setDateFormat(value: string): void {
    this.dateFormat = value

    this.debouncedDateFormat(value)
  }

  setEmailSeparator(value: string): void {
    this.emailSeparator = value

    this.debouncedEmailSeparator(value)
  }

  setAlertMessage<T extends keyof AlertMessage>(key: T, data: AlertMessage[T]): void {
    this.alertMessage[key] = data

    if (key === 'data') {
      this.debouncedAlertMessage()

      return
    }

    this.updateAlertMessage()
  }

  updateLastUsedDevice(value: string): void {
    this.updateUserSettings({ lastUsedDevice: value })
  }

  updateDateFormat(value: string): void {
    this.updateUserSettings({ dateFormat: value })
  }

  updateEmailSeparator(value: string): void {
    this.updateUserSettings({ emailAddressSeparator: value })
  }

  updateAlertMessage(): void {
    this.updateUserSettings({ alertMessage: this.alertMessage })
  }

  setSelectedLanguage(value: string): void {
    this.updateUserSettings({ selectedLanguage: value })
  }

  setAndroidRuntimeSetting(key: keyof typeof DEFAULT_ANDROID_RUNTIME_SETTINGS, value: number): void {
    this.androidRuntimeSettings = {
      ...this.androidRuntimeSettings,
      [key]: value,
    }

    this.debouncedAndroidRuntimeSettings()
  }

  setAndroidRuntimeProfile(profile: RuntimeProfileOption): void {
    this.androidRuntimeProfile = profile
    this.androidRuntimeSettings = { ...ANDROID_RUNTIME_PRESETS[profile] }
    this.updateAndroidRuntimeSettings()
  }

  setIosRuntimeSetting(key: keyof typeof DEFAULT_IOS_RUNTIME_SETTINGS, value: number | boolean): void {
    this.iosRuntimeSettings = {
      ...this.iosRuntimeSettings,
      [key]: value,
    }

    this.debouncedIosRuntimeSettings()
  }

  setIosRuntimeProfile(profile: RuntimeProfileOption): void {
    this.iosRuntimeProfile = profile
    this.iosRuntimeSettings = { ...IOS_RUNTIME_PRESETS[profile] }
    this.updateIosRuntimeSettings()
  }

  resetToDefaults(): void {
    socket.emit('user.settings.reset')

    this.dateFormat = DEFAULT_DATE_FORMAT
    this.alertMessage = DEFAULT_ALERT_MESSAGE
    this.emailSeparator = DEFAULT_EMAIL_SEPARATOR
    this.androidRuntimeProfile = 'aggressive'
    this.iosRuntimeProfile = 'aggressive'
    this.androidRuntimeSettings = DEFAULT_ANDROID_RUNTIME_SETTINGS
    this.iosRuntimeSettings = DEFAULT_IOS_RUNTIME_SETTINGS

    this.updateUserSettings({
      dateFormat: DEFAULT_DATE_FORMAT,
      alertMessage: DEFAULT_ALERT_MESSAGE,
      emailAddressSeparator: DEFAULT_EMAIL_SEPARATOR,
      androidRuntimeSettings: {
        ...DEFAULT_ANDROID_RUNTIME_SETTINGS,
        profile: 'aggressive',
      },
      iosRuntimeSettings: {
        ...DEFAULT_IOS_RUNTIME_SETTINGS,
        profile: 'aggressive',
      },
    })
  }

  updateAndroidRuntimeSettings(): void {
    this.updateUserSettings({
      androidRuntimeSettings: {
        ...this.androidRuntimeSettings,
        profile: this.androidRuntimeProfile,
      },
    })
  }

  updateIosRuntimeSettings(): void {
    this.updateUserSettings({
      iosRuntimeSettings: {
        ...this.iosRuntimeSettings,
        profile: this.iosRuntimeProfile,
      },
    })
  }

  private onUserSettingsUpdate({ user }: UserSettingsUpdateMessage): void {
    if (user.settings.alertMessage) {
      this.alertMessage = user.settings.alertMessage
    }

    if (user.email === this.currentUserProfileStore.profileQueryResult.data?.email) {
      queryClient.setQueryData<User>(queries.user.profile.queryKey, (oldData) => {
        if (!oldData) return oldData

        return {
          ...oldData,
          groups: {
            ...oldData.groups,
            ...user.groups,
          },
        }
      })
    }
  }

  private updateUserSettings<T>(data: Record<string, T>): void {
    socket.emit('user.settings.update', data)
  }
}
