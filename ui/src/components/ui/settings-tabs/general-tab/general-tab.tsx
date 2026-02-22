import { observer } from 'mobx-react-lite'
import { InterfaceSettings } from './interface-settings'

import styles from './general-tab.module.css'

export const GeneralTab = observer(() => {
  return (
    <div className={styles.generalTabContainer}>
      <div className={styles.generalTab}>
        <InterfaceSettings />
      </div>
    </div>
  )
})
