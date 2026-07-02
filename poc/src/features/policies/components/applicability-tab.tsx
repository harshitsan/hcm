import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRole } from '@/context/role-context'
import {
  policyVisibleToRole,
  resolveWorkerPolicies,
  todayIso,
  versionInForceOn,
} from '../data/policy-utils'
import { seedWorkers } from '../data/workers'
import { type PoliciesStore } from '../hooks/use-policies'
import { OutcomeBadge } from './policy-badges'

/**
 * Rules-engine applicability resolution (POL-17): pick any worker — including
 * Employee (Non-User) workers with no login (POL-12) — and an as-of date
 * (POL-05), and see every policy deterministically resolved across company,
 * group, jurisdiction, location, department, employment type, worker kind and
 * position level (POL-02/03/06/13/23/31), with the most specific scope winning.
 */
export function ApplicabilityTab({ store }: { store: PoliciesStore }) {
  const { role } = useRole()
  const [workerId, setWorkerId] = useState(seedWorkers[0].id)
  const [asOfDate, setAsOfDate] = useState(todayIso())

  const worker = seedWorkers.find((w) => w.id === workerId) ?? seedWorkers[0]

  const resolutions = useMemo(() => {
    const visible = store.policies.filter((p) => policyVisibleToRole(p, role))
    return resolveWorkerPolicies(visible, worker, asOfDate)
  }, [store.policies, role, worker, asOfDate])

  const applying = resolutions.filter((r) => r.outcome === 'applies').length

  const profile: [string, string][] = [
    ['Company', worker.company],
    ['Group', worker.group],
    ['Jurisdiction', worker.jurisdiction],
    ['Location', worker.location],
    ['Department', worker.department],
    ['Employment type', worker.employmentType],
    ['Position level', worker.positionLevel],
    ['Worker kind', worker.workerKind],
  ]

  return (
    <div className='w-full space-y-4'>
      <Card className='gap-3 border-none bg-white py-4'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Resolve applicable policies
          </CardTitle>
          <p className='text-paragraph-sm text-neutral-1000'>
            The shared rules engine evaluates every scoped policy for a worker
            on a date and selects one winner per category — a more specific
            scope (Company-level) overrides a broader one (Group, then
            Portfolio). Re-running with the same inputs always returns the same
            result.
          </p>
        </CardHeader>
        <CardContent className='space-y-3 px-4'>
          <div className='flex flex-wrap items-center gap-2'>
            <Select value={workerId} onValueChange={setWorkerId}>
              <SelectTrigger variant='secondary' className='w-72 bg-white'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {seedWorkers.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name} · {w.company}
                    {w.hasLogin ? '' : ' · non-user'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type='date'
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value || todayIso())}
              className='h-9 w-44 bg-white'
              aria-label='As-of date'
            />
            <Badge variant='badge_active'>
              {applying} policy(ies) in force for this worker
            </Badge>
          </div>

          <div className='flex flex-wrap gap-1.5'>
            {profile.map(([label, value]) => (
              <Badge key={label} variant='open'>
                {label}: {value}
              </Badge>
            ))}
            {!worker.hasLogin && (
              <Badge variant='pending'>Employee (Non-User) — no login</Badge>
            )}
          </div>

          {!worker.hasLogin && (
            <div className='rounded-[6px] bg-neutral-100 px-3 py-2'>
              <p className='text-paragraph-sm text-neutral-1000'>
                This worker has no system login. The policies below still apply
                to them and are surfaced and administered on their behalf by an
                authorized admin through HR-managed processes, not self-service
                (POL-12).
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className='space-y-2'>
        {resolutions.map(({ policy, evaluation, outcome, note }) => {
          const inForce = versionInForceOn(policy, asOfDate)
          return (
            <div
              key={policy.id}
              className='border-grey-200 flex flex-wrap items-center justify-between gap-2 rounded-[6px] border bg-white px-3 py-2'
            >
              <div className='flex min-w-0 flex-col'>
                <span className='text-neutral-1600 text-sm font-medium'>
                  {policy.name}
                  {inForce ? ` — ${inForce.editionName}` : ''}
                </span>
                <span className='text-paragraph-sm text-neutral-1000'>
                  {policy.category} · {policy.ownerLevel}-level ·{' '}
                  {policy.ownerName} · specificity {evaluation.specificity}
                </span>
                <span className='text-paragraph-sm text-neutral-1900'>
                  {note}
                </span>
              </div>
              <OutcomeBadge outcome={outcome} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
