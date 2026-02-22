import { useTranslation } from 'react-i18next'
import { Icon20SquareStackUpOutline, Icon24ErrorCircleFillRed } from '@vkontakte/icons'
import { Accordion, Button, Gradient, Paragraph, Placeholder, Spacing } from '@vkontakte/vkui'

import { ConditionalRender } from '@/components/lib/conditional-render'

import styles from './error-fallback.module.css'

import type { FallbackProps } from 'react-error-boundary'

export const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  const { t } = useTranslation()

  return (
    <Gradient className={styles.gradient} mode='tint'>
      <Placeholder
        icon={<Icon24ErrorCircleFillRed height={56} width={56} />}
        title={t('Something went wrong')}
        action={
          <Button appearance='accent-invariable' mode='outline' size='m' onClick={resetErrorBoundary}>
            {t('Retry')}
          </Button>
        }
        stretched
      >
        <Paragraph>{error?.message}</Paragraph>
        <Spacing size='xl' />
        <ConditionalRender conditions={[!!error?.stack]}>
          <Accordion defaultExpanded={false}>
            <Accordion.Summary before={<Icon20SquareStackUpOutline height={24} width={24} />}>
              {t('Stack trace')}
            </Accordion.Summary>
            <Accordion.Content className={styles.accordionContent}>
              <pre className={styles.stack}>{error?.stack}</pre>
            </Accordion.Content>
          </Accordion>
        </ConditionalRender>
      </Placeholder>
    </Gradient>
  )
}
