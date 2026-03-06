import axios from 'axios'

import { variablesConfig } from '@/config/variables.config'

import { attachTokenOnRequest, extractMessageOnErrorResponse, logoutOnErrorResponse } from '../interceptors'

export const mercuryClient = axios.create({
  baseURL: variablesConfig[import.meta.env.MODE].openStfApiHostUrl,
  withCredentials: true,
})

mercuryClient.interceptors.request.use((config) => attachTokenOnRequest(config))
mercuryClient.interceptors.response.use((response) => response, logoutOnErrorResponse)
mercuryClient.interceptors.response.use(
  (response) => response,
  (error) => extractMessageOnErrorResponse(error)
)
