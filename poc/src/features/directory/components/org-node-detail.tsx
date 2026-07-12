import { ArrowsLeftRight } from 'phosphor-react'
import { type Role } from '@/context/role-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { companyById, type Employee } from '../data/directory'
import { type CustomFieldDef } from '../data/directory-config'
import { evaluateField, type PrivacyConfig } from '../utils/privacy'
import {
  CompanyBadge,
  EmploymentStatusBadge,
  NonUserBadge,
} from './directory-badges'

/** Active delegation involvement shown on the node detail panel. */
export interface DelegationNote {
  id: string
  /** Whether the selected person handed over ('owner') or is acting ('delegate'). */
  kind: 'owner' | 'delegate'
  counterpartName: string
  endDate: string | null
}

interface OrgNodeDetailProps {
  employee: Employee | null
  manager: Employee | null
  reports: Employee[]
  delegations?: DelegationNote[]
  role: Role
  config: PrivacyConfig
  customFields: CustomFieldDef[]
  asOf: string
  onClose: () => void
  onSelect: (id: string) => void
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex items-start justify-between gap-3'>
      <span className='text-neutral-1000'>{label}</span>
      <span className='text-neutral-1900 text-right font-medium'>{value}</span>
    </div>
  )
}

/**
 * Node inspector (DIR-03 AC 3): position, department and reporting
 * relationship for the selected employee, with contact fields resolved
 * through the shared privacy rules engine (DIR-21).
 */
export function OrgNodeDetail({
  employee,
  manager,
  reports,
  delegations = [],
  role,
  config,
  customFields,
  asOf,
  onClose,
  onSelect,
}: OrgNodeDetailProps) {
  return (
    <Card className='border-gray-200'>
      <CardHeader>
        <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
          Employee detail
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!employee ? (
          <p className='text-neutral-1000 text-sm'>
            Select a node to view that employee's position, department and
            reporting relationship without leaving the chart.
          </p>
        ) : (
          <div className='space-y-3 text-sm'>
            <div className='flex flex-wrap items-center gap-2'>
              <span className='text-neutral-1600 text-base font-semibold'>
                {employee.name}
              </span>
              {!employee.isUser && <NonUserBadge />}
              <CompanyBadge companyId={employee.companyId} />
              <EmploymentStatusBadge status={employee.employmentStatus} />
            </div>
            <p className='text-neutral-1000 font-mono text-xs'>
              {employee.employeeCode} · {companyById(employee.companyId)?.name}
            </p>
            {delegations.length > 0 && (
              <div className='space-y-1'>
                {delegations.map((d) => (
                  <div
                    key={d.id}
                    className='bg-vanilla-400/30 text-vanilla-500 flex items-start gap-1.5 rounded-md px-2 py-1 text-xs'
                  >
                    <ArrowsLeftRight
                      size={12}
                      weight='bold'
                      className='mt-0.5 shrink-0'
                    />
                    <span>
                      {d.kind === 'owner'
                        ? `Delegating approvals to ${d.counterpartName}`
                        : `Acting for ${d.counterpartName}`}{' '}
                      {d.endDate ? `until ${d.endDate}` : 'until revoked'}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <DetailRow label='Position' value={employee.position} />
            <DetailRow label='Department' value={employee.department} />
            <DetailRow label='Location' value={employee.location} />
            <DetailRow
              label={`Manager (as of ${asOf})`}
              value={manager ? manager.name : 'None — root of the hierarchy'}
            />
            <DetailRow
              label='Direct reports'
              value={
                reports.length > 0
                  ? reports.map((r) => r.name).join(', ')
                  : 'None'
              }
            />
            {evaluateField('workEmail', role, config, employee.companyId)
              .visible && (
              <DetailRow label='Work email' value={employee.workEmail} />
            )}
            {evaluateField('workPhone', role, config, employee.companyId)
              .visible && (
              <DetailRow label='Work phone' value={employee.workPhone} />
            )}
            {customFields
              .filter((f) => f.showInDirectory && !f.sensitive)
              .map((f) =>
                employee.customFields[f.id] ? (
                  <DetailRow
                    key={f.id}
                    label={f.label}
                    value={employee.customFields[f.id]}
                  />
                ) : null
              )}
            {manager && (
              <Button
                variant='outline'
                className='h-7 px-2 text-xs'
                onClick={() => onSelect(manager.id)}
              >
                Jump to manager
              </Button>
            )}
            <Button
              variant='ghost'
              className='h-7 px-2 text-xs'
              onClick={onClose}
            >
              Close detail
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
