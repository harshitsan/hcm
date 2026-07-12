import { ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  FIELD_TYPE_LABELS,
  SENSITIVITY_LABELS,
  type FieldDefinition,
  type FieldPermissions,
  type FieldScope,
  type FieldType,
} from '../data/custom-fields'

const scopeVariant: Record<
  FieldScope,
  'open' | 'badge_active' | 'pending'
> = {
  Platform: 'open',
  Group: 'badge_active',
  Company: 'pending',
}

export function ScopeBadge({ scope }: { scope: FieldScope }) {
  return <Badge variant={scopeVariant[scope]}>{scope}</Badge>
}

export function TypeBadge({ type }: { type: FieldType }) {
  return <Badge variant='outline'>{FIELD_TYPE_LABELS[type]}</Badge>
}

export function YesNoBadge({ value }: { value: boolean }) {
  return (
    <Badge variant={value ? 'badge_active' : 'badge_inactive'}>
      {value ? 'Yes' : 'No'}
    </Badge>
  )
}

/**
 * Shield badge for salary/tax/payroll fields. Hover names the roles granted
 * view access — nobody else ever sees the stored values.
 */
export function SensitivityBadge({ field }: { field: FieldDefinition }) {
  if (field.sensitivity === 'none') return null
  const grants = field.sensitiveGrants.length
    ? field.sensitiveGrants.join(', ')
    : 'No roles granted yet'
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant='outline' className='gap-1 border-orange-300 text-orange-900'>
          <ShieldCheck className='size-3' aria-hidden />
          Sensitive · {SENSITIVITY_LABELS[field.sensitivity]}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>Visible only to: {grants}</TooltipContent>
    </Tooltip>
  )
}

/**
 * Capability chips: every custom field is first-class across the platform —
 * searchable, usable in workflow conditions, imported/exported, reportable,
 * and exposed on the API.
 */
export function CapabilityChips() {
  const capabilities = [
    'Searchable',
    'Workflow conditions',
    'Import/Export',
    'Reports',
    'API',
  ]
  return (
    <div className='flex flex-wrap gap-1'>
      {capabilities.map((c) => (
        <Badge key={c} variant='outline' className='text-neutral-1000'>
          {c}
        </Badge>
      ))}
    </div>
  )
}

/** Compact HR / RM / EMP pills showing View/Edit grants per audience. */
export function PermissionPills({ perms }: { perms: FieldPermissions }) {
  const audiences: { label: string; view: boolean; edit: boolean }[] = [
    { label: 'HR', view: perms.hrView, edit: perms.hrEdit },
    { label: 'RM', view: perms.managerView, edit: perms.managerEdit },
    { label: 'EMP', view: perms.employeeView, edit: perms.employeeEdit },
  ]
  return (
    <div className='flex flex-wrap gap-1'>
      {audiences.map((a) => (
        <Badge
          key={a.label}
          variant={a.edit ? 'badge_active' : a.view ? 'open' : 'badge_inactive'}
          title={`${a.label}: ${a.edit ? 'View + Edit' : a.view ? 'View only' : 'No access'}`}
        >
          {a.label} {a.edit ? 'V/E' : a.view ? 'V' : '—'}
        </Badge>
      ))}
    </div>
  )
}
