import { useRole, type Role } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  type AuditAccessConfig,
  type AuditScopeEntity,
} from '../data/audit-config'
import { type AuditEntityType } from '../data/audit-entries'
import { AccessDeniedPanel } from './access-denied-panel'
import { auditDateFmt } from './audit-badges'

interface GovernanceTabProps {
  scopeEntities: AuditScopeEntity[]
  onToggleEntity: (entity: AuditEntityType) => void
  onToggleField: (entity: AuditEntityType, field: string) => void
  accessConfig: AuditAccessConfig
  onToggleAccess: (
    role: Role,
    key: 'canViewAuditTrail' | 'canViewRecordHistory'
  ) => void
}

/**
 * Platform-level governed configuration (L2): mandatory audit entity/field
 * scope (FR 6.29.1/6.29.2) and role-based audit access with tenant scoping
 * (FR 6.29.5). Versioned + effective-dated; no code deployments.
 */
export function GovernanceTab({
  scopeEntities,
  onToggleEntity,
  onToggleField,
  accessConfig,
  onToggleAccess,
}: GovernanceTabProps) {
  const { role, hasRole } = useRole()

  if (!hasRole('Platform Admin')) {
    return (
      <AccessDeniedPanel
        description={`Audit governance configuration is restricted to Platform Admins. The role "${role}" cannot view or change audit scope or access permissions.`}
      />
    )
  }

  return (
    <div className='grid w-full gap-4 lg:grid-cols-2'>
      {/* Mandatory audit entity + field scope */}
      <Card className='border-grey-200 border bg-white'>
        <CardHeader className='px-4 pt-4 pb-0'>
          <CardTitle className='text-paragraph-sm text-neutral-1600 font-medium'>
            Audit scope — mandatory entities &amp; tracked fields
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4 px-4 py-4'>
          {scopeEntities.map((cfg) => (
            <div
              key={cfg.entity}
              className='border-grey-200 rounded-[6px] border p-3'
            >
              <div className='mb-2 flex flex-wrap items-center gap-2'>
                <span className='text-neutral-1600 text-sm font-semibold'>
                  {cfg.entity}
                </span>
                {cfg.mandatory && (
                  <Badge variant='disqualified'>Mandatory</Badge>
                )}
                <span className='text-neutral-1000 ms-auto text-xs'>
                  v{cfg.version} · effective{' '}
                  {auditDateFmt.format(new Date(cfg.effectiveFrom))}
                </span>
                <Switch
                  checked={cfg.enabled}
                  onCheckedChange={() => onToggleEntity(cfg.entity)}
                  aria-label={`Toggle ${cfg.entity} audit scope`}
                />
              </div>
              <p className='text-neutral-1000 mb-2 text-xs'>
                Create, update, delete and status-change actions on{' '}
                {cfg.entity} records are captured per this metadata — removing
                a mandatory entity from scope is prevented.
              </p>
              <div className='grid grid-cols-2 gap-x-4 gap-y-1.5'>
                {cfg.fields.map((field) => (
                  <div
                    key={field.name}
                    className='flex items-center justify-between gap-2'
                  >
                    <span className='text-neutral-1900 text-sm'>
                      {field.name}
                    </span>
                    <Switch
                      checked={field.tracked}
                      onCheckedChange={() =>
                        onToggleField(cfg.entity, field.name)
                      }
                      aria-label={`Track ${cfg.entity} ${field.name}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Role-based audit access permissions */}
      <Card className='border-grey-200 border bg-white'>
        <CardHeader className='flex flex-wrap items-center justify-between px-4 pt-4 pb-0'>
          <CardTitle className='text-paragraph-sm text-neutral-1600 font-medium'>
            Audit access permissions (per-tenant governed config)
          </CardTitle>
          <span className='text-neutral-1000 text-xs'>
            v{accessConfig.version} · effective{' '}
            {auditDateFmt.format(new Date(accessConfig.effectiveFrom))} · by{' '}
            {accessConfig.updatedBy}
          </span>
        </CardHeader>
        <CardContent className='px-4 py-4'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Tenant scope</TableHead>
                <TableHead className='text-center'>Audit trail</TableHead>
                <TableHead className='text-center'>Record history</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accessConfig.rules.map((rule) => (
                <TableRow key={rule.role}>
                  <TableCell className='text-neutral-1600 text-sm font-medium'>
                    {rule.role}
                  </TableCell>
                  <TableCell className='text-neutral-1000 text-xs'>
                    {rule.scopeLabel}
                  </TableCell>
                  <TableCell className='text-center'>
                    <Switch
                      checked={rule.canViewAuditTrail}
                      onCheckedChange={() =>
                        onToggleAccess(rule.role, 'canViewAuditTrail')
                      }
                      aria-label={`${rule.role} audit trail access`}
                    />
                  </TableCell>
                  <TableCell className='text-center'>
                    <Switch
                      checked={rule.canViewRecordHistory}
                      onCheckedChange={() =>
                        onToggleAccess(rule.role, 'canViewRecordHistory')
                      }
                      aria-label={`${rule.role} record history access`}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className='text-neutral-1000 mt-3 text-xs'>
            Changes take effect immediately for the affected roles (switch the
            active role to verify), are versioned with prior versions retained,
            and apply only within this tenant's boundary — they can never grant
            cross-tenant access.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
