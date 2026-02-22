import { cloneElement, useRef, useState } from 'react'
import cn from 'classnames'
import { Card } from '@vkontakte/vkui'

import { ConditionalRender } from '@/components/lib/conditional-render'

import { useClickOutside } from '@/lib/hooks/use-click-outside.hook'

import styles from './popover-container.module.css'

import type { MouseEvent, ReactElement, ReactNode } from 'react'

type PopoverContainerProps = {
  children: ReactElement
  content: (onClose: () => void) => ReactNode
  className?: string
}

export const PopoverContainer = ({ children, content, className }: PopoverContainerProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useClickOutside(cardRef, () => setIsMenuOpen(false))

  const onMenuOpen = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()

    setIsMenuOpen((isOpen) => !isOpen)
  }

  return (
    <div className={styles.popoverContainer}>
      <ConditionalRender conditions={[isMenuOpen]}>
        <Card className={cn(styles.menu, className)} getRootRef={cardRef} mode='shadow'>
          {content(() => setIsMenuOpen(false))}
        </Card>
      </ConditionalRender>
      {cloneElement(children, { onClick: onMenuOpen })}
    </div>
  )
}
