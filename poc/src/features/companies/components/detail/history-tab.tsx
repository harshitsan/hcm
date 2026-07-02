import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type Company } from '../../data/companies'
import { type HistoryEntry, type HistoryKind } from '../../data/records'

const kindBadge: Record<
  HistoryKind,
  { label: string; variant: 'open' | 'overdue' | 'pending' }
> = {
  profile: { label: 'Master data', variant: 'open' },
  lifecycle: { label: 'Lifecycle', variant: 'overdue' },
  config: { label: 'Configuration', variant: 'pending' },
}

const dateTimeFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

interface HistoryTabProps {
  company: Company
  history: HistoryEntry[]
}

/**
 * COMP-FR-009 / §5.2 View History — read-only, metadata-driven timeline of
 * version history and lifecycle changes, with an as-of bitemporal query.
 */
export function HistoryTab({ company, history }: HistoryTabProps) {
  const [asOf, setAsOf] = useState(new Date().toISOString().slice(0, 10))

  const entries = useMemo(
    () =>
      history
        .filter((h) => h.companyId === company.id)
        .sort((a, b) => b.changedAt.localeCompare(a.changedAt)),
    [history, company.id]
  )

  /** Values effective as of the chosen date, replayed from history. */
  const snapshot = useMemo(() => {
    const byField = new Map<string, { value: string; effective: string }>()
    const chronological = [...entries].reverse()
    for (const entry of chronological) {
      if (entry.kind === 'config') continue
      const current = byField.get(entry.field)
      if (entry.effectiveDate <= asOf) {
        byField.set(entry.field, {
          value: entry.newValue,
          effective: entry.effectiveDate,
        })
      } else if (!current) {
        // The change is in the future relative to asOf — the old value applied.
        byField.set(entry.field, {
          value: entry.oldValue,
          effective: `before ${entry.effectiveDate}`,
        })
      }
    }
    return [...byField.entries()]
  }, [entries, asOf])

  return (
    <div className='space-y-4'>
      <div className='bg-blue-150 text-neutral-1600 rounded-[6px] px-3 py-2 text-sm'>
        History is read-only and retained for 7 years. Only fields your role is
        permitted to see are shown.
      </div>

      {/* Bitemporal as-of query */}
      <div className='space-y-2 rounded-[6px] border border-gray-200 bg-white p-3'>
        <div className='flex items-center gap-3'>
          <Label htmlFor='as-of' className='text-paragraph-sm shrink-0'>
            What was true as of
          </Label>
          <Input
            id='as-of'
            type='date'
            value={asOf}
            onChange={(e) => setAsOf(e.target.value)}
            className='w-[180px]'
          />
        </div>
        {snapshot.length === 0 ? (
          <p className='text-paragraph-sm text-neutral-1000'>
            No recorded changes for this company — current values applied
            throughout.
          </p>
        ) : (
          <div className='divide-y divide-gray-100'>
            {snapshot.map(([field, info]) => (
              <div
                key={field}
                className='flex items-center justify-between py-1.5 text-sm'
              >
                <span className='text-neutral-1000'>{field}</span>
                <span className='text-neutral-1600 font-medium'>
                  {info.value}{' '}
                  <span className='text-neutral-1000 text-xs font-normal'>
                    (effective {info.effective})
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Timeline */}
      <p className='text-paragraph-sm text-neutral-1000 font-medium'>
        Version history & lifecycle timeline ({entries.length})
      </p>
      {entries.length === 0 ? (
        <p className='text-paragraph-sm text-neutral-1000'>
          No history entries yet.
        </p>
      ) : (
        <div className='space-y-2'>
          {entries.map((entry) => {
            const badge = kindBadge[entry.kind]
            return (
              <div
                key={entry.id}
                className='rounded-[6px] border border-gray-200 bg-white px-3 py-2'
              >
                <div className='flex items-center justify-between gap-2'>
                  <div className='flex items-center gap-2'>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                    <span className='text-neutral-1600 text-sm font-medium'>
                      {entry.field}
                    </span>
                  </div>
                  <span className='text-paragraph-sm text-neutral-1000'>
                    {dateTimeFmt.format(new Date(entry.changedAt))}
                  </span>
                </div>
                <p className='text-neutral-1900 mt-1 text-sm'>
                  <span className='text-neutral-1000 line-through'>
                    {entry.oldValue}
                  </span>{' '}
                  → <span className='font-medium'>{entry.newValue}</span>
                  <span className='text-neutral-1000'>
                    {' '}
                    · effective {entry.effectiveDate}
                  </span>
                </p>
                <p className='text-paragraph-sm text-neutral-1000 mt-0.5'>
                  Changed by {entry.changedBy}
                  {entry.reason ? ` — ${entry.reason}` : ''}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
