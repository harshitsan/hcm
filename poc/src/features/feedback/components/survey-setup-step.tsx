import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { type SurveysStore } from '../hooks/use-surveys'

interface SurveySetupStepProps {
  store: SurveysStore
  onNext: () => void
}

/**
 * Survey Setup step (SET-01..04): the "Enable Survey Module?" Yes/No option
 * with Save, Save & Next and Cancel — mirroring the Kensium Setup screen.
 */
export function SurveySetupStep({ store, onNext }: SurveySetupStepProps) {
  const { settings } = store
  const [enabled, setEnabled] = useState<'yes' | 'no'>(
    settings.moduleEnabled ? 'yes' : 'no'
  )

  const save = (advance: boolean) => {
    const ok = store.saveSettings(enabled === 'yes')
    if (ok && advance) onNext()
  }

  const cancel = () => {
    setEnabled(settings.moduleEnabled ? 'yes' : 'no')
    toast.info('Unsaved Survey Setup changes discarded')
  }

  return (
    <div className='flex w-full flex-col gap-4'>
      <Card className='gap-3 border-none bg-white py-4'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Survey Module setup
          </CardTitle>
          <p className='text-paragraph-sm text-neutral-1000'>
            Controls whether survey creation, approval routing and employee
            participation are available in this company.
          </p>
        </CardHeader>
        <CardContent className='space-y-4 px-4'>
          <div className='border-gray-200 flex items-center justify-between rounded-[6px] border px-3 py-3'>
            <div>
              <Label className='text-sm font-medium'>Enable Survey Module?</Label>
              <p className='text-paragraph-sm text-neutral-1000'>
                When set to No, the Survey List and approver routing stay
                configured but surveys cannot be published to employees.
              </p>
            </div>
            <RadioGroup
              value={enabled}
              onValueChange={(v) => setEnabled(v === 'yes' ? 'yes' : 'no')}
              className='flex items-center gap-4'
            >
              <div className='flex items-center gap-2'>
                <RadioGroupItem value='yes' id='survey-module-yes' />
                <Label htmlFor='survey-module-yes' className='text-sm'>
                  Yes
                </Label>
              </div>
              <div className='flex items-center gap-2'>
                <RadioGroupItem value='no' id='survey-module-no' />
                <Label htmlFor='survey-module-no' className='text-sm'>
                  No
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className='flex items-center gap-2'>
            <span className='text-paragraph-sm text-neutral-1000'>
              Current saved value:
            </span>
            <Badge variant={settings.moduleEnabled ? 'badge_active' : 'badge_inactive'}>
              {settings.moduleEnabled ? 'Yes — enabled' : 'No — disabled'}
            </Badge>
            {settings.savedOn && (
              <span className='text-paragraph-sm text-neutral-1000'>
                saved {settings.savedOn} by {settings.savedBy}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className='flex items-center justify-end gap-3'>
        <Button variant='outline' onClick={cancel}>
          Cancel
        </Button>
        <Button variant='outline' onClick={() => save(false)}>
          Save
        </Button>
        <Button onClick={() => save(true)}>Save & Next</Button>
      </div>
    </div>
  )
}
