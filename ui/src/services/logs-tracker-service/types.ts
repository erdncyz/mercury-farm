import type { LogcatEntryMessage } from '@/types/logcat-entry-message.type'

export type DeviceLogs = {
  logs: LogcatEntryMessage[]
  isLogcatStarted: boolean
}
