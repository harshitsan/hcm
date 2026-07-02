import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  NON_USER_EMPLOYEE_ID,
  companyName,
  personById,
} from '../data/directory'
import { ruleAllowsPerson, type ScopeRule } from '../data/scope-rules'
import { SecurityBadge } from './badges'

/**
 * Non-user employee governance (RSEC-13): the record is protected by the
 * same RBAC scope rules even though the person has no system login. Login
 * attempts are denied and interactive features (delegation, impersonation,
 * context switching) do not apply.
 */
export function NonUserPanel({ rules }: { rules: ScopeRule[] }) {
  const person = personById(NON_USER_EMPLOYEE_ID)
  if (!person) return null

  const exposingRules = rules.filter(
    (r) => r.status === 'Published' && ruleAllowsPerson(r, person)
  )

  return (
    <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
      <div className='mb-2 flex items-center gap-2'>
        <h3 className='text-neutral-1600 text-sm font-medium'>
          My record — {person.name}
        </h3>
        <SecurityBadge value='Hidden' />
        <span className='text-neutral-1000 text-xs'>no system login</span>
      </div>

      <div className='mb-3 grid grid-cols-2 gap-2 rounded-[6px] border border-gray-200 p-3 text-sm sm:grid-cols-4'>
        <div>
          <p className='text-neutral-1000 text-xs'>Company</p>
          <p className='text-neutral-1600 font-medium'>
            {companyName(person.companyId)}
          </p>
        </div>
        <div>
          <p className='text-neutral-1000 text-xs'>Department</p>
          <p className='text-neutral-1600 font-medium'>{person.department}</p>
        </div>
        <div>
          <p className='text-neutral-1000 text-xs'>Workforce type</p>
          <p className='text-neutral-1600 font-medium'>
            {person.workforceType}
          </p>
        </div>
        <div>
          <p className='text-neutral-1000 text-xs'>Position</p>
          <p className='text-neutral-1600 font-medium'>{person.position}</p>
        </div>
      </div>

      <p className='text-neutral-1600 mb-1 text-sm font-medium'>
        Who can see this record
      </p>
      <ul className='text-neutral-1000 mb-3 list-disc pl-5 text-xs'>
        {exposingRules.length > 0 ? (
          exposingRules.map((r) => (
            <li key={r.id}>
              Users granted “{r.name}” (v{r.version}) — their role and scope
              must permit {person.workforceType} records in{' '}
              {companyName(person.companyId)}
            </li>
          ))
        ) : (
          <li>No published scope rule currently exposes this record</li>
        )}
      </ul>

      <div className='mb-3 flex items-center gap-3'>
        <Button
          variant='outline'
          className='h-7'
          onClick={() =>
            toast.error(
              `Access denied — ${person.name} has no user account, so no system access is granted`
            )
          }
        >
          Attempt system login
        </Button>
        <span className='text-neutral-1000 text-xs'>
          demonstrates that a login attempt for a non-user grants nothing
        </span>
      </div>

      <ul className='text-neutral-1000 list-disc pl-5 text-xs'>
        <li>
          Records are visible only to users whose role and scope (company,
          group, department, workforce type) permit it — evaluated by the same
          engine and row-level security as user employees.
        </li>
        <li>
          Delegation, impersonation and company context switching do not apply
          — there is no interactive session to delegate, impersonate or
          switch.
        </li>
      </ul>
    </div>
  )
}
