import { useMemo, useState } from 'react'
import { Plus } from 'phosphor-react'
import { SummaryCards } from '@/components/module-page'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@/components/common/data-table/table'
import {
  AGREEMENT_STATUSES,
  CONTRACT_AGREEMENT_TYPES,
  effectiveStatusOf,
  type AgreementStatus,
  type ContractAgreementType,
} from '../data/agreements'
import { CURRENT_ADMIN, HOME_COMPANY } from '../data/org'
import { useAgreements, type AgreementDraft } from '../hooks/use-agreements'
import { type DocumentsStore } from '../hooks/use-documents'
import { AgreementDetailSheet } from './agreement-detail-sheet'
import {
  agreementsTableColumns,
  type AgreementRow,
} from './agreements-table-columns'
import { NewAgreementOverlay } from './new-agreement-overlay'

interface AgreementsTabProps {
  /** Documents store — generated agreements are filed into the grid (F12). */
  docStore: DocumentsStore
}

/**
 * Agreements admin grid (O10): employment agreements, bonds and NDAs as
 * trackable records — generated via the Template Engine (F8), stored in
 * Documents (F12), optionally acknowledged (W11) and tracked for validity
 * and expiry with reminders via Notifications (F7).
 */
export function AgreementsTab({ docStore }: AgreementsTabProps) {
  const store = useAgreements({ actor: `${CURRENT_ADMIN} (Company Admin)` })
  const [statusFilter, setStatusFilter] = useState<AgreementStatus | 'All'>(
    'All'
  )
  const [typeFilter, setTypeFilter] = useState<ContractAgreementType | 'All'>(
    'All'
  )
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)

  const allRows = useMemo<AgreementRow[]>(
    () =>
      store.agreements.map((a) => ({
        ...a,
        effectiveStatus: effectiveStatusOf(a),
      })),
    [store.agreements]
  )

  const rows = useMemo(
    () =>
      allRows
        .filter((a) => typeFilter === 'All' || a.type === typeFilter)
        .filter(
          (a) => statusFilter === 'All' || a.effectiveStatus === statusFilter
        ),
    [allRows, typeFilter, statusFilter]
  )

  const summaryItems = useMemo(() => {
    const count = (...statuses: AgreementStatus[]) =>
      allRows.filter((a) => statuses.includes(a.effectiveStatus)).length
    return [
      { label: 'Active', value: count('Active', 'Acknowledged') },
      { label: 'Expiring soon', value: count('Expiring soon') },
      {
        label: 'Awaiting acknowledgment',
        value: count('Sent for acknowledgment'),
      },
      { label: 'Expired', value: count('Expired') },
    ]
  }, [allRows])

  const detail = detailId
    ? (allRows.find((a) => a.id === detailId) ?? null)
    : null

  function handleGenerate(draft: AgreementDraft) {
    const record = store.createAgreement(draft)
    if (!record) return
    // File the generated agreement in the Documents grid (F12).
    docStore.addDocument(
      {
        name: `${record.type} — ${record.employeeName}`,
        fileName: record.documentRef.fileName,
        format: 'PDF',
        sizeKb: 180,
        entityType: 'Employee',
        entityName: record.employeeName,
        company: HOME_COMPANY,
        category: 'Contract',
        documentType: record.type,
        expiryDate: record.validUntil ?? null,
      },
      CURRENT_ADMIN
    )
    setDetailId(record.id)
  }

  return (
    <div className='w-full'>
      <SummaryCards title='Agreements Summary' items={summaryItems} />

      <div className='mb-3 flex flex-wrap items-center gap-2'>
        <Select
          value={typeFilter}
          onValueChange={(v) =>
            setTypeFilter(v as ContractAgreementType | 'All')
          }
        >
          <SelectTrigger variant='secondary' className='h-7 w-[220px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='All'>All agreement types</SelectItem>
            {CONTRACT_AGREEMENT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as AgreementStatus | 'All')}
        >
          <SelectTrigger variant='secondary' className='h-7 w-[220px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='All'>All statuses</SelectItem>
            {AGREEMENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant='outline'
          className='h-7 px-2'
          onClick={() => {
            setTypeFilter('All')
            setStatusFilter('All')
          }}
        >
          Reset
        </Button>
      </div>

      <div className='mb-3 flex items-center justify-between'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          Agreements ({rows.length})
        </h2>
        <Button
          variant='red'
          onClick={() => setOverlayOpen(true)}
          className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
        >
          <Plus size={10} weight='bold' />
          New Agreement
        </Button>
      </div>

      <DataTable
        columns={agreementsTableColumns}
        data={rows}
        variant='no-status'
        onRowClick={(row) => setDetailId(row.id)}
      />

      <AgreementDetailSheet
        agreement={detail}
        onOpenChange={(open) => {
          if (!open) setDetailId(null)
        }}
        mode='admin'
        store={store}
      />

      <NewAgreementOverlay
        open={overlayOpen}
        onOpenChange={setOverlayOpen}
        onGenerate={handleGenerate}
      />
    </div>
  )
}
