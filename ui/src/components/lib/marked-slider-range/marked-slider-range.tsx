import ReactSlider from 'react-slider'

import styles from './marked-slider-range.module.css'

type MarkedSliderRangeProps = {
  value: number
  onAfterChange: (value: number) => void
  marks: number[]
  min?: number
  max?: number
  step?: number
}

export const MarkedSliderRange = ({ min, max, step, value, marks, onAfterChange }: MarkedSliderRangeProps) => (
  <div className={styles.sliderWrapper}>
    <ReactSlider
      className={styles.slider}
      markClassName={styles.sliderMark}
      marks={marks}
      max={max}
      min={min}
      step={step}
      thumbClassName={styles.sliderThumb}
      trackClassName='sliderTrack'
      value={value}
      onAfterChange={onAfterChange}
    />
  </div>
)
