import { mercuryApiClient } from './mercury-api-client'
import { isOriginGroup } from '@/lib/utils/is-origin-group.util'

import {
  DEVICE_SETTINGS_FIELDS,
  DEVICE_GROUPS_FIELDS,
  DEVICE_LIST_FIELDS,
  USERS_GROUPS_FIELDS,
  DEVICE_SHELL_FIELDS,
  USERS_SETTINGS_FIELDS,
  USERS_TEAMS_FIELDS,
  GROUPS_TEAMS_FIELDS,
} from '@/constants/request-fields'

import { MERCURY_API_ROUTES } from './routes'

import type { ShellDevice } from '@/types/shell-device.type'
import type { SettingsUser } from '@/types/settings-user.type'
import type { SettingsDevice } from '@/types/settings-device.type'
import type { GroupUser } from '@/types/group-user.type'
import type {
  GroupUserArgs,
  CreateUserArgs,
  RemoveUserArgs,
  GroupDeviceArgs,
  RemoveUsersArgs,
  RemoveDeviceArgs,
  UpdateDeviceArgs,
  RemoveDevicesArgs,
  ParamsWithoutFields,
  GroupDeviceWithClassArgs,
  UsersWithFieldsListResponse,
  DeviceWithFieldsListResponse,
  UpdateUserGroupQuotaArgs,
  TeamUserArgs,
  TeamGroupArgs,
} from './types'
import type { GroupDevice } from '@/types/group-device.type'
import type { ListDevice } from '@/types/list-device.type'
import type {
  User,
  Device,
  UserResponse,
  GroupPayload,
  GroupResponse,
  DeviceResponse,
  GetUsersParams,
  GetGroupsParams,
  DefaultResponse,
  AdbPortResponse,
  AdbRangeResponse,
  GetDevicesParams,
  UserListResponse,
  GroupListResponse,
  AccessTokensResponse,
  GetDeviceBySerialParams,
  GroupListResponseGroupsItem,
  UpdateDefaultUserGroupsQuotasParams,
  AlertMessageResponse,
  AlertMessage,
  Token,
  Team,
  TeamsResponse,
  TeamPayload,
  TeamResponse,
  GetGroupParams,
} from '@/generated/types'
import type { TeamUser } from '@/types/team-user.type'
import type { TeamGroup } from '@/types/team-group.type'

const getDevices = async <T>(params?: GetDevicesParams): Promise<T[]> => {
  const { data } = await mercuryApiClient.get<DeviceWithFieldsListResponse<T>>(MERCURY_API_ROUTES.devices, { params })

  return data.devices
}

const getUsers = async <T>(params?: GetUsersParams): Promise<T[]> => {
  const { data } = await mercuryApiClient.get<UsersWithFieldsListResponse<T>>(MERCURY_API_ROUTES.users, { params })

  return data.users
}

const addOriginGroupDevice = async ({ serial, groupId }: GroupDeviceArgs): Promise<boolean> => {
  const { data } = await mercuryApiClient.put<DeviceResponse>(MERCURY_API_ROUTES.deviceGroup(groupId, serial))

  return data.success
}

const addTransientGroupDevice = async ({ serial, groupId }: GroupDeviceArgs): Promise<boolean> => {
  const { data } = await mercuryApiClient.put<GroupResponse>(MERCURY_API_ROUTES.groupDevice(groupId, serial))

  return data.success
}

const removeTransientGroupDevice = async ({ serial, groupId }: GroupDeviceArgs): Promise<boolean> => {
  const { data } = await mercuryApiClient.delete<GroupResponse>(MERCURY_API_ROUTES.groupDevice(groupId, serial))

  return data.success
}

const removeOriginGroupDevice = async ({ serial, groupId }: GroupDeviceArgs): Promise<boolean> => {
  const { data } = await mercuryApiClient.delete<DeviceResponse>(MERCURY_API_ROUTES.deviceGroup(groupId, serial))

  return data.success
}

