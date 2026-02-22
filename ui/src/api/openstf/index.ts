import { openstfClient } from './openstf-client'
import { jsonToFormData } from '@/lib/utils/json-to-form-data.util'

import { OPENSTF_ROUTES } from './routes'

import type {
  UploadFileResponse,
  GetAuthDocsResponse,
  GetAuthContactResponse,
  GetManifestResponse,
  UploadFileArgs,
  GetAdditionalUrlResponse,
} from './types'

export const getAuthDocs = async (): Promise<string> => {
  const { data } = await openstfClient.get<GetAuthDocsResponse>(OPENSTF_ROUTES.authDocs)

  return data.docsUrl
}

export const getAuthContact = async (): Promise<string> => {
  const { data } = await openstfClient.get<GetAuthContactResponse>(OPENSTF_ROUTES.authContact)

  return data.contactUrl
}

export const uploadFile = async ({ type, file }: UploadFileArgs): Promise<UploadFileResponse> => {
  const { data } = await openstfClient.post<UploadFileResponse>(
    `${OPENSTF_ROUTES.uploadFile}/${type}`,
    jsonToFormData({ file }),
    { headers: { ['Content-Type']: 'multipart/form-data' } }
  )

  return data
}

export const getManifest = async (href: string): Promise<GetManifestResponse> => {
  const { data } = await openstfClient.get<GetManifestResponse>(`${href}/manifest`)

  return data
}

export const downloadFile = async (href: string): Promise<Blob> => {
  const { data } = await openstfClient.get<Blob>(`${href}?download`, { responseType: 'blob' })

  return data
}

export const additionalUrl = async (): Promise<string> => {
  const { data } = await openstfClient.get<GetAdditionalUrlResponse>(OPENSTF_ROUTES.additionalUrl)

  return data.additionalUrl
}
