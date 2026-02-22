import cn from 'classnames'
import { Flex, Skeleton, Text } from '@vkontakte/vkui'

import { ConditionalRender } from '@/components/lib/conditional-render'

import styles from './titled-value.module.css'

type TitledValueProps = {
  title: string
  value: string | number
  className?: string
  isValueLoading?: boolean
}

export const TitledValue = ({ title, value, className, isValueLoading = false }: TitledValueProps) => (
  <Text className={cn(styles.sideText, className)}>
    <Flex align='center'>
      <span className={styles.sideTextLabel}>{`${title}:`}</span>
      <ConditionalRender conditions={[isValueLoading]}>
        <Skeleton height={20} width={30} />
      </ConditionalRender>
      <ConditionalRender conditions={[!isValueLoading]}>{value}</ConditionalRender>
    </Flex>
  </Text>
)
