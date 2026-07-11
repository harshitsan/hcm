import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import { Form } from '@/components/ui/form'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useRole } from '@/context/role-context'
import {
  type FieldDefinition,
  type SupportedEntity,
} from '../data/custom-fields'
import { type FieldDraft } from '../hooks/use-custom-fields'
import {
  allowedScopesForRole,
  fieldWizardSchema,
  parseOptions,
  WIZARD_STEPS,
  type FieldWizardValues,
} from './field-wizard-schema'
import {
  StepBasics,
  StepBehaviors,
  StepPermissions,
  StepType,
} from './field-wizard-steps'

interface FieldWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When set, the wizard edits this definition; otherwise it creates one. */
  field?: FieldDefinition | null
  onSubmit: (draft: FieldDraft) => void
}

const today = () => new Date().toISOString().slice(0, 10)

function emptyDraft(scope: FieldWizardValues['scope']): FieldWizardValues {
  return {
    name: '',
    entity: 'Employees',
    scope,
    description: '',
    type: 'single-line-text',
    optionsText: '',
    lookupEntity: '',
    required: false,
    isDefault: false,
    mask: '',
    regex: '',
    effectiveDate: today(),
    permissions: {
      hrView: true,
      hrEdit: true,
      managerView: false,
      managerEdit: false,
      employeeView: false,
      employeeEdit: false,
    },
  }
}

/**
 * Guided multi-step creation/edit flow: Basics → Data type → Behaviors →
 * Permissions, with Next/Back and a safe Cancel (no partial field is kept).
 */
export function FieldWizard({
  open,
  onOpenChange,
  field,
  onSubmit,
}: FieldWizardProps) {
  const { role } = useRole()
  const isEdit = Boolean(field)
  const allowedScopes = allowedScopesForRole(role)
  const [step, setStep] = useState(0)

  const form = useForm<FieldWizardValues>({
    resolver: zodResolver(fieldWizardSchema),
    defaultValues: emptyDraft(allowedScopes[0]),
  })

  useEffect(() => {
    if (!open) return
    setStep(0)
    form.reset(
      field
        ? {
            name: field.name,
            entity: field.entity,
            scope: field.scope,
            description: field.description,
            type: field.type,
            optionsText: field.options.join('\n'),
            lookupEntity: field.lookupEntity ?? '',
            required: field.required,
            isDefault: field.isDefault,
            mask: field.mask,
            regex: field.regex,
            effectiveDate: field.effectiveDate,
            permissions: { ...field.permissions },
          }
        : emptyDraft(allowedScopes[0])
    )
    // allowedScopes derives from role; role changes close the sheet anyway.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, field, form])

  const next = async () => {
    const valid = await form.trigger([...WIZARD_STEPS[step].fields])
    if (valid) setStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1))
  }

  const cancel = () => onOpenChange(false)

  function handleSubmit(values: FieldWizardValues) {
    const owner =
      values.scope === 'Platform'
        ? 'All companies'
        : values.scope === 'Group'
          ? 'Acme Group'
          : 'Acme Manufacturing'
    onSubmit({
      name: values.name,
      entity: values.entity,
      scope: values.scope,
      owner,
      type: values.type,
      options: parseOptions(values.optionsText),
      lookupEntity:
        values.type === 'lookup'
          ? (values.lookupEntity as SupportedEntity)
          : null,
      required: values.required,
      isDefault: values.isDefault,
      mask: values.mask,
      regex: values.regex,
      description: values.description,
      effectiveDate: values.effectiveDate,
      permissions: values.permissions,
    })
    onOpenChange(false)
  }

  const isLast = step === WIZARD_STEPS.length - 1

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[520px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            {isEdit ? 'Edit User Defined Field' : 'Add New User Defined Field'}
          </SheetTitle>
          <div className='mt-1 flex items-center gap-2'>
            {WIZARD_STEPS.map((s, i) => (
              <Badge
                key={s.title}
                variant={i === step ? 'open' : i < step ? 'badge_active' : 'pending'}
              >
                {i + 1}. {s.title}
              </Badge>
            ))}
          </div>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='flex min-h-0 flex-1 flex-col'
          >
            <div className='flex-1 space-y-4 overflow-y-auto px-5 py-5'>
              {step === 0 && (
                <StepBasics form={form} allowedScopes={allowedScopes} />
              )}
              {step === 1 && <StepType form={form} />}
              {step === 2 && <StepBehaviors form={form} />}
              {step === 3 && <StepPermissions form={form} />}
            </div>

            <div className='border-gray-200 flex items-center justify-between gap-3 border-t px-5 py-4'>
              <Button type='button' variant='outline' onClick={cancel}>
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
                {!isLast && (
                  <Button type='button' onClick={next}>
                    Next
                  </Button>
                )}
                {isLast && (
                  <Button type='submit'>
                    {isEdit ? 'Save new version' : 'Create field'}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </FloatingSheetContent>
    </Sheet>
  )
}
