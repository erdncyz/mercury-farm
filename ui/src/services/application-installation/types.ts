export type SelectOption = { value: string; label: string }

export type ActivityOptions = {
  activityNames: SelectOption[]
  activityActions: SelectOption[]
  activityCategories: SelectOption[]
  activityData: SelectOption[]
}

export type ActivityOptionsSet = {
  activityNames: Set<string>
  activityActions: Set<string>
  activityCategories: Set<string>
  activityData: Set<string>
}

export type RunActivityArgs = {
  selectedAction: string | null
  selectedCategory: string | null
  selectedData: string | null
  selectedPackageName: string | null
  selectedActivityName: string | null
}
