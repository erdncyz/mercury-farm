import cn from 'classnames'
import { Icon20HelpOutline } from '@vkontakte/icons'
import { Button, Card, Div, Flex, Headline, Separator, Tooltip } from '@vkontakte/vkui'

import { ConditionalRender } from '@/components/lib/conditional-render'

import styles from './content-card.module.css'

import type { ReactElement, ReactNode } from 'react'

type ContentCardProps = {
  title: string
  children: ReactNode
  before?: ReactNode
  extraAfter?: ReactNode
  afterButtonIcon?: ReactElement
  onAfterButtonClick?: () => void
  afterTooltipText?: string
  isAfterButtonLoading?: boolean
  helpTooltipText?: string
  className?: string
  separator?: boolean
  isAfterButtonDisabled?: boolean
}

export const ContentCard = ({
  title,
  children,
  before,
  extraAfter,
  afterButtonIcon,
  onAfterButtonClick,
  afterTooltipText,
  helpTooltipText,
  className,
  separator = false,
  isAfterButtonDisabled = false,
  isAfterButtonLoading = false,
}: ContentCardProps) => (
  <Card className={cn(styles.contentCard, className)} mode='tint'>
    <Div className={styles.cardContainer}>
      <Flex align='center' className={styles.cardHeader} justify='space-between' noWrap>
        <Flex align='center' noWrap>
          {before}
          <Headline className={styles.cardTitle} level='1'>
            {title}
          </Headline>
        </Flex>
        <Flex align='center'>
          <ConditionalRender conditions={[!!helpTooltipText]}>
            <Tooltip appearance='accent' description={helpTooltipText} placement='left'>
              <Button appearance='neutral' aria-label='Help button' before={<Icon20HelpOutline />} mode='tertiary' />
            </Tooltip>
          </ConditionalRender>
          {extraAfter}
          <ConditionalRender conditions={[!!onAfterButtonClick]}>
            <Tooltip
              appearance='accent'
              description={afterTooltipText}
              shown={isAfterButtonDisabled ? false : undefined}
            >
              <Button
                appearance='neutral'
                aria-label='action button'
                before={afterButtonIcon}
                disabled={isAfterButtonDisabled}
                loading={isAfterButtonLoading}
                mode='tertiary'
                onClick={onAfterButtonClick}
              />
            </Tooltip>
          </ConditionalRender>
        </Flex>
      </Flex>
      <ConditionalRender conditions={[separator]}>
        <Separator appearance='primary-alpha' className={styles.separator} />
      </ConditionalRender>
      <div>{children}</div>
    </Div>
  </Card>
)
