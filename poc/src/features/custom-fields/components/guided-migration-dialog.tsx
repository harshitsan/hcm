import { useEffect, useState } from 'react'
import { ShieldWarning } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  FIELD_TYPE_LABELS,
  type FieldDefinition,
  type FieldType,
} from '../data/custom-fields'
import {
  mockIncompatibleCount,
  mockIncompatibleSamples,
  mockRecordCount,
} from '../data/field-engine'

export type MigrationRule = 'convert' | 'clear' | 'cancel'

interface GuidedMigrationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The field being migrated (its current, pre-change definition). */
  field: FieldDefinition | null
  /** The type the field is changing to. */
  nextType: FieldType | null
  /** Called with the chosen rule and the resulting record counts. */
  onApply: (rule: Exclude<MigrationRule, 'cancel'>, outcome: {
    converted: number
    cleared: number
  }) => void
}

const STEPS = ['Review impact', 'Conversion rule', 'Confirm & apply'] as const

/**
 * Changing the type of a field that already has stored values never applies
 * silently — this 3-step guided flow shows the impact, asks how to handle
 * values that can't convert, and applies only on explicit confirmation.
 */
export function GuidedMigrationDialog({
  open,
  onOpenChange,
  field,
  nextType,
  onApply,
}: GuidedMigrationDialogProps) {
  const [step, setStep] = useState(0)
  const [rule, setRule] = useState<MigrationRule | ''>('')

  useEffect(() => {
    if (open) {
      setStep(0)
      setRule('')
    }
  }, [open])

  if (!field || !nextType) return null

  const total = mockRecordCount(field)
  const incompatible = mockIncompatibleCount(field)
  const samples = mockIncompatibleSamples(field, nextType)
  const outcome =
    rule === 'clear'
      ? { converted: 0, cleared: total }
      : { converted: total - incompatible, cleared: incompatible }

  const apply = () => {
    if (rule === 'cancel' || rule === '') {
      onOpenChange(false)
      return
    }
    onApply(rule, outcome)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[480px]'>
        <DialogHeader>
          <DialogTitle>Guided migration — {field.name}</DialogTitle>
          <DialogDescription>
            This field already has saved values, so the type change needs a
            guided migration.
          </DialogDescription>
        </DialogHeader>

        <div className='flex items-center gap-2'>
          {STEPS.map((s, i) => (
            <Badge
              key={s}
              variant={i === step ? 'open' : i < step ? 'badge_active' : 'pending'}
            >
              {i + 1}. {s}
            </Badge>
          ))}
        </div>

        {step === 0 && (
          <div className='space-y-3'>
            <div className='rounded-md border border-gray-200 bg-white p-3'>
              <div className='flex items-center justify-between py-1'>
                <span className='text-paragraph-sm text-neutral-1000'>
                  Records with a saved value
                </span>
                <span className='text-sm font-medium'>{total}</span>
              </div>
              <div className='flex items-center justify-between py-1'>
                <span className='text-paragraph-sm text-neutral-1000'>
                  Type change
                </span>
                <span className='text-sm font-medium'>
                  {FIELD_TYPE_LABELS[field.type]} →{' '}
                  {FIELD_TYPE_LABELS[nextType]}
                </span>
              </div>
              <div className='flex items-center justify-between py-1'>
                <span className='text-paragraph-sm text-neutral-1000'>
                  Values that may not convert
                </span>
                <span className='text-sm font-medium'>{incompatible}</span>
              </div>
            </div>
            <div className='rounded-md border border-orange-200 bg-orange-50 p-3'>
              <p className='text-paragraph-sm mb-1 flex items-center gap-1.5 font-medium text-orange-900'>
                <ShieldWarning size={14} weight='bold' />
                Examples of values at risk
              </p>
              <ul className='text-paragraph-sm list-inside list-disc text-orange-900'>
                {samples.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {step === 1 && (
          <RadioGroup
            value={rule}
            onValueChange={(v) => setRule(v as MigrationRule)}
            className='space-y-1'
          >
            <label className='flex cursor-pointer items-start gap-2 rounded-md border border-gray-200 bg-white p-3'>
              <RadioGroupItem value='convert' id='mig-convert' className='mt-0.5' />
              <span>
                <Label htmlFor='mig-convert' className='cursor-pointer'>
                  Convert where possible
                </Label>
                <span className='text-paragraph-sm text-neutral-1000 block'>
                  {total - incompatible} values convert to the new type;{' '}
                  {incompatible} incompatible values are cleared.
                </span>
              </span>
            </label>
            <label className='flex cursor-pointer items-start gap-2 rounded-md border border-gray-200 bg-white p-3'>
              <RadioGroupItem value='clear' id='mig-clear' className='mt-0.5' />
              <span>
                <Label htmlFor='mig-clear' className='cursor-pointer'>
                  Clear incompatible values
                </Label>
                <span className='text-paragraph-sm text-neutral-1000 block'>
                  Start fresh: all {total} stored values are cleared and the
                  field restarts empty under the new type.
                </span>
              </span>
            </label>
            <label className='flex cursor-pointer items-start gap-2 rounded-md border border-gray-200 bg-white p-3'>
              <RadioGroupItem value='cancel' id='mig-cancel' className='mt-0.5' />
              <span>
                <Label htmlFor='mig-cancel' className='cursor-pointer'>
                  Cancel the type change
                </Label>
                <span className='text-paragraph-sm text-neutral-1000 block'>
                  Keep the field as {FIELD_TYPE_LABELS[field.type]}; no values
                  are touched.
                </span>
              </span>
            </label>
          </RadioGroup>
        )}

        {step === 2 && (
          <div className='rounded-md border border-gray-200 bg-white p-3'>
            {rule === 'cancel' ? (
              <p className='text-paragraph-sm text-neutral-1000'>
                No changes will be applied. "{field.name}" stays{' '}
                {FIELD_TYPE_LABELS[field.type]} and all {total} stored values
                remain as they are.
              </p>
            ) : (
              <ul className='text-paragraph-sm text-neutral-1000 list-inside list-disc space-y-1'>
                <li>
                  "{field.name}" becomes {FIELD_TYPE_LABELS[nextType]} (was{' '}
                  {FIELD_TYPE_LABELS[field.type]}).
                </li>
                <li>{outcome.converted} records convert to the new type.</li>
                <li>{outcome.cleared} records are cleared.</li>
                <li>
                  A new version is recorded in the field's history and the
                  audit trail.
                </li>
              </ul>
            )}
          </div>
        )}

        <div className='flex items-center justify-between gap-3 pt-2'>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <div className='flex items-center gap-3'>
            {step > 0 && (
              <Button
                type='button'
                variant='outline'
                onClick={() => setStep((s) => s - 1)}
              >
                Back
              </Button>
            )}
            {step < 2 && (
              <Button
                type='button'
                onClick={() => setStep((s) => s + 1)}
                disabled={step === 1 && rule === ''}
              >
                Next
              </Button>
            )}
            {step === 2 && (
              <Button type='button' variant='red' onClick={apply}>
                {rule === 'cancel' ? 'Close without changes' : 'Apply migration'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
