import { useEffect, useMemo } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { COMPANIES, GROUP_NAME, type LocationShare } from '../data/locations'
import type { LocationsStore } from '../hooks/use-locations'
import { todayISO } from '../utils/format'

const shareFormSchema = z.object({
  locationId: z.string().min(1, 'Select the owned location to share'),
  targetCompanyIds: z
    .array(z.string())
    .min(1, 'Select at least one group company to share with'),
})

type ShareFormValues = z.infer<typeof shareFormSchema>

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  store: LocationsStore
  /** When set, edits this sharing configuration (creates a new version). */
  share?: LocationShare | null
  actor: string
}

/**
 * Explicit sharing configuration (LOC-04/05/13): pick an owned location and
 * choose target companies inside the same group (companies outside the
 * group-company structure are visibly blocked, LOC-07). The effective date is
 * stamped automatically — today for a new share, unchanged when editing.
 */
export function ShareDialog({ open, onOpenChange, store, share, actor }: ShareDialogProps) {
  const isEdit = Boolean(share)

  const form = useForm<ShareFormValues>({
    resolver: zodResolver(shareFormSchema),
    defaultValues: { locationId: '', targetCompanyIds: [] },
  })

  useEffect(() => {
    if (!open) return
    form.reset(
      share
        ? {
            locationId: share.locationId,
            targetCompanyIds: share.targetCompanyIds,
          }
        : { locationId: '', targetCompanyIds: [] }
    )
  }, [open, share, form])

  const locationId = form.watch('locationId')
  const owner = useMemo(() => {
    const location = store.locationById.get(locationId)
    return location ? COMPANIES.find((c) => c.id === location.companyId) : undefined
  }, [locationId, store.locationById])

  function handleSubmit(values: ShareFormValues) {
    // Effective date is auto-stamped: keep the existing one when editing,
    // otherwise the share takes effect today.
    const effectiveFrom = share?.effectiveFrom ?? todayISO()
    store.enableShare(values.locationId, values.targetCompanyIds, effectiveFrom, actor)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[480px]'>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit sharing configuration' : 'New sharing configuration'}
          </DialogTitle>
          <DialogDescription>
            Sharing is explicit and versioned. Ownership always remains with the
            originating company; other companies only hold a reference.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='locationId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location to share</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isEdit}
                  >
                    <FormControl>
                      <SelectTrigger variant='secondary' className='w-full'>
                        <SelectValue placeholder='Select an owned location' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {store.locations.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.name} — owned by {store.companyName(l.companyId)}
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
              name='targetCompanyIds'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Share with group companies</FormLabel>
                  <div className='space-y-2 rounded-[6px] border border-gray-200 p-3'>
                    {COMPANIES.filter((c) => c.id !== owner?.id).map((company) => {
                      const inGroup = Boolean(
                        owner?.groupId && company.groupId === owner.groupId
                      )
                      const checked = field.value.includes(company.id)
                      return (
                        <label
                          key={company.id}
                          className={`flex items-center gap-2 text-sm ${
                            inGroup ? 'text-neutral-1600' : 'text-neutral-1000'
                          }`}
                        >
                          <Checkbox
                            variant='blue'
                            checked={checked}
                            disabled={!inGroup || !owner}
                            onCheckedChange={(value) =>
                              field.onChange(
                                value
                                  ? [...field.value, company.id]
                                  : field.value.filter((id) => id !== company.id)
                              )
                            }
                          />
                          <span>{company.name}</span>
                          {owner && !inGroup && (
                            <span className='text-paragraph-sm text-red-1400'>
                              Outside {owner.groupId ? GROUP_NAME : 'any group'} — sharing blocked
                            </span>
                          )}
                        </label>
                      )
                    })}
                  </div>
                  <FormDescription>
                    Only companies in the same group-company structure as the
                    owner can be selected. No location is shared implicitly.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type='submit'>
                {isEdit ? 'Save new version' : 'Enable sharing'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
