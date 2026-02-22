import { METADATA_REQUIRES_CONNECTION } from '@/config/inversify/decorators'

export const isRequiredDeviceConnection = <T extends object>(service: T): boolean =>
  !!Reflect.getMetadata(METADATA_REQUIRES_CONNECTION, service.constructor)
