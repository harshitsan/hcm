import { useMemo, useState } from 'react'
import { Archive, PencilSimple, Trash } from 'phosphor-react'
import { useRole } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  type PolicyVersionStatus,
  type RetentionPolicyVersion,
} from '../data/audit-config'
import { type AuditEntry } from '../data/audit-entries'
import { AccessDeniedPanel } from './access-denied-panel'
import { auditDateFmt, auditDateTimeFmt } from './audit-badges'
import { RetentionPolicyDialog } from './retention-policy-dialog'
import { type RetentionPolicyDraft } from '../hooks/use-audit-config'

const versionStatusBadge: Record<
  PolicyVersionStatus,
  { label: string; variant: 'badge_active' | 'open' | 'badge_inactive' }
> = {
  'in-effect': { label: 'In effect', variant: 'badge_active' },
  scheduled: { label: 'Scheduled', variant: 'open' },
  superseded: { label: 'Superseded', variant: 'badge_inactive' },
}

interface RetentionTabProps {
  entries: AuditEntry[]
  policyVersions: RetentionPolicyVersion[]
  currentPolicy: RetentionPolicyVersion
  onSavePolicy: (draft: RetentionPolicyDraft) => void
  onRunArchival: () => void
  onDisposeExpired: () => void
}

/**
 * Retention & archival (FR 6.29.3): 1-year active / 7-year total policy as
 * governed, versioned config plus the archival + disposal processes that read
 * it. Platform Admin only.
 */
