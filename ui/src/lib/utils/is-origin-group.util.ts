import type { GroupPayloadClass } from '@/generated/types'

export const isOriginGroup = (groupClass?: GroupPayloadClass): boolean =>
  groupClass === 'bookable' || groupClass === 'standard'
