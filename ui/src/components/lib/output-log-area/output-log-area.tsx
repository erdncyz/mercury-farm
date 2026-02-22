import cn from 'classnames'

import styles from './output-log-area.module.css'

type OutputLogAreaProps = {
  text: string
  className?: string
}

export const OutputLogArea = ({ text, className }: OutputLogAreaProps) => (
  <pre className={cn(styles.outputLogArea, className)}>{text}</pre>
)