export const getListDevices = (params?: ParamsWithoutFields<GetDevicesParams>): Promise<ListDevice[]> =>
  getDevices({ ...params, fields: DEVICE_LIST_FIELDS })

export const getGroupDevices = (params?: ParamsWithoutFields<GetDevicesParams>): Promise<GroupDevice[]> =>
  getDevices({ ...params, fields: DEVICE_GROUPS_FIELDS })

export const getSettingsDevices = (params?: ParamsWithoutFields<GetDevicesParams>): Promise<SettingsDevice[]> =>
  getDevices({ ...params, fields: DEVICE_SETTINGS_FIELDS })

export const getShellDevices = (params?: ParamsWithoutFields<GetDevicesParams>): Promise<ShellDevice[]> =>
  getDevices({ ...params, fields: DEVICE_SHELL_FIELDS })

export const getGroupUsers = (params?: ParamsWithoutFields<GetUsersParams>): Promise<GroupUser[]> =>
  getUsers({ ...params, fields: USERS_GROUPS_FIELDS })

export const getSettingsUsers = (params?: ParamsWithoutFields<GetUsersParams>): Promise<SettingsUser[]> =>
  getUsers({ ...params, fields: USERS_SETTINGS_FIELDS })

export const getGroups = async (params?: GetGroupsParams): Promise<GroupListResponseGroupsItem[]> => {
  const { data } = await mercuryApiClient.get<GroupListResponse>(MERCURY_API_ROUTES.groups, { params })

  return data.groups
}

export const createTeam = async (): Promise<boolean> => {
  const { data } = await mercuryApiClient.post<TeamResponse>(MERCURY_API_ROUTES.team, {})

  return data.success
}

export const getTeams = async (): Promise<Team[]> => {
  const { data } = await mercuryApiClient.get<TeamsResponse>(MERCURY_API_ROUTES.teams)

  return data.teams || []
}

export const updateTeam = async (id: string, data: TeamPayload): Promise<boolean> => {
  const {
    data: { success },
  } = await mercuryApiClient.post<TeamResponse>(`${MERCURY_API_ROUTES.team}/${id}`, data)

  return success
}

export const removeTeam = async (id: string): Promise<boolean> => {
  const { data } = await mercuryApiClient.delete<DefaultResponse>(MERCURY_API_ROUTES.teamDelete(id))

  return data.success
}

export const removeUserFromTeam = async ({ teamId, userEmail }: TeamUserArgs): Promise<boolean> => {
  if (!userEmail) throw new Error('User email is required to remove user')
  const { data } = await mercuryApiClient.delete<TeamResponse>(MERCURY_API_ROUTES.teamUser(teamId, userEmail))

  return data.success
}

export const removeGroupFromTeam = async ({ teamId, groupId }: TeamGroupArgs): Promise<boolean> => {
  if (!groupId) throw new Error('Group id is required to remove group')
  const { data } = await mercuryApiClient.delete<TeamResponse>(MERCURY_API_ROUTES.teamGroup(teamId, groupId))

  return data.success
}

export const getTeamUsers = (params?: ParamsWithoutFields<GetUsersParams>): Promise<TeamUser[]> =>
  getUsers({ ...params, fields: USERS_TEAMS_FIELDS })

export const getTeamGroups = (params?: ParamsWithoutFields<GetGroupParams>): Promise<TeamGroup[]> =>
  getGroups({ ...params, fields: GROUPS_TEAMS_FIELDS })

export const getDeviceBySerial = async (serial: string, params?: GetDeviceBySerialParams): Promise<Device> => {
  const { data } = await mercuryApiClient.get<DeviceResponse>(`${MERCURY_API_ROUTES.devices}/${serial}`, { params })

  return data.device
}

export const getCurrentUserProfile = async (): Promise<User | undefined> => {
  const { data } = await mercuryApiClient.get<UserResponse>(MERCURY_API_ROUTES.user)

  return data.user
}

