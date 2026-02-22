import { ModalCard, ModalRoot } from '@vkontakte/vkui'

import styles from './base-modal.module.css'

import type { ReactNode } from 'react'

export type BaseModalProps = {
  isOpen: boolean
  title: string
  icon?: ReactNode
  children?: ReactNode
  description?: string
  actions?: ReactNode
  onClose: () => void
}

export const BaseModal = ({ isOpen, title, icon, description, children, onClose, actions }: BaseModalProps) => (
  <ModalRoot activeModal={isOpen ? 'modal-card' : null} usePortal onClose={onClose}>
    <ModalCard
      actions={actions}
      className={styles.baseModal}
      description={description}
      dismissButtonMode='inside'
      icon={icon}
      id='modal-card'
      open={isOpen}
      size={900}
      title={title}
      onClose={onClose}
    >
      {children}
    </ModalCard>
  </ModalRoot>
)
