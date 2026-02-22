import type { TransactionService } from '@/services/core/transaction-service/transaction-service'

export type TransactionFactory = <T>() => TransactionService<T>