export const getAccessTokens = async (): Promise<string[]> => {
  const { data } = await mercuryApiClient.get<AccessTokensResponse>(MERCURY_API_ROUTES.accessTokens)

  return data.titles?.reverse() || []
}

export const getAccessTokensByEmail = async (email: string): Promise<string[]> => {
  const { data } = await mercuryApiClient.get<{ success: boolean; titles: string[] }>(
    MERCURY_API_ROUTES.accessTokensByEmail(email)
  )

  return data.titles || []
}

export const getAccessTokenByTitle = async (title: string): Promise<Token | null> => {
  const { data } = await mercuryApiClient.post<{ token: Token }>(MERCURY_API_ROUTES.accessTokenByTitle, { title })

  return data.token || null
}

export const getUsersInGroup = async ({ groupId }: GroupUserArgs): Promise<GroupUser[]> => {
  const { data } = await mercuryApiClient.get<UsersWithFieldsListResponse<GroupUser>>(
    MERCURY_API_ROUTES.groupUser(groupId)
  )

  return data.users
}

export const addUserInGroup = async ({ groupId, userEmail }: GroupUserArgs): Promise<boolean> => {
  const { data } = await mercuryApiClient.put<GroupResponse>(MERCURY_API_ROUTES.groupUser(groupId, userEmail))

  return data.success
}

export const removeUserFromGroup = async ({ groupId, userEmail }: GroupUserArgs): Promise<boolean> => {
  const { data } = await mercuryApiClient.delete<GroupResponse>(MERCURY_API_ROUTES.groupUser(groupId, userEmail))

  return data.success
}

export const addDeviceToGroup = async ({ groupClass, groupId, serial }: GroupDeviceWithClassArgs): Promise<boolean> => {
  if (isOriginGroup(groupClass)) {
    return addOriginGroupDevice({ serial, groupId })
  }

  return addTransientGroupDevice({ serial, groupId })
}

export const removeDeviceFromGroup = async ({
  groupClass,
  groupId,
  serial,
}: GroupDeviceWithClassArgs): Promise<boolean> => {
  if (isOriginGroup(groupClass)) {
    return removeOriginGroupDevice({ serial, groupId })
  }

  return removeTransientGroupDevice({ serial, groupId })
}

export const createGroup = async (): Promise<boolean> => {
  const { data } = await mercuryApiClient.post<GroupResponse>(MERCURY_API_ROUTES.groups, { state: 'pending' })

  return data.success
}

export const removeGroup = async (id: string): Promise<boolean> => {
  const { data } = await mercuryApiClient.delete<DefaultResponse>(`${MERCURY_API_ROUTES.groups}/${id}`)

  return data.success
}

export const removeGroups = async (ids: string): Promise<boolean> => {
  const { data } = await mercuryApiClient.delete<DefaultResponse>(MERCURY_API_ROUTES.groups, {
    params: { _: Date.now() },
    data: ids ? { ids } : undefined,
  })

  return data.success
}

export const updateGroup = async (id: string, data: GroupPayload): Promise<boolean> => {
  const {
    data: { success },
  } = await mercuryApiClient.put<GroupResponse>(`${MERCURY_API_ROUTES.groups}/${id}`, data)

  return success
}

export const renewAdbPort = async (serial: string): Promise<number> => {
  const { data } = await mercuryApiClient.put<AdbPortResponse>(MERCURY_API_ROUTES.adbPort(serial))

  return data.port
}

export const updateDevice = async ({ serial, ...params }: UpdateDeviceArgs): Promise<boolean> => {
  const { data } = await mercuryApiClient.put<DefaultResponse>(
    MERCURY_API_ROUTES.updateStorageInfo(serial),
    undefined,
    {
      params,
    }
  )

  return data.success
}

export const removeDevice = async ({ serial, ...params }: RemoveDeviceArgs): Promise<boolean> => {
  const { data } = await mercuryApiClient.delete<DefaultResponse>(`${MERCURY_API_ROUTES.devices}/${serial}`, {
    params,
  })

  return data.success
}

