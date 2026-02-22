export const isRepetitionsGroup = (groupClass: string): boolean =>
  groupClass !== 'bookable' && groupClass !== 'standard' && groupClass !== 'once'
