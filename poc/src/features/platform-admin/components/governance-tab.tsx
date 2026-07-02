import { useState } from 'react'
import { useRole } from '@/context/role-context'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { anonymizationRules, DSR_TYPES, type DsrType } from '../data/governance'
import { type GovernanceStore } from '../hooks/use-governance'
import { MiniTable, SectionCard, ToneBadge, type BadgeTone } from './shared'

const dsrTone: Record<string, BadgeTone> = {
  received: 'blue',
  'identity verified': 'blue',
  'in progress': 'amber',
  completed: 'green',
  'statutory exception': 'red',
}

const stageTone: Record<string, BadgeTone> = {
  'account disabled': 'amber',
  'active (exit processing)': 'blue',
  anonymized: 'grey',
  purged: 'grey',
}

/**
 * Data governance tab (SYS-26, 37, 69, 70, 71) — retention rules, the
 * terminated-record lifecycle with legal holds & monthly purge, and the
 * data-subject-rights portal.
 */
export function GovernanceTab({ store }: { store: GovernanceStore }) {
  const { hasRole } = useRole()
  const canAdmin = hasRole('Platform Admin', 'Company Admin')
  const [dsrOpen, setDsrOpen] = useState(false)
  const [dsrType, setDsrType] = useState<DsrType>('Access')
  const [dsrDetail, setDsrDetail] = useState('')
  const [dsrSensitive, setDsrSensitive] = useState(false)

  return (
    <div className='w-full'>
      {/* Retention periods per data type (SYS-26, 69) */}
      <SectionCard
        title='Data retention rules'
        description='Defined retention periods enforced per data type'
      >
        <MiniTable
          headers={['Data type', 'Retention', 'Note']}
          rows={store.retentionRules.map((r) => [
            <span key='d' className='font-medium'>{r.dataType}</span>,
            r.retention,
            <span key='n' className='text-paragraph-sm text-neutral-1000'>
              {r.note}
            </span>,
          ])}
        />
      </SectionCard>

      {/* Terminated-record lifecycle & purge (SYS-70) */}
      <SectionCard
        title='Terminated-record lifecycle & purge'
        description='Account disabled immediately → active 30 days for exit processing → anonymized → permanently deleted after 7 years. Automated monthly purge with legal-hold suspension.'
        actions={
          canAdmin ? (
            <Button variant='outline' className='h-8' onClick={store.runMonthlyPurge}>
              Run monthly purge
            </Button>
          ) : undefined
        }
      >
        <MiniTable
          headers={['Person', 'Company', 'Terminated on', 'Stage', 'Legal hold']}
          rows={store.lifecycleRecords.map((r) => [
            <span key='p' className='font-medium'>{r.person}</span>,
            r.tenantCode,
            r.terminatedOn,
            <ToneBadge key='s' tone={stageTone[r.stage] ?? 'grey'}>
              {r.stage}
            </ToneBadge>,
            <Switch
              key='h'
              checked={r.legalHold}
              disabled={!canAdmin || r.stage === 'purged'}
              onCheckedChange={() => store.toggleLegalHold(r.id)}
            />,
          ])}
        />
        <p className='text-paragraph-sm text-neutral-1000 mt-2'>
          Anonymization: {anonymizationRules.join(' · ')}
        </p>
      </SectionCard>

      {/* Data subject rights (SYS-26, 37, 71) */}
      <SectionCard
        title={`Data subject rights requests (${store.dsrRequests.length})`}
        description='Self-service portal with identity verification, request tracking, 30-day SLA monitoring and DPO support. Erasure honors statutory exceptions.'
        actions={
          <Button variant='outline' className='h-8' onClick={() => setDsrOpen(true)}>
            New request (self-service)
          </Button>
        }
      >
        <MiniTable
          headers={['Request', 'Requester', 'Type', 'Submitted', 'SLA due', 'Status', '']}
          rows={store.dsrRequests.map((r) => [
            <div key='r' className='flex flex-col'>
              <span className='font-medium'>{r.id}</span>
              <span className='text-paragraph-sm text-neutral-1000'>
                {r.detail}
                {r.sensitive ? ' · sensitive (workflow-approved)' : ''}
              </span>
            </div>,
            r.requester,
            r.type,
            r.submittedAt,
            r.slaDue,
            <ToneBadge key='s' tone={dsrTone[r.status] ?? 'grey'}>
              {r.status}
            </ToneBadge>,
            <div key='a' className='flex justify-end gap-1'>
              {canAdmin && r.type === 'Access' && r.status !== 'completed' && (
                <Button
                  variant='outline'
                  className='h-7 px-2 text-xs'
                  onClick={() => store.exportDsrData(r)}
                >
                  Export data
                </Button>
              )}
              {canAdmin &&
                r.status !== 'completed' &&
                r.status !== 'statutory exception' && (
                  <Button
                    className='h-7 px-2 text-xs'
                    onClick={() => store.advanceDsr(r.id)}
                  >
                    Advance
                  </Button>
                )}
            </div>,
          ])}
        />
      </SectionCard>

      {/* Self-service DSR submission (SYS-37, 71) */}
      <Dialog open={dsrOpen} onOpenChange={setDsrOpen}>
        <DialogContent className='sm:max-w-[440px]'>
          <DialogHeader>
            <DialogTitle>Exercise your data subject rights</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='flex flex-col gap-1.5'>
              <Label>Request type</Label>
              <Select value={dsrType} onValueChange={(v) => setDsrType(v as DsrType)}>
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DSR_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t === 'Access'
                        ? 'Right to Access — machine-readable copy in 30 days'
                        : t === 'Rectification'
                          ? 'Right to Rectification'
                          : 'Right to Erasure'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {dsrType === 'Rectification' && (
              <div className='flex items-center gap-2'>
                <Switch checked={dsrSensitive} onCheckedChange={setDsrSensitive} />
                <Label>
                  Sensitive field (routes through an approval workflow)
                </Label>
              </div>
            )}
            <div className='flex flex-col gap-1.5'>
              <Label>Details</Label>
              <Textarea
                value={dsrDetail}
                onChange={(e) => setDsrDetail(e.target.value)}
                placeholder='Describe the data concerned…'
              />
            </div>
            <p className='text-paragraph-sm text-neutral-1000'>
              Your identity will be verified before processing; the request is
              tracked against a 30-day SLA with DPO support.
            </p>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDsrOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={dsrDetail.trim().length < 5}
              onClick={() => {
                store.submitDsr('You', dsrType, dsrDetail.trim(), dsrSensitive)
                setDsrDetail('')
                setDsrSensitive(false)
                setDsrOpen(false)
              }}
            >
              Submit request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
