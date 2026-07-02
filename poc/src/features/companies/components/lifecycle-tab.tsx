import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { RoleGate, useRole } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { type Company } from '../data/companies'
import { RETENTION_RULES } from '../data/records'
import { scopeCompanies, type CompaniesStore } from '../hooks/use-companies'
import { CompanyStatusBadge } from './company-badges'
import { performLifecycleTransition } from './lifecycle-actions'
import { LifecycleDialog, type LifecycleRequest } from './lifecycle-dialog'

interface LifecycleTabProps {
  store: CompaniesStore
}

/** Months a closed company has been retained (fees accrue monthly). */
function monthsRetained(company: Company): number {
  if (!company.retentionEndsOn) return 0
  const closure = new Date(company.retentionEndsOn)
  closure.setFullYear(closure.getFullYear() - 7)
  const diff =
    (Date.now() - closure.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
  return Math.max(0, Math.floor(diff))
}

/**
 * FR 6.2.6 — closure, 7-year retention with archival fees, verified archival
 * and per-data-type retention rules.
 */
export function LifecycleTab({ store }: LifecycleTabProps) {
  const { role } = useRole()
  const [request, setRequest] = useState<LifecycleRequest | null>(null)

  const scoped = useMemo(
    () => scopeCompanies(store.companies, role),
    [store.companies, role]
  )
  const closed = scoped.filter(
    (c) => c.status === 'inactive' || c.status === 'archived'
  )

  const requestExport = (company: Company) => {
    const checksum = store.exportCompany(
      company,
      'Retention export requested for closed/merged company'
    )
    toast.success(
      `Export of the entire company dataset generated for ${company.code} (handover package). Checksum ${checksum}`
    )
  }

  return (
    <div className='w-full space-y-4'>
      {/* Suspension behavior (COMP-FR-011) */}
      <div className='rounded-[6px] border border-gray-200 bg-white p-4'>
        <p className='text-neutral-1600 mb-1 text-sm font-medium'>
          Suspension behavior (COMP-FR-011)
        </p>
        <ul className='text-paragraph-sm text-neutral-1600 list-inside list-disc space-y-0.5'>
          <li>New logins blocked for all users except Platform Administrators</li>
          <li>Existing sessions: read-only access for a 30-minute grace period</li>
          <li>Queued background jobs allowed to complete</li>
          <li>Company administrators notified; operations blocked with COMP_004</li>
        </ul>
      </div>

      {/* Closed / merged companies */}
      <p className='text-paragraph-sm text-neutral-1000 font-medium'>
        Closed & merged companies — 7-year retention with archival fees
      </p>
      {closed.length === 0 ? (
        <div className='rounded-[6px] border border-gray-200 bg-white p-4'>
          <p className='text-paragraph-sm text-neutral-1000'>
            No closed or merged companies in your scope.
          </p>
        </div>
      ) : (
        <div className='rounded-[6px] border border-gray-200 bg-white'>
          {closed.map((c) => {
            const months = monthsRetained(c)
            const billed = c.archivalFeeMonthly
              ? c.archivalFeeMonthly * months
              : 0
            return (
              <div
                key={c.id}
                className='flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-3 py-2 last:border-b-0'
              >
                <div className='flex min-w-0 items-center gap-2'>
                  <span className='truncate text-sm font-medium'>
                    {c.legalName}
                  </span>
                  <CompanyStatusBadge status={c.status} />
                </div>
                <div className='flex flex-wrap items-center gap-3'>
                  <span className='text-paragraph-sm text-neutral-1000'>
                    Retention ends {c.retentionEndsOn ?? '—'}
                  </span>
                  {c.status === 'inactive' && c.archivalFeeMonthly ? (
                    <Badge variant='overdue'>
                      ${c.archivalFeeMonthly}/mo · ${billed.toLocaleString('en-US')}{' '}
                      billed to date
                    </Badge>
                  ) : (
                    <Badge variant='pending'>No further fees</Badge>
                  )}
                  <RoleGate roles={['Platform Admin', 'Company Admin']}>
                    <Button
                      type='button'
                      variant='outline'
                      className='h-7 px-2 text-xs'
                      onClick={() => requestExport(c)}
                    >
                      Request full export
                    </Button>
                  </RoleGate>
                  {c.status === 'inactive' && (
                    <RoleGate roles={['Platform Admin']}>
                      <Button
                        type='button'
                        variant='outline'
                        className='h-7 px-2 text-xs'
                        onClick={() =>
                          setRequest({ company: c, target: 'archived' })
                        }
                      >
                        Run archival
                      </Button>
                    </RoleGate>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
      <p className='text-paragraph-sm text-neutral-1000'>
        Inactive companies keep retained data readable while active operations
        stay disabled. When the 7-year retention elapses, the company
        transitions to Archived (terminal) and data is handled per the disposal
        policy. Archival fees are tracked and billable during retention.
      </p>

      {/* Retention rules by data type (§8.2) */}
      <p className='text-paragraph-sm text-neutral-1000 font-medium'>
        Data retention rules by data type
      </p>
      <div className='overflow-hidden rounded-[6px] border border-gray-200 bg-white'>
        <div className='text-paragraph-sm text-neutral-1000 grid grid-cols-3 gap-2 border-b border-gray-200 bg-neutral-100 px-3 py-2 font-medium'>
          <span>Data type</span>
          <span>Retention</span>
          <span>Post-retention action</span>
        </div>
        {RETENTION_RULES.map((rule) => (
          <div
            key={rule.dataType}
            className='grid grid-cols-3 gap-2 border-b border-gray-100 px-3 py-2 text-sm last:border-b-0'
          >
            <span className='font-medium'>{rule.dataType}</span>
            <span>{rule.retention}</span>
            <span className='text-neutral-1000'>{rule.postRetentionAction}</span>
          </div>
        ))}
      </div>

      <LifecycleDialog
        request={request}
        onOpenChange={(open) => {
          if (!open) setRequest(null)
        }}
        onConfirm={(req, reason) =>
          performLifecycleTransition(store, req, reason)
        }
      />
    </div>
  )
}
