import { type UseFormReturn } from 'react-hook-form'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  FIELD_SCOPES,
  FIELD_TYPE_LABELS,
  FIELD_TYPES,
  SUPPORTED_ENTITIES,
  type FieldScope,
} from '../data/custom-fields'
import {
  hasConfigurableOptions,
  type FieldWizardValues,
} from './field-wizard-schema'

interface StepProps {
  form: UseFormReturn<FieldWizardValues>
}

/**
 * Row-based option editor for dropdown / radio / multi-select fields.
 * Rows are stored newline-joined in `optionsText` so the schema stays flat.
 */
function OptionRowsEditor({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const rows = value === '' ? [''] : value.split('\n')
  const commit = (next: string[]) => onChange(next.join('\n'))
  return (
    <div className='space-y-2'>
      {rows.map((row, i) => (
        <div key={i} className='flex items-center gap-2'>
          <Input
            value={row}
            placeholder={`Option ${i + 1}`}
            aria-label={`Option ${i + 1}`}
            onChange={(e) => {
              const next = [...rows]
              next[i] = e.target.value.replace(/\n/g, '')
              commit(next)
            }}
          />
          <Button
            type='button'
            variant='outline'
            size='icon'
            aria-label={`Remove option ${i + 1}`}
            disabled={rows.length === 1}
            onClick={() => commit(rows.filter((_, idx) => idx !== i))}
          >
            <X className='size-3.5' />
          </Button>
        </div>
      ))}
      <Button
        type='button'
        variant='outline'
        size='sm'
        onClick={() => commit([...rows, ''])}
      >
        <Plus className='size-3.5' />
        Add option
      </Button>
    </div>
  )
}

/** Step 1 — name, supported entity, scope level, description. */
export function StepBasics({
  form,
  allowedScopes,
}: StepProps & { allowedScopes: FieldScope[] }) {
  return (
    <>
      <FormField
        control={form.control}
        name='name'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Field name</FormLabel>
            <FormControl>
              <Input placeholder='e.g. Locker Number' {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name='entity'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Entity to extend</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {SUPPORTED_ENTITIES.map((e) => (
                  <SelectItem key={e} value={e}>
                    {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className='text-paragraph-sm text-neutral-1000'>
              Only the six supported core entities can be extended.
            </p>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name='scope'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Scope level</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {FIELD_SCOPES.map((s) => (
                  <SelectItem
                    key={s}
                    value={s}
                    disabled={!allowedScopes.includes(s)}
                  >
                    {s}
                    {!allowedScopes.includes(s) && ' (not permitted for your role)'}
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
        name='description'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder='What this field captures and why'
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}

/** Step 2 — data type plus type-specific configuration. */
export function StepType({ form }: StepProps) {
  const type = form.watch('type')
  return (
    <>
      <FormField
        control={form.control}
        name='type'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Data type</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {FIELD_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {FIELD_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className='text-paragraph-sm text-neutral-1000'>
              Input is validated, stored, and displayed per the selected type.
            </p>
            <FormMessage />
          </FormItem>
        )}
      />
      {hasConfigurableOptions(type) && (
        <FormField
          control={form.control}
          name='optionsText'
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Options ({type === 'multi-select' ? 'pick many' : 'pick one'})
              </FormLabel>
              <FormControl>
                <OptionRowsEditor
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <p className='text-paragraph-sm text-neutral-1000'>
                Users can only choose configured options — no free-form entry.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
      {type === 'lookup' && (
        <FormField
          control={form.control}
          name='lookupEntity'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lookup target entity</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger variant='secondary' className='w-full'>
                    <SelectValue placeholder='Choose target entity' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {SUPPORTED_ENTITIES.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className='text-paragraph-sm text-neutral-1000'>
                Values resolve to a referenced record of this entity.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
      {type === 'file' && (
        <p className='text-paragraph-sm text-neutral-1000 rounded-md border border-gray-200 bg-white p-3'>
          Users will upload a document into this field; attachments stay
          available to view or download from the record.
        </p>
      )}
    </>
  )
}

/** Step 3 — required, Is Default, mask, regex, effective date. */
export function StepBehaviors({ form }: StepProps) {
  return (
    <>
      <FormField
        control={form.control}
        name='required'
        render={({ field }) => (
          <FormItem className='flex flex-row items-center justify-between rounded-md border border-gray-200 bg-white p-3'>
            <div>
              <FormLabel>Mandatory</FormLabel>
              <p className='text-paragraph-sm text-neutral-1000'>
                Saves are blocked when this field is empty.
              </p>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name='isDefault'
        render={({ field }) => (
          <FormItem className='flex flex-row items-center justify-between rounded-md border border-gray-200 bg-white p-3'>
            <div>
              <FormLabel>Is Default</FormLabel>
              <p className='text-paragraph-sm text-neutral-1000'>
                Show on the standard form out of the box.
              </p>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name='mask'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Field mask (optional)</FormLabel>
            <FormControl>
              <Input placeholder='e.g. ACM-#### (# = digit)' {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name='regex'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Regex validation (optional)</FormLabel>
            <FormControl>
              <Input placeholder='e.g. ^ACM-\d{4}$' {...field} />
            </FormControl>
            <p className='text-paragraph-sm text-neutral-1000'>
              The mask shapes input; the regex validates the final value.
            </p>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name='effectiveDate'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Effective date</FormLabel>
            <FormControl>
              <Input type='date' {...field} />
            </FormControl>
            <p className='text-paragraph-sm text-neutral-1000'>
              Future dates schedule the definition change; prior saves keep the
              earlier version.
            </p>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}

const AUDIENCES = [
  { label: 'HR', view: 'permissions.hrView', edit: 'permissions.hrEdit' },
  {
    label: 'Reporting Manager',
    view: 'permissions.managerView',
    edit: 'permissions.managerEdit',
  },
  {
    label: 'Employee',
    view: 'permissions.employeeView',
    edit: 'permissions.employeeEdit',
  },
] as const

/** Step 4 — per-audience View/Edit permission matrix. */
export function StepPermissions({ form }: StepProps) {
  const grantHrFull = () => {
    form.setValue('permissions.hrView', true)
    form.setValue('permissions.hrEdit', true)
  }
  return (
    <>
      <div className='flex items-center justify-between'>
        <p className='text-paragraph-sm text-neutral-1000'>
          Toggle View and Edit independently per audience.
        </p>
        <Button type='button' variant='outline' size='sm' onClick={grantHrFull}>
          Grant HR full access
        </Button>
      </div>
      <div className='overflow-hidden rounded-md border border-gray-200 bg-white'>
        <div className='text-paragraph-sm grid grid-cols-3 gap-2 border-b border-gray-200 px-3 py-2 font-medium'>
          <span>Audience</span>
          <span>View</span>
          <span>Edit</span>
        </div>
        {AUDIENCES.map((aud) => (
          <div
            key={aud.label}
            className='grid grid-cols-3 items-center gap-2 border-b border-gray-100 px-3 py-2 last:border-b-0'
          >
            <span className='text-sm font-medium'>{aud.label}</span>
            <FormField
              control={form.control}
              name={aud.view}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked)
                    // Removing View also removes Edit.
                    if (!checked) form.setValue(aud.edit, false)
                  }}
                  aria-label={`${aud.label} view`}
                />
              )}
            />
            <FormField
              control={form.control}
              name={aud.edit}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked)
                    // Edit implies View.
                    if (checked) form.setValue(aud.view, true)
                  }}
                  aria-label={`${aud.label} edit`}
                />
              )}
            />
          </div>
        ))}
      </div>
      <p className='text-paragraph-sm text-neutral-1000'>
        View without Edit renders the field read-only; no View hides it
        entirely for that audience.
      </p>
    </>
  )
}
