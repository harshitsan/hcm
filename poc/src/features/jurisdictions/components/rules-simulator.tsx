import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type Jurisdiction } from '../data/jurisdictions'
import { type AssignmentsStore } from '../hooks/use-assignments'
import { effectivePacksFor } from '../data/rule-packs'
import { type RulePacksStore } from '../hooks/use-rule-packs'

interface RulesSimulatorProps {
  assignments: AssignmentsStore
  rulePacks: RulePacksStore
  catalog: Jurisdiction[]
}

/**
 * Rules engine simulator (JUR-14): evaluates jurisdiction as a decision-table
 * input for a company (or a single employee context) as of a date. Each
 * relevant jurisdiction resolves deterministically from the same catalog and
 * the rule-pack version effective on that date — config changes are honored
 * on the next evaluation without code changes.
 */
export function RulesSimulator({
  assignments,
  rulePacks,
  catalog,
}: RulesSimulatorProps) {
  const [companyId, setCompanyId] = useState(assignments.companies[0]?.id ?? '')
  const [employeeId, setEmployeeId] = useState<string>('all')
  const [asOf, setAsOf] = useState(new Date().toISOString().slice(0, 10))

  const catalogById = useMemo(
    () => new Map(catalog.map((j) => [j.id, j])),
    [catalog]
  )
  const company = assignments.companies.find((c) => c.id === companyId)
  const companyEmployees = assignments.employees.filter(
    (e) => e.companyId === companyId
  )
  const employee =
    employeeId === 'all'
      ? undefined
      : companyEmployees.find((e) => e.id === employeeId)

  // Employee context narrows evaluation to their single jurisdiction.
  const jurisdictionIds = employee
    ? [employee.jurisdictionId]
    : (company?.jurisdictionIds ?? [])

  return (
    <div className='rounded-md border border-gray-200 bg-white px-4 py-4'>
      <p className='text-sm font-medium'>Rules engine — evaluate applicability</p>
      <p className='text-paragraph-sm text-neutral-1000 mb-3'>
        Pick a company operation or employee context and an as-of date; the
        engine reads the jurisdiction config effective on that date.
      </p>

      <div className='mb-4 grid grid-cols-1 gap-3 md:grid-cols-3'>
        <div className='space-y-1'>
          <Label>Company</Label>
          <Select
            value={companyId}
            onValueChange={(v) => {
              setCompanyId(v)
              setEmployeeId('all')
            }}
          >
            <SelectTrigger variant='secondary' className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {assignments.companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='space-y-1'>
          <Label>Employee context (optional)</Label>
          <Select value={employeeId} onValueChange={setEmployeeId}>
            <SelectTrigger variant='secondary' className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Whole company</SelectItem>
              {companyEmployees.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                  {e.isUser ? '' : ' (non-login)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='space-y-1'>
          <Label>Evaluate as of</Label>
          <Input
            type='date'
            value={asOf}
            onChange={(e) => setAsOf(e.target.value)}
          />
        </div>
      </div>

      <div className='space-y-3'>
        {jurisdictionIds.length === 0 && (
          <p className='text-paragraph-sm text-neutral-1000'>
            No jurisdiction matches this context — no jurisdiction-driven
            applicability is applied.
          </p>
        )}
        {jurisdictionIds.map((jid) => {
          const j = catalogById.get(jid)
          if (!j) return null
          const packs = effectivePacksFor(rulePacks.packs, jid, asOf)
          const policies = assignments.policies.filter(
            (p) => p.status === 'active' && p.jurisdictionIds.includes(jid)
          )
          return (
            <div key={jid} className='rounded-md border border-gray-200 p-3'>
              <div className='mb-2 flex items-center gap-2'>
                <Badge variant='open'>{j.name}</Badge>
                <span className='text-neutral-1000 text-xs'>
                  resolved from the supported catalog
                </span>
              </div>
              <div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
                <div>
                  <p className='text-xs font-medium'>Effective rule-packs</p>
                  {packs.length === 0 ? (
                    <p className='text-paragraph-sm text-neutral-1000'>
                      None effective on {asOf}
                    </p>
                  ) : (
                    packs.map((p) => (
                      <p key={p.id} className='text-paragraph-sm'>
                        {p.name}{' '}
                        <Badge variant='pending'>v{p.version}</Badge>
                      </p>
                    ))
                  )}
                </div>
                <div>
                  <p className='text-xs font-medium'>Tax & fee applicability</p>
                  {j.taxFees.length === 0 ? (
                    <p className='text-paragraph-sm text-neutral-1000'>
                      Not configured — treated as such
                    </p>
                  ) : (
                    j.taxFees.map((t) => (
                      <p key={t.id} className='text-paragraph-sm'>
                        {t.name} · {t.rate}{' '}
                        <span className='text-neutral-1000'>({t.appliesTo})</span>
                      </p>
                    ))
                  )}
                </div>
                <div>
                  <p className='text-xs font-medium'>Applicable policies</p>
                  {policies.length === 0 ? (
                    <p className='text-paragraph-sm text-neutral-1000'>
                      No policy criteria match — none applied
                    </p>
                  ) : (
                    policies.map((p) => (
                      <p key={p.id} className='text-paragraph-sm'>
                        {p.name}
                      </p>
                    ))
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
