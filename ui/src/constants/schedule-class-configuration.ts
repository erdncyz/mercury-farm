import type { GroupPayloadClass } from '@/generated/types'
import type { SelectOption } from '@/components/lib/base-select'

const FIVE_MIN = 300 * 1000
const ONE_HOUR = 3600 * 1000
const ONE_DAY = 24 * ONE_HOUR
const ONE_WEEK = 7 * ONE_DAY
const ONE_MONTH = 30 * ONE_DAY
const ONE_QUARTER = 3 * ONE_MONTH
const ONE_HALF_YEAR = 6 * ONE_MONTH
const ONE_YEAR = 365 * ONE_DAY

type ClassConfiguration = {
  name: string
  value: GroupPayloadClass
  privilege: string
  duration: number
}

export const CLASS_CONFIGURATIONS: ClassConfiguration[] = [
  { name: 'Once', value: 'once', privilege: 'user', duration: Infinity },
  { name: 'Hourly', value: 'hourly', privilege: 'user', duration: ONE_HOUR },
  { name: 'Daily', value: 'daily', privilege: 'user', duration: ONE_DAY },
  { name: 'Weekly', value: 'weekly', privilege: 'user', duration: ONE_WEEK },
  { name: 'Monthly', value: 'monthly', privilege: 'user', duration: ONE_MONTH },
  { name: 'Quaterly', value: 'quaterly', privilege: 'user', duration: ONE_QUARTER },
  { name: 'Halfyearly', value: 'halfyearly', privilege: 'user', duration: ONE_HALF_YEAR },
  { name: 'Yearly', value: 'yearly', privilege: 'user', duration: ONE_YEAR },
  { name: 'Debug', value: 'debug', privilege: 'admin', duration: FIVE_MIN },
  { name: 'Bookable', value: 'bookable', privilege: 'admin', duration: Infinity },
  { name: 'Standard', value: 'standard', privilege: 'admin', duration: Infinity },
]

export const USER_CLASS_OPTIONS: SelectOption<GroupPayloadClass>[] = CLASS_CONFIGURATIONS.filter(
  ({ privilege }) => privilege === 'user'
).map(({ name, value }) => ({ name, value }))

export const ADMIN_CLASS_OPTIONS: SelectOption<GroupPayloadClass>[] = CLASS_CONFIGURATIONS.map(({ name, value }) => ({
  name,
  value,
}))
