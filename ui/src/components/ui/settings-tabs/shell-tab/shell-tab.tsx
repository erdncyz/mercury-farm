import { useTranslation } from 'react-i18next'
import { observer } from 'mobx-react-lite'
import { useInjection } from 'inversify-react'
import { Flex, IconButton, Input, Pagination, Placeholder, Search, Spacing } from '@vkontakte/vkui'
import { Icon20ChevronRightOutline, Icon20DeleteOutline, Icon20Play, Icon28InboxOutline } from '@vkontakte/icons'

import { BaseSelect } from '@/components/lib/base-select'
import { TitledValue } from '@/components/lib/titled-value'
import { ContentCard } from '@/components/lib/content-card'
import { ConditionalRender } from '@/components/lib/conditional-render'

import { CONTAINER_IDS } from '@/config/inversify/container-ids'

import { PAGE_SIZE_OPTIONS } from '@/constants/page-size-options'

import { ShellList } from './shell-list'

import styles from './shell-tab.module.css'

import type { KeyboardEvent } from 'react'

export const ShellTab = observer(() => {
  const { t } = useTranslation()

  const shellSettingsService = useInjection(CONTAINER_IDS.shellSettingsService)
  const { isLoading: isDevicesLoading } = shellSettingsService.devicesQueryResult

  const onPressEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      shellSettingsService.runShellCommand()
    }
  }

  return (
    <ContentCard
      afterButtonIcon={<Icon20DeleteOutline />}
      afterTooltipText={t('Clear')}
      before={<Icon20ChevronRightOutline />}
      helpTooltipText={t('Execute adb shell command on all devices')}
      isAfterButtonDisabled={shellSettingsService.isPaginatedItemsEmpty}
      title={t('Shell')}
      onAfterButtonClick={() => shellSettingsService.clear()}
    >
      <div className={styles.commandInput}>
        <Input
          placeholder={t('Type a command')}
          value={shellSettingsService.command}
          after={
            <IconButton
              disabled={!shellSettingsService.command}
              label='run shell command'
              onClick={() => shellSettingsService.runShellCommand()}
            >
              <Icon20Play />
            </IconButton>
          }
          onChange={(event) => shellSettingsService.setCommand(event.target.value)}
          onKeyDown={onPressEnter}
        />
      </div>
      <Spacing size='xl' />
      <Search
        className={styles.search}
        placeholder={t('Search')}
        value={shellSettingsService.globalFilter}
        onChange={(event) => shellSettingsService.setGlobalFilter(event.target.value)}
      />
      <Flex align='center' justify='space-between'>
        <Spacing />
        <Flex align='center' className={styles.pagination}>
          <Pagination
            boundaryCount={1}
            currentPage={shellSettingsService.currentPage}
            navigationButtonsStyle='both'
            siblingCount={2}
            totalPages={shellSettingsService.totalPages}
            onChange={(page) => shellSettingsService.setCurrentPage(page)}
          />
          <BaseSelect
            options={PAGE_SIZE_OPTIONS}
            selectType='plain'
            stretched={false}
            value={shellSettingsService.pageSize}
            onChange={(value) => shellSettingsService.setPageSize(Number(value))}
          />
        </Flex>
        <TitledValue
          className={styles.titledValue}
          isValueLoading={isDevicesLoading}
          title={t('Displayed')}
          value={shellSettingsService.paginatedItems.length}
        />
      </Flex>
      <ShellList />
      <ConditionalRender conditions={[shellSettingsService.isPaginatedItemsEmpty]}>
        <Placeholder icon={<Icon28InboxOutline />}>{t('Empty')}</Placeholder>
      </ConditionalRender>
    </ContentCard>
  )
})
