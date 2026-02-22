import { Caption, Progress } from '@vkontakte/vkui'

import styles from './progress-bar.module.css'

type ProgressBarProps = {
  value: number
}

export const ProgressBar = ({ value }: ProgressBarProps) => (
  <div className={styles.progressBar}>
    <Progress appearance={value < 15 ? 'negative' : 'positive'} height={15} value={value} />
    <Caption className={styles.caption} level='1'>
      {value}%
    </Caption>
  </div>
)
