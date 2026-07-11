import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type OrgGroupsStore } from '../hooks/use-org-groups'
import { memberCountOf, todayIso } from '../utils/resolve'
import { ScopeBadge, StatusBadge } from './group-badges'

const ALL = '__all__'

interface GovernanceTabProps {
  store: OrgGroupsStore
}

/**
 * Portfolio governance (GRP-12/14/15/44): scope-and-usage matrix tracing which
 * groups drive which policies, versioned effective-dated config history and
 * the chronological audit trail, plus the tenant-isolation guarantees.
 */
export function GovernanceTab({ store }: GovernanceTabProps) {
  const [auditGroup, setAuditGroup] = useState(ALL)

  const groupById = new Map(store.groups.map((g) => [g.id, g]))
  const audits =
    auditGroup === ALL
      ? store.audits
      : store.audits.filter((a) => a.groupId === auditGroup)

  return (
    <div className='w-full space-y-4'>
      {/* Tenant isolation guarantees (GRP-14) */}
      <div className='border-gray-200 flex items-start gap-2 rounded-[6px] border bg-white px-3 py-2'>
        <ShieldCheck className='text-blue-1400 mt-0.5 size-4 shrink-0' />
        <p className='text-paragraph-sm text-neutral-1000'>
          Group data is tenant-scoped at the persistence layer: row-level
          security limits reads to the requesting tenant’s authorized scope,
          global groups are readable everywhere but writable only by the
          Platform Admin, name/acronym uniqueness is enforced per scope, and
          cross-tenant references (such as adding another company’s employee)
          are blocked by integrity constraints — the membership import rejects
          such rows.
        </p>
      </div>

      {/* Scope & usage matrix (GRP-12) */}
      <div>
        <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
          Group scope and usage across the portfolio
        </h3>
        <div className='border-gray-200 overflow-hidden rounded-[6px] border bg-white'>
          <div className='text-paragraph-sm text-neutral-1000 border-gray-200 grid grid-cols-[1fr_120px_90px_80px_1fr] items-center gap-2 border-b px-3 py-2 font-medium'>
            <span>Group</span>
            <span>Scope</span>
            <span>Status</span>
            <span>Members</span>
            <span>Drives policies</span>
          </div>
          {store.groups.map((g) => {
            const used = store.policiesUsing(g.id)
            return (
              <div
                key={g.id}
                className='border-gray-200 grid grid-cols-[1fr_120px_90px_80px_1fr] items-center gap-2 border-b px-3 py-2 last:border-b-0'
              >
                <div className='flex min-w-0 flex-col'>
                  <span className='text-neutral-1600 truncate text-sm font-medium'>
                    {g.name}
                  </span>
                  <span className='text-paragraph-sm text-neutral-1000'>
                    v{g.version} · owner {g.owner ?? 'unassigned'}
                  </span>
                </div>
                <ScopeBadge scope={g.scope} />
                <StatusBadge status={g.status} />
                <span className='text-neutral-1600 text-sm font-medium'>
                  {memberCountOf(store.memberships, g.id, todayIso())}
                </span>
                <div className='flex flex-wrap gap-1'>
                  {used.length === 0 ? (
                    <span className='text-paragraph-sm text-neutral-1000'>—</span>
                  ) : (
                    used.map((p) => (
                      <Badge key={p.id} variant='open'>
                        {p.name}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className='grid gap-4 lg:grid-cols-2'>
        {/* Versioned config history (GRP-15) */}
        <div>
          <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
            Versioned, effective-dated group config
          </h3>
          <div className='space-y-2'>
            {store.versions.map((v) => (
              <div
                key={v.id}
                className='border-gray-200 rounded-[6px] border bg-white px-3 py-2'
              >
                <span className='text-neutral-1600 text-sm font-medium'>
                  {groupById.get(v.groupId)?.name ?? v.groupId} — v{v.version}
                  {v.supersedes !== null && (
                    <span className='text-neutral-1000 font-normal'>
                      {' '}
                      supersedes v{v.supersedes}
                    </span>
                  )}
                </span>
                <p className='text-paragraph-sm text-neutral-1000'>
                  {v.summary} · effective {v.effectiveFrom} · changed by{' '}
                  {v.changedBy}. Engines read the governed config at runtime —
                  no code deployment; prior versions stay resolvable so
                  historical evaluations remain reproducible.
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Audit trail (GRP-44) */}
        <div>
          <div className='mb-2 flex items-center justify-between'>
            <h3 className='text-neutral-1600 text-sm font-medium'>
              Audit trail — who, what, when
            </h3>
            <Select value={auditGroup} onValueChange={setAuditGroup}>
              <SelectTrigger variant='secondary' className='h-7 w-[200px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All groups</SelectItem>
                {store.groups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-2'>
            {audits.length === 0 ? (
              <p className='text-paragraph-sm text-neutral-1000'>
                No audit events for this group yet.
              </p>
            ) : (
              audits.map((a) => (
                <div
                  key={a.id}
                  className='border-gray-200 rounded-[6px] border bg-white px-3 py-2'
                >
                  <span className='text-neutral-1600 text-sm font-medium'>
                    {a.action} — {groupById.get(a.groupId)?.name ?? a.groupId}
                  </span>
                  <p className='text-paragraph-sm text-neutral-1000'>
                    {a.detail}
                  </p>
                  <p className='text-neutral-1000 text-xs'>
                    {a.at} · {a.actor}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
