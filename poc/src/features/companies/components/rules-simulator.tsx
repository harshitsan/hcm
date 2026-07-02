import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MODULES, type Company, type ModuleName } from '../data/companies'
import {
  type EntitlementAction,
  type EntitlementDecision,
} from '../data/subscriptions'
import { type SubscriptionsStore } from '../hooks/use-subscriptions'

const ACTIONS: { value: EntitlementAction; label: string }[] = [
  { value: 'create-company', label: 'Create a company' },
  { value: 'add-employee', label: 'Add an employee' },
  { value: 'access-module', label: 'Access a module' },
]

interface RulesSimulatorProps {
  companies: Company[]
  subscriptions: SubscriptionsStore
}

/**
 * CMP-20 — the shared Rules engine evaluates entitlement requests against the
 * package decision table read from current configuration.
 */
export function RulesSimulator({ companies, subscriptions }: RulesSimulatorProps) {
  const [companyId, setCompanyId] = useState('')
  const [action, setAction] = useState<EntitlementAction>('add-employee')
  const [module, setModule] = useState<ModuleName>('Payroll')
  const [decision, setDecision] = useState<EntitlementDecision | null>(null)

  const evaluate = () => {
    const company = companies.find((c) => c.id === companyId)
    if (!company) return
    setDecision(
      subscriptions.evaluateEntitlement(action, company, companies, module)
    )
  }

  const decisionVariant =
    decision?.decision === 'ALLOW'
      ? 'badge_active'
      : decision?.decision === 'FLAG'
        ? 'overdue'
        : 'dropped'

  return (
    <div className='space-y-3 rounded-[6px] border border-gray-200 bg-white p-4'>
      <p className='text-neutral-1600 text-sm font-medium'>
        Rules engine — entitlement evaluation
      </p>
      <p className='text-paragraph-sm text-neutral-1000'>
        Decisions come from the package decision table in configuration — when
        a package version changes, the engine uses the updated limits on the
        next evaluation without any code change.
      </p>
      <div className='flex flex-wrap items-center gap-2'>
        <Select value={companyId} onValueChange={setCompanyId}>
          <SelectTrigger variant='secondary' className='h-8 w-[240px]'>
            <SelectValue placeholder='Company…' />
          </SelectTrigger>
          <SelectContent>
            {companies
              .filter((c) => c.status === 'active' || c.status === 'draft')
              .map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.legalName}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <Select
          value={action}
          onValueChange={(v) => setAction(v as EntitlementAction)}
        >
          <SelectTrigger variant='secondary' className='h-8 w-[190px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACTIONS.map((a) => (
              <SelectItem key={a.value} value={a.value}>
                {a.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {action === 'access-module' && (
          <Select
            value={module}
            onValueChange={(v) => setModule(v as ModuleName)}
          >
            <SelectTrigger variant='secondary' className='h-8 w-[190px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODULES.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button
          type='button'
          className='h-8'
          disabled={!companyId}
          onClick={evaluate}
        >
          Evaluate
        </Button>
      </div>
      {decision && (
        <div className='flex items-start gap-3 rounded-[6px] bg-neutral-100 px-3 py-2'>
          <Badge variant={decisionVariant}>{decision.decision}</Badge>
          <div>
            <p className='text-sm'>{decision.reason}</p>
            <p className='text-paragraph-sm text-neutral-1000'>
              Rule: {decision.rule}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
