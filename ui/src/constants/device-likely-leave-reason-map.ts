export const DEVICE_LIKELY_LEAVE_REASON: Record<string, string> = {
  ungroup_request: 'You (or someone else) kicked the device',
  owner_change: 'Someone stole your device',
  automatic_timeout: 'Device was kicked by automatic timeout',
  device_absent: 'Device is not present anymore for some reason',
  status_change: 'Device is present but offline',
}
