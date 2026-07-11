import { SummaryCards } from '@/components/module-page'

export interface SummaryItem {
  label: string
  value: number
}

/** Count cards above the entry tables (status breakdown per FBG-04/19). */
export function FeedbackSummary({
  title,
  items,
}: {
  title: string
  items: SummaryItem[]
}) {
  return <SummaryCards title={title} items={items} />
}
