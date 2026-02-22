import { Headline } from '@vkontakte/vkui'
import { useTranslation } from 'react-i18next'

import { ConditionalRender } from '@/components/lib/conditional-render'

import styles from './info-block.module.css'

import type { ReactNode } from 'react'

const NONE_VALUE = 'None'

type InfoBlock = {
  title: string
  children?: ReactNode
  unit?: string
}

export const InfoBlock = ({ title, unit, children }: InfoBlock) => {
  const { t } = useTranslation()

  return (
    <div className={styles.infoBlock}>
      <Headline level='1'>{title}</Headline>
      <div className={styles.content}>
        <ConditionalRender conditions={[children === undefined || children === null]}>
          {t(NONE_VALUE)}
        </ConditionalRender>
        <ConditionalRender conditions={[children !== undefined && children !== null]}>
          {
            <>
              {children} <span>{unit}</span>
            </>
          }
        </ConditionalRender>
      </div>
    </div>
  )
}
