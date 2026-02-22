export type Manifest = {
  versionCode: number
  versionName: string
  installLocation: number
  compileSdkVersion: number
  compileSdkVersionCodename: string
  package: string
  platformBuildVersionCode: number
  platformBuildVersionName: number
  usesPermissions: UsesPermission[]
  permissions: Permission[]
  permissionTrees: unknown[]
  permissionGroups: unknown[]
  instrumentation: unknown
  usesSdk: UsesSdk
  usesConfiguration: unknown
  usesFeatures: UsesFeature[]
  supportsScreens: SupportsScreens
  compatibleScreens: unknown[]
  supportsGlTextures: unknown[]
  application: Application
}

export type UsesPermission = {
  name: string
}

export type Permission = {
  name: string
  protectionLevel: number
}

export type UsesSdk = {
  minSdkVersion: number
  targetSdkVersion: number
}

export type UsesFeature = {
  name?: string
  required: boolean
  glEsVersion?: number
}

export type SupportsScreens = {
  anyDensity: boolean
  smallScreens: boolean
  normalScreens: boolean
  largeScreens: boolean
  resizeable: boolean
  xlargeScreens: boolean
}

export type Application = {
  theme?: string
  label?: string
  icon?: string
  name: string
  manageSpaceActivity?: string
  backupAgent?: string
  allowBackup?: boolean
  restoreAnyVersion?: boolean
  hardwareAccelerated?: string
  largeHeap?: boolean
  supportsRtl?: boolean
  extractNativeLibs?: boolean
  usesCleartextTraffic?: boolean
  roundIcon?: string
  appComponentFactory?: string
  allowAudioPlaybackCapture?: boolean
  requestLegacyExternalStorage?: boolean
  preserveLegacyExternalStorage?: boolean
  activities: Activity[]
  activityAliases: ActivityAlias[]
  launcherActivities: LauncherActivity[]
  leanbackLauncherActivities: unknown[]
  services: Service[]
  receivers: Receiver[]
  providers: Provider[]
  usesLibraries: UsesLibrary[]
}

export type Activity = {
  name: string
  exported?: boolean
  intentFilters: IntentFilter[]
  metaData: MetaData[]
  theme?: string
  launchMode?: number
  configChanges?: number
  windowSoftInputMode?: number
  hardwareAccelerated?: string
  allowEmbedded?: boolean
  documentLaunchMode?: number
  resizeableActivity?: boolean
  stateNotNeeded?: boolean
  excludeFromRecents?: boolean
  taskAffinity?: string
}

export type IntentFilter = {
  actions: Action[]
  categories: Category[]
  data: Data[]
  icon?: string
  priority?: number
  roundIcon?: string
}

export type Action = {
  name: string
}

export type Category = {
  name: string
}

export type Data = {
  mimeType?: string
  scheme?: string
  host?: string
  port?: string
  path?: string
  pathPrefix?: string
  pathPattern?: string
}

export type ActivityAlias = {
  name: string
  enabled?: boolean
  exported: boolean
  targetActivity: string
  intentFilters: IntentFilter[]
  metaData: MetaData[]
  permission?: string
  icon?: string
  roundIcon?: string
}

export type LauncherActivity = {
  name: string
  enabled: boolean
  exported: boolean
  targetActivity: string
  intentFilters: IntentFilter[]
  metaData: MetaData[]
  icon?: string
  roundIcon?: string
}

export type Service = {
  name: string
  exported: boolean
  intentFilters: IntentFilter[]
  metaData: MetaData[]
  enabled?: boolean
  foregroundServiceType?: number
  permission?: string
  visibleToInstantApps?: boolean
  directBootAware?: boolean
}

export type Receiver = {
  name: string
  enabled?: boolean
  exported?: boolean
  intentFilters: IntentFilter[]
  metaData: MetaData[]
  permission?: string
}

export type Provider = {
  name: string
  exported: boolean
  authorities: string
  grantUriPermissions: unknown[]
  metaData: MetaData[]
  pathPermissions: unknown[]
  initOrder?: number
  directBootAware?: boolean
}

export type MetaData = {
  name: string
  resource?: string
  value?: string
}

export type UsesLibrary = {
  name: string
  required: boolean
}
