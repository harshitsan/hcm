import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { BUDGET_CYCLES, type BudgetCycle } from '../data/org-config'
import { type OrgConfigStore } from '../hooks/use-org-config'

interface BudgetSetupTabProps {
  store: OrgConfigStore
}

/**
 * Configuration → HR Budget → Setup (Kensium kx-060). Enable/disable the
 * HR budget planner module, pick the planning cycle, then Save to persist or
 * Cancel to discard unsaved edits.
 */
export function BudgetSetupTab({ store }: BudgetSetupTabProps) {
  const saved = store.budgetConfig
  const [enabled, setEnabled] = useState(saved.enabled)
  const [cycle, setCycle] = useState<BudgetCycle>(saved.cycle)
  const [notifyOnOverrun, setNotifyOnOverrun] = useState(saved.notifyOnOverrun)

  const dirty =
    enabled !== saved.enabled ||
    cycle !== saved.cycle ||
    notifyOnOverrun !== saved.notifyOnOverrun

  const save = () => {
    store.saveBudgetConfig({ enabled, cycle, notifyOnOverrun })
  }

  const cancel = () => {
    setEnabled(saved.enabled)
    setCycle(saved.cycle)
    setNotifyOnOverrun(saved.notifyOnOverrun)
    toast.info('Unsaved changes discarded — settings restored to last save')
  }

  return (
    <div className='w-full max-w-2xl space-y-4'>
      <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
        <div className='mb-1 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            HR Budget Planner — Setup
          </h3>
          <Badge variant={saved.enabled ? 'open' : 'dropped'}>
            {saved.enabled ? 'Module enabled' : 'Module disabled'}
          </Badge>
        </div>
        <p className='text-neutral-1000 mb-4 text-xs'>
          Controls whether budget planning is available in the system. Changes
          take effect only after saving.
        </p>

        <div className='space-y-4'>
          <div className='flex items-center justify-between gap-2 rounded-[6px] border border-gray-200 p-3'>
            <div>
              <p className='text-neutral-1600 text-sm font-medium'>
                Enable HR budget planner
              </p>
              <p className='text-neutral-1000 text-xs'>
                When disabled, budget planning screens are hidden for every
                company user.
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          <div className='space-y-1'>
            <Label className='text-paragraph-sm'>Planning cycle</Label>
            <Select
              value={cycle}
              onValueChange={(v) => setCycle(v as BudgetCycle)}
              disabled={!enabled}
            >
              <SelectTrigger variant='secondary' className='w-64'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BUDGET_CYCLES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <label className='flex items-center gap-2 text-sm'>
            <Checkbox
              variant='blue'
              checked={notifyOnOverrun}
              disabled={!enabled}
              onCheckedChange={(v) => setNotifyOnOverrun(!!v)}
            />
            Notify HR admins when a department exceeds its planned budget
          </label>
        </div>

        <div className='mt-5 flex items-center gap-2'>
          <Button className='h-7' onClick={save} disabled={!dirty}>
            Save
          </Button>
          <Button
            variant='outline'
            className='h-7'
            onClick={cancel}
            disabled={!dirty}
          >
            Cancel
          </Button>
          {dirty && (
            <span className='text-neutral-1000 text-xs'>Unsaved changes</span>
          )}
        </div>
      </div>
    </div>
  )
}
