import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import { Form } from '@/components/ui/form'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { type Policy, type PolicyAttachment } from '../data/policies'
import {
  emptyWizardValues,
  validateFile,
  WIZARD_STEP_FIELDS,
  WIZARD_STEPS,
  wizardSchema,
  type WizardValues,
} from './policy-wizard-schema'
import {
  DatingStep,
  ExclusionsStep,
  ReviewStep,
} from './policy-wizard-review'
import { ApplicabilityStep, DetailsStep } from './policy-wizard-steps'

interface PolicyWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When set, the wizard authors a new version of this policy (POL-04). */
  policy?: Policy | null
  /** Returns false to keep the wizard open (e.g. overlapping-window rejection). */
  onSubmit: (
    values: WizardValues,
    attachment: PolicyAttachment | null,
    publish: boolean
  ) => boolean
}

function prefillFrom(policy: Policy): WizardValues {
  const latest = policy.versions[policy.versions.length - 1]
  return {
    ...emptyWizardValues,
    name: policy.name,
    editionName: '',
    type: policy.type,
    category: policy.category as WizardValues['category'],
    ownerLevel: policy.ownerLevel,
    ownerName: policy.ownerName,
    content: latest?.content ?? '',
    linkedModules: policy.linkedModules,
    workerKinds: policy.scope.workerKinds,
    companies: policy.scope.companies,
    groups: policy.scope.groups,
    jurisdictions: policy.scope.jurisdictions,
    locations: policy.scope.locations,
    departments: policy.scope.departments,
    employmentTypes: policy.scope.employmentTypes,
    positionLevels: policy.scope.positionLevels,
    excludedPositionLevels: policy.scope.excludedPositionLevels,
  }
}

/**
 * Guided multi-step authoring wizard (POL-26/19): details → applicability →
 * exclusions → dating & document → review, with Next blocked on invalid steps
 * and Cancel discarding the draft.
 */
export function PolicyWizard({ open, onOpenChange, policy, onSubmit }: PolicyWizardProps) {
  const isNewVersion = Boolean(policy)
  const nextVersionNumber = policy
    ? Math.max(...policy.versions.map((v) => v.version)) + 1
    : 1

  const [step, setStep] = useState(0)
  const [attachment, setAttachment] = useState<PolicyAttachment | null>(null)
  const [attachmentError, setAttachmentError] = useState<string | null>(null)

  const form = useForm<WizardValues>({
    resolver: zodResolver(wizardSchema),
    defaultValues: emptyWizardValues,
  })

  useEffect(() => {
    if (!open) return
    setStep(0)
    setAttachment(null)
    setAttachmentError(null)
    form.reset(policy ? prefillFrom(policy) : emptyWizardValues)
  }, [open, policy, form])

  const handleFileSelect = (file: File | null) => {
    if (!file) {
      setAttachment(null)
      setAttachmentError(null)
      return
    }
    const error = validateFile(file)
    if (error) {
      setAttachment(null)
      setAttachmentError(error)
      return
    }
    setAttachmentError(null)
    setAttachment({ fileName: file.name, sizeKb: Math.max(1, Math.round(file.size / 1024)) })
  }

  const handleNext = async () => {
    const valid = await form.trigger(WIZARD_STEP_FIELDS[step])
    if (!valid) return
    setStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1))
  }

  const handleFinish = (publish: boolean) => {
    void form.handleSubmit((values) => {
      const saved = onSubmit(values, attachment, publish)
      if (saved) onOpenChange(false)
    })()
  }

  const values = form.watch()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[560px]'>
        <SheetHeader className='border-grey-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            {isNewVersion
              ? `New version of ${policy?.name} (v${nextVersionNumber})`
              : 'Add new policy document'}
          </SheetTitle>
          <div className='mt-2 flex items-center gap-1'>
            {WIZARD_STEPS.map((label, i) => (
              <div key={label} className='flex flex-1 flex-col gap-1'>
                <div
                  className={`h-1 rounded-full ${
                    i <= step ? 'bg-blue-1400' : 'bg-neutral-300'
                  }`}
                />
                <span
                  className={`text-[10px] leading-tight ${
                    i === step
                      ? 'text-blue-1400 font-medium'
                      : 'text-neutral-1000'
                  }`}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={(e) => e.preventDefault()}
            className='flex min-h-0 flex-1 flex-col'
          >
            <div className='flex-1 space-y-4 overflow-y-auto px-5 py-5'>
              {step === 0 && <DetailsStep form={form} />}
              {step === 1 && <ApplicabilityStep form={form} />}
              {step === 2 && <ExclusionsStep form={form} />}
              {step === 3 && (
                <DatingStep
                  form={form}
                  attachment={attachment}
                  attachmentError={attachmentError}
                  onFileSelect={handleFileSelect}
                  nextVersionNumber={nextVersionNumber}
                />
              )}
              {step === 4 && (
                <ReviewStep
                  values={values}
                  attachment={attachment}
                  nextVersionNumber={nextVersionNumber}
                />
              )}
            </div>

            <div className='border-grey-200 flex items-center justify-between gap-3 border-t px-5 py-4'>
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
                {step < WIZARD_STEPS.length - 1 ? (
                  <Button type='button' onClick={handleNext}>
                    Next
                  </Button>
                ) : (
                  <>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => handleFinish(false)}
                    >
                      Save as draft
                    </Button>
                    <Button type='button' onClick={() => handleFinish(true)}>
                      Publish
                    </Button>
                  </>
                )}
              </div>
            </div>
          </form>
        </Form>
      </FloatingSheetContent>
    </Sheet>
  )
}
