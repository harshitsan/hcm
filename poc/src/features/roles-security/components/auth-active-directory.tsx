import { useState } from 'react'
import { ArrowLeft, ArrowRight } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  DEPARTMENTS,
  LOCATIONS,
  POSITIONS,
  WORKFORCE_TYPES,
  type Department,
  type WorkforceType,
} from '../data/directory'
import { type SecurityConfigStore } from '../hooks/use-security-config'

function CheckGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: readonly T[]
  value: T[]
  onChange: (next: T[]) => void
}) {
  return (
    <div>
      <p className='text-neutral-1600 mb-1 text-sm font-medium'>{label}</p>
      <div className='grid grid-cols-2 gap-2 rounded-[6px] border border-gray-200 p-3'>
        {options.map((opt) => (
          <label key={opt} className='flex items-center gap-2 text-sm'>
            <Checkbox
              variant='blue'
              checked={value.includes(opt)}
              onCheckedChange={(checked) =>
                onChange(
                  checked ? [...value, opt] : value.filter((v) => v !== opt)
                )
              }
            />
            {opt}
          </label>
        ))}
      </div>
    </div>
  )
}

/**
 * Manage Active Directory (RSEC-30 … RSEC-32): enable/disable the
 * integration, scope it by employee class, location and department, and use
 * shuttle controls to select positions — marking some as mandatory-AD.
 */
export function AuthActiveDirectory({ store }: { store: SecurityConfigStore }) {
  const cfg = store.adConfig
  const [enabled, setEnabled] = useState(cfg.enabled ? 'yes' : 'no')
  const [classes, setClasses] = useState<WorkforceType[]>([...cfg.classes])
  const [locations, setLocations] = useState<string[]>([...cfg.locations])
  const [departments, setDepartments] = useState<Department[]>([
    ...cfg.departments,
  ])
  const [selected, setSelected] = useState<string[]>([...cfg.selectedPositions])
  const [mandatory, setMandatory] = useState<string[]>([
    ...cfg.mandatoryPositions,
  ])
  const [pickAvailable, setPickAvailable] = useState<string | null>(null)
  const [pickSelected, setPickSelected] = useState<string | null>(null)

  const available = POSITIONS.filter((p) => !selected.includes(p))

  const moveRight = () => {
    if (!pickAvailable) return
    setSelected((prev) => [...prev, pickAvailable])
    setPickAvailable(null)
  }
  const moveLeft = () => {
    if (!pickSelected) return
    setSelected((prev) => prev.filter((p) => p !== pickSelected))
    setMandatory((prev) => prev.filter((p) => p !== pickSelected))
    setPickSelected(null)
  }

  const save = () => {
    store.saveAdConfig({
      enabled: enabled === 'yes',
      classes,
      locations,
      departments,
      selectedPositions: selected,
      mandatoryPositions: mandatory,
    })
  }

  return (
    <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
      <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
        Manage Active Directory
        <span className='text-neutral-1000 ml-2 text-xs'>
          company-scoped — in-scope employees authenticate against the
          corporate directory; everyone else uses local credentials and the
          password policy
        </span>
      </h3>

      <p className='text-neutral-1000 mb-2 text-sm'>
        Enable Active Directory integration?
      </p>
      <RadioGroup
        value={enabled}
        onValueChange={setEnabled}
        className='mb-4 flex gap-6'
      >
        <label className='flex items-center gap-2 text-sm'>
          <RadioGroupItem value='yes' /> Yes
        </label>
        <label className='flex items-center gap-2 text-sm'>
          <RadioGroupItem value='no' /> No
        </label>
      </RadioGroup>

      <div className='mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3'>
        <CheckGroup
          label='Applicable employee classes'
          options={WORKFORCE_TYPES}
          value={classes}
          onChange={setClasses}
        />
        <CheckGroup
          label='Applicable locations'
          options={LOCATIONS}
          value={locations}
          onChange={setLocations}
        />
        <CheckGroup
          label='Applicable departments'
          options={DEPARTMENTS}
          value={departments}
          onChange={setDepartments}
        />
      </div>

      <p className='text-neutral-1600 mb-1 text-sm font-medium'>
        Applicable positions (shuttle) — mark critical ones as mandatory AD
      </p>
      <div className='mb-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3'>
        <div className='rounded-[6px] border border-gray-200 p-2'>
          <p className='text-neutral-1000 mb-1 text-xs'>Available positions</p>
          {available.map((p) => (
            <button
              key={p}
              type='button'
              onClick={() => setPickAvailable(p)}
              className={`block w-full rounded px-2 py-1 text-left text-sm ${
                pickAvailable === p
                  ? 'bg-blue-150 text-blue-1400'
                  : 'text-neutral-1900'
              }`}
            >
              {p}
            </button>
          ))}
          {available.length === 0 && (
            <p className='text-neutral-1000 px-2 py-1 text-sm'>None left</p>
          )}
        </div>
        <div className='flex flex-col gap-2'>
          <Button
            variant='outline'
            className='h-7 w-7 p-0'
            onClick={moveRight}
            disabled={!pickAvailable}
            aria-label='Move to selected'
          >
            <ArrowRight size={14} weight='bold' />
          </Button>
          <Button
            variant='outline'
            className='h-7 w-7 p-0'
            onClick={moveLeft}
            disabled={!pickSelected}
            aria-label='Move to available'
          >
            <ArrowLeft size={14} weight='bold' />
          </Button>
        </div>
        <div className='rounded-[6px] border border-gray-200 p-2'>
          <p className='text-neutral-1000 mb-1 text-xs'>
            Selected positions (check = mandatory AD account)
          </p>
          {selected.map((p) => (
            <div
              key={p}
              className={`flex items-center justify-between rounded px-2 py-1 ${
                pickSelected === p ? 'bg-blue-150' : ''
              }`}
            >
              <button
                type='button'
                onClick={() => setPickSelected(p)}
                className='text-neutral-1900 flex-1 text-left text-sm'
              >
                {p}
              </button>
              <label className='flex items-center gap-1 text-xs'>
                <Checkbox
                  variant='blue'
                  checked={mandatory.includes(p)}
                  onCheckedChange={(checked) =>
                    setMandatory((prev) =>
                      checked ? [...prev, p] : prev.filter((m) => m !== p)
                    )
                  }
                />
                Mandatory
              </label>
            </div>
          ))}
          {selected.length === 0 && (
            <p className='text-neutral-1000 px-2 py-1 text-sm'>
              No positions selected
            </p>
          )}
        </div>
      </div>

      {mandatory.length > 0 && (
        <p className='text-neutral-1000 mb-3 text-xs'>
          Onboarding an employee into{' '}
          {mandatory.map((m) => (
            <Badge key={m} variant='outline' className='mr-1'>
              {m}
            </Badge>
          ))}
          without an AD account will be flagged.
        </p>
      )}

      <Button className='h-7' onClick={save}>
        Save Active Directory configuration
      </Button>
    </div>
  )
}
