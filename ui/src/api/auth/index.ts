import { authClient } from './auth-client'

import { AUTH_ROUTES } from './routes'

import type { LdapAuthArgs, MockAuthArgs, AuthResponse, GetAuthUrlResponse } from './types'

export const mockAuth = async (body: MockAuthArgs): Promise<AuthResponse> => {
  const { data } = await authClient.post<AuthResponse>(AUTH_ROUTES.mock, body)

  return data
}

export const ldapAuth = async (body: LdapAuthArgs): Promise<AuthResponse> => {
  const { data } = await authClient.post<AuthResponse>(AUTH_ROUTES.ldap, body)

  return data
}

export const openIdAuth = async (): Promise<string> => {
  const { data } = await authClient.get<{ url: string }>(AUTH_ROUTES.openId)

  return data.url
}

export const openIdCallback = async (code: string): Promise<AuthResponse> => {
  const { data } = await authClient.post<AuthResponse>(AUTH_ROUTES.openIdCallback, undefined, { params: { code } })

  return data
}

export const getAuthUrl = async (): Promise<string> => {
  const { data } = await authClient.get<GetAuthUrlResponse>(AUTH_ROUTES.authUrl)

  return data.authUrl
}
