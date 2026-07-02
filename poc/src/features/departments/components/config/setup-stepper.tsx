import { Check } from 'phosphor-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SETUP_STEPS, type DepartmentConfigStore } from '../../hooks/use-department-config'

const STEP_HINTS = [
  'Name, acronym, description, parent, head and status are captured in the Directory tab.',
  'Map office sites and the work areas each department occupies.',
  'Assign shifts, pick a default and set weekly offs per site.',
  'Everything saved so far is retained — finish to complete organizational setup.',
]

/**
 * Guided, resumable configuration stepper (DEPT-33): Save & Next persists
 * progress; returning later resumes from the correct step with prior data
 * intact.
 */
export function SetupStepper({ config }: { config: DepartmentConfigStore }) {
  const { setupStep, saveAndNext, goBack } = config
  const done = setupStep === SETUP_STEPS.length - 1

  return (
    <Card className='border-gray-200'>
      <CardHeader>
        <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
          Guided department setup
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex flex-wrap items-center gap-2'>
          {SETUP_STEPS.map((step, i) => (
            <div key={step} className='flex items-center gap-2'>
              <div
                className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-sm ${
                  i < setupStep
                    ? 'bg-green-1200 text-green-1300'
                    : i === setupStep
                      ? 'bg-blue-1400 text-white'
                      : 'text-neutral-1000 bg-neutral-200'
                }`}
              >
                {i < setupStep ? (
                  <Check size={12} weight='bold' />
                ) : (
                  <span className='text-xs font-semibold'>{i + 1}</span>
                )}
                {step}
              </div>
              {i < SETUP_STEPS.length - 1 && (
                <span className='text-neutral-1000 text-xs'>›</span>
              )}
            </div>
          ))}
        </div>
        <p className='text-neutral-1000 text-sm'>{STEP_HINTS[setupStep]}</p>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            className='h-8'
            onClick={goBack}
            disabled={setupStep === 0}
          >
            Back
          </Button>
          <Button className='h-8' onClick={saveAndNext}>
            {done ? 'Finish setup' : 'Save & Next'}
          </Button>
          <span className='text-neutral-1000 text-xs'>
            Progress is retained — you can leave and resume from this step later.
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
