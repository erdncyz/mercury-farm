import axios from 'axios'

import { variablesConfig } from '@/config/variables.config'

import { attachTokenOnRequest, extractMessageOnErrorResponse, logoutOnErrorResponse } from '../interceptors'

export const mercuryApiClient = axios.create({
  baseURL: `${variablesConfig[import.meta.env.MODE].openStfApiHostUrl}/api/v1`,
  withCredentials: true,
})

mercuryApiClient.interceptors.request.use((config) => attachTokenOnRequest(config))
mercuryApiClient.interceptors.response.use((response) => response, logoutOnErrorResponse)
mercuryApiClient.interceptors.response.use(
  (response) => response,
  (error) => extractMessageOnErrorResponse(error)
)
