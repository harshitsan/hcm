import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import {
  Form,
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
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { JURISDICTION_TYPES, type Jurisdiction } from '../data/jurisdictions'
import { type JurisdictionDraft } from '../hooks/use-jurisdictions'
import {
  emptyJurisdictionDraft,
  jurisdictionFormSchema,
  type JurisdictionFormValues,
} from './jurisdiction-form-schema'
import { TaxFeeFields } from './tax-fee-fields'

interface JurisdictionOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When set, the sheet edits this catalog entry; otherwise creates one. */
  jurisdiction?: Jurisdiction | null
  /** Duplicate guard from the store — name+type must be unique (JUR-01). */
  isDuplicate: (
    name: string,
    type: Jurisdiction['type'],
    excludeId?: string
  ) => boolean
  onSubmit: (draft: JurisdictionDraft) => void
}

/**
 * Metadata-driven create/edit form (JUR-01/02/03/04/15): a jurisdiction is a
 * flat catalog entry — no parent field, any type — with optional tax & fee
 * applicability rows.
 */
export function JurisdictionOverlay({
  open,
  onOpenChange,
  jurisdiction,
  isDuplicate,
  onSubmit,
}: JurisdictionOverlayProps) {
  const isEdit = Boolean(jurisdiction)
  const form = useForm<JurisdictionFormValues>({
    resolver: zodResolver(jurisdictionFormSchema),
    defaultValues: emptyJurisdictionDraft,
  })

  useEffect(() => {
    if (!open) return
    form.reset(
      jurisdiction
        ? {
            name: jurisdiction.name,
            code: jurisdiction.code,
            type: jurisdiction.type,
            status: jurisdiction.status,
            effectiveFrom: jurisdiction.effectiveFrom,
            taxFees: jurisdiction.taxFees,
          }
        : emptyJurisdictionDraft
    )
  }, [open, jurisdiction, form])

  function handleSubmit(values: JurisdictionFormValues) {
    if (isDuplicate(values.name, values.type, jurisdiction?.id)) {
      form.setError('name', {
        message: `A ${values.type.toLowerCase()} named “${values.name}” already exists in the catalog`,
      })
      return
    }
    onSubmit(values)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[520px]'>
        <SheetHeader className='border-grey-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            {isEdit ? 'Edit jurisdiction' : 'New jurisdiction'}
          </SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='flex min-h-0 flex-1 flex-col'
          >
            <div className='flex-1 space-y-4 overflow-y-auto px-5 py-5'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='e.g. Netherlands, Texas, Pune'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-2 gap-3'>
                <FormField
                  control={form.control}
                  name='code'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code</FormLabel>
                      <FormControl>
                        <Input placeholder='NL' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='type'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger variant='secondary' className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {JURISDICTION_TYPES.map((t) => (
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
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <FormField
                  control={form.control}
                  name='effectiveFrom'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Effective from</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='status'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='active'>Active</SelectItem>
                          <SelectItem value='inactive'>Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <p className='text-paragraph-sm text-neutral-1000'>
                Catalog entries are flat — no parent country/state chain is
                required, whatever the type. Saving an edit records a new
                effective-dated version in the entry's history.
              </p>

              <TaxFeeFields form={form} />
            </div>

            <div className='border-grey-200 flex items-center justify-end gap-3 border-t px-5 py-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>
                {isEdit ? 'Save changes' : 'Add to catalog'}
              </Button>
            </div>
          </form>
        </Form>
      </FloatingSheetContent>
    </Sheet>
  )
}
