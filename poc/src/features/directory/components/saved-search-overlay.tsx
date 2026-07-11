import { useEffect } from 'react'
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
import { type SavedSearch } from '../data/directory-config'
import { countActiveFilters, type DirectoryFilters } from '../data/filters'

const savedSearchSchema = z
  .object({
    mode: z.enum(['new', 'update']),
    name: z.string(),
    existingId: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.mode === 'new' && values.name.trim().length < 2) {
      ctx.addIssue({
        code: 'custom',
        path: ['name'],
        message: 'Give the search a name (min 2 characters)',
      })
    }
    if (values.mode === 'update' && !values.existingId) {
      ctx.addIssue({
        code: 'custom',
        path: ['existingId'],
        message: 'Pick a saved search to update',
      })
    }
  })

type SavedSearchFormValues = z.infer<typeof savedSearchSchema>

interface SavedSearchOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The criteria currently applied in advanced search. */
  filters: DirectoryFilters
  savedSearches: SavedSearch[]
  onCreate: (name: string, filters: DirectoryFilters) => void
  onUpdate: (id: string, filters: DirectoryFilters) => void
}

/**
 * Stores the current advanced-search criteria as a named saved search, or
 * overwrites an existing one with the current criteria (DIR-07).
 */
export function SavedSearchOverlay({
  open,
  onOpenChange,
  filters,
  savedSearches,
  onCreate,
  onUpdate,
}: SavedSearchOverlayProps) {
  const form = useForm<SavedSearchFormValues>({
    resolver: zodResolver(savedSearchSchema),
    defaultValues: { mode: 'new', name: '', existingId: '' },
  })

  const mode = form.watch('mode')

  useEffect(() => {
    if (open) form.reset({ mode: 'new', name: '', existingId: '' })
  }, [open, form])

  function handleSubmit(values: SavedSearchFormValues) {
    if (values.mode === 'update') {
      onUpdate(values.existingId, filters)
    } else {
      onCreate(values.name.trim(), filters)
    }
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[420px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            Save current search
          </SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='flex min-h-0 flex-1 flex-col'
          >
            <div className='flex-1 space-y-4 overflow-y-auto px-5 py-5'>
              <p className='text-neutral-1000 rounded-md border border-gray-200 p-2 text-xs'>
                {countActiveFilters(filters)} filter(s) will be captured.
                Applying this saved search later restores every criterion
                exactly.
              </p>

              <FormField
                control={form.control}
                name='mode'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Action</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='new'>
                          Create a new saved search
                        </SelectItem>
                        <SelectItem
                          value='update'
                          disabled={savedSearches.length === 0}
                        >
                          Update an existing saved search
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {mode === 'new' ? (
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Search name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='e.g. Hyderabad delivery team'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name='existingId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Saved search to update</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger variant='secondary' className='w-full'>
                            <SelectValue placeholder='Choose…' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {savedSearches.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
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

            <div className='border-gray-200 flex items-center justify-end gap-3 border-t px-5 py-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>
                {mode === 'update' ? 'Update search' : 'Save search'}
              </Button>
            </div>
          </form>
        </Form>
      </FloatingSheetContent>
    </Sheet>
  )
}
