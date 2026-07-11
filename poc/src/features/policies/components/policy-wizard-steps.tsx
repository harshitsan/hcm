import { type UseFormReturn } from 'react-hook-form'
import { Checkbox } from '@/components/ui/checkbox'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  COMPANIES,
  DEPARTMENTS,
  EMPLOYMENT_TYPES,
  JURISDICTIONS,
  LINKED_MODULES,
  LOCATIONS,
  ORG_GROUPS,
  OWNER_LEVELS,
  POLICY_CATEGORIES,
  POLICY_TYPES,
  PORTFOLIO_NAME,
  POSITION_LEVELS,
} from '../data/policies'
import { type WizardValues } from './policy-wizard-schema'

interface CheckboxGroupProps {
  label: string
  options: readonly string[]
  value: string[]
  onChange: (next: string[]) => void
  hint?: string
}

/** Multi-select checkbox grid; leaving everything unticked = no restriction. */
export function CheckboxGroup({ label, options, value, onChange, hint }: CheckboxGroupProps) {
  const toggle = (option: string, checked: boolean) => {
    onChange(checked ? [...value, option] : value.filter((v) => v !== option))
  }
  return (
    <div className='space-y-1.5'>
      <p className='text-neutral-1600 text-sm font-medium'>{label}</p>
      {hint && <p className='text-paragraph-sm text-neutral-1000'>{hint}</p>}
      <div className='grid grid-cols-2 gap-x-3 gap-y-1.5'>
        {options.map((option) => (
          <label key={option} className='flex cursor-pointer items-center gap-2'>
            <Checkbox
              variant='blue'
              checked={value.includes(option)}
              onCheckedChange={(checked) => toggle(option, !!checked)}
            />
            <span className='text-neutral-1900 text-sm'>{option}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

export interface StepProps {
  form: UseFormReturn<WizardValues>
}

export function DetailsStep({ form }: StepProps) {
  const ownerLevel = form.watch('ownerLevel')
  const ownerOptions =
    ownerLevel === 'Company'
      ? COMPANIES
      : ownerLevel === 'Group'
        ? ORG_GROUPS
        : ([PORTFOLIO_NAME] as const)
  return (
    <div className='space-y-4'>
      <FormField
        control={form.control}
        name='name'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Policy name</FormLabel>
            <FormControl>
              <Input placeholder='Employee Manual' {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name='editionName'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Edition / version name</FormLabel>
            <FormControl>
              <Input placeholder='e.g. Employee Manual 2026' {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className='grid grid-cols-2 gap-3'>
        <FormField
          control={form.control}
          name='type'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Policy type</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger variant='secondary' className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {POLICY_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t} Policy
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
          name='category'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger variant='secondary' className='w-full'>
                    <SelectValue placeholder='Select category' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {POLICY_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className='grid grid-cols-2 gap-3'>
        <FormField
          control={form.control}
          name='ownerLevel'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Owner level</FormLabel>
              <Select
                value={field.value}
                onValueChange={(v) => {
                  field.onChange(v)
                  form.setValue('ownerName', '')
                }}
              >
                <FormControl>
                  <SelectTrigger variant='secondary' className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {OWNER_LEVELS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}-level
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
          name='ownerName'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Owned by</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger variant='secondary' className='w-full'>
                    <SelectValue placeholder='Select owner' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ownerOptions.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name='content'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Policy content / body</FormLabel>
            <FormControl>
              <Textarea
                rows={5}
                placeholder='Write the policy body employees will read…'
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name='linkedModules'
        render={({ field }) => (
          <FormItem>
            <CheckboxGroup
              label='Integrated modules'
              hint='Processes in these modules consume the in-force version of this policy automatically.'
              options={LINKED_MODULES}
              value={field.value}
              onChange={field.onChange}
            />
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

export function ApplicabilityStep({ form }: StepProps) {
  return (
    <div className='space-y-4'>
      <p className='text-paragraph-sm text-neutral-1000'>
        Leave a dimension empty for no restriction. When several are set, only
        workers matching <span className='font-medium'>all</span> of them inherit
        the policy.
      </p>
      <FormField
        control={form.control}
        name='workerKinds'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Worker type applicability</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value='both'>Employees & contractors</SelectItem>
                <SelectItem value='employees'>Employees only</SelectItem>
                <SelectItem value='contractors'>Contractors only</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      {(
        [
          ['companies', 'Companies', COMPANIES],
          ['groups', 'Org groups', ORG_GROUPS],
          ['jurisdictions', 'Jurisdictions', JURISDICTIONS],
          ['locations', 'Locations', LOCATIONS],
          ['departments', 'Departments', DEPARTMENTS],
          ['employmentTypes', 'Employment types', EMPLOYMENT_TYPES],
          ['positionLevels', 'Included position levels', POSITION_LEVELS],
        ] as const
      ).map(([name, label, options]) => (
        <FormField
          key={name}
          control={form.control}
          name={name}
          render={({ field }) => (
            <FormItem>
              <CheckboxGroup
                label={label}
                options={options}
                value={field.value}
                onChange={field.onChange}
              />
              <FormMessage />
            </FormItem>
          )}
        />
      ))}
    </div>
  )
}
