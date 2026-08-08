import type { ReactNode } from 'react'

export type ColumnFilterType = 'text' | 'select' | 'none'

export type ColumnAlign = 'left' | 'center' | 'right'

export type ColumnDef<T> = {
  key: string
  header: string
  sortKey?: string
  filterKey?: string
  filter?: ColumnFilterType
  filterOptions?: { value: string; label: string }[]
  width?: number | string
  align?: ColumnAlign
  render: (row: T) => ReactNode
  /** Client-side sort value (reports and local tables). */
  getSortValue?: (row: T) => string | number | boolean | null | undefined
}
