import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowsClockwise, ImageSquare, PencilSimple, Plus, Trash } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EVENT_BASES, type AnnouncementImage } from '../data/announcements'
import {
  type AnnouncementSettingsStore,
  type ImageDraft,
} from '../hooks/use-announcement-settings'

const EVENT_TYPES = EVENT_BASES.filter((b) => b !== 'None')

const imageSchema = z.object({
  name: z.string().min(3, 'Upload an image or enter its file name'),
  url: z.url('Enter a valid URL').or(z.literal('')),
  eventType: z.enum(EVENT_TYPES),
  years: z.coerce
    .number<number>()
    .int('Years must be a whole number')
    .min(0, 'Years cannot be negative')
    .max(60, 'Years must be 60 or less'),
})

type ImageFormValues = z.infer<typeof imageSchema>

const emptyImage: ImageFormValues = {
  name: '',
  url: '',
  eventType: 'Service Anniversary',
  years: 1,
}

interface ImagesTabProps {
  settings: AnnouncementSettingsStore
}

/**
 * Announcement image library (ANN-32/33): each entry maps a visual to an
 * event type and milestone years so automated greetings pick the right image.
 */
export function ImagesTab({ settings }: ImagesTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<AnnouncementImage | null>(null)

  const form = useForm<ImageFormValues>({
    resolver: zodResolver(imageSchema),
    defaultValues: emptyImage,
  })

  useEffect(() => {
    if (!dialogOpen) return
    form.reset(
      editing
        ? {
            name: editing.name,
            url: editing.url,
            eventType: editing.eventType,
            years: editing.years,
          }
        : emptyImage
    )
  }, [dialogOpen, editing, form])

  const handleSubmit = (values: ImageFormValues) => {
    const draft: ImageDraft = values
    if (editing) {
      settings.updateImage(editing.id, draft)
    } else {
      settings.addImage(draft)
    }
    setDialogOpen(false)
    setEditing(null)
  }

  return (
    <div className='w-full'>
      <div className='mb-3 flex items-center justify-between'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          Announcement Images ({settings.images.length})
        </h2>
        <div className='flex items-center gap-3'>
          <Button
            variant='icon2'
            onClick={settings.refreshImages}
            className='text-neutral-1900 h-7 w-7'
            aria-label='Refresh'
          >
            <ArrowsClockwise size={16} weight='bold' />
          </Button>
          <Button
            variant='red'
            onClick={() => {
              setEditing(null)
              setDialogOpen(true)
            }}
            className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
          >
            <Plus size={10} weight='bold' />
            Add new announcement images
          </Button>
        </div>
      </div>

      <div className='border-grey-200 overflow-hidden rounded-[6px] border bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Event type</TableHead>
              <TableHead>Years</TableHead>
              <TableHead>Last updated</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {settings.images.map((img) => (
              <TableRow key={img.id}>
                <TableCell>
                  <div className='flex items-center gap-2'>
                    <div className='bg-blue-150 flex size-8 items-center justify-center rounded-[6px]'>
                      <ImageSquare size={16} className='text-blue-1400' />
                    </div>
                    <div className='flex min-w-0 flex-col'>
                      <span className='text-neutral-1600 text-sm font-medium'>
                        {img.name}
                      </span>
                      {img.url && (
                        <span className='text-paragraph-sm text-neutral-1000 max-w-[280px] truncate'>
                          {img.url}
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={img.eventType === 'Date of Birth' ? 'open' : 'booked'}>
                    {img.eventType}
                  </Badge>
                </TableCell>
                <TableCell className='text-neutral-1900 text-sm'>
                  {img.years} {img.years === 1 ? 'year' : 'years'}
                </TableCell>
                <TableCell className='text-neutral-1000 text-sm'>
                  {img.updatedAt}
                </TableCell>
                <TableCell>
                  <div className='flex items-center justify-end gap-2'>
                    <Button
                      variant='icon2'
                      className='text-neutral-1900 h-7 w-7'
                      aria-label={`Edit ${img.name}`}
                      onClick={() => {
                        setEditing(img)
                        setDialogOpen(true)
                      }}
                    >
                      <PencilSimple size={14} weight='fill' />
                    </Button>
                    <Button
                      variant='icon2'
                      className='text-neutral-1900 h-7 w-7'
                      aria-label={`Delete ${img.name}`}
                      onClick={() => settings.deleteImage(img.id)}
                    >
                      <Trash size={14} weight='bold' />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditing(null)
        }}
      >
        <DialogContent className='sm:max-w-[420px]'>
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Edit announcement image' : 'Add announcement image'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-4'>
              <FormItem>
                <FormLabel>Upload image (browse)</FormLabel>
                <FormControl>
                  <Input
                    type='file'
                    accept='image/*'
                    onChange={(e) => {
                      const fileName = e.target.files?.[0]?.name
                      if (fileName) {
                        form.setValue('name', fileName, { shouldValidate: true })
                      }
                    }}
                  />
                </FormControl>
              </FormItem>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image name</FormLabel>
                    <FormControl>
                      <Input placeholder='anniversary-20yr-diamond.png' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='url'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL (optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='https://assets.aster.dev/announcements/…'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='eventType'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EVENT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
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
                name='years'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Years (milestone)</FormLabel>
                    <FormControl>
                      <Input type='number' min={0} max={60} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='flex items-center justify-end gap-3'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type='submit'>{editing ? 'Save changes' : 'Add image'}</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
