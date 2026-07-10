import { useState } from 'react'
import { Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/utils/helpers'
import { type SurveysStore } from '../hooks/use-surveys'
import { SurveyApproversStep } from './survey-approvers-step'
import { SurveyListPanel } from './survey-list-panel'
import { SurveySetupStep } from './survey-setup-step'
import { SurveyTemplatesStep } from './survey-templates-step'

const STEPS = ['Setup', 'Survey Approvers', 'Email Templates'] as const

/**
 * Configuration → Surveys admin surface: the Survey List management screen
 * (SVL-01..07) plus the guided Setup → Survey Approvers → Email Templates
 * configuration flow (SET-01..04, SAP-01..05), mirroring the Kensium wizard.
 */
export function SurveysTab({ store }: { store: SurveysStore }) {
  const [step, setStep] = useState(0)

  return (
    <div className='w-full'>
      <div className='mb-3 flex items-center gap-2'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>Surveys</h2>
        <Badge variant={store.settings.moduleEnabled ? 'badge_active' : 'badge_inactive'}>
          {store.settings.moduleEnabled ? 'Module enabled' : 'Module disabled'}
        </Badge>
      </div>

      <Tabs defaultValue='list' className='w-full'>
        <TabsList className='mb-3 bg-transparent p-0'>
          <TabsTrigger variant='primary' value='list'>
            Survey List
          </TabsTrigger>
          <TabsTrigger variant='primary' value='config'>
            Configuration
          </TabsTrigger>
        </TabsList>

        <TabsContent value='list'>
          <SurveyListPanel store={store} />
        </TabsContent>

        <TabsContent value='config'>
          <ol className='mb-4 flex items-center gap-2'>
            {STEPS.map((label, i) => (
              <li key={label} className='flex items-center gap-2'>
                <button
                  type='button'
                  onClick={() => setStep(i)}
                  className={cn(
                    'flex items-center gap-2 rounded-[6px] px-3 py-1.5 text-sm font-medium',
                    i === step
                      ? 'bg-blue-150 text-blue-1400'
                      : 'text-neutral-1000 bg-white'
                  )}
                >
                  <span
                    className={cn(
                      'flex size-5 items-center justify-center rounded-full text-xs',
                      i < step
                        ? 'bg-green-1200 text-green-1300'
                        : i === step
                          ? 'bg-blue-1400 text-white'
                          : 'bg-neutral-200'
                    )}
                  >
                    {i < step ? <Check className='size-3' /> : i + 1}
                  </span>
                  {label}
                </button>
                {i < STEPS.length - 1 && (
                  <span className='text-neutral-1000 text-sm'>→</span>
                )}
              </li>
            ))}
          </ol>

          {step === 0 && <SurveySetupStep store={store} onNext={() => setStep(1)} />}
          {step === 1 && (
            <SurveyApproversStep
              store={store}
              onEmailTemplates={() => setStep(2)}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && <SurveyTemplatesStep store={store} />}
        </TabsContent>
      </Tabs>
    </div>
  )
}
