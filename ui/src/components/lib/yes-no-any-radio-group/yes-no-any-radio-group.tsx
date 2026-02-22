import { useTranslation } from 'react-i18next'
import { Radio, RadioGroup } from '@vkontakte/vkui'

type YesNoAnyRadioGroupProps = {
  name: string
  defaultValue?: boolean
  yesDescription?: string
  noDescription?: string
  className?: string
  onChange: (value?: boolean) => void
}

export const YesNoAnyRadioGroup = ({
  name,
  defaultValue,
  yesDescription,
  noDescription,
  className,
  onChange,
}: YesNoAnyRadioGroupProps) => {
  const { t } = useTranslation()

  return (
    <RadioGroup className={className}>
      <Radio
        defaultChecked={defaultValue === true}
        description={yesDescription}
        name={name}
        onChange={() => onChange(true)}
      >
        {t('Yes')}
      </Radio>
      <Radio
        defaultChecked={defaultValue === false}
        description={noDescription}
        name={name}
        onChange={() => onChange(false)}
      >
        {t('No')}
      </Radio>
      <Radio defaultChecked={defaultValue === undefined} name={name} onChange={() => onChange(undefined)}>
        {t('Any')}
      </Radio>
    </RadioGroup>
  )
}
