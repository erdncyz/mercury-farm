import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useInjection } from 'inversify-react'
import { Button, CustomSelect, Div, EllipsisText, Flex, FormItem, Separator, Spacing } from '@vkontakte/vkui'
import {
  Icon28PlayOutline,
  Icon20DeleteOutline,
  Icon24ChevronUpSmall,
  Icon20DocumentOutline,
  Icon24ChevronDownSmall,
} from '@vkontakte/icons'

import { ConditionalRender } from '@/components/lib/conditional-render'
import { OutputLogArea } from '@/components/lib/output-log-area'

import { CONTAINER_IDS } from '@/config/inversify/container-ids'

import styles from './activity-launcher.module.css'

import type { FormEvent } from 'react'

export const ActivityLauncher = observer(() => {
  const { t } = useTranslation()
  const [isManifestShown, setIsManifestShown] = useState(false)
  const [selectedPackageName, setSelectedPackageName] = useState<string | null>(null)
  const [selectedActivityName, setSelectedActivityName] = useState<string | null>(null)
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedData, setSelectedData] = useState<string | null>(null)

  const applicationInstallationService = useInjection(CONTAINER_IDS.applicationInstallationService)

  const onRunActivity = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    applicationInstallationService.runActivity({
      selectedAction,
      selectedCategory,
      selectedData,
      selectedPackageName,
      selectedActivityName,
    })
  }

  const { manifest } = applicationInstallationService.manifestQueryResult.data || {}

  return (
    <>
      <Flex align='center' justify='space-between' noWrap>
        <Flex align='center' className={styles.packageInfo} noWrap>
          <Icon20DocumentOutline className={styles.packageIcon} />
          <EllipsisText>{manifest?.package}</EllipsisText>
        </Flex>
        <Button
          appearance='negative'
          before={<Icon20DeleteOutline />}
          className={styles.uninstallButton}
          onClick={() => {
            if (!manifest?.package) return

            applicationInstallationService.uninstall(manifest.package)
          }}
        >
          {t('Uninstall')}
        </Button>
      </Flex>
      <Spacing size='2xl' />
      <Separator appearance='primary-alpha' />
      <form onSubmit={onRunActivity}>
        <FormItem htmlFor='appSelectSearchable' top={t('Package')}>
          <CustomSelect
            emptyText={t('Empty')}
            id='appSelectSearchable'
            options={applicationInstallationService.packageOptions}
            placeholder={t('Please, type or select value')}
            value={selectedPackageName}
            allowClearButton
            searchable
            onChange={(_, value) => setSelectedPackageName(value as string)}
          />
        </FormItem>
        <FormItem htmlFor='activitySelectSearchable' top={t('Activity')}>
          <CustomSelect
            emptyText={t('Empty')}
            id='activitySelectSearchable'
            options={applicationInstallationService.activityOptions.activityNames}
            placeholder={t('Please, type or select value')}
            value={selectedActivityName}
            allowClearButton
            searchable
            onChange={(_, value) => setSelectedActivityName(value as string)}
          />
        </FormItem>
        <FormItem htmlFor='actionSelectSearchable' top={t('Action')}>
          <CustomSelect
            emptyText={t('Empty')}
            id='actionSelectSearchable'
            options={applicationInstallationService.activityOptions.activityActions}
            placeholder={t('Please, type or select value')}
            value={selectedAction}
            allowClearButton
            searchable
            onChange={(_, value) => setSelectedAction(value as string)}
          />
        </FormItem>
        <FormItem htmlFor='categorySelectSearchable' top={t('Category')}>
          <CustomSelect
            emptyText={t('Empty')}
            id='categorySelectSearchable'
            options={applicationInstallationService.activityOptions.activityCategories}
            placeholder={t('Please, type or select value')}
            value={selectedCategory}
            allowClearButton
            searchable
            onChange={(_, value) => setSelectedCategory(value as string)}
          />
        </FormItem>
        <FormItem htmlFor='dataSelectSearchable' top={t('Data')}>
          <CustomSelect
            emptyText={t('Empty')}
            id='dataSelectSearchable'
            options={applicationInstallationService.activityOptions.activityData}
            placeholder={t('Please, type or select value')}
            value={selectedData}
            allowClearButton
            searchable
            onChange={(_, value) => setSelectedData(value as string)}
          />
        </FormItem>
        <Spacing size='m' />
        <Div>
          <Flex align='center' justify='space-between'>
            <Button
              mode='secondary'
              type='button'
              before={
                isManifestShown ? (
                  <Icon24ChevronUpSmall height={20} width={20} />
                ) : (
                  <Icon24ChevronDownSmall height={20} width={20} />
                )
              }
              onClick={() => setIsManifestShown((isShown) => !isShown)}
            >
              {isManifestShown ? t('Hide Manifest') : t('Show Manifest')}
            </Button>
            <Button before={<Icon28PlayOutline height={20} width={20} />} mode='secondary' type='submit'>
              {t('Launch Activity')}
            </Button>
            <ConditionalRender conditions={[isManifestShown]}>
              <OutputLogArea
                className={styles.manifest}
                text={JSON.stringify(applicationInstallationService.manifestQueryResult.data?.manifest, null, ' ')}
              />
            </ConditionalRender>
          </Flex>
        </Div>
      </form>
    </>
  )
})
