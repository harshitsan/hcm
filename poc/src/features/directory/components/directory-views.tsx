import { UserRound } from 'lucide-react'
import { type Role } from '@/context/role-context'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { companyById, type Employee } from '../data/directory'
import { type CustomFieldDef } from '../data/directory-config'
import { evaluateField, type PrivacyConfig } from '../utils/privacy'
import {
  CompanyBadge,
  EmploymentStatusBadge,
  NonUserBadge,
} from './directory-badges'
import { initials } from './directory-table-columns'

interface ViewProps {
  employees: Employee[]
  role: Role
  config: PrivacyConfig
  customFields: CustomFieldDef[]
  showCompany: boolean
}

function EmptyState() {
  return (
    <Card className='border-gray-200'>
      <CardContent className='py-10 text-center'>
        <p className='text-neutral-1600 text-sm font-medium'>
          No employees match your search
        </p>
        <p className='text-neutral-1000 mt-1 text-sm'>
          Adjust or clear the filters to see more people.
        </p>
      </CardContent>
    </Card>
  )
}

/**
 * Card view (DIR-01): one card per employee with the same privacy-governed
 * field set as the list view. Restricted fields are omitted, not blanked
 * (DIR-02 AC 3).
 */
export function DirectoryCardView({
  employees,
  role,
  config,
  customFields,
  showCompany,
}: ViewProps) {
  if (employees.length === 0) return <EmptyState />
  const canSee = (key: Parameters<typeof evaluateField>[0], e: Employee) =>
    evaluateField(key, role, config, e.companyId).visible
  const visibleCustom = customFields.filter(
    (f) => f.showInDirectory && !f.sensitive
  )

  return (
    <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
      {employees.map((e) => (
        <Card key={e.id} className='gap-2 border-gray-200 py-4'>
          <CardContent className='px-4'>
            <div className='flex items-start gap-3'>
              <Avatar className='h-11 w-11'>
                <AvatarFallback className='bg-blue-1200 text-sm font-semibold text-white'>
                  {canSee('photo', e) ? (
                    initials(e.name)
                  ) : (
                    <UserRound className='size-5' />
                  )}
                </AvatarFallback>
              </Avatar>
              <div className='min-w-0 flex-1'>
                <div className='flex flex-wrap items-center gap-1.5'>
                  <span className='text-neutral-1600 truncate font-medium'>
                    {e.name}
                  </span>
                  {!e.isUser && <NonUserBadge />}
                  {showCompany && <CompanyBadge companyId={e.companyId} />}
                </div>
                {canSee('position', e) && (
                  <p className='text-neutral-1900 truncate text-sm'>
                    {e.position}
                  </p>
                )}
                <p className='text-neutral-1000 text-xs'>
                  {[
                    canSee('department', e) ? e.department : null,
                    canSee('location', e) ? e.location : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              <EmploymentStatusBadge status={e.employmentStatus} />
            </div>
            <div className='mt-3 space-y-0.5 text-sm'>
              {canSee('workEmail', e) && (
                <p className='text-neutral-1900 truncate'>{e.workEmail}</p>
              )}
              {canSee('workPhone', e) && (
                <p className='text-neutral-1000 truncate'>{e.workPhone}</p>
              )}
              {visibleCustom.map((f) =>
                e.customFields[f.id] ? (
                  <p key={f.id} className='text-neutral-1000 truncate text-xs'>
                    {f.label}: {e.customFields[f.id]}
                  </p>
                ) : null
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/** Compact view (DIR-01): condensed rows, consistent with the other views. */
export function DirectoryCompactView({
  employees,
  role,
  config,
  showCompany,
}: Omit<ViewProps, 'customFields'>) {
  if (employees.length === 0) return <EmptyState />
  const canSee = (key: Parameters<typeof evaluateField>[0], e: Employee) =>
    evaluateField(key, role, config, e.companyId).visible

  return (
    <Card className='gap-0 border-gray-200 py-0'>
      {employees.map((e, index) => (
        <div
          key={e.id}
          className={`flex items-center gap-3 px-4 py-2 ${
            index > 0 ? 'border-t border-gray-100' : ''
          }`}
        >
          <Avatar className='h-7 w-7'>
            <AvatarFallback className='bg-blue-1200 text-[10px] font-semibold text-white'>
              {canSee('photo', e) ? (
                initials(e.name)
              ) : (
                <UserRound className='size-3.5' />
              )}
            </AvatarFallback>
          </Avatar>
          <div className='flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2'>
            <span className='text-neutral-1600 text-sm font-medium'>
              {e.name}
            </span>
            {canSee('position', e) && (
              <span className='text-neutral-1000 truncate text-xs'>
                {e.position}
                {canSee('department', e) ? ` · ${e.department}` : ''}
              </span>
            )}
            {!e.isUser && <NonUserBadge />}
          </div>
          {showCompany && (
            <span className='text-neutral-1000 text-xs'>
              {companyById(e.companyId)?.code}
            </span>
          )}
          {canSee('workEmail', e) && (
            <span className='text-neutral-1000 hidden truncate text-xs sm:block'>
              {e.workEmail}
            </span>
          )}
          <EmploymentStatusBadge status={e.employmentStatus} />
        </div>
      ))}
    </Card>
  )
}
