import { useFieldArray, type UseFormReturn } from 'react-hook-form'
import { Plus, Trash } from 'phosphor-react'
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
import { TAX_FEE_KINDS, TAX_FEE_SCOPES } from '../data/jurisdictions'
import { type JurisdictionFormValues } from './jurisdiction-form-schema'

interface TaxFeeFieldsProps {
  form: UseFormReturn<JurisdictionFormValues>
}

/**
 * Optional tax & fee applicability lines on a jurisdiction (JUR-04): an
 * empty list means the jurisdiction is treated as "not configured".
 */
export function TaxFeeFields({ form }: TaxFeeFieldsProps) {
  const taxFeeArray = useFieldArray({ control: form.control, name: 'taxFees' })

  return (
    <div className='border-gray-200 space-y-3 border-t pt-4'>
      <div className='flex items-center justify-between'>
        <p className='text-neutral-1600 text-sm font-medium'>
          Tax & fee applicability (optional)
        </p>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={() =>
            taxFeeArray.append({
              id: `tf-${crypto.randomUUID().slice(0, 8)}`,
              name: '',
              kind: 'Tax',
              rate: '',
              appliesTo: TAX_FEE_SCOPES[0],
            })
          }
        >
          <Plus size={12} weight='bold' /> Add line
        </Button>
      </div>
      {taxFeeArray.fields.length === 0 && (
        <p className='text-paragraph-sm text-neutral-1000'>
          None configured — this jurisdiction will be treated as “tax/fee not
          configured” wherever it is used.
        </p>
      )}
      {taxFeeArray.fields.map((row, index) => (
        <div
          key={row.id}
          className='space-y-2 rounded-md border border-gray-200 p-3'
        >
          <div className='grid grid-cols-[1fr_110px_32px] items-end gap-2'>
            <FormField
              control={form.control}
              name={`taxFees.${index}.name`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax / fee name</FormLabel>
                  <FormControl>
                    <Input placeholder='e.g. GST' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`taxFees.${index}.kind`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kind</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className='w-full'>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TAX_FEE_KINDS.map((k) => (
                        <SelectItem key={k} value={k}>
                          {k}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <Button
              type='button'
              variant='icon2'
              className='text-neutral-1900 h-8 w-8'
              aria-label='Remove line'
              onClick={() => taxFeeArray.remove(index)}
            >
              <Trash size={14} weight='bold' />
            </Button>
          </div>
          <div className='grid grid-cols-2 gap-2'>
            <FormField
              control={form.control}
              name={`taxFees.${index}.rate`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate / amount</FormLabel>
                  <FormControl>
                    <Input placeholder='18%' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`taxFees.${index}.appliesTo`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Applies to</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className='w-full'>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TAX_FEE_SCOPES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
