import { inject, injectable } from 'inversify'

import { socket } from '@/api/socket'

import { CONTAINER_IDS } from '@/config/inversify/container-ids'

import type { DeviceGroup } from '@/generated/types'
import type { TransactionFactory } from '@/types/transaction-factory.type'

const MILLISECONDS_IN_MINUTE = 1000 * 60

@injectable()
export class GroupService {
  constructor(@inject(CONTAINER_IDS.factoryTransactionService) private transactionServiceFactory: TransactionFactory) {}

  invite(serial: string, channel: string, deviceGroup?: DeviceGroup, customTimeoutMinutes?: number): Promise<unknown> {
    let timeout: number

    if (customTimeoutMinutes && customTimeoutMinutes > 0) {
      timeout = MILLISECONDS_IN_MINUTE * customTimeoutMinutes
    } else if (deviceGroup?.id === deviceGroup?.origin) {
      /* NOTE: 1 for Infinity */
      timeout = MILLISECONDS_IN_MINUTE * 5
    } else if (deviceGroup?.class === 'once') {
      timeout = MILLISECONDS_IN_MINUTE * 40
    } else {
      timeout = 1
    }

    const transaction = this.transactionServiceFactory()
    const { channel: transactionChannel, donePromise: transactionEndPromise } = transaction.initializeTransaction()
    const invite = (): void =>
      socket.emit('group.invite', channel, transactionChannel, {
        requirements: {
          serial: {
            value: serial,
            match: 'exact',
          },
        },
        timeout,
      }) as never

    if (!socket.connected) {
      socket.on('connect', invite)
    } else {
      invite()
    }

    return transactionEndPromise
  }

  kick(serial: string, channel: string): Promise<unknown> {
    const transaction = this.transactionServiceFactory()
    const { channel: transactionChannel, donePromise: transactionEndPromise } = transaction.initializeTransaction()
    const kick = (): void =>
      socket.emit('group.kick', channel, transactionChannel, {
        requirements: {
          serial: {
            value: serial,
            match: 'exact',
          },
        },
      }) as never

    if (!socket.connected) {
      socket.once('connect', kick)
      socket.connect()
    } else {
      kick()
    }

    return transactionEndPromise
  }
}
