import { useState } from 'react'
import { toast } from 'sonner'
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
import {
  MY_GROUP_ID,
  MY_PORTFOLIO_ID,
  OPERATING_MODELS,
  type Company,
} from '../data/companies'
import { type CompaniesStore } from '../hooks/use-companies'
import { type GroupsStore } from '../hooks/use-groups'
import { CompanyStatusBadge } from './company-badges'

interface GroupsTabProps {
  store: CompaniesStore
  groups: GroupsStore
}

/**
 * FR 6.2.4 — operating models, group-company structures (effective-dated
 * parent/subsidiary relationships) and shared-services portfolios.
 */
export function GroupsTab({ store, groups }: GroupsTabProps) {
  const { role } = useRole()
  const [newMemberId, setNewMemberId] = useState('')
  const [assignCompanyId, setAssignCompanyId] = useState('')
  const [assignPortfolioId, setAssignPortfolioId] = useState('')

  const byId = (id: string): Company | undefined =>
    store.companies.find((c) => c.id === id)

  const visibleGroups =
    role === 'Platform Admin'
      ? groups.groups
      : role === 'Group Company Admin'
        ? groups.groups.filter((g) => g.id === MY_GROUP_ID)
        : []

  const visiblePortfolios =
    role === 'Platform Admin'
      ? groups.portfolios
      : role === 'Portfolio Admin'
        ? groups.portfolios.filter((p) => p.id === MY_PORTFOLIO_ID)
        : []

  const ungrouped = store.companies.filter(
    (c) =>
      c.status === 'active' &&
      !groups.memberships.some((m) => m.companyId === c.id && !m.endDate)
  )
  const unassigned = store.companies.filter(
    (c) => c.status === 'active' && !c.portfolioId
  )

  const modelCounts = OPERATING_MODELS.map((model) => ({
    model,
    count: store.companies.filter(
      (c) => c.operatingModel === model && c.status !== 'archived'
    ).length,
  }))

  return (
    <div className='w-full space-y-4'>
      {/* Operating models overview */}
      <div className='grid grid-cols-3 gap-3'>
        {modelCounts.map(({ model, count }) => (
          <div
            key={model}
            className='rounded-[6px] border border-gray-200 bg-white px-3 py-2'
          >
            <p className='text-paragraph-sm text-neutral-1000'>{model}</p>
            <p className='text-2xl font-medium'>{count}</p>
          </div>
        ))}
      </div>
      <p className='text-paragraph-sm text-neutral-1000'>
        Standalone, group-company and shared-services models are all supported
        — company-level data isolation is preserved regardless of the operating
        model, and continues to apply when a model changes later.
      </p>

      {/* Group-company structures */}
      {visibleGroups.length === 0 ? (
        <div className='rounded-[6px] border border-gray-200 bg-white p-4'>
          <p className='text-neutral-1600 text-sm font-medium'>
            Group structures
          </p>
          <p className='text-paragraph-sm text-neutral-1000'>
            Your role has no group-company access — attempts to access a
            company outside your group are denied.
          </p>
        </div>
      ) : (
        visibleGroups.map((group) => {
          const members = groups.memberships.filter(
            (m) => m.groupId === group.id
          )
          return (
            <div
              key={group.id}
              className='space-y-2 rounded-[6px] border border-gray-200 bg-white p-4'
            >
              <div className='flex items-center justify-between'>
                <p className='text-neutral-1600 text-sm font-medium'>
                  {group.name}{' '}
                  <span className='text-neutral-1000 font-normal'>
                    · parent: {byId(group.parentCompanyId)?.legalName ?? '—'}
                  </span>
                </p>
                <Badge variant='open'>
                  {members.filter((m) => !m.endDate).length} active members
                </Badge>
              </div>
              <div className='divide-y divide-gray-100'>
                {members.map((m) => {
                  const company = byId(m.companyId)
                  return (
                    <div
                      key={m.id}
                      className='flex items-center justify-between gap-2 py-2'
                    >
                      <div className='flex items-center gap-2'>
                        <span className='text-sm font-medium'>
                          {company?.legalName ?? m.companyId}
                        </span>
                        <Badge
                          variant={
                            m.relationship === 'Parent' ? 'badge_active' : 'pending'
                          }
                        >
                          {m.relationship}
                        </Badge>
                        {company && (
                          <CompanyStatusBadge status={company.status} />
                        )}
                      </div>
                      <div className='flex items-center gap-3'>
                        <span className='text-paragraph-sm text-neutral-1000'>
                          {m.effectiveDate} → {m.endDate ?? 'present'}
                        </span>
                        {!m.endDate && m.relationship !== 'Parent' && (
                          <Button
                            type='button'
                            variant='outline'
                            className='h-7 px-2 text-xs'
                            onClick={() => groups.endMembership(m.id)}
                          >
                            End membership
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className='flex items-center gap-2 pt-1'>
                <Select value={newMemberId} onValueChange={setNewMemberId}>
                  <SelectTrigger variant='secondary' className='h-8 w-[280px]'>
                    <SelectValue placeholder='Add a company to this group…' />
                  </SelectTrigger>
                  <SelectContent>
                    {ungrouped.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.legalName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type='button'
                  className='h-8'
                  disabled={!newMemberId}
                  onClick={() => {
                    groups.addMembership(
                      group.id,
                      newMemberId,
                      new Date().toISOString().slice(0, 10)
                    )
                    const result = store.updateCompany(newMemberId, {
                      groupId: group.id,
                      operatingModel: 'Group Company',
                    })
                    if (!result.ok) toast.error(result.error)
                    setNewMemberId('')
                  }}
                >
                  Add subsidiary
                </Button>
              </div>
              <p className='text-paragraph-sm text-neutral-1000'>
                Parent–subsidiary relationships are first-class, effective-dated
                records — group oversight without collapsing each member’s
                company-level isolation.
              </p>
            </div>
          )
        })
      )}

      {/* Shared-services portfolios */}
      {visiblePortfolios.length === 0 ? (
        <div className='rounded-[6px] border border-gray-200 bg-white p-4'>
          <p className='text-neutral-1600 text-sm font-medium'>
            Shared-services portfolios
          </p>
          <p className='text-paragraph-sm text-neutral-1000'>
            Your role has no portfolio access — providers can only administer
            companies explicitly assigned to them.
          </p>
        </div>
      ) : (
        visiblePortfolios.map((portfolio) => {
          const rows = groups.assignments.filter(
            (a) => a.portfolioId === portfolio.id
          )
          return (
            <div
              key={portfolio.id}
              className='space-y-2 rounded-[6px] border border-gray-200 bg-white p-4'
            >
              <p className='text-neutral-1600 text-sm font-medium'>
                {portfolio.providerName}{' '}
                <span className='text-neutral-1000 font-normal'>
                  · {portfolio.adminEmail}
                </span>
              </p>
              <div className='divide-y divide-gray-100'>
                {rows.map((a) => {
                  const company = byId(a.companyId)
                  return (
                    <div
                      key={a.id}
                      className='flex items-center justify-between gap-2 py-2'
                    >
                      <div className='flex items-center gap-2'>
                        <span className='text-sm font-medium'>
                          {company?.legalName ?? a.companyId}
                        </span>
                        {company && (
                          <CompanyStatusBadge status={company.status} />
                        )}
                        <Badge variant={a.active ? 'badge_active' : 'dropped'}>
                          {a.active ? 'Assigned' : 'Revoked'}
                        </Badge>
                      </div>
                      <div className='flex items-center gap-3'>
                        <span className='text-paragraph-sm text-neutral-1000'>
                          since {a.assignedOn}
                        </span>
                        {a.active && role === 'Platform Admin' && (
                          <Button
                            type='button'
                            variant='outline'
                            className='h-7 px-2 text-xs'
                            onClick={() => groups.revokeAssignment(a.id)}
                          >
                            Revoke
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              <p className='text-paragraph-sm text-neutral-1000'>
                Client tenants stay isolated from each other — the provider
                administers each one separately and is denied access to
                unassigned companies.
              </p>
            </div>
          )
        })
      )}

      {role === 'Platform Admin' && (
        <div className='flex items-center gap-2 rounded-[6px] border border-gray-200 bg-white p-4'>
          <Select value={assignCompanyId} onValueChange={setAssignCompanyId}>
            <SelectTrigger variant='secondary' className='h-8 w-[260px]'>
              <SelectValue placeholder='Assign a company…' />
            </SelectTrigger>
            <SelectContent>
              {unassigned.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.legalName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={assignPortfolioId} onValueChange={setAssignPortfolioId}>
            <SelectTrigger variant='secondary' className='h-8 w-[240px]'>
              <SelectValue placeholder='…to a provider' />
            </SelectTrigger>
            <SelectContent>
              {groups.portfolios.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.providerName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type='button'
            className='h-8'
            disabled={!assignCompanyId || !assignPortfolioId}
            onClick={() => {
              groups.assignToPortfolio(assignPortfolioId, assignCompanyId)
              const result = store.updateCompany(assignCompanyId, {
                portfolioId: assignPortfolioId,
                operatingModel: 'Shared Services',
              })
              if (!result.ok) toast.error(result.error)
              setAssignCompanyId('')
              setAssignPortfolioId('')
            }}
          >
            Assign to provider
          </Button>
        </div>
      )}
    </div>
  )
}
