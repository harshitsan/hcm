import { useMemo, useState } from 'react'
import { ArrowDownUp } from 'lucide-react'
import { useRole } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getRoleScope, type AuditEntry } from '../data/audit-entries'
import { AccessDeniedPanel } from './access-denied-panel'
import {
  ActionBadge,
  TierBadge,
  ValueTransition,
  auditDateTimeFmt,
} from './audit-badges'
import {
  AuditFilterBar,
  EMPTY_FILTERS,
  applyFilters,
  type AuditFilters,
} from './audit-filter-bar'

interface RecordHistoryTabProps {
  entries: AuditEntry[]
  allowed: boolean
}

/**
 * In-application record-level change-history utility (FR 6.29.4): pick a
 * record in scope, see its chronological history with field, previous/new
 * values, timestamp and actor — searchable and filterable, presented
 * consistently across active and archival storage.
 */
export function RecordHistoryTab({ entries, allowed }: RecordHistoryTabProps) {
  const { role } = useRole()
  const scope = getRoleScope(role)

  const records = useMemo(() => {
    const map = new Map<string, { key: string; label: string }>()
    entries.forEach((e) => {
      const key = `${e.entityType}:${e.recordId}`
      if (!map.has(key)) {
        map.set(key, {
          key,
          label: `${e.entityType} · ${e.recordName} (${e.recordId})`,
        })
      }
    })
    return [...map.values()].sort((a, b) => a.label.localeCompare(b.label))
  }, [entries])

  const [recordKey, setRecordKey] = useState<string>('')
  const [filters, setFilters] = useState<AuditFilters>(EMPTY_FILTERS)
  const [sortDesc, setSortDesc] = useState(false)

  const selectedKey =
    recordKey && records.some((r) => r.key === recordKey)
      ? recordKey
      : (records[0]?.key ?? '')

  const recordEntries = useMemo(() => {
    if (!selectedKey) return []
    const [entityType, recordId] = selectedKey.split(':')
    return entries.filter(
      (e) => e.entityType === entityType && e.recordId === recordId
    )
  }, [entries, selectedKey])

  const actors = useMemo(
    () => [...new Set(recordEntries.map((e) => e.actor))].sort(),
    [recordEntries]
  )

  const history = useMemo(() => {
    const filtered = applyFilters(recordEntries, filters)
    return [...filtered].sort((a, b) =>
      sortDesc
        ? b.timestamp.localeCompare(a.timestamp)
        : a.timestamp.localeCompare(b.timestamp)
    )
  }, [recordEntries, filters, sortDesc])

  if (scope.kind === 'none') {
    return <AccessDeniedPanel title='No direct access' description={scope.reason} />
  }
  if (!allowed) {
    return (
      <AccessDeniedPanel
        description={`The role "${role}" has no record-history permission in the current access configuration. Ask a Platform Admin to grant it under the Governance tab.`}
      />
    )
  }

  const spansBothStores =
    recordEntries.some((e) => e.storageTier === 'active') &&
    recordEntries.some((e) => e.storageTier === 'archived')

  return (
    <div className='w-full'>
      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
        <div className='flex flex-wrap items-center gap-2'>
          <Select value={selectedKey} onValueChange={setRecordKey}>
            <SelectTrigger variant='secondary' className='h-8 w-[320px]'>
              <SelectValue placeholder='Select a record' />
            </SelectTrigger>
            <SelectContent>
              {records.map((r) => (
                <SelectItem key={r.key} value={r.key}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {scope.kind === 'self' && (
            <span className='text-neutral-1000 text-xs'>
              Self-service: only your own employee record is accessible. Other
              records are denied by RBAC.
            </span>
          )}
        </div>
        <Button
          variant='outline'
          className='h-8 gap-1 px-2 text-sm'
          onClick={() => setSortDesc((prev) => !prev)}
        >
          <ArrowDownUp className='size-3.5' />
          {sortDesc ? 'Newest first' : 'Oldest first'}
        </Button>
      </div>

      <AuditFilterBar
        filters={filters}
        onChange={setFilters}
        actors={actors}
        showEntityFilter={false}
      />

      <Card className='border-gray-200 w-full border bg-white'>
        <CardHeader className='flex flex-wrap items-center justify-between px-4 pt-4 pb-0'>
          <CardTitle className='text-paragraph-sm text-neutral-1600 font-medium'>
            Chronological change history ({history.length}{' '}
            {history.length === 1 ? 'entry' : 'entries'})
          </CardTitle>
          {spansBothStores && (
            <Badge variant='open'>Spans active + archival storage</Badge>
          )}
        </CardHeader>
        <CardContent className='px-4 py-4'>
          {history.length === 0 ? (
            <p className='text-neutral-1000 py-8 text-center text-sm'>
              No history entries match the current filters.
            </p>
          ) : (
            <ol className='border-gray-200 ms-2 space-y-5 border-s ps-5'>
              {history.map((entry) => (
                <li key={entry.id} className='relative'>
                  <span className='bg-blue-1400 absolute -start-[26px] top-1.5 h-2.5 w-2.5 rounded-full' />
                  <div className='flex flex-wrap items-center gap-2'>
                    <ActionBadge action={entry.actionType} />
                    <span className='text-neutral-1600 text-sm font-medium'>
                      {auditDateTimeFmt.format(new Date(entry.timestamp))}
                    </span>
                    <span className='text-neutral-1000 text-sm'>
                      by {entry.actor}
                      {entry.actorType === 'system' && ' (system identity)'}
                    </span>
                    <TierBadge tier={entry.storageTier} />
                  </div>
                  <div className='mt-2 space-y-1.5'>
                    {entry.changes.map((change) => (
                      <div
                        key={`${entry.id}-${change.field}`}
                        className='flex flex-wrap items-center gap-2 text-sm'
                      >
                        <span className='text-neutral-1900 min-w-[130px] font-medium'>
                          {change.field}
                        </span>
                        <ValueTransition
                          previousValue={change.previousValue}
                          newValue={change.newValue}
                        />
                      </div>
                    ))}
                  </div>
                  <div className='text-neutral-1000 mt-1 text-xs'>
                    {entry.id} · {entry.companyName} · {entry.tenant}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
