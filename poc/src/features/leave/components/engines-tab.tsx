import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { policySpecificity, type LeavePolicy } from '../data/policies'
import {
  COMPANIES,
  DEPARTMENTS,
  EMPLOYEE_TYPES,
  GROUP_COMPANIES,
  JURISDICTIONS,
  LOCATIONS,
  fmtDate,
} from '../data/shared'
import { type BalancesStore } from '../hooks/use-balances'
import { type LeaveConfigStore } from '../hooks/use-leave-config'

const ENGINES = [
  {
    name: 'Workflow / Approval Engine',
    story: 'LVE-24',
    detail:
      'Interprets each tenant’s levels, approvers, sequential/parallel modes, all/any rules, delegation windows and SLA escalations from config at runtime. The same engine serves other modules driven only by their config.',
  },
  {
    name: 'Rules Engine',
    story: 'LVE-25',
    detail:
      'Evaluates differentiation decision tables at request time and deterministically selects the single most-specific applicable policy, returning allow/deny with the reason.',
  },
  {
    name: 'Accrual / Balance / Time Engine',
    story: 'LVE-26',
    detail:
      'Accrues entitlements on schedule, deducts atomically on approval, restores on cancellation/withdrawal, creates and lapses comp-off credits, and applies carry-forward, caps and pro-ration.',
  },
  {
    name: 'Notification / Template Engine',
    story: 'LVE-27',
    detail:
      'Renders configured templates on every state transition (submitted, approved, rejected, escalated, delegated, cancelled) and delivers to applicant, approver and delegate per channel config.',
  },
  {
    name: 'Forms / Dynamic-Fields Engine',
    story: 'LVE-28',
    detail:
      'Renders type-specific request fields (medical certificate, relationship, half-day, comp-off source, FMLA reason) with required/conditional rules — new field config applies to the next render without code changes.',
  },
]

interface EnginesTabProps {
  config: LeaveConfigStore
  balances: BalancesStore
}

/**
 * Platform engine console: shared-engine descriptions (LVE-24..28), a live
 * rules-engine policy resolver (LVE-25), the accrual run (LVE-26) and a
 * bitemporal as-of query (LVE-21).
 */
