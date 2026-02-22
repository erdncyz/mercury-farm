import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Icon20PalleteOutline } from '@vkontakte/icons'
import { FormItem, FormLayoutGroup } from '@vkontakte/vkui'

import { ContentCard } from '@/components/lib/content-card'
import { LangSwitcher } from '@/components/ui/lang-switcher'

export const InterfaceSettings = observer(() => {
  const { t } = useTranslation()

  return (
    <ContentCard before={<Icon20PalleteOutline height={20} width={20} />} title={t('Interface Settings')}>
      <FormLayoutGroup>
        <FormItem top={t('Language')}>
          <LangSwitcher />
        </FormItem>
      </FormLayoutGroup>
    </ContentCard>
  )
})
