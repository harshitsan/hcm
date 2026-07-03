import { useState } from 'react'
import { Database } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PEOPLE, companyName } from '../data/directory'
import {
  ruleAllowsPerson,
  type ScopeRule,
} from '../data/scope-rules'
import { type ScopeRulesStore } from '../hooks/use-scope-rules'
import { SecurityBadge } from './badges'
import { ScopeRuleOverlay } from './scope-rule-overlay'

function dims(rule: ScopeRule): string {
  const parts = [
    rule.companyIds.length > 0
      ? rule.companyIds.map(companyName).join(', ')
      : 'All companies',
    rule.departments.length > 0 ? rule.departments.join(', ') : 'All departments',
    rule.workforceTypes.length > 0
      ? rule.workforceTypes.join(', ')
      : 'All workforce types',
  ]
  return parts.join(' · ')
}

/**
 * Security scope rules as governed, versioned config (RSEC-03, RSEC-19)
 * with a row-level-security explainer (RSEC-16) and a simulator that shows
 * exactly which records a rule exposes — including non-user employees, whose
 * records are governed by the same predicate (RSEC-13).
 */
export function ScopeTab({ store }: { store: ScopeRulesStore }) {
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<ScopeRule | null>(null)
  const [simRuleId, setSimRuleId] = useState(store.rules[0]?.id ?? '')

  const simRule = store.rules.find((r) => r.id === simRuleId)

  return (
    <div className='w-full space-y-4'>
      <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
        <div className='mb-3 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Data Access Rules ({store.rules.length})
            <span className='text-neutral-1000 ml-2 text-xs'>
              governed, versioned configuration — the access engine reads them
              at evaluation time, no code change
            </span>
          </h3>
          <Button
            className='h-7'
            onClick={() => {
              setEditingRule(null)
              setOverlayOpen(true)
            }}
          >
            New Rule
          </Button>
        </div>
        <table className='w-full text-sm'>
          <thead>
            <tr className='text-neutral-1000 border-b text-left text-xs'>
              <th className='py-2 pr-3 font-medium'>Rule</th>
              <th className='px-2 font-medium'>Dimensions (all must match)</th>
              <th className='px-2 font-medium'>Version</th>
              <th className='px-2 font-medium'>Effective</th>
              <th className='px-2 font-medium'>Status</th>
              <th className='px-2 font-medium'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {store.rules.map((r) => (
              <tr key={r.id} className='border-b last:border-0'>
                <td className='py-2 pr-3'>
                  <div className='text-neutral-1600 font-medium'>{r.name}</div>
                  <div className='text-neutral-1000 text-xs'>
                    by {r.updatedBy} on {r.updatedOn}
                  </div>
                </td>
                <td className='text-neutral-1900 px-2'>{dims(r)}</td>
                <td className='px-2'>
                  <Badge variant='outline'>v{r.version}</Badge>
                  {r.history.length > 0 && (
                    <span className='text-neutral-1000 ml-1 text-xs'>
                      {r.history.length} prior retained
                    </span>
                  )}
                </td>
                <td className='text-neutral-1900 px-2'>{r.effectiveFrom}</td>
                <td className='px-2'>
                  <SecurityBadge value={r.status} />
                </td>
                <td className='px-2'>
                  <div className='flex gap-1'>
                    <Button
                      variant='outline'
                      className='h-6 text-xs'
                      onClick={() => {
                        setEditingRule(r)
                        setOverlayOpen(true)
                      }}
                    >
                      Edit
                    </Button>
                    {r.status === 'Draft' && (
                      <Button
                        className='h-6 text-xs'
                        onClick={() => store.publishRule(r.id)}
                      >
                        Publish
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* RSEC-16: RLS enforced at the persistence layer */}
      <div className='flex items-start gap-3 rounded-[8px] border border-gray-200 bg-white p-4'>
        <Database size={20} weight='bold' className='text-blue-1400 mt-0.5 shrink-0' />
        <div>
          <p className='text-neutral-1600 text-sm font-medium'>
            Row-level security at the persistence layer
          </p>
          <p className='text-paragraph-sm text-neutral-1000 pt-1'>
            The same predicates shown below are compiled into row-level
            security filters on tenant data. Even if a screen or service is
            bypassed — or a request omits or forges its scope filters — rows
            outside the caller&apos;s authorized company, group, department
            and workforce type never leave the datastore, and cross-company
            reads or writes are never returned or applied. Scope changes take
            effect on the very next query.
          </p>
        </div>
      </div>

      {/* Simulator: what a rule exposes */}
      <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
        <div className='mb-3 flex items-center gap-3'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Rule simulator — records exposed
          </h3>
          <div className='w-72'>
            <Select value={simRuleId} onValueChange={setSimRuleId}>
              <SelectTrigger variant='secondary' className='w-full'>
                <SelectValue placeholder='Pick a rule' />
              </SelectTrigger>
              <SelectContent>
                {store.rules.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name} (v{r.version}, {r.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {simRule && (
          <>
            <p className='text-neutral-1000 mb-2 text-xs'>
              {dims(simRule)} — every dimension must be satisfied. Non-user
              employees are governed by the same scope even though they have
              no login.
            </p>
            <div className='grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3'>
              {PEOPLE.map((p) => {
                const visible = ruleAllowsPerson(simRule, p)
                return (
                  <div
                    key={p.id}
                    className='flex items-center justify-between rounded-[6px] border border-gray-200 px-3 py-2'
                  >
                    <div className='min-w-0'>
                      <p className='text-neutral-1600 truncate text-sm font-medium'>
                        {p.name}
                        {!p.isUser && (
                          <span className='text-neutral-1000 ml-1 text-xs'>
                            (non-user)
                          </span>
                        )}
                      </p>
                      <p className='text-neutral-1000 truncate text-xs'>
                        {companyName(p.companyId)} · {p.department} ·{' '}
                        {p.workforceType}
                      </p>
                    </div>
                    <SecurityBadge value={visible ? 'Visible' : 'Hidden'} />
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      <ScopeRuleOverlay
        open={overlayOpen}
        onOpenChange={(open) => {
          setOverlayOpen(open)
          if (!open) setEditingRule(null)
        }}
        rule={editingRule}
        onSubmit={store.saveRule}
      />
    </div>
  )
}
