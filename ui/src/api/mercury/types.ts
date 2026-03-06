import type { Manifest } from '@/types/manifest.type'

export type GetAuthDocsResponse = {
  success: boolean
  docsUrl: string
}

export type GetAuthContactResponse = {
  success: boolean
  contactUrl: string
}

export type UploadFileResponse = {
  success: true
  resources: {
    file: {
      date: string
      plugin: string
      id: string
      name: string
      href: string
    }
  }
}

export type GetManifestResponse = {
  success: boolean
  manifest: Manifest
}

export type UploadFileArgs = {
  type: string
  file: File
}

export type GetAdditionalUrlResponse = {
  success: boolean
  additionalUrl: string
}
