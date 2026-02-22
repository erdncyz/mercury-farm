import { observer } from 'mobx-react-lite'
import { useInjection } from 'inversify-react'
import { useTranslation } from 'react-i18next'
import { Checkbox, FormItem, FormLayoutGroup, Input } from '@vkontakte/vkui'

import { CONTAINER_IDS } from '@/config/inversify/container-ids'

import type { PortForwardEntry } from '@/services/port-forwarding-service/types'

type PortForwardItemProps = {
  className?: string
}

export const PortForwardItem = observer(
  ({ id, isEnabled, devicePort, targetHost, targetPort, className }: PortForwardItemProps & PortForwardEntry) => {
    const { t } = useTranslation()

    const portForwardingService = useInjection(CONTAINER_IDS.portForwardingService)

    return (
      <FormLayoutGroup
        className={className}
        mode='horizontal'
        removable
        onRemove={() => portForwardingService.removePortForward(id)}
      >
        <Checkbox
          checked={isEnabled}
          hasHover={false}
          onChange={(event) => portForwardingService.togglePortForward(id, event.target.checked)}
        />
        <FormItem htmlFor='devicePort' top={t('Device Port')}>
          <Input
            id='devicePort'
            type='number'
            value={devicePort}
            onChange={(event) => {
              portForwardingService.setPortForwardValue(id, 'devicePort', event.target.valueAsNumber)
            }}
          />
        </FormItem>
        <FormItem htmlFor='targetHost' top={t('Target Host')}>
          <Input
            id='targetHost'
            value={targetHost}
            onChange={(event) => {
              portForwardingService.setPortForwardValue(id, 'targetHost', event.target.value)
            }}
          />
        </FormItem>
        <FormItem htmlFor='targetPort' top={t('Target Port')}>
          <Input
            id='targetPort'
            type='number'
            value={targetPort}
            onChange={(event) => {
              portForwardingService.setPortForwardValue(id, 'targetPort', event.target.valueAsNumber)
            }}
          />
        </FormItem>
      </FormLayoutGroup>
    )
  }
)
