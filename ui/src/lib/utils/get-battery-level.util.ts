export const getBatteryLevel = (batteryLevel: number, batteryScale: number): number =>
  Math.floor((batteryLevel / batteryScale) * 100)
