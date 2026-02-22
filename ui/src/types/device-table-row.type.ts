import type { ListDevice } from './list-device.type'

export type DeviceTableRow = ListDevice & { needUpdate?: number }
