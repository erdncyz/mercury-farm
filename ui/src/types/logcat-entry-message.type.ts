import type { LogPriority } from './enums/log-priority.enum'

export type LogcatEntryMessage = {
  serial: string
  priority: LogPriority
  date: number
  pid: number
  tid: number
  tag: string
  message: string
}
