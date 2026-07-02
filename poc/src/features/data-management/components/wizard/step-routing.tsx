import { type UseFormReturn } from 'react-hook-form'
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
  IMPORT_FUNCTIONS,
  IMPORT_MODULES,
  entityById,
} from '../../data/catalog'
import { type FunctionToggle } from '../../data/config'
import { type MappingTemplate } from '../../data/mappings'
import { TierBadge } from '../badges'
import { allowedCompanies, scopeLabel } from '../scope'
import { type WizardValues } from './schema'

interface StepRoutingProps {
  form: UseFormReturn<WizardValues>
  role: Role
  functionToggles: FunctionToggle[]
  mappings: MappingTemplate[]
}

/**
 * Step 1 — route the import by module → function, pick the company
 * context (tenant scope varies by role) and choose between a fresh
 * mapping or a previously saved one (DM-21 / DM-31 / DM-10 / DM-11).
 */
export function StepRouting({
  form,
  role,
  functionToggles,
  mappings,
}: StepRoutingProps) {
  const module = form.watch('module')
  const functionId = form.watch('functionId')
  const companyId = form.watch('companyId')
  const mappingMode = form.watch('mappingMode')

  const companies = allowedCompanies(role)

  const availableFunctions = IMPORT_FUNCTIONS.filter((f) => {
    if (f.module !== module) return false
    const toggle = functionToggles.find((t) => t.functionId === f.id)
    if (!toggle?.enabled) return false
    if (companyId && toggle.hiddenForCompanyIds.includes(companyId))
      return false
    return true
  })

  const selectedFn = IMPORT_FUNCTIONS.find((f) => f.id === functionId)
  const entity = selectedFn ? entityById(selectedFn.entityId) : undefined
  const savedForFunction = mappings.filter((m) => m.functionId === functionId)

  return (
    <div className='space-y-4'>
      <FormField
        control={form.control}
        name='module'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Select module</FormLabel>
            <Select
              value={field.value}
              onValueChange={(v) => {
                field.onChange(v)
                form.setValue('functionId', '')
              }}
            >
              <FormControl>
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue placeholder='Choose a functional area' />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {IMPORT_MODULES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
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
        name='functionId'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Select function</FormLabel>
            <Select
              value={field.value}
              onValueChange={(v) => {
                field.onChange(v)
                form.setValue('savedMappingId', '')
              }}
              disabled={!module}
            >
              <FormControl>
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue
                    placeholder={
                      module
                        ? 'Choose an import function'
                        : 'Select a module first'
                    }
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {availableFunctions.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {entity && (
        <div className='bg-blue-150 flex items-center gap-2 rounded-[6px] px-3 py-2 text-sm'>
          <span className='text-neutral-1900'>Target entity:</span>
          <span className='text-neutral-1600 font-medium'>{entity.name}</span>
          <TierBadge tier={entity.tier} />
          <span className='text-neutral-1000 text-paragraph-sm'>
            {entity.kind} data
          </span>
        </div>
      )}

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
