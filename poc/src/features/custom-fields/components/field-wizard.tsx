import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CopySimple } from 'phosphor-react'
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
  findNameCollision,
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
  /** When set (create mode), the wizard pre-fills a copy of this field. */
  duplicateSource?: FieldDefinition | null
  /** Current definitions, used for the platform+company name-collision rule. */
  existingFields: FieldDefinition[]
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
    sensitivity: 'none',
    sensitiveGrants: [],
  }
}

/** Wizard values copied from an existing definition. */
function valuesFromField(
  source: FieldDefinition,
  overrides?: Partial<FieldWizardValues>
): FieldWizardValues {
  return {
    name: source.name,
    entity: source.entity,
    scope: source.scope,
    description: source.description,
    type: source.type,
    optionsText: source.options.join('\n'),
    lookupEntity: source.lookupEntity ?? '',
    required: source.required,
    isDefault: source.isDefault,
    mask: source.mask,
    regex: source.regex,
    effectiveDate: source.effectiveDate,
    permissions: { ...source.permissions },
    sensitivity: source.sensitivity,
    sensitiveGrants: [...source.sensitiveGrants],
    ...overrides,
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
  duplicateSource,
  existingFields,
  onSubmit,
}: FieldWizardProps) {
  const { role } = useRole()
  const isEdit = Boolean(field)
  const allowedScopes = allowedScopesForRole(role)
  const [step, setStep] = useState(0)
  /** Existing field the entered name collides with, if any. */
  const [collision, setCollision] = useState<FieldDefinition | null>(null)

  const form = useForm<FieldWizardValues>({
    resolver: zodResolver(fieldWizardSchema),
    defaultValues: emptyDraft(allowedScopes[0]),
  })

  useEffect(() => {
    if (!open) return
    setStep(0)
    setCollision(null)
    form.reset(
      field
        ? valuesFromField(field)
        : duplicateSource
          ? valuesFromField(duplicateSource, {
              name: `${duplicateSource.name} (copy)`,
              scope: allowedScopes.includes(duplicateSource.scope)
                ? duplicateSource.scope
                : allowedScopes[0],
            })
          : emptyDraft(allowedScopes[0])
    )
    // allowedScopes derives from role; role changes close the sheet anyway.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, field, duplicateSource, form])

  // Editing the name or target entity invalidates a shown collision.
  useEffect(() => {
    const sub = form.watch((_, info) => {
      if (info.name === 'name' || info.name === 'entity') setCollision(null)
    })
    return () => sub.unsubscribe()
  }, [form])

  const next = async () => {
    const valid = await form.trigger([...WIZARD_STEPS[step].fields])
    if (valid) setStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1))
  }

  const cancel = () => onOpenChange(false)

  /** Pre-fill a copy of the colliding field instead of fighting the name. */
  const duplicateColliding = () => {
    if (!collision) return
    form.reset(
      valuesFromField(collision, {
        name: `${collision.name} (copy)`,
        scope: allowedScopes.includes(collision.scope)
          ? collision.scope
          : allowedScopes[0],
      })
    )
    setCollision(null)
    setStep(0)
  }

  function handleSubmit(values: FieldWizardValues) {
    const existing = findNameCollision(
      existingFields,
      values.name,
      values.entity,
      field?.id
    )
    if (existing) {
      setCollision(existing)
      form.setError('name', {
        type: 'manual',
        message: `A field named '${existing.name}' already exists for ${existing.entity} (${existing.scope} scope). Field names must be unique across platform and company scopes.`,
      })
      setStep(0)
      return
    }

    const owner =
      values.scope === 'Platform'
        ? 'All companies'
        : values.scope === 'Group'
          ? 'Acme Group'
          : 'Acme Manufacturing'
    const isSensitive = values.sensitivity !== 'none'
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
      // Phase 1 policy: sensitive fields are never visible to standard
      // employees or people-managers, whatever the toggles said before.
      permissions: isSensitive
        ? {
            ...values.permissions,
            managerView: false,
            managerEdit: false,
            employeeView: false,
            employeeEdit: false,
          }
        : values.permissions,
      sensitivity: values.sensitivity,
      sensitiveGrants: isSensitive ? values.sensitiveGrants : [],
    })
    onOpenChange(false)
  }

  const isLast = step === WIZARD_STEPS.length - 1

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[520px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            {isEdit
              ? 'Edit User Defined Field'
              : duplicateSource
                ? 'Duplicate User Defined Field'
                : 'Add New User Defined Field'}
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
              {collision && (
                <div className='space-y-2 rounded-md border border-red-200 bg-red-50 p-3'>
                  <p className='text-paragraph-sm text-red-900'>
                    A field named '{collision.name}' already exists for{' '}
                    {collision.entity} ({collision.scope} scope). Field names
                    must be unique across platform and company scopes.
                  </p>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={duplicateColliding}
                  >
                    <CopySimple size={14} weight='bold' />
                    Duplicate existing field instead
                  </Button>
                </div>
              )}
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
