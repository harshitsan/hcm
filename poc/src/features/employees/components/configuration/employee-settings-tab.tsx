import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useRole } from '@/context/role-context'
import { formatEmployeeCode } from '../../data/configuration'
import { type ConfigurationStore } from '../../hooks/use-configuration'
import { SectionTitle } from '../shared'

/**
 * Employee master settings — employee code generation series (auto vs manual
 * with a live preview) and self-service edit notifications for HR.
 */
export function EmployeeSettingsTab({ store }: { store: ConfigurationStore }) {
  const { hasRole } = useRole()
  const canEdit = hasRole('Company Admin', 'Platform Admin')

  const [draft, setDraft] = useState(store.employeeCodeSeries)

  const preview = formatEmployeeCode(draft)
  const isValid =
    draft.prefix.trim().length > 0 &&
    Number.isInteger(draft.nextNumber) &&
    draft.nextNumber > 0 &&
    Number.isInteger(draft.paddingLength) &&
    draft.paddingLength >= 1 &&
    draft.paddingLength <= 10

  return (
    <div className='space-y-4'>
      <SectionTitle>Employee code generation</SectionTitle>
      <div className='space-y-4 rounded-md border border-gray-200 bg-white p-4'>
        <div className='flex items-center justify-between rounded-md border border-gray-200 px-3 py-2'>
          <div>
            <p className='text-sm font-medium'>Auto-generate employee codes</p>
            <p className='text-paragraph-sm text-neutral-1000'>
              On: new employees receive the next code from this series. Off:
              the code is entered manually on the employee form.
            </p>
          </div>
          <Switch
            checked={draft.autoGenerate}
            disabled={!canEdit}
            onCheckedChange={(v) => setDraft({ ...draft, autoGenerate: v })}
            aria-label='Toggle employee code auto-generation'
          />
        </div>

        <div className='grid grid-cols-3 gap-3'>
          <div className='space-y-1'>
            <Label>Prefix</Label>
            <Input
              value={draft.prefix}
              disabled={!canEdit}
              onChange={(e) => setDraft({ ...draft, prefix: e.target.value })}
              placeholder='EMP'
            />
          </div>
          <div className='space-y-1'>
            <Label>Next number</Label>
            <Input
              type='number'
              min={1}
              value={draft.nextNumber}
              disabled={!canEdit}
              onChange={(e) =>
                setDraft({ ...draft, nextNumber: Number(e.target.value) })
              }
            />
          </div>
          <div className='space-y-1'>
            <Label>Padding length</Label>
            <Input
              type='number'
              min={1}
              max={10}
              value={draft.paddingLength}
              disabled={!canEdit}
              onChange={(e) =>
                setDraft({ ...draft, paddingLength: Number(e.target.value) })
              }
            />
          </div>
        </div>

        <div className='flex items-center justify-between'>
          <p className='text-paragraph-sm text-neutral-1000'>
            Next code preview:{' '}
            <Badge variant={draft.autoGenerate ? 'qualified' : 'badge_inactive'}>
              {isValid ? preview : 'Invalid series'}
            </Badge>
            {!draft.autoGenerate && (
              <span className='pl-2'>
                (auto-generation off — codes entered manually)
              </span>
            )}
          </p>
          {canEdit && (
            <Button
              size='sm'
              disabled={!isValid}
              onClick={() => store.saveEmployeeCodeSeries(draft)}
            >
              Save series
            </Button>
          )}
        </div>
      </div>

      <SectionTitle>Self-service edits</SectionTitle>
      <div className='flex items-center justify-between rounded-md border border-gray-200 bg-white px-4 py-3'>
        <div>
          <p className='text-sm font-medium'>
            Notify HR when employees edit their own profile
          </p>
          <p className='text-paragraph-sm text-neutral-1000'>
            The Notification engine sends HR a summary of self-service profile
            changes (contact details, address, dependants) as they are saved.
          </p>
        </div>
        <Switch
          checked={store.selfServiceSettings.notifyHrOnSelfEdit}
          disabled={!canEdit}
          onCheckedChange={() => store.toggleNotifyHrOnSelfEdit()}
          aria-label='Toggle HR notification on self-service edits'
        />
      </div>
    </div>
  )
}
