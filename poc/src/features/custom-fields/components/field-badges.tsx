import { Badge } from '@/components/ui/badge'
import {
  FIELD_TYPE_LABELS,
  type FieldPermissions,
  type FieldScope,
  type FieldType,
} from '../data/custom-fields'

const scopeVariant: Record<
  FieldScope,
  'open' | 'qualified' | 'pending'
> = {
  Platform: 'open',
  Group: 'qualified',
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
