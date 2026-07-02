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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type OperationsStore } from '../hooks/use-operations'
import { MiniTable, SectionCard, ToneBadge } from './shared'

/**
 * Operations & SLA tab (SYS-23, 24, 53-64) — performance targets vs
 * measured, availability tiers, failover/RTO/RPO, backup tiers, DR test
 * cadence and controlled maintenance windows.
 */
export function OperationsTab({ store }: { store: OperationsStore }) {
  const { hasRole } = useRole()
  const isPlatformAdmin = hasRole('Platform Admin')
  const [mwOpen, setMwOpen] = useState(false)
  const [mwDate, setMwDate] = useState('')
  const [mwHours, setMwHours] = useState(4)
  const [mwError, setMwError] = useState<string | null>(null)

  return (
    <div className='w-full'>
      {/* Performance & scalability targets (SYS-23, 53-58) */}
      <SectionCard
        title='Performance, scalability & concurrency'
        description='Sub-2-second interactions up to 1000-employee tenants; bounded report and import/export times; 20% concurrency with 2× burst; no fixed platform limits. Regressions are flagged for remediation.'
      >
        <MiniTable
          headers={['Measure', 'Target', 'Measured', 'Status']}
          rows={store.perfMetrics.map((m) => [
            m.name,
            <span key='t' className='font-medium'>{m.target}</span>,
            m.measured,
            <ToneBadge key='s' tone={m.met ? 'green' : 'amber'}>
              {m.met ? 'Met' : 'Flagged for optimization'}
            </ToneBadge>,
          ])}
        />
      </SectionCard>

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        {/* Availability tiers (SYS-59) */}
        <SectionCard title='Availability tiers' className='mb-0'>
          <MiniTable
            headers={['Tier', 'Target uptime', 'Measured', 'Status']}
            rows={store.availabilityTiers.map((t) => [
              t.tier,
              t.target,
              t.measured,
              <ToneBadge key='s' tone={t.met ? 'green' : 'red'}>
                {t.met ? 'Met' : 'Breached'}
              </ToneBadge>,
            ])}
          />
          <p className='text-paragraph-sm text-neutral-1000 mt-2'>
            {store.failoverPosture.architecture} · failover{' '}
            {store.failoverPosture.failoverTarget.toLowerCase()} ·{' '}
            {store.failoverPosture.replication} replication. Last failover:{' '}
            {store.failoverPosture.lastFailover}.
          </p>
        </SectionCard>

        {/* RTO / RPO (SYS-62) */}
        <SectionCard title='Recovery objectives (RTO / RPO)' className='mb-0'>
          <MiniTable
            headers={['Tier', 'RTO', 'RPO']}
            rows={store.recoveryObjectives.map((r) => [r.tier, r.rto, r.rpo])}
          />
          <p className='text-paragraph-sm text-neutral-1000 mt-2'>
            Achieved RTO/RPO are measured against targets after every recovery
            event.
          </p>
        </SectionCard>
      </div>

      {/* Backup strategy (SYS-63) */}
      <SectionCard title='Tiered backup strategy' className='mt-4'>
        <MiniTable
          headers={['Backup tier', 'Cadence', 'Retention']}
          rows={store.backupTiers.map((b) => [
            <span key='n' className='font-medium'>{b.name}</span>,
            b.cadence,
            b.retention,
          ])}
        />
        <p className='text-paragraph-sm text-neutral-1000 mt-2'>
          All backups are encrypted; restores use the appropriate tier per the
          requested point in time.
        </p>
      </SectionCard>

      {/* DR testing cadence (SYS-64) */}
      <SectionCard
        title='Disaster-recovery testing cadence'
        description='Quarterly tabletop exercises, bi-annual failover tests and monthly automated restore tests'
      >
        <MiniTable
          headers={['Test', 'Cadence', 'Last run', 'Result', '']}
          rows={store.drTests.map((t) => [
            <span key='k' className='font-medium'>{t.kind}</span>,
            t.cadence,
            t.lastRun,
            <ToneBadge key='r' tone={t.result === 'passed' ? 'green' : 'amber'}>
              {t.result}
            </ToneBadge>,
            <div key='a' className='flex justify-end'>
              {isPlatformAdmin && (
                <Button
                  variant='outline'
                  className='h-7 px-2 text-xs'
                  onClick={() => store.recordDrTest(t.kind)}
                >
                  Record test run
                </Button>
              )}
            </div>,
          ])}
        />
      </SectionCard>

      {/* Maintenance windows (SYS-61) */}
      <SectionCard
        title='Maintenance windows'
        description='At most once per month, up to 4 hours, Sunday 02:00–06:00 IST, announced at least 7 days in advance'
        actions={
          isPlatformAdmin ? (
            <Button
              variant='outline'
              className='h-8'
              onClick={() => {
                setMwError(null)
                setMwOpen(true)
              }}
            >
              Schedule maintenance
            </Button>
          ) : undefined
        }
      >
        <MiniTable
          headers={['Date', 'Window', 'Duration', 'Notice sent', 'Status']}
          rows={store.maintenanceWindows.map((w) => [
            w.date,
            w.window,
            `${w.durationHours} h`,
            w.noticeSentOn,
            <ToneBadge key='s' tone={w.status === 'announced' ? 'blue' : 'grey'}>
              {w.status}
            </ToneBadge>,
          ])}
        />
      </SectionCard>

      <Dialog open={mwOpen} onOpenChange={setMwOpen}>
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader>
            <DialogTitle>Schedule maintenance window</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='flex flex-col gap-1.5'>
              <Label>Date (must be a Sunday, ≥ 7 days out)</Label>
              <Input
                type='date'
                value={mwDate}
                onChange={(e) => setMwDate(e.target.value)}
              />
            </div>
            <div className='flex flex-col gap-1.5'>
              <Label>Duration in hours (starts 02:00 IST, max 4)</Label>
              <Input
                type='number'
                min={1}
                max={4}
                value={mwHours}
                onChange={(e) => setMwHours(Number(e.target.value))}
              />
            </div>
            {mwError && (
              <p className='text-destructive text-paragraph-sm'>{mwError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setMwOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={mwDate === ''}
              onClick={() => {
                const error = store.scheduleMaintenance({
                  date: mwDate,
                  durationHours: mwHours,
                })
                setMwError(error)
                if (!error) {
                  setMwDate('')
                  setMwOpen(false)
                }
              }}
            >
              Announce window
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
