import { useState } from 'react'
import { Check } from 'phosphor-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { type KnowledgeTransferStore } from '../hooks/use-knowledge-transfer'
import { SectionCard } from './config-widgets'
import { StepFooter } from './orientation-widgets'

const STEPS = ['Setup', 'Handover Policy', 'Review & Finish'] as const

interface KtConfigProps {
  store: KnowledgeTransferStore
}

/**
 * Knowledge Transfer configuration wizard — sequential Save & Next steps
 * (Setup → Handover Policy → Review & Finish) mirroring the Kensium flow.
 */
export function KtConfig({ store }: KtConfigProps) {
  const [step, setStep] = useState(0)
  const [enabled, setEnabled] = useState(store.moduleEnabled)
  const [days, setDays] = useState(String(store.defaultHandoverDays))
  const [approval, setApproval] = useState(store.preCloseApprovalRequired)

  const cancel = () => {
    setStep(0)
    setEnabled(store.moduleEnabled)
    setDays(String(store.defaultHandoverDays))
    setApproval(store.preCloseApprovalRequired)
    toast.info('Knowledge Transfer setup exited — unsaved changes discarded')
  }
  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1))

  const savePolicy = () => {
    const parsed = Number(days)
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 90) {
      toast.error('Default handover window must be between 1 and 90 days')
      return false
    }
    store.saveHandoverPolicy(parsed, approval)
    return true
  }

  return (
    <div className='w-full'>
      {/* Step rail */}
      <div className='mb-4 flex flex-wrap items-center gap-1.5'>
        {STEPS.map((label, i) => (
          <button
            key={label}
            type='button'
            onClick={() => setStep(i)}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
              i === step
                ? 'border-blue-600 bg-blue-600 font-medium text-white'
                : i < step
                  ? 'border-green-600/40 bg-green-50 text-green-700'
                  : 'text-neutral-1000 border-gray-200 bg-white'
            }`}
          >
            {i < step ? (
              <Check size={11} weight='bold' />
            ) : (
              <span className='font-medium'>{i + 1}.</span>
            )}
            {label}
          </button>
        ))}
      </div>

      <section className='rounded-[6px] border border-gray-200 bg-white p-4'>
        {step === 0 && (
          <div>
            <SectionCard
              title='Knowledge Transfer Module'
              description='Controls whether KT tasks can be raised during exits and internal moves.'
            >
              <label className='flex items-center gap-3 text-sm'>
                <Switch checked={enabled} onCheckedChange={setEnabled} />
                <span>
                  Enable Knowledge Transfer Module{' '}
                  <Badge variant={enabled ? 'badge_active' : 'badge_inactive'}>
                    {enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </span>
              </label>
            </SectionCard>
            <StepFooter onCancel={cancel}>
              <Button
                variant='outline'
                size='sm'
                onClick={() => store.saveSetup(enabled)}
              >
                Save
              </Button>
              <Button
                size='sm'
                onClick={() => {
                  store.saveSetup(enabled)
                  next()
                }}
              >
                Save &amp; Next
              </Button>
            </StepFooter>
          </div>
        )}

        {step === 1 && (
          <div>
            <SectionCard
              title='Handover policy'
              description='Defaults applied when a new KT task is raised.'
            >
              <div className='flex flex-col gap-3'>
                <label className='flex items-center gap-3 text-sm'>
                  <span className='w-56'>Default handover window (days)</span>
                  <Input
                    type='number'
                    min={1}
                    max={90}
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    className='h-7 w-[110px]'
                  />
                </label>
                <label className='flex items-center gap-3 text-sm'>
                  <Switch checked={approval} onCheckedChange={setApproval} />
                  <span>Manager approval required before a task is Pre Closed</span>
                </label>
              </div>
            </SectionCard>
            <StepFooter onCancel={cancel}>
              <Button variant='outline' size='sm' onClick={savePolicy}>
                Save
              </Button>
              <Button
                size='sm'
                onClick={() => {
                  if (savePolicy()) next()
                }}
              >
                Save &amp; Next
              </Button>
            </StepFooter>
          </div>
        )}

        {step === 2 && (
          <div>
            <SectionCard
              title='Review & Finish'
              description='Summary of the configuration that will govern new KT tasks.'
            >
              <ul className='list-disc space-y-1 pl-5 text-sm'>
                <li>
                  Module:{' '}
                  <Badge
                    variant={store.moduleEnabled ? 'badge_active' : 'badge_inactive'}
                  >
                    {store.moduleEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </li>
                <li>Default handover window: {store.defaultHandoverDays} day(s)</li>
                <li>
                  Pre-close approval:{' '}
                  {store.preCloseApprovalRequired ? 'Required' : 'Optional'}
                </li>
              </ul>
            </SectionCard>
            <StepFooter onCancel={cancel}>
              <Button
                size='sm'
                onClick={() => {
                  setStep(0)
                  toast.success('Knowledge Transfer configuration complete')
                }}
              >
                Finish setup
              </Button>
            </StepFooter>
          </div>
        )}
      </section>
    </div>
  )
}
