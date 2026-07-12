import { useMemo } from 'react'
import { type HrDocument } from '../data/hr-letters'
import { SummaryCards } from '@/components/module-page'

interface LettersSummaryProps {
  documents: HrDocument[]
}

/** Count cards shown above the documents grid (HLC-22 overview). */
export function LettersSummary({ documents }: LettersSummaryProps) {
  const summaryItems = useMemo(() => {
    const by = (status: HrDocument['status']) =>
      documents.filter((d) => d.status === status).length
    const failedDeliveries = documents.filter((d) =>
      d.distributions.some((dist) => dist.outcome === 'failed')
    ).length
    const pendingAcks = documents.filter(
      (d) => d.requiresAcknowledgment && !d.acknowledgedOn
    ).length

    return [
      { label: 'Total documents', value: documents.length },
      { label: 'Drafts', value: by('draft') },
      { label: 'Pending approval', value: by('pending-approval') },
      { label: 'Issued', value: by('issued') },
      { label: 'Delivery failures', value: failedDeliveries },
      { label: 'Acknowledgments due', value: pendingAcks },
    ]
  }, [documents])

  return <SummaryCards title='HR Letters & Certificates Summary' items={summaryItems} />
}
