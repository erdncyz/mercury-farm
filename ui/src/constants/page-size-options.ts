import type { SelectOption } from '@/components/lib/base-select'

export const PAGE_SIZE_OPTIONS: SelectOption<number>[] = [
  { value: 5, name: '5' },
  { value: 10, name: '10' },
  { value: 20, name: '20' },
  { value: 50, name: '50' },
]
