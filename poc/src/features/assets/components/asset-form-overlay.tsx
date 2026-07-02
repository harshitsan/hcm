import { useEffect, useMemo } from 'react'
import { z } from 'zod'
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
import { type Asset } from '../data/assets'
import { type AssetCategoryConfig } from '../data/config'
import { type AssetDraft } from '../hooks/use-assets'

interface AssetFormOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When set, the sheet edits this asset; otherwise it registers a new one. */
  asset?: Asset | null
  categories: AssetCategoryConfig[]
  /** Tenant-unique identity check (ASM-18). */
  isTagTaken: (tag: string, excludeId?: string) => boolean
  onSubmit: (draft: AssetDraft) => boolean
}

/**
 * Register / maintain an asset (ASM-11) with procurement + warranty
 * provenance (ASM-36). Category is mandatory and read from the current
 * effective taxonomy (ASM-01, ASM-19); tags must be tenant-unique (ASM-18).
 */
export function AssetFormOverlay({
  open,
  onOpenChange,
  asset,
  categories,
  isTagTaken,
  onSubmit,
}: AssetFormOverlayProps) {
  const isEdit = Boolean(asset)
  const activeCategories = categories.filter((c) => c.active)

  const schema = useMemo(
    () =>
      z.object({
        assetTag: z.string().min(2, 'Asset ID / tag is required'),
        serial: z.string().min(2, 'Serial number is required'),
        name: z.string().min(2, 'Asset name is required'),
        category: z.string().min(1, 'Select exactly one category — required to save'),
        vendor: z.string().min(2, 'Vendor is required'),
        poDate: z.string().min(1, 'Purchase order date is required'),
        warrantyMonths: z.coerce.number<number>().min(0, 'Warranty months must be 0 or more'),
        value: z.coerce.number<number>().min(1, 'Asset value is required'),
      }),
    []
  )

  type FormValues = z.infer<typeof schema>

  const emptyDraft: FormValues = {
    assetTag: '',
    serial: '',
    name: '',
    category: '',
    vendor: '',
    poDate: '',
    warrantyMonths: 24,
    value: 0,
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyDraft,
  })

  useEffect(() => {
    if (!open) return
    form.reset(
      asset
        ? {
            assetTag: asset.assetTag,
            serial: asset.serial,
            name: asset.name,
            category: asset.category,
            vendor: asset.vendor,
            poDate: asset.poDate,
            warrantyMonths: asset.warrantyMonths,
            value: asset.value,
          }
        : emptyDraft
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, asset, form])

  function handleSubmit(values: FormValues) {
    if (isTagTaken(values.assetTag, asset?.id)) {
      form.setError('assetTag', {
        message: `“${values.assetTag}” already exists in this company — asset IDs must be tenant-unique`,
      })
      return
    }
    const ok = onSubmit(values)
    if (ok) onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[460px]'>
        <SheetHeader className='border-grey-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            {isEdit ? 'Edit asset' : 'Register asset'}
          </SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className='flex min-h-0 flex-1 flex-col'>
            <div className='flex-1 space-y-4 overflow-y-auto px-5 py-5'>
              <div className='grid grid-cols-2 gap-3'>
                <FormField
                  control={form.control}
                  name='assetTag'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asset ID / tag</FormLabel>
                      <FormControl>
                        <Input placeholder='AST-0021' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='serial'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serial number</FormLabel>
                      <FormControl>
                        <Input placeholder='SN-XXXX-0000' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset name</FormLabel>
                    <FormControl>
                      <Input placeholder='MacBook Air 13"' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='category'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category (required)</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue placeholder='Choose exactly one category' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeCategories.map((c) => (
                          <SelectItem key={c.id} value={c.name}>
                            {c.name} ({c.code})
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
                name='vendor'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor</FormLabel>
                    <FormControl>
                      <Input placeholder='Ingram Micro' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-3 gap-3'>
                <FormField
                  control={form.control}
                  name='poDate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PO date</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='warrantyMonths'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Warranty (months)</FormLabel>
                      <FormControl>
                        <Input type='number' min={0} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='value'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Value (INR)</FormLabel>
                      <FormControl>
                        <Input type='number' min={0} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className='border-grey-200 flex items-center justify-end gap-3 border-t px-5 py-4'>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type='submit'>{isEdit ? 'Save changes' : 'Register asset'}</Button>
            </div>
          </form>
        </Form>
      </FloatingSheetContent>
    </Sheet>
  )
}
