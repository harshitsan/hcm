import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useRole } from '@/context/role-context'
import { Button } from '@/components/ui/button'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import { Form } from '@/components/ui/form'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { COMPANIES, entityById, functionById, type Tier } from '../data/catalog'
import { type FunctionToggle } from '../data/config'
import { type MappingTemplate } from '../data/mappings'
import { simulateValidation, type ImportDraft } from '../hooks/use-data-jobs'
import { type MappingDraft } from '../hooks/use-mappings'
import { actorName } from './scope'
import { defaultColumnMap, missingRequiredFields } from './wizard/mapping-utils'
import {
  STEP_FIELDS,
  WIZARD_STEPS,
  wizardDefaults,
  wizardSchema,
  type WizardValues,
} from './wizard/schema'
import { StepFile } from './wizard/step-file'
import { StepMapping } from './wizard/step-mapping'
import { StepOptions } from './wizard/step-options'
import { StepReview, type ValidationPreview } from './wizard/step-review'
import { StepRouting } from './wizard/step-routing'

interface ImportWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  functionToggles: FunctionToggle[]
  tierMap: Record<string, Tier>
  mappings: MappingTemplate[]
  onSaveMapping: (draft: MappingDraft) => void
  onSubmitImport: (draft: ImportDraft) => void
}

/**
 * Guided, metadata-driven import wizard (DM-18): routing → file →
 * options → field mapping → staging validation and commit.
 */
