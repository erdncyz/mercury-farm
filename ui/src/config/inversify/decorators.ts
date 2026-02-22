export const METADATA_REQUIRES_CONNECTION = 'requiresDeviceConnection'

export const deviceConnectionRequired =
  () =>
  <T extends abstract new (...args: any) => unknown>(target: T): void => {
    Reflect.defineMetadata(METADATA_REQUIRES_CONNECTION, true, target)
  }
