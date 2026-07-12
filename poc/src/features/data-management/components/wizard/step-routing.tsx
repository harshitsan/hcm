import { type UseFormReturn } from 'react-hook-form'
import { CheckCircle, LockSimple } from 'phosphor-react'
import { type Role } from '@/context/role-context'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DATA_ENTITIES,
  IMPORT_FUNCTIONS,
  TIERS,
  TIER_HEADINGS,
  type Tier,
} from '../../data/catalog'
import { type FunctionToggle } from '../../data/config'
import { type MappingTemplate } from '../../data/mappings'
import { type TierGate } from '../../data/sequencing'
import { TierBadge } from '../badges'
import { allowedCompanies, scopeLabel } from '../scope'
import { type WizardValues } from './schema'

interface StepRoutingProps {
  form: UseFormReturn<WizardValues>
  role: Role
  functionToggles: FunctionToggle[]
  mappings: MappingTemplate[]
  /** Governed entity → tier classification (DM-17). */
  tierMap: Record<string, Tier>
  /** Dependency-sequencing gates derived from the import history. */
  gates: Record<Tier, TierGate>
}

/**
 * Step 1 — pick what to import from the tier-organized entity picker
 * (dependency sequencing enforced, FR 6.24.3), route to an import
 * function, pick the company context (tenant scope varies by role) and
 * choose between a fresh mapping or a previously saved one
 * (DM-21 / DM-31 / DM-10 / DM-11).
 */
export function StepRouting({
  form,
  role,
  functionToggles,
  mappings,
  tierMap,
  gates,
}: StepRoutingProps) {
  const entityId = form.watch('entityId')
  const functionId = form.watch('functionId')
  const companyId = form.watch('companyId')
  const mappingMode = form.watch('mappingMode')

  const companies = allowedCompanies(role)

  const entityTierOf = (id: string): Tier =>
    tierMap[id] ?? DATA_ENTITIES.find((e) => e.id === id)?.tier ?? 'Foundation'

  const availableFunctions = IMPORT_FUNCTIONS.filter((f) => {
    if (f.entityId !== entityId) return false
    const toggle = functionToggles.find((t) => t.functionId === f.id)
    if (!toggle?.enabled) return false
    if (companyId && toggle.hiddenForCompanyIds.includes(companyId))
      return false
    return true
  })

  const savedForFunction = mappings.filter((m) => m.functionId === functionId)

  const pickEntity = (id: string) => {
    form.setValue('entityId', id, { shouldValidate: true })
    form.setValue('functionId', '')
    form.setValue('module', '')
    form.setValue('savedMappingId', '')
  }

  return (
    <div className='space-y-4'>
      <FormField
        control={form.control}
        name='entityId'
        render={() => (
          <FormItem>
            <FormLabel>What are you importing?</FormLabel>
            <p className='text-paragraph-sm text-neutral-1000'>
              Imports follow the dependency order below — each tier opens once
              every tier before it has at least one completed import.
            </p>
            <div className='space-y-2.5'>
              {TIERS.map((tier) => {
                const gate = gates[tier]
                const entities = DATA_ENTITIES.filter(
                  (e) => entityTierOf(e.id) === tier
                )
                return (
                  <div
                    key={tier}
                    className={`rounded-[6px] border px-3 py-2.5 ${
                      gate.unlocked
                        ? 'border-gray-200'
                        : 'border-gray-200 bg-neutral-200/60'
                    }`}
                  >
                    <div className='mb-2 flex items-center gap-2'>
                      {gate.unlocked ? (
                        <CheckCircle
                          size={14}
                          weight='bold'
                          className='text-green-1300'
                        />
                      ) : (
                        <LockSimple
                          size={14}
                          weight='bold'
                          className='text-neutral-1000'
                        />
                      )}
                      <span className='text-neutral-1600 text-sm font-medium'>
                        {TIER_HEADINGS[tier]}
                      </span>
                      <TierBadge tier={tier} />
                    </div>
                    <div className='flex flex-wrap gap-2'>
                      {entities.map((e) => {
                        const selected = entityId === e.id
                        return (
                          <button
                            key={e.id}
                            type='button'
                            disabled={!gate.unlocked}
                            onClick={() => pickEntity(e.id)}
                            aria-pressed={selected}
                            className={`rounded-[6px] border px-2.5 py-1.5 text-sm transition-colors ${
                              selected
                                ? 'border-blue-400 ring-1 ring-blue-400'
                                : 'border-gray-200'
                            } ${
                              gate.unlocked
                                ? 'text-neutral-1600 hover:bg-gray-50'
                                : 'text-neutral-1000 cursor-not-allowed opacity-60'
                            }`}
                          >
                            {e.name}
                            <span className='text-paragraph-sm text-neutral-1000 ml-1.5'>
                              {e.kind}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                    {!gate.unlocked && gate.reason && (
                      <p className='text-paragraph-sm text-neutral-1000 mt-2'>
                        {gate.reason}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name='functionId'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Select import function</FormLabel>
            <Select
              value={field.value}
              onValueChange={(v) => {
                field.onChange(v)
                const fn = IMPORT_FUNCTIONS.find((f) => f.id === v)
                form.setValue('module', fn?.module ?? '', {
                  shouldValidate: true,
                })
                form.setValue('savedMappingId', '')
              }}
              disabled={!entityId}
            >
              <FormControl>
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue
                    placeholder={
                      entityId
                        ? 'Choose an import function'
                        : 'Pick an entity above first'
                    }
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {availableFunctions.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name} — {f.module}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name='companyId'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Company / project context</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue placeholder='Scope the import to a company' />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} — {c.group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className='text-paragraph-sm text-neutral-1000'>
              Your scope as {role}: {scopeLabel(role)}. Records are written only
              within this tenant (row-level security).
            </p>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name='mappingMode'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Field mapping</FormLabel>
            <FormControl>
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                className='flex gap-6'
              >
                <label className='flex items-center gap-2 text-sm'>
                  <RadioGroupItem value='new' /> Create new
                </label>
                <label className='flex items-center gap-2 text-sm'>
                  <RadioGroupItem value='saved' /> Use from saved mapping
                </label>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {mappingMode === 'saved' && (
        <FormField
          control={form.control}
          name='savedMappingId'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Saved mapping</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger variant='secondary' className='w-full'>
                    <SelectValue
                      placeholder={
                        savedForFunction.length
                          ? 'Pick a saved mapping'
                          : 'No saved mappings for this function'
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {savedForFunction.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  )
}
