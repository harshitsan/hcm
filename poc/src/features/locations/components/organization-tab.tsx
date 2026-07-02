import { useState } from 'react'
import { Check } from 'phosphor-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import type { LocationsStore } from '../hooks/use-locations'
import type { OrganizationStore } from '../hooks/use-organization'
import { AddressStep } from './org/address-step'
import { BrandingStep } from './org/branding-step'
import { DocumentsStep } from './org/documents-step'
import { PayrollStep } from './org/payroll-step'
import { ProfileStep } from './org/profile-step'

const STEPS = [
  'Head Office Profile',
  'Payroll Schedule',
  'Address & Contact',
  'Branding',
  'Documents',
] as const

interface OrganizationTabProps {
  org: OrganizationStore
  store: LocationsStore
}

/**
 * Guided Save & Next organization setup (LOC-19..25): each step validates and
 * saves before progression, and previously saved values are retained when
 * navigating back.
 */
export function OrganizationTab({ org, store }: OrganizationTabProps) {
  const [step, setStep] = useState(0)

  const goNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1)
    } else {
      toast.success('Organization setup complete')
    }
  }
  const goBack = () => setStep((s) => Math.max(0, s - 1))

  const stepProps = { onNext: goNext, onBack: goBack, isFirst: step === 0, isLast: step === STEPS.length - 1 }

  return (
    <div className='w-full'>
      {/* Stepper header */}
      <Card className='mb-4 gap-0 border-none bg-white py-3'>
        <CardContent className='px-4'>
          <ol className='flex flex-wrap items-center gap-2'>
            {STEPS.map((label, i) => {
              const done = i < step
              const current = i === step
              return (
                <li key={label} className='flex items-center gap-2'>
                  <button
                    type='button'
                    onClick={() => i <= step && setStep(i)}
                    className='flex items-center gap-2'
                    disabled={i > step}
                  >
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                        done
                          ? 'bg-green-1200 text-green-1300'
                          : current
                            ? 'bg-blue-1400 text-white'
                            : 'bg-neutral-200 text-neutral-1000'
                      }`}
                    >
                      {done ? <Check size={12} weight='bold' /> : i + 1}
                    </span>
                    <span
                      className={`text-sm ${
                        current
                          ? 'text-neutral-1600 font-semibold'
                          : 'text-neutral-1000 font-medium'
                      }`}
                    >
                      {label}
                    </span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <span className='bg-grey-200 hidden h-px w-6 sm:block' />
                  )}
                </li>
              )
            })}
          </ol>
        </CardContent>
      </Card>

      {step === 0 && <ProfileStep org={org} store={store} {...stepProps} />}
      {step === 1 && <PayrollStep org={org} {...stepProps} />}
      {step === 2 && <AddressStep org={org} {...stepProps} />}
      {step === 3 && <BrandingStep org={org} {...stepProps} />}
      {step === 4 && <DocumentsStep org={org} {...stepProps} />}
    </div>
  )
}

export interface StepNavProps {
  onNext: () => void
  onBack: () => void
  isFirst: boolean
  isLast: boolean
}
