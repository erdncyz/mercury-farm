import type { FormError } from '@/types/form-field-error.type'
import type { GroupListResponseGroupsItem, GroupPayloadClass } from '@/generated/types'
import type { ScheduleFormFields } from '@/components/ui/settings-tabs/groups-tab/group-item/tabs/schedule'

export type ScheduleFormErrors = {
  [K in ScheduleFormFields]?: FormError<K>
}

export type ScheduleData = {
  dateRange: [Date, Date]
  repetitions: number
  groupClass: GroupPayloadClass
}

export type SetScheduleDataArgs = Pick<GroupListResponseGroupsItem, 'dates' | 'repetitions' | 'class'>
