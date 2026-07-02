import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import { Form } from '@/components/ui/form'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  findExactNameDuplicate,
  findFuzzyMatches,
  findRegistrationDuplicate,
  nextCompanyCode,
  SUPPORTED_JURISDICTIONS,
  type Company,
} from '../data/companies'
import { emptyWizardValues, STEP_FIELDS, WIZARD_STEPS, wizardSchema, type WizardValues } from './wizard/schema'
import { StepBasicInfo, StepContactInfo, StepLegalDetails } from './wizard/steps-identity'
import { StepAdminSetup, StepOperationalConfig, StepReview } from './wizard/steps-setup'

interface CompanyWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  companies: Company[]
  /** Returns true when the company was created (entitlements allowed it). */
  onSubmit: (values: WizardValues, asDraft: boolean) => boolean
}

/** COMP-FR-001 §5.3 — guided six-step company creation wizard. */
export function CompanyWizard({
  open,
  onOpenChange,
  companies,
  onSubmit,
}: CompanyWizardProps) {
  const [step, setStep] = useState(0)
  const [fuzzyMatches, setFuzzyMatches] = useState<Company[]>([])

  const form = useForm<WizardValues>({
    resolver: zodResolver(wizardSchema),
    defaultValues: emptyWizardValues,
  })

  useEffect(() => {
    if (!open) return
    form.reset(emptyWizardValues)
    setStep(0)
  }, [open, form])

  const codePreview = nextCompanyCode(companies, new Date().getFullYear())

  const goNext = async () => {
    const valid = await form.trigger(STEP_FIELDS[step])
    if (!valid) return

    if (step === 0) {
      // COMP-FR-005 — duplicate prevention on legal name.
      const exact = findExactNameDuplicate(companies, form.getValues('legalName'))
      if (exact) {
        form.setError('legalName', {
          message: `COMP_001 (409 Conflict) — legal name already used by ${exact.code}`,
        })
        return
      }
      const fuzzy = findFuzzyMatches(companies, form.getValues('legalName'))
      if (fuzzy.length > 0) {
        setFuzzyMatches(fuzzy)
        return
      }
    }
    if (step === 3) {
      // COMP_002 — invalid or unsupported jurisdiction is rejected.
      const jurisdiction = form.getValues('primaryJurisdiction')
      if (
        !(SUPPORTED_JURISDICTIONS as readonly string[]).includes(jurisdiction)
      ) {
        form.setError('primaryJurisdiction', {
          message:
            'COMP_002 (400 Bad Request) — invalid or unsupported jurisdiction',
        })
        return
      }
    }
    setStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1))
  }

  const finalizeCreate = (values: WizardValues) => {
    // COMP_006 — registration uniqueness within the chosen jurisdiction.
    const regDup = findRegistrationDuplicate(
      companies,
      values.registrationNumber,
      values.primaryJurisdiction
    )
    if (regDup) {
      setStep(1)
      form.setError('registrationNumber', {
        message: `COMP_006 (409 Conflict) — registration number already used by ${regDup.code} in ${values.primaryJurisdiction}`,
      })
      return
    }
    if (onSubmit(values, false)) onOpenChange(false)
  }

  const saveDraft = async () => {
    const valid = await form.trigger(['legalName'])
    if (!valid) {
      toast.error('A legal name (3-100 characters) is required to save a draft')
      return
    }
    if (onSubmit(form.getValues(), true)) onOpenChange(false)
  }

  const isLast = step === WIZARD_STEPS.length - 1
  const control = form.control

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[560px]'>
          <SheetHeader className='border-grey-200 border-b px-5 py-4'>
            <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
              Create Company — Step {step + 1} of 6: {WIZARD_STEPS[step]}
            </SheetTitle>
            {/* Step indicator */}
            <div className='mt-2 flex items-center gap-1'>
              {WIZARD_STEPS.map((label, i) => (
                <div
                  key={label}
                  className={`h-1.5 flex-1 rounded-full ${
                    i < step
                      ? 'bg-green-1300'
                      : i === step
                        ? 'bg-blue-1400'
                        : 'bg-neutral-300'
                  }`}
                  title={`Step ${i + 1}: ${label}`}
                />
              ))}
            </div>
          </SheetHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(finalizeCreate)}
              className='flex min-h-0 flex-1 flex-col'
            >
              <div className='flex-1 space-y-4 overflow-y-auto px-5 py-5'>
                {step === 0 && (
                  <StepBasicInfo control={control} codePreview={codePreview} />
                )}
                {step === 1 && <StepLegalDetails control={control} />}
                {step === 2 && <StepContactInfo control={control} />}
                {step === 3 && <StepOperationalConfig control={control} />}
                {step === 4 && <StepAdminSetup control={control} />}
                {step === 5 && (
                  <StepReview values={form.getValues()} codePreview={codePreview} />
                )}
              </div>

              <div className='border-grey-200 flex items-center justify-between gap-3 border-t px-5 py-4'>
                <Button type='button' variant='outline' onClick={saveDraft}>
                  Save as Draft
                </Button>
                <div className='flex items-center gap-3'>
                  <Button
                    type='button'
                    variant='outline'
                    disabled={step === 0}
                    onClick={() => setStep((s) => Math.max(0, s - 1))}
                  >
                    Back
                  </Button>
                  {isLast ? (
                    <Button type='submit'>Confirm & Create Company</Button>
                  ) : (
                    <Button type='button' onClick={goNext}>
                      Next
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </Form>
        </FloatingSheetContent>
      </Sheet>

      {/* COMP-FR-005 — potential duplicate warning modal */}
      <AlertDialog
        open={fuzzyMatches.length > 0}
        onOpenChange={(o) => {
          if (!o) setFuzzyMatches([])
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Potential duplicate companies</AlertDialogTitle>
            <AlertDialogDescription>
              The legal name you entered is similar to existing companies.
              Review the matches before continuing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='max-h-48 space-y-2 overflow-y-auto'>
            {fuzzyMatches.map((c) => (
              <div
                key={c.id}
                className='flex items-center justify-between rounded-[6px] border border-gray-200 px-3 py-2 text-sm'
              >
                <span className='text-neutral-1600 font-medium'>
                  {c.legalName}
                </span>
                <span className='text-neutral-1000'>{c.code}</span>
              </div>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel creation</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setFuzzyMatches([])
                setStep(1)
              }}
            >
              Continue anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
