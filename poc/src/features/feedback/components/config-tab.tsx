import { useState } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/utils/helpers'
import { type FeedbackConfigStore } from '../hooks/use-feedback-config'
import { ConfigReceiversStep } from './config-receivers-step'
import { ConfigSetupStep } from './config-setup-step'
import { ConfigTemplatesStep } from './config-templates-step'
import { CoordinatorRoleCard } from './coordinator-role-card'

const STEPS = [
  'Setup',
  'Feedback / Grievance Receivers',
  'Coordinator Role',
  'Email Templates',
] as const

/**
 * Guided multi-step configuration — Setup → Receivers → Email Templates with
 * Save and Save & Next on each step (FBG-29), mirroring the Kensium flow.
 * Company Admin only; every save is versioned in the tenant config.
 */
export function ConfigTab({ store }: { store: FeedbackConfigStore }) {
  const [step, setStep] = useState(0)

  return (
    <div className='w-full'>
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

      {step === 0 && <ConfigSetupStep store={store} onNext={() => setStep(1)} />}
      {step === 1 && <ConfigReceiversStep store={store} onNext={() => setStep(2)} />}
      {step === 2 && <CoordinatorRoleCard store={store} />}
      {step === 3 && <ConfigTemplatesStep store={store} />}
    </div>
  )
}
