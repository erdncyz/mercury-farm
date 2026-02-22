export const getExpireTime = (startDate: string, offsetMilliseconds: number): Date =>
  new Date(new Date(startDate).getTime() + offsetMilliseconds)
