import { observer } from 'mobx-react-lite'
import { useInjection } from 'inversify-react'
import { useTranslation } from 'react-i18next'
import { IconButton, Input } from '@vkontakte/vkui'
import { Icon20ChevronRightOutline, Icon20DeleteOutline, Icon20Play } from '@vkontakte/icons'

import { ContentCard } from '@/components/lib/content-card'
import { OutputLogArea } from '@/components/lib/output-log-area'
import { ConditionalRender } from '@/components/lib/conditional-render'

import { CONTAINER_IDS } from '@/config/inversify/container-ids'

import styles from './shell-control.module.css'

import type { KeyboardEvent } from 'react'

export const ShellControl = observer(({ className }: { className?: string }) => {
  const { t } = useTranslation()

  const shellControlStore = useInjection(CONTAINER_IDS.shellControlStore)

  const onPressEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      shellControlStore.runShellCommand()
    }
  }

  return (
    <ContentCard
      afterButtonIcon={<Icon20DeleteOutline />}
      afterTooltipText={t('Clear')}
      before={<Icon20ChevronRightOutline />}
      className={className}
      helpTooltipText={t('Executes remote shell commands')}
      title={t('Shell')}
      onAfterButtonClick={() => shellControlStore.clear()}
    >
      <Input
        placeholder={t('Type a command')}
        value={shellControlStore.command}
        after={
          <IconButton
            disabled={!shellControlStore.command}
            label='run shell command'
            onClick={() => shellControlStore.runShellCommand()}
          >
            <Icon20Play />
          </IconButton>
        }
        onChange={(event) => shellControlStore.setCommand(event.target.value)}
        onKeyDown={onPressEnter}
      />
      <ConditionalRender conditions={[!!shellControlStore.shellResult]}>
        <OutputLogArea className={styles.shellResult} text={shellControlStore.shellResult} />
      </ConditionalRender>
    </ContentCard>
  )
})
