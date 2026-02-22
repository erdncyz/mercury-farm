export type TouchDownArgs = {
  seq: number
  contact: number
  x: number
  y: number
  pressure: number
}

export type TouchMoveIosArgs = {
  x: number
  y: number
  pX: number
  pY: number
  pressure: number
  contact: number
  seq: number
  duration?: number
}

export type TouchMoveArgs = {
  seq: number
  contact: number
  x: number
  y: number
  pressure: number
}
