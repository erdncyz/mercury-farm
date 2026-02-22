import { useTranslation } from 'react-i18next'
import cn from 'classnames'
import { Icon20CopyOutline, Icon20RefreshOutline } from '@vkontakte/icons'
import { EllipsisText, Flex, IconButton, Tooltip } from '@vkontakte/vkui'

import { ConditionalRender } from '@/components/lib/conditional-render'

import styles from './output-field.module.css'

type OutputFieldProps = {
  text: string
  tooltipText?: string
  afterButtonClick?: () => void
  className?: string
}

export const OutputField = ({ text, tooltipText, afterButtonClick, className }: OutputFieldProps) => {
  const { t } = useTranslation()

  return (
    <div className={cn(styles.outputField, className)}>
      <Flex align='center' className={styles.flexContainer} justify='space-between' noWrap>
        <EllipsisText className={cn({ [styles.text]: text })}>{text || t('Empty')}</EllipsisText>
        <ConditionalRender conditions={[!!afterButtonClick]}>
          <Tooltip appearance='accent' description={tooltipText}>
            <IconButton
              borderRadiusMode='inherit'
              className={styles.afterButton}
              hoverMode='opacity'
              label='after output button'
              onClick={afterButtonClick}
            >
              <Icon20RefreshOutline />
            </IconButton>
          </Tooltip>
        </ConditionalRender>
        <ConditionalRender conditions={[!afterButtonClick]}>
          <IconButton
            borderRadiusMode='inherit'
            className={styles.afterButton}
            hoverMode='opacity'
            label='after output copy button'
            onClick={() => navigator.clipboard.writeText(text)}
          >
            <Icon20CopyOutline />
          </IconButton>
        </ConditionalRender>
      </Flex>
    </div>
  )
}