export function EnginesTab({ config, balances }: EnginesTabProps) {
  const [attrs, setAttrs] = useState({
    employeeType: 'Full-time',
    group: 'Satellite Group',
    jurisdiction: 'India',
    company: 'Satellite Tech India',
    department: 'Engineering',
    location: 'Hyderabad',
  })
  const [result, setResult] = useState<{
    governing: LeavePolicy | null
    matches: LeavePolicy[]
  } | null>(null)
  const [asOf, setAsOf] = useState('2025-06-15')
  const [asOfResult, setAsOfResult] = useState<string | null>(null)

  const attrSelect = (
    key: keyof typeof attrs,
    label: string,
    options: readonly string[]
  ) => (
    <div className='space-y-1'>
      <Label className='text-xs'>{label}</Label>
      <Select
        value={attrs[key]}
        onValueChange={(v) => setAttrs((p) => ({ ...p, [key]: v }))}
      >
        <SelectTrigger variant='secondary' className='h-7 w-full'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )

  const runAsOf = () => {
    const versions = config.policies
      .flatMap((p) => p.versions.map((v) => ({ policy: p, v })))
      .filter(({ v }) => v.effectiveFrom <= asOf)
      .sort((a, b) => b.v.effectiveFrom.localeCompare(a.v.effectiveFrom))
    const hit = versions[0]
    setAsOfResult(
      hit
        ? `As of ${fmtDate(asOf)}: “${hit.policy.name}” v${hit.v.version} (effective ${fmtDate(hit.v.effectiveFrom)}, recorded ${new Date(hit.v.recordedAt).toLocaleDateString('en-GB')}) governed matching requests. Later edits do not rewrite this answer — prior values are retained as history.`
        : `No policy version was effective on ${fmtDate(asOf)}.`
    )
    toast.success('Bitemporal query resolved against effective-dated history')
  }

  return (
    <div className='w-full space-y-5'>
      <div className='grid gap-3 lg:grid-cols-2'>
        {ENGINES.map((e) => (
          <div key={e.name} className='rounded-[8px] border border-gray-200 bg-white p-3'>
            <div className='mb-1 flex items-center gap-2 text-sm font-medium'>
              {e.name}
              <Badge variant='open'>{e.story}</Badge>
              <Badge variant='badge_active'>config-driven</Badge>
            </div>
            <p className='text-neutral-1000 text-xs'>{e.detail}</p>
          </div>
        ))}
      </div>

      {/* LVE-25: rules engine tester */}
      <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
        <h3 className='text-neutral-1600 mb-1 text-sm font-medium'>
          Rules Engine — Policy Resolution Tester
        </h3>
        <p className='text-neutral-1000 mb-3 text-xs'>
          Pick employee attributes; the engine evaluates the decision tables
          and resolves the single most-specific governing policy.
        </p>
        <div className='mb-3 grid grid-cols-2 gap-3 lg:grid-cols-3'>
          {attrSelect('employeeType', 'Employee type', EMPLOYEE_TYPES)}
          {attrSelect('group', 'Group', GROUP_COMPANIES)}
          {attrSelect('jurisdiction', 'Jurisdiction', JURISDICTIONS)}
          {attrSelect('company', 'Company', COMPANIES)}
          {attrSelect('department', 'Department', DEPARTMENTS)}
          {attrSelect('location', 'Location', LOCATIONS)}
        </div>
        <Button className='h-7' onClick={() => setResult(config.resolvePolicy(attrs))}>
          Resolve governing policy
        </Button>
        {result && (
          <div className='mt-3 space-y-1.5'>
            {result.governing ? (
              <div className='rounded-[6px] border border-green-200 bg-green-50 p-3 text-sm'>
                <strong>Governing policy:</strong> {result.governing.name} (v
                {result.governing.version}, specificity{' '}
                {policySpecificity(result.governing.scope)}) —{' '}
                {result.governing.entitlementSummary}
                <div className='text-neutral-1000 text-xs'>
                  Decision: ALLOW — employee population is covered by an
                  applicable policy.
                </div>
              </div>
            ) : (
              <div className='rounded-[6px] border border-red-200 bg-red-50 p-3 text-sm'>
                Decision: DENY — no active policy covers this population.
                Configure a policy before requests can be evaluated.
              </div>
            )}
            {result.matches.length > 1 && (
              <p className='text-neutral-1000 text-xs'>
                Also matched (lower precedence):{' '}
                {result.matches.slice(1).map((m) => m.name).join(', ')}
              </p>
            )}
          </div>
        )}
      </div>

      <div className='grid gap-4 lg:grid-cols-2'>
        {/* LVE-26: accrual run */}
        <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
          <h3 className='text-neutral-1600 mb-1 text-sm font-medium'>
            Accrual / Balance Engine — Scheduled Run
          </h3>
          <p className='text-neutral-1000 mb-3 text-xs'>
            Executes the monthly accrual per policy config: credits
            entitlements, and lapses comp-off credits past their expiry.
          </p>
          <Button className='h-7' onClick={balances.runAccrual}>
            Run accrual cycle now
          </Button>
          <p className='text-neutral-1000 mt-2 text-xs'>
            Comp-off credits tracked: {balances.compOffCredits.length} (
            {balances.compOffCredits.filter((c) => c.status === 'lapsed').length}{' '}
            lapsed per expiry policy)
          </p>
        </div>

        {/* LVE-21: bitemporal as-of query */}
        <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
          <h3 className='text-neutral-1600 mb-1 text-sm font-medium'>
            Bitemporal Store — As-Of Query
          </h3>
          <p className='text-neutral-1000 mb-3 text-xs'>
            Query which policy version was effective on a past date. Records
            keep valid-time and transaction-time so past states are always
            reconstructable.
          </p>
          <div className='flex items-center gap-2'>
            <Input
              type='date'
              className='h-7 w-[170px]'
              value={asOf}
              onChange={(e) => setAsOf(e.target.value)}
            />
            <Button className='h-7' onClick={runAsOf}>
              Query as of date
            </Button>
          </div>
          {asOfResult && (
            <p className='mt-2 rounded-[6px] bg-neutral-100 p-2 text-xs'>{asOfResult}</p>
          )}
        </div>
      </div>
    </div>
  )
}
