import { useMemo, useState } from 'react'
import { PencilSimple, Play, Trash, XCircle } from 'phosphor-react'
import { toast } from 'sonner'
import { useRole } from '@/context/role-context'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/common/data-table/table'
import {
  getRoleScope,
  type AuditEntry,
  type SecurityEvent,
} from '../data/audit-entries'
import { AccessDeniedPanel } from './access-denied-panel'
import { auditDateTimeFmt } from './audit-badges'
import { AuditEntrySheet } from './audit-entry-sheet'
import {
  AuditFilterBar,
  EMPTY_FILTERS,
  applyFilters,
  type AuditFilters,
} from './audit-filter-bar'
import { auditLogColumns } from './audit-log-columns'

interface AuditTrailTabProps {
  entries: AuditEntry[]
  securityEvents: SecurityEvent[]
  allowed: boolean
  onSimulateCommitted: () => void
  onSimulateRolledBack: () => void
  onSecurityEvent: (
    type: SecurityEvent['type'],
    detail: string,
    actor: string
  ) => void
}

export function AuditTrailTab({
  entries,
  securityEvents,
  allowed,
  onSimulateCommitted,
  onSimulateRolledBack,
  onSecurityEvent,
}: AuditTrailTabProps) {
  const { role, hasRole } = useRole()
  const scope = getRoleScope(role)

  const [filters, setFilters] = useState<AuditFilters>(EMPTY_FILTERS)
  const [selectedRows, setSelectedRows] = useState<AuditEntry[]>([])
  const [resetSelectionKey, setResetSelectionKey] = useState(0)
  const [detailEntry, setDetailEntry] = useState<AuditEntry | null>(null)
  const [tamperDialog, setTamperDialog] = useState<'edit' | 'delete' | null>(
    null
  )

  const actors = useMemo(
    () => [...new Set(entries.map((e) => e.actor))].sort(),
    [entries]
  )
  const filtered = useMemo(
    () => applyFilters(entries, filters),
    [entries, filters]
  )

  const isAdmin = hasRole(
    'Platform Admin',
    'Portfolio Admin',
    'Group Company Admin',
    'Company Admin'
  )

  if (scope.kind === 'none') {
    return <AccessDeniedPanel title='No direct access' description={scope.reason} />
  }
  if (!allowed) {
    return (
      <AccessDeniedPanel
        description={`The role "${role}" has no audit-view permission in the current access configuration. Ask a Platform Admin to grant it under the Governance tab.`}
      />
    )
  }

  const onTamperAttempt = () => {
    const mode = tamperDialog
    setTamperDialog(null)
    const ids = selectedRows.map((r) => r.id).join(', ')
    onSecurityEvent(
      'tamper-attempt',
      `${mode === 'edit' ? 'Modify' : 'Delete'} attempt on audit ${selectedRows.length === 1 ? 'entry' : 'entries'} ${ids} blocked — audit entries are write-once.`,
      `${role} session`
    )
    toast.error(
      'Blocked: audit entries are tamper-resistant. The attempt itself has been recorded as a security event.'
    )
    setSelectedRows([])
    setResetSelectionKey((prev) => prev + 1)
  }

  return (
    <div className='w-full'>
      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          Audit trail ({filtered.length})
          <span className='text-neutral-1000 ms-2 text-sm font-normal'>
            {scope.kind === 'all'
              ? 'All tenants'
              : scope.kind === 'companies'
                ? `Scope: ${scope.label}`
                : 'Scope: your own record'}
          </span>
        </h2>
        <div className='flex items-center gap-3'>
          {hasRole('Platform Admin') && (
            <>
              <Button
                variant='outline'
                className='h-7 gap-1 px-2 text-sm'
                onClick={onSimulateCommitted}
              >
                <Play size={12} weight='bold' />
                Simulate committed change
              </Button>
              <Button
                variant='outline'
                className='h-7 gap-1 px-2 text-sm'
                onClick={onSimulateRolledBack}
              >
                <XCircle size={12} weight='bold' />
                Simulate rolled-back change
              </Button>
            </>
          )}
          <Button
            variant='icon2'
            onClick={() => setTamperDialog('edit')}
            className='text-neutral-1900 h-7 w-7'
            disabled={selectedRows.length !== 1}
            aria-label='Attempt edit (blocked)'
          >
            <PencilSimple size={16} weight='fill' />
          </Button>
          <Button
            variant='icon2'
            onClick={() => setTamperDialog('delete')}
            className='text-neutral-1900 h-7 w-7'
            disabled={selectedRows.length === 0}
            aria-label='Attempt delete (blocked)'
          >
            <Trash size={16} weight='bold' />
          </Button>
        </div>
      </div>

      <AuditFilterBar filters={filters} onChange={setFilters} actors={actors} />

      <DataTable
        columns={auditLogColumns}
        data={filtered}
        variant='no-status'
        resetSelectionKey={resetSelectionKey}
        onSelectionChange={(rows) => setSelectedRows(rows)}
        onRowClick={(row) => setDetailEntry(row)}
      />

      {isAdmin && (
        <Card className='border-gray-200 mt-4 w-full border bg-white'>
          <CardHeader className='px-4 pt-4 pb-0'>
            <CardTitle className='text-paragraph-sm text-neutral-1600 font-medium'>
              Security events — blocked tamper &amp; denied-access attempts
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-2 px-4 py-3'>
            {securityEvents.map((event) => (
              <div
                key={event.id}
                className='border-gray-200 flex flex-wrap items-center gap-2 rounded-[6px] border px-3 py-2'
              >
                <Badge
                  variant={
                    event.type === 'tamper-attempt' ? 'dropped' : 'pending'
                  }
                >
                  {event.type === 'tamper-attempt'
                    ? 'Tamper attempt'
                    : 'Access denied'}
                </Badge>
                <span className='text-neutral-1900 min-w-0 flex-1 text-sm'>
                  {event.detail}
                </span>
                <span className='text-neutral-1000 text-xs whitespace-nowrap'>
                  {event.actor} · {auditDateTimeFmt.format(new Date(event.timestamp))}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <AuditEntrySheet
        entry={detailEntry}
        onOpenChange={(open) => {
          if (!open) setDetailEntry(null)
        }}
      />

      <AlertDialog
        open={tamperDialog !== null}
        onOpenChange={(open) => {
          if (!open) setTamperDialog(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Audit entries are write-once
            </AlertDialogTitle>
            <AlertDialogDescription>
              {tamperDialog === 'edit' ? 'Editing' : 'Deleting'}{' '}
              {selectedRows.length === 1
                ? `entry ${selectedRows[0]?.id}`
                : `${selectedRows.length} entries`}{' '}
              is not permitted for any role — audit logs are tamper-resistant
              across active and archival storage. Proceeding will only record
              the attempt as a security event.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onTamperAttempt}
              className='bg-destructive hover:bg-destructive/90 text-white'
            >
              Attempt anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
