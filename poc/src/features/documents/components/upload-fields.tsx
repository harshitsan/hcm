import { type UseFormReturn } from 'react-hook-form'
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
import { ENTITY_MODULE, ENTITY_TYPES } from '../data/documents'
import { type DocumentType } from '../data/masters'
import { type UploadFormValues } from './upload-schema'

interface UploadFieldsProps {
  form: UseFormReturn<UploadFormValues>
  mode: 'admin' | 'self'
  companies: string[]
  uploadableCategories: string[]
  documentTypes: DocumentType[]
}

/**
 * Metadata fields for the upload form: entity association (admin mode only),
 * category from the tenant taxonomy filtered by upload permission
 * (DOC-08/16/18), module-scoped document type (DOC-23), and optional expiry
 * date (DOC-06/07).
 */
export function UploadFields({
  form,
  mode,
  companies,
  uploadableCategories,
  documentTypes,
}: UploadFieldsProps) {
  const entityType = form.watch('entityType')
  const typeOptions = documentTypes.filter((t) =>
    t.modules.includes(ENTITY_MODULE[entityType])
  )

  return (
    <>
      <FormField
        control={form.control}
        name='name'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Document name</FormLabel>
            <FormControl>
              <Input placeholder='e.g. Trade License 2026' {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {mode === 'admin' && (
        <>
          <FormField
            control={form.control}
            name='entityType'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Entity</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger variant='secondary' className='w-full'>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ENTITY_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
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
            name='entityName'
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {entityType === 'Company'
                    ? 'Company entity'
                    : `${entityType} name`}
                </FormLabel>
                <FormControl>
                  <Input placeholder='Record the file belongs to' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='company'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tenant company</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger variant='secondary' className='w-full'>
                      <SelectValue placeholder='Select company' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {companies.map((c) => (
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
        </>
      )}

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
                {uploadableCategories.map((c) => (
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

      <FormField
        control={form.control}
        name='documentType'
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Document type{' '}
              <span className='text-paragraph-sm text-neutral-1000 font-normal'>
                ({ENTITY_MODULE[entityType]} module)
              </span>
            </FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue placeholder='Select type' />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {typeOptions.map((t) => (
                  <SelectItem key={t.id} value={t.name}>
                    {t.name}
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
        name='expiryDate'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Expiry date (optional)</FormLabel>
            <FormControl>
              <Input type='date' {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}
