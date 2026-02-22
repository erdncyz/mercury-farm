import { action, computed, makeObservable, observable } from 'mobx'

export abstract class ListManagementService<
  const K extends string = 'id',
  T extends { [P in K]?: string } = { id?: string },
> {
  @observable pageSize = 5
  @observable currentPage = 1
  @observable globalFilter = ''
  @observable needConfirm = true
  @observable selectedItems: T[] = []

  protected uniqueKey: K

  protected startsWithFilter = (value?: string): boolean | undefined =>
    value?.toLowerCase().startsWith(this.globalFilterCaseInsensitive)

  constructor(uniqueKey: K) {
    makeObservable(this)

    this.uniqueKey = uniqueKey
  }

  abstract get items(): T[]

  @action
  setGlobalFilter(value: string): void {
    this.globalFilter = value
  }

  @action
  setCurrentPage(value: number): void {
    this.currentPage = value
  }

  @action
  setPageSize(value: number): void {
    this.pageSize = value

    this.currentPage = 1
  }

  @action
  setSelectedItem(item: T, checked: boolean): void {
    if (checked) {
      this.selectedItems.push(item)
    }

    if (!checked) {
      this.selectedItems = this.selectedItems.filter((selected) => selected[this.uniqueKey] !== item[this.uniqueKey])
    }
  }

  @action
  clearSelectedItems(): void {
    this.selectedItems = []
  }

  @action
  selectItemsOnPage(checked: boolean): void {
    if (checked) {
      this.selectedItems = this.paginatedItems
    }

    if (!checked) {
      this.clearSelectedItems()
    }
  }

  @action
  toggleNeedConfirm(): void {
    this.needConfirm = !this.needConfirm
  }

  isItemSelected(id?: string): boolean {
    return this.selectedItems.findIndex((selected) => selected[this.uniqueKey] === id) !== -1
  }

  @computed
  get globalFilterCaseInsensitive(): string {
    return this.globalFilter.toLowerCase()
  }

  @computed
  get isAllItemsOnPageSelected(): boolean {
    if (this.paginatedItems.length === 0) return false

    return this.paginatedItems.every((item) => this.isItemSelected(item[this.uniqueKey]))
  }

  @computed
  get paginatedItems(): T[] {
    const start = (this.currentPage - 1) * this.pageSize
    const end = start + this.pageSize

    return this.items.slice(start, end)
  }

  @computed
  get totalPages(): number {
    return Math.ceil(this.items.length / this.pageSize)
  }

  @computed
  get isSelectedItemsEmpty(): boolean {
    return this.selectedItems.length === 0
  }

  @computed
  get isPaginatedItemsEmpty(): boolean {
    return this.paginatedItems.length === 0
  }
}