export function RetentionTab({
  entries,
  policyVersions,
  currentPolicy,
  onSavePolicy,
  onRunArchival,
  onDisposeExpired,
}: RetentionTabProps) {
  const { role, hasRole } = useRole()
  const [editOpen, setEditOpen] = useState(false)

  const stats = useMemo(() => {
    const activeCutoff = new Date()
    activeCutoff.setMonth(activeCutoff.getMonth() - currentPolicy.activeMonths)
    const disposalCutoff = new Date()
    disposalCutoff.setFullYear(
      disposalCutoff.getFullYear() - currentPolicy.totalYears
    )
    return {
      active: entries.filter((e) => e.storageTier === 'active').length,
      archived: entries.filter((e) => e.storageTier === 'archived').length,
      dueForArchival: entries.filter(
        (e) =>
          e.storageTier === 'active' && new Date(e.timestamp) < activeCutoff
      ).length,
      disposalEligible: entries.filter(
        (e) =>
          e.storageTier === 'archived' && new Date(e.timestamp) < disposalCutoff
      ).length,
    }
  }, [entries, currentPolicy])

  if (!hasRole('Platform Admin')) {
    return (
      <AccessDeniedPanel
        description={`Retention and archival configuration is restricted to Platform Admins. The role "${role}" cannot view or change the retention policy.`}
      />
    )
  }

  return (
    <div className='grid w-full gap-4 lg:grid-cols-2'>
      {/* Current governed policy */}
      <Card className='border-grey-200 border bg-white'>
        <CardHeader className='flex items-center justify-between px-4 pt-4 pb-0'>
          <CardTitle className='text-paragraph-sm text-neutral-1600 font-medium'>
            Retention policy (governed config)
          </CardTitle>
          <Button
            variant='outline'
            className='h-7 gap-1 px-2 text-sm'
            onClick={() => setEditOpen(true)}
          >
            <PencilSimple size={12} weight='fill' />
            Edit policy
          </Button>
        </CardHeader>
        <CardContent className='space-y-3 px-4 py-4'>
          <div className='grid grid-cols-2 gap-3'>
            <div className='border-grey-200 rounded-[6px] border px-3 py-2'>
              <div className='text-neutral-1000 text-xs'>Active retention</div>
              <div className='text-neutral-1600 text-2xl font-medium'>
                {currentPolicy.activeMonths} months
              </div>
            </div>
            <div className='border-grey-200 rounded-[6px] border px-3 py-2'>
              <div className='text-neutral-1000 text-xs'>
                Total retention (with archival)
              </div>
              <div className='text-neutral-1600 text-2xl font-medium'>
                {currentPolicy.totalYears} years
              </div>
            </div>
          </div>
          <p className='text-neutral-1000 text-xs'>
            v{currentPolicy.version} · effective{' '}
            {auditDateFmt.format(new Date(currentPolicy.effectiveFrom))} · by{' '}
            {currentPolicy.changedBy}. The archival/disposal jobs read these
            values as their rule source — no hard-coded durations, no code
            deployment to change them.
          </p>

          <div>
            <h4 className='text-neutral-1600 mb-2 text-sm font-semibold'>
              Version history
            </h4>
            <div className='space-y-1.5'>
              {policyVersions.map((v) => (
                <div
                  key={v.id}
                  className='border-grey-200 flex flex-wrap items-center gap-2 rounded-[6px] border px-3 py-1.5 text-sm'
                >
                  <span className='text-neutral-1600 font-medium'>
                    v{v.version}
                  </span>
                  <Badge variant={versionStatusBadge[v.status].variant}>
                    {versionStatusBadge[v.status].label}
                  </Badge>
                  <span className='text-neutral-1900'>
                    {v.activeMonths} mo active / {v.totalYears} yr total
                  </span>
                  <span className='text-neutral-1000 ms-auto text-xs'>
                    effective {auditDateFmt.format(new Date(v.effectiveFrom))} ·
                    saved {auditDateTimeFmt.format(new Date(v.changedAt))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Archival + disposal processes */}
      <Card className='border-grey-200 border bg-white'>
        <CardHeader className='px-4 pt-4 pb-0'>
          <CardTitle className='text-paragraph-sm text-neutral-1600 font-medium'>
            Archival &amp; disposal
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 px-4 py-4'>
          <div className='grid grid-cols-2 gap-3'>
            <div className='border-grey-200 rounded-[6px] border px-3 py-2'>
              <div className='text-neutral-1000 text-xs'>In active store</div>
              <div className='text-neutral-1600 text-2xl font-medium'>
                {stats.active}
              </div>
            </div>
            <div className='border-grey-200 rounded-[6px] border px-3 py-2'>
              <div className='text-neutral-1000 text-xs'>In archival store</div>
              <div className='text-neutral-1600 text-2xl font-medium'>
                {stats.archived}
              </div>
            </div>
            <div className='border-grey-200 rounded-[6px] border px-3 py-2'>
              <div className='text-neutral-1000 text-xs'>
                Past active window (due for archival)
              </div>
              <div className='text-neutral-1600 text-2xl font-medium'>
                {stats.dueForArchival}
              </div>
            </div>
            <div className='border-grey-200 rounded-[6px] border px-3 py-2'>
              <div className='text-neutral-1000 text-xs'>
                Past total retention (disposal eligible)
              </div>
              <div className='text-neutral-1600 text-2xl font-medium'>
                {stats.disposalEligible}
              </div>
            </div>
          </div>

          <div className='flex flex-wrap gap-2'>
            <Button className='h-8 gap-1.5 px-3' onClick={onRunArchival}>
              <Archive size={14} weight='bold' />
              Run archival sweep
            </Button>
            <Button
              variant='outline'
              className='h-8 gap-1.5 px-3'
              onClick={onDisposeExpired}
            >
              <Trash size={14} weight='bold' />
              Dispose expired entries
            </Button>
          </div>

          <p className='text-neutral-1000 text-xs'>
            The sweep moves entries older than the active window (
            {currentPolicy.activeMonths} months) to archival storage instead of
            deleting them; archived entries stay retrievable until{' '}
            {currentPolicy.totalYears} years total, after which they become
            eligible for disposal. Both processes preserve tamper-resistance
            and integrity of retained records.
          </p>
        </CardContent>
      </Card>

      <RetentionPolicyDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        current={currentPolicy}
        onSubmit={onSavePolicy}
      />
    </div>
  )
}
