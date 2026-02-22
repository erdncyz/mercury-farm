import type { ReactElement, ReactNode } from 'react'

export type TabsContent = {
  id: string
  title: string
  before?: ReactNode
  status?: ReactElement | number
  ariaControls: string
  disabled?: boolean
  content: ReactNode
}