export function ImportWizard({
  open,
  onOpenChange,
  functionToggles,
  tierMap,
  mappings,
  onSaveMapping,
  onSubmitImport,
}: ImportWizardProps) {
  const { role } = useRole()
  const [step, setStep] = useState(0)
  const [columnMap, setColumnMap] = useState<Record<string, string>>({})
  const [preview, setPreview] = useState<ValidationPreview | null>(null)

  const form = useForm<WizardValues>({
    resolver: zodResolver(wizardSchema),
    defaultValues: wizardDefaults,
    mode: 'onChange',
  })

  const functionId = form.watch('functionId')
  const savedMappingId = form.watch('savedMappingId')
  const mappingMode = form.watch('mappingMode')

  const importFn = useMemo(() => functionById(functionId), [functionId])
  const savedTemplate =
    mappingMode === 'saved'
      ? mappings.find((m) => m.id === savedMappingId)
      : undefined

  useEffect(() => {
    if (!open) return
    setStep(0)
    setPreview(null)
    form.reset(wizardDefaults)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Re-derive the source columns whenever the target function changes.
  useEffect(() => {
    setColumnMap(importFn ? defaultColumnMap(importFn, savedTemplate) : {})
    setPreview(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importFn?.id])

  const runValidation = () => {
    const v = form.getValues()
    const entity = importFn ? entityById(importFn.entityId) : undefined
    setPreview(
      simulateValidation({
        totalRecords: Number(v.totalRecords) || 0,
        duplicateHandling: v.duplicateHandling,
        entity: entity?.name ?? 'record',
        documentsZip: v.documentsZip || undefined,
      })
    )
    toast.info('Staging validation finished — nothing was committed')
  }

  const goNext = async () => {
    const valid = await form.trigger(STEP_FIELDS[step])
    if (!valid) return
    if (step === 3 && importFn) {
      const missing = missingRequiredFields(importFn, columnMap)
      if (missing.length > 0) {
        toast.error(
          `Map the required field${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`
        )
        return
      }
    }
    setStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1))
  }

  const buildDraft = (stagingOnly: boolean): ImportDraft | null => {
    const v = form.getValues()
    if (!importFn) return null
    const entity = entityById(importFn.entityId)
    const company = COMPANIES.find((c) => c.id === v.companyId)
    if (!entity || !company) return null
    return {
      module: v.module,
      functionName: importFn.name,
      entity: entity.name,
      tier: tierMap[entity.id] ?? entity.tier,
      companyId: company.id,
      companyName: company.name,
      format: v.format,
      fileName: v.fileName,
      fileSizeMb: Number(v.fileSizeMb),
      totalRecords: Number(v.totalRecords),
      duplicateHandling: v.duplicateHandling,
      processType: v.processType,
      staging: stagingOnly,
      preserveEffectiveDates: v.preserveEffectiveDates,
      documentsZip: v.documentsZip || undefined,
      submittedBy: actorName(role),
    }
  }

  const persistMappingIfAsked = () => {
    const v = form.getValues()
    if (!v.saveMapping || !importFn) return
    const entity = entityById(importFn.entityId)
    onSaveMapping({
      name: v.mappingName.trim(),
      module: v.module,
      functionId: importFn.id,
      functionName: importFn.name,
      entity: entity?.name ?? importFn.name,
      format: v.format,
      columnMap,
      createdBy: actorName(role),
    })
  }

  const submit = async (stagingOnly: boolean) => {
    const valid = await form.trigger()
    if (!valid) {
      toast.error('Fix the highlighted issues before submitting')
      return
    }
    const staging = form.getValues('staging')
    if (!stagingOnly && staging && !preview) {
      toast.error(
        'Staging mode is on — run validation and review the results before committing'
      )
      return
    }
    const draft = buildDraft(stagingOnly)
    if (!draft) return
    persistMappingIfAsked()
    onSubmitImport(draft)
    toast.success(
      stagingOnly
        ? `Staging validation job submitted for ${draft.fileName}`
        : `Import job submitted for ${draft.fileName} — track it live on the dashboard`
    )
    onOpenChange(false)
  }

  const entityTier: Tier = importFn
    ? (tierMap[importFn.entityId] ?? 'Foundation')
    : 'Foundation'
  const companyName =
    COMPANIES.find((c) => c.id === form.watch('companyId'))?.name ?? '—'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[640px]'>
        <SheetHeader className='border-grey-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            New import — step {step + 1} of {WIZARD_STEPS.length}:{' '}
            {WIZARD_STEPS[step]}
          </SheetTitle>
          <div className='mt-2 flex gap-1'>
            {WIZARD_STEPS.map((label, i) => (
              <span
                key={label}
                className={`h-1 flex-1 rounded-full ${
                  i <= step ? 'bg-blue-1400' : 'bg-neutral-300'
                }`}
              />
            ))}
          </div>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={(e) => e.preventDefault()}
            className='flex min-h-0 flex-1 flex-col'
          >
            <div className='flex-1 space-y-4 overflow-y-auto px-5 py-5'>
              {step === 0 && (
                <StepRouting
                  form={form}
                  role={role}
                  functionToggles={functionToggles}
                  mappings={mappings}
                />
              )}
              {step === 1 && <StepFile form={form} />}
              {step === 2 && <StepOptions form={form} importFn={importFn} />}
              {step === 3 && importFn && (
                <StepMapping
                  form={form}
                  importFn={importFn}
                  columnMap={columnMap}
                  onColumnMapChange={setColumnMap}
                  savedTemplate={savedTemplate}
                />
              )}
              {step === 4 && importFn && (
                <StepReview
                  values={form.getValues()}
                  importFn={importFn}
                  companyName={companyName}
                  entityTier={entityTier}
                  preview={preview}
                  onRunValidation={runValidation}
                />
              )}
            </div>

            <div className='border-grey-200 flex items-center justify-between gap-3 border-t px-5 py-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() =>
                  step === 0 ? onOpenChange(false) : setStep(step - 1)
                }
              >
                {step === 0 ? 'Cancel' : 'Back'}
              </Button>
              <div className='flex items-center gap-3'>
                {step < WIZARD_STEPS.length - 1 ? (
                  <Button type='button' onClick={goNext}>
                    Next
                  </Button>
                ) : (
                  <>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => submit(true)}
                    >
                      Validate only (staging)
                    </Button>
                    <Button type='button' onClick={() => submit(false)}>
                      Commit import
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
