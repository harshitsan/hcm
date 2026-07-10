import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { KT_ASSIGNERS, KT_EXIT_TYPES } from '../data/knowledge-transfer'
import { type KnowledgeTransferStore } from '../hooks/use-knowledge-transfer'
import { CheckboxGroup, SectionCard } from './config-widgets'

interface ConfigKtProps {
  store: KnowledgeTransferStore
  /** Exit type vocabulary; defaults to the Kensium KT exit types. */
  exitTypes?: readonly string[]
}

/**
 * Configuration → Employee Management → KT Management (Kensium spec):
 * module toggle, non-exit / exit process toggles, applicable exit types and
 * who may assign KT tasks — saved together via the store.
 */
export function ConfigKt({ store, exitTypes = KT_EXIT_TYPES }: ConfigKtProps) {
  const [ktEnabled, setKtEnabled] = useState(store.moduleEnabled)
  const [nonExit, setNonExit] = useState(store.supportNonExitKt)
  const [whileExit, setWhileExit] = useState(store.supportExitKt)
  const [types, setTypes] = useState<string[]>(store.applicableExitTypes)
  const [assigners, setAssigners] = useState<string[]>(store.assignedBy)

  const save = () => {
    if (ktEnabled && !nonExit && !whileExit) {
      toast.error(
        'Enable at least one KT process (non-exit or while exit) when KT management is on'
      )
      return
    }
    if (whileExit && types.length === 0) {
      toast.error('Select at least one applicable exit type for KT while exit')
      return
    }
    if (ktEnabled && assigners.length === 0) {
      toast.error('Select at least one role that can assign KT tasks')
      return
    }
    store.saveKtConfig({
      moduleEnabled: ktEnabled,
      supportNonExitKt: nonExit,
      supportExitKt: whileExit,
      applicableExitTypes: types,
      assignedBy: assigners,
    })
  }

  return (
    <div className='w-full'>
      <SectionCard
        title='KT Management'
        description='Configure the Knowledge Transfer module for this company.'
        actions={
          <Button size='sm' onClick={save}>
            Save
          </Button>
        }
      >
        <div className='flex flex-col gap-4'>
          <label className='flex items-center gap-3 text-sm'>
            <Switch checked={ktEnabled} onCheckedChange={setKtEnabled} />
            <span>
              Do you support KT management?{' '}
              <Badge variant={ktEnabled ? 'badge_active' : 'badge_inactive'}>
                {ktEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </span>
          </label>

          <div
            className={
              ktEnabled ? 'flex flex-col gap-4' : 'pointer-events-none flex flex-col gap-4 opacity-50'
            }
          >
            <label className='flex items-center gap-3 text-sm'>
              <Switch checked={nonExit} onCheckedChange={setNonExit} />
              <span>Do you support non-exit KT process?</span>
            </label>

            <label className='flex items-center gap-3 text-sm'>
              <Switch checked={whileExit} onCheckedChange={setWhileExit} />
              <span>Do you support KT process while exit?</span>
            </label>

            <div
              className={
                whileExit ? undefined : 'pointer-events-none opacity-50'
              }
            >
              <p className='mb-1.5 text-sm font-medium'>Applicable exit types</p>
              <p className='text-neutral-1000 mb-2 text-xs'>
                The exit types for which the KT process is applicable.
              </p>
              <CheckboxGroup options={exitTypes} value={types} onChange={setTypes} />
            </div>

            <div>
              <p className='mb-1.5 text-sm font-medium'>KT task to be assigned by</p>
              <p className='text-neutral-1000 mb-2 text-xs'>
                Who can assign KT tasks to employees.
              </p>
              <CheckboxGroup
                options={KT_ASSIGNERS}
                value={assigners}
                onChange={setAssigners}
              />
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
