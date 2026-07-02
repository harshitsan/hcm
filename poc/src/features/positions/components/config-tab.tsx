import { useState } from 'react'
import { CaretLeft, Check } from 'phosphor-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { OrgConfigStore } from '../hooks/use-org-config'
import type { PositionsStore } from '../hooks/use-positions'
import { ClassificationsPanel } from './config/classifications-panel'
import { CustomFieldsPanel } from './config/custom-fields-panel'
import { PayGradesPanel } from './config/paygrades-panel'
import { ProjectRolesPanel } from './config/project-roles-panel'
import { ProjectTypesPanel } from './config/project-types-panel'
import { SeriesPanel } from './config/series-panel'

interface ConfigTabProps {
  companyId: string
  store: PositionsStore
  orgConfig: OrgConfigStore
}

const STEPS = [
  { id: 'fields', label: 'Position Custom Fields' },
  { id: 'paygrade', label: 'Position Level PayGrade' },
  { id: 'series', label: 'Configure Series' },
  { id: 'types', label: 'Project Types' },
  { id: 'roles', label: 'Project Roles' },
  { id: 'classes', label: 'Employee Classification' },
] as const

/**
 * Guided organization-setup sequence (POS-34): each configuration step is
 * saved with Save & Next, earlier settings are retained while moving through
 * the sequence, and Cancel discards the current step's unsaved changes.
 */
export function ConfigTab({ companyId, store, orgConfig }: ConfigTabProps) {
  const [step, setStep] = useState(0)
  const [completed, setCompleted] = useState<boolean[]>(
    () => STEPS.map(() => false)
  )
  const isLast = step === STEPS.length - 1

  const markSaved = () => {
    setCompleted((prev) => prev.map((done, i) => (i === step ? true : done)))
    if (isLast) {
      toast.success(
        'Organization setup complete — all configuration persisted for your company'
      )
    } else {
      toast.success(`${STEPS[step].label} saved`)
      setStep(step + 1)
    }
  }

  return (
    <div className='w-full space-y-4'>
      {/* Step rail */}
      <div className='flex flex-wrap items-center gap-1.5'>
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            type='button'
            onClick={() => setStep(i)}
            className={`flex items-center gap-1.5 rounded-[6px] border px-2.5 py-1 text-sm transition-colors ${
              i === step
                ? 'border-blue-1400 bg-blue-150 text-blue-1400 font-medium'
                : 'border-gray-200 bg-white text-neutral-1000 hover:text-neutral-1600'
            }`}
          >
            {completed[i] ? (
              <Check size={12} weight='bold' className='text-green-600' />
            ) : (
              <span className='text-paragraph-sm'>{i + 1}.</span>
            )}
            {s.label}
          </button>
        ))}
      </div>

      <Card className='gap-3 border-gray-200 py-4'>
        <CardHeader className='px-5 pb-0'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Step {step + 1} of {STEPS.length}: {STEPS[step].label}
          </CardTitle>
        </CardHeader>
        <CardContent className='px-5'>
          {STEPS[step].id === 'fields' && (
            <CustomFieldsPanel companyId={companyId} store={store} />
          )}
          {STEPS[step].id === 'paygrade' && (
            <PayGradesPanel companyId={companyId} orgConfig={orgConfig} />
          )}
          {STEPS[step].id === 'series' && (
            <SeriesPanel companyId={companyId} orgConfig={orgConfig} />
          )}
          {STEPS[step].id === 'types' && (
            <ProjectTypesPanel companyId={companyId} orgConfig={orgConfig} />
          )}
          {STEPS[step].id === 'roles' && (
            <ProjectRolesPanel companyId={companyId} orgConfig={orgConfig} />
          )}
          {STEPS[step].id === 'classes' && (
            <ClassificationsPanel companyId={companyId} orgConfig={orgConfig} />
          )}
        </CardContent>
      </Card>

      {/* Save & Next configuration flow (POS-34). */}
      <div className='flex items-center justify-between'>
        <Button
          variant='outline'
          className='h-8'
          disabled={step === 0}
          onClick={() => setStep(step - 1)}
        >
          <CaretLeft size={12} weight='bold' />
          Back
        </Button>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            className='h-8'
            onClick={() =>
              toast.info('Unsaved changes on this step were discarded')
            }
          >
            Cancel
          </Button>
          <Button className='h-8' onClick={markSaved}>
            {isLast ? 'Save & Finish' : 'Save & Next'}
          </Button>
        </div>
      </div>
    </div>
  )
}