export const removeDevices = async ({ ids, ...params }: RemoveDevicesArgs): Promise<boolean> => {
  const { data } = await mercuryApiClient.delete<DefaultResponse>(MERCURY_API_ROUTES.devices, {
    params,
    data: ids ? { ids } : undefined,
  })

  return data.success
}

export const getAdbRange = async (): Promise<string> => {
  const { data } = await mercuryApiClient.get<AdbRangeResponse>(MERCURY_API_ROUTES.adbRange)

  return data.adbRange
}

export const updateDefaultUserGroupsQuota = async (params: UpdateDefaultUserGroupsQuotasParams): Promise<boolean> => {
  const { data } = await mercuryApiClient.put<UserResponse>(MERCURY_API_ROUTES.defaultGroupsQuotas, undefined, {
    params,
  })

  return data.success
}

export const updateUserGroupQuota = async ({ email, ...params }: UpdateUserGroupQuotaArgs): Promise<boolean> => {
  const { data } = await mercuryApiClient.put<UserResponse>(MERCURY_API_ROUTES.userGroupQuota(email), undefined, {
    params,
  })

  return data.success
}

export const createUser = async ({ email, ...params }: CreateUserArgs): Promise<boolean> => {
  const { data } = await mercuryApiClient.post<UserResponse>(`${MERCURY_API_ROUTES.users}/${email}`, undefined, {
    params,
  })

  return data.success
}

export const removeUser = async ({ email, ...params }: RemoveUserArgs): Promise<boolean> => {
  const { data } = await mercuryApiClient.delete<DefaultResponse>(`${MERCURY_API_ROUTES.users}/${email}`, {
    params,
  })

  return data.success
}

export const removeUsers = async ({ emails, ...params }: RemoveUsersArgs): Promise<boolean> => {
  const { data } = await mercuryApiClient.delete<DefaultResponse>(MERCURY_API_ROUTES.users, {
    params,
    data: emails ? { emails } : undefined,
  })

  return data.success
}

export const grantAdmin = async (email: string): Promise<boolean> => {
  const { data } = await mercuryApiClient.post<UserListResponse>(MERCURY_API_ROUTES.grantAdmin(email))

  return data.success
}

export const revokeAdmin = async (email: string): Promise<boolean> => {
  const { data } = await mercuryApiClient.delete<UserListResponse>(MERCURY_API_ROUTES.revokeAdmin(email))

  return data.success
}

export const getAlertMessage = async (): Promise<AlertMessage> => {
  const { data } = await mercuryApiClient.get<AlertMessageResponse>(MERCURY_API_ROUTES.alertMessage)

  return data.alertMessage
}

export const addUserAsModerator = async ({ groupId, userEmail }: GroupUserArgs): Promise<boolean> => {
  if (!userEmail) throw new Error('User email is required to add moderator')

  const { data } = await mercuryApiClient.put<GroupResponse>(MERCURY_API_ROUTES.groupModerator(groupId, userEmail))

  return data.success
}

export const removeUserAsModerator = async ({ groupId, userEmail }: GroupUserArgs): Promise<boolean> => {
  if (!userEmail) throw new Error('User email is required to remove moderator')

  const { data } = await mercuryApiClient.delete<GroupResponse>(MERCURY_API_ROUTES.groupModerator(groupId, userEmail))

  return data.success
}

export type BookDeviceResponse = {
  success: boolean
  description: string
  serial: string
  bookedBy: string
  duration: number
  bookedUntil: string
}

export const bookDevice = async (serial: string, duration: number): Promise<BookDeviceResponse> => {
  const { data } = await mercuryApiClient.post<BookDeviceResponse>(MERCURY_API_ROUTES.bookDevice(serial), { duration })

  return data
}

export const releaseBooking = async (serial: string): Promise<{ success: boolean }> => {
  const { data } = await mercuryApiClient.delete<{ success: boolean }>(MERCURY_API_ROUTES.bookDevice(serial))

  return data
}
