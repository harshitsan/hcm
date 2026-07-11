import { useMemo } from 'react'
import { type FieldDefinition } from '../data/custom-fields'
import { SummaryCards } from '@/components/module-page'

interface FieldsSummaryProps {
  fields: FieldDefinition[]
}

/** Count cards above the definitions table: totals + scope breakdown. */
export function FieldsSummary({ fields }: FieldsSummaryProps) {
  const summaryItems = useMemo(() => {
    const byScope = (scope: FieldDefinition['scope']) =>
      fields.filter((f) => f.scope === scope).length
    return [
      { label: 'Total custom fields', value: fields.length },
      { label: 'Platform scope', value: byScope('Platform') },
      { label: 'Group scope', value: byScope('Group') },
      { label: 'Company scope', value: byScope('Company') },
      {
        label: 'On standard form',
        value: fields.filter((f) => f.isDefault).length,
      },
    ]
  }, [fields])

  return <SummaryCards title='Data Model Extensibility Summary' items={summaryItems} />
}
