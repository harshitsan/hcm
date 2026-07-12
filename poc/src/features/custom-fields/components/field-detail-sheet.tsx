import { ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import {
  Sheet,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  FIELD_TYPE_LABELS,
  SENSITIVITY_LABELS,
  type FieldDefinition,
} from '../data/custom-fields'
import {
  CapabilityChips,
  PermissionPills,
  ScopeBadge,
  YesNoBadge,
} from './field-badges'

interface FieldDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  field: FieldDefinition | null
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='flex items-start justify-between gap-3 border-b border-gray-100 py-2 last:border-b-0'>
      <span className='text-paragraph-sm text-neutral-1000 shrink-0'>
        {label}
      </span>
      <div className='text-right text-sm'>{children}</div>
    </div>
  )
}

/** Read-only detail view for a definition: setup, access, and capabilities. */
export function FieldDetailSheet({
  open,
  onOpenChange,
  field,
}: FieldDetailSheetProps) {
  if (!field) return null
  const sensitive = field.sensitivity !== 'none'
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[480px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            {field.name}
          </SheetTitle>
          <SheetDescription>{field.description || '—'}</SheetDescription>
        </SheetHeader>

        <div className='flex-1 space-y-4 overflow-y-auto px-5 py-5'>
          <div className='rounded-md border border-gray-200 bg-white px-3'>
            <DetailRow label='Entity'>{field.entity}</DetailRow>
            <DetailRow label='Scope'>
              <div className='flex items-center justify-end gap-2'>
                <ScopeBadge scope={field.scope} />
                <span className='text-paragraph-sm text-neutral-1000'>
                  {field.owner}
                </span>
              </div>
            </DetailRow>
            <DetailRow label='Data type'>
              {FIELD_TYPE_LABELS[field.type]}
            </DetailRow>
            {field.options.length > 0 && (
              <DetailRow label='Options'>{field.options.join(', ')}</DetailRow>
            )}
            {field.lookupEntity && (
              <DetailRow label='Lookup target'>{field.lookupEntity}</DetailRow>
            )}
            <DetailRow label='Mandatory'>
              <YesNoBadge value={field.required} />
            </DetailRow>
            <DetailRow label='On standard form'>
              <YesNoBadge value={field.isDefault} />
            </DetailRow>
            {field.mask && <DetailRow label='Mask'>{field.mask}</DetailRow>}
            <DetailRow label='Version'>
              v{field.version} · effective {field.effectiveDate}
            </DetailRow>
          </div>

          <div>
            <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
              View / Edit permissions
            </h3>
            <PermissionPills perms={field.permissions} />
          </div>

          {sensitive && (
            <div className='rounded-md border border-orange-200 bg-orange-50 p-3'>
              <p className='text-paragraph-sm mb-2 flex items-center gap-1.5 font-medium text-orange-900'>
                <ShieldCheck className='size-4' aria-hidden />
                Sensitive · {SENSITIVITY_LABELS[field.sensitivity]} data
              </p>
              <p className='text-paragraph-sm mb-2 text-orange-900'>
                Compensation data is never visible to standard employees or
                people-managers (Phase 1 policy). View access is granted to:
              </p>
              <div className='flex flex-wrap gap-1'>
                {field.sensitiveGrants.length ? (
                  field.sensitiveGrants.map((r) => (
                    <Badge key={r} variant='badge_active'>
                      {r}
                    </Badge>
                  ))
                ) : (
                  <span className='text-paragraph-sm text-orange-900'>
                    No roles granted yet
                  </span>
                )}
              </div>
            </div>
          )}

          <div>
            <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
              Where this field works
            </h3>
            <CapabilityChips />
            <p className='text-paragraph-sm text-neutral-1000 mt-2'>
              Custom fields are automatically available in searches, workflow
              conditions, imports/exports, reports, and the API.
            </p>
          </div>
        </div>
      </FloatingSheetContent>
    </Sheet>
  )
}
