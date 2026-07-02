import { useMemo, useState } from 'react'
import { useRole } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@/components/common/data-table/table'
import { companyName, manageableCompanyIds } from '../data/companies'
import {
  AUTH_EVENT_LABELS,
  AUTH_EVENT_TYPES,
  type AuditOutcome,
  type AuthAuditEvent,
  type AuthEventType,
} from '../data/auth-audit'
import { auditTableColumns } from './audit-table-columns'

const ALL = 'all'
const PLATFORM = 'platform'

interface AuditTabProps {
  events: AuthAuditEvent[]
}

/**
 * Authentication audit log review (AUTH-09/15). Read-only: filters and
 * search only — records can never be altered from this interface. Rows are
 * tenant-scoped to the active admin role's boundary (AUTH-16).
 */
export function AuditTab({ events }: AuditTabProps) {
  const { role } = useRole()
  const scope = useMemo(() => manageableCompanyIds(role), [role])
  const platformWide = role === 'Platform Admin' || role === 'Portfolio Admin'

  const [actorQuery, setActorQuery] = useState('')
  const [eventType, setEventType] = useState<string>(ALL)
  const [companyId, setCompanyId] = useState<string>(ALL)
  const [outcome, setOutcome] = useState<string>(ALL)

  /** Tenant isolation: only the role's companies (platform rows for platform-wide admins). */
  const scoped = useMemo(
    () =>
      events.filter((e) =>
        e.companyId === null ? platformWide : scope.includes(e.companyId)
      ),
    [events, scope, platformWide]
  )

  const filtered = useMemo(
    () =>
      scoped.filter((e) => {
        if (
          actorQuery &&
          !e.actor.toLowerCase().includes(actorQuery.toLowerCase())
        )
          return false
        if (eventType !== ALL && e.eventType !== (eventType as AuthEventType))
          return false
        if (companyId !== ALL) {
          if (companyId === PLATFORM ? e.companyId !== null : e.companyId !== companyId)
            return false
        }
        if (outcome !== ALL && e.outcome !== (outcome as AuditOutcome))
          return false
        return true
      }),
    [scoped, actorQuery, eventType, companyId, outcome]
  )

  if (scope.length === 0) {
    return (
      <div className='rounded-[6px] border border-gray-200 bg-white p-6 text-center'>
        <p className='text-neutral-1600 text-sm font-medium'>
          Audit log review requires an administrator role
        </p>
        <p className='text-neutral-1000 mt-1 text-xs'>
          Switch to Platform, Portfolio, Group Company or Company Admin to
          review authentication events. Your own sign-ins are still recorded.
        </p>
      </div>
    )
  }

  const resetFilters = () => {
    setActorQuery('')
    setEventType(ALL)
    setCompanyId(ALL)
    setOutcome(ALL)
  }

  return (
    <div className='w-full'>
      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
        <div className='flex items-center gap-2'>
          <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
            Authentication audit log ({filtered.length})
          </h2>
          <Badge variant='pending'>Read-only · retained per policy</Badge>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Input
            value={actorQuery}
            onChange={(e) => setActorQuery(e.target.value)}
            placeholder='Search by user / actor'
            className='h-7 w-[200px] text-xs'
          />
          <Select value={eventType} onValueChange={setEventType}>
            <SelectTrigger variant='secondary' className='h-7 w-[170px] text-xs'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All events</SelectItem>
              {AUTH_EVENT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {AUTH_EVENT_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={companyId} onValueChange={setCompanyId}>
            <SelectTrigger variant='secondary' className='h-7 w-[180px] text-xs'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All companies</SelectItem>
              {platformWide && (
                <SelectItem value={PLATFORM}>Platform-level</SelectItem>
              )}
              {scope.map((id) => (
                <SelectItem key={id} value={id}>
                  {companyName(id)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={outcome} onValueChange={setOutcome}>
            <SelectTrigger variant='secondary' className='h-7 w-[130px] text-xs'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All outcomes</SelectItem>
              <SelectItem value='success'>Success</SelectItem>
              <SelectItem value='failure'>Failure</SelectItem>
              <SelectItem value='info'>Info</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant='outline'
            size='sm'
            className='h-7 px-2 text-xs'
            onClick={resetFilters}
          >
            Reset
          </Button>
        </div>
      </div>

      <DataTable
        columns={auditTableColumns}
        data={filtered}
        variant='no-status'
      />

      <p className='text-neutral-1000 mt-2 text-xs'>
        Every login success/failure, logout, password event, context switch,
        membership/linkage change and configuration change is appended here
        with actor, timestamp, company context and outcome. Entries are
        immutable from this view and retained for compliance review.
      </p>
    </div>
  )
}
