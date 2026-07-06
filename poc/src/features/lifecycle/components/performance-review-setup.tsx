import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { type PerformanceReviewStore } from '../hooks/use-performance-review'
import { SectionCard } from './config-widgets'
import { StepFooter } from './orientation-widgets'

interface PerformanceReviewSetupProps {
  store: PerformanceReviewStore
}

/**
 * Performance Review setup — enable / disable the module, save the choice
 * (optionally proceeding to the operational grids) or cancel to discard an
 * unintended change.
 */
export function PerformanceReviewSetup({ store }: PerformanceReviewSetupProps) {
  const [enabled, setEnabled] = useState(store.moduleEnabled)
  const [savedNext, setSavedNext] = useState(false)

  const cancel = () => {
    setEnabled(store.moduleEnabled)
    setSavedNext(false)
    toast.info('Performance Review setup changes discarded')
  }

  return (
    <div className='w-full'>
      <SectionCard
        title='Performance Review Module'
        description='Controls whether employees and managers can participate in performance reviews for this company.'
      >
        <label className='flex items-center gap-3 text-sm'>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
          <span>
            Enable Performance Review Module{' '}
            <Badge variant={enabled ? 'badge_active' : 'badge_inactive'}>
              {enabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </span>
        </label>
        {!enabled && (
          <p className='text-neutral-1000 mt-2 text-xs'>
            While disabled, review initiations and ratings under Onboarding →
            Performance Review are read-only and no new cycles can start.
          </p>
        )}
        {savedNext && (
          <p className='mt-2 text-xs text-green-700'>
            Setup saved. Next step: manage cycles under Onboarding &amp;
            Probation → Performance Review.
          </p>
        )}
      </SectionCard>
      <StepFooter onCancel={cancel}>
        <Button
          variant='outline'
          size='sm'
          onClick={() => {
            store.saveSetup(enabled)
            setSavedNext(false)
          }}
        >
          Save
        </Button>
        <Button
          size='sm'
          onClick={() => {
            store.saveSetup(enabled)
            setSavedNext(true)
            toast.info(
              'Proceed to Onboarding & Probation → Performance Review to manage cycles'
            )
          }}
        >
          Save &amp; Next
        </Button>
      </StepFooter>
    </div>
  )
}
