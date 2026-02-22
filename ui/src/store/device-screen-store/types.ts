export type StartScreenStreamingMessage = {
  length: number
  orientation: number
  pid: number
  quirks: {
    dumb: boolean
    alwaysUpright: boolean
    tear: boolean
  }
  alwaysUpright: boolean
  dumb: boolean
  tear: boolean
  realHeight: number
  realWidth: number
  version: number
  virtualHeight: number
  virtualWidth: number
}

export type ElementBoundSize = {
  width: number
  height: number
}
