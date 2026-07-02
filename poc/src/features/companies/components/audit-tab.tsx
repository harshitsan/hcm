import { useMemo, useState } from 'react'
import { useRole } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MY_COMPANY_ID } from '../data/companies'
import {
  AUDIT_EVENT_TYPES,
  ERROR_CODES,
  type AuditEventType,
} from '../data/records'
import { scopeCompanies, type CompaniesStore } from '../hooks/use-companies'

const dateTimeFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

interface AuditTabProps {
  store: CompaniesStore
}

/** §7.2 + §8.1 + §9 — tenant isolation, audit trail and error-code reference. */
export function AuditTab({ store }: AuditTabProps) {
  const { role } = useRole()
  const [typeFilter, setTypeFilter] = useState<'all' | AuditEventType>('all')

  const scoped = useMemo(
    () => scopeCompanies(store.companies, role),
    [store.companies, role]
  )
  const scopedIds = useMemo(() => new Set(scoped.map((c) => c.id)), [scoped])

  const events = store.auditEvents.filter(
    (e) =>
      (role === 'Platform Admin' || scopedIds.has(e.companyId)) &&
      (typeFilter === 'all' || e.type === typeFilter)
  )

  const myCompany =
    store.companies.find((c) => c.id === MY_COMPANY_ID) ?? store.companies[0]

  return (
    <div className='w-full space-y-4'>
      {/* Tenant isolation panel */}
      <div className='rounded-[6px] border border-gray-200 bg-white p-4'>
        <p className='text-neutral-1600 mb-1 text-sm font-medium'>
          Tenant isolation — session binding
        </p>
        <div className='text-paragraph-sm text-neutral-1600 space-y-0.5'>
          <p>
            Active role: <strong>{role}</strong> · JWT company claim:{' '}
            <strong>
              {role === 'Platform Admin'
                ? 'platform (all tenants)'
                : scoped.map((c) => c.code).join(', ') || 'none'}
            </strong>
          </p>
          <p>
            Every query is filtered by <code>company_id</code> from your company
            context; cross-company access is possible only through explicit
            portfolio or group-company assignments, and every attempt —
            successful or failed — is logged.
          </p>
        </div>
        {myCompany && (
          <Button
            type='button'
            variant='outline'
            className='mt-2 h-7 px-2 text-xs'
            onClick={() => store.simulateCrossTenantAccess(myCompany)}
          >
            Simulate unauthorized cross-tenant request
          </Button>
        )}
      </div>

      {/* Audit events */}
      <div className='flex items-center justify-between'>
        <p className='text-paragraph-sm text-neutral-1000 font-medium'>
          Company management audit events ({events.length}) — retained 7 years
        </p>
        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as 'all' | AuditEventType)}
        >
          <SelectTrigger variant='secondary' className='h-8 w-[240px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All event types</SelectItem>
            {AUDIT_EVENT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className='space-y-2'>
        {events.length === 0 && (
          <p className='text-paragraph-sm text-neutral-1000'>
            No audit events in your scope.
          </p>
        )}
        {events.map((e) => (
          <div
            key={e.id}
            className='rounded-[6px] border border-gray-200 bg-white px-3 py-2'
          >
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <div className='flex items-center gap-2'>
                <Badge variant={e.outcome === 'denied' ? 'dropped' : 'open'}>
                  {e.type}
                </Badge>
                <span className='text-sm font-medium'>{e.companyName}</span>
              </div>
              <span className='text-paragraph-sm text-neutral-1000'>
                {dateTimeFmt.format(new Date(e.timestamp))} · {e.actor}
              </span>
            </div>
            <p className='text-neutral-1900 mt-1 text-sm'>{e.details}</p>
          </div>
        ))}
      </div>

      {/* Error code reference */}
      <p className='text-paragraph-sm text-neutral-1000 font-medium'>
        Standardized error codes (§9)
      </p>
      <div className='overflow-hidden rounded-[6px] border border-gray-200 bg-white'>
        <div className='text-paragraph-sm text-neutral-1000 grid grid-cols-[120px_140px_1fr] gap-2 border-b border-gray-200 bg-neutral-100 px-3 py-2 font-medium'>
          <span>Code</span>
          <span>HTTP status</span>
          <span>Meaning</span>
        </div>
        {ERROR_CODES.map((code) => (
          <div
            key={code.code}
            className='grid grid-cols-[120px_140px_1fr] gap-2 border-b border-gray-100 px-3 py-2 text-sm last:border-b-0'
          >
            <span className='font-medium'>{code.code}</span>
            <span>{code.httpStatus}</span>
            <span className='text-neutral-1000'>{code.meaning}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
