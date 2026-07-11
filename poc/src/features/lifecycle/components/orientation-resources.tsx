import { useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { PencilSimple, Plus } from 'phosphor-react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { Textarea } from '@/components/ui/textarea'
import { DataTable } from '@/components/common/data-table/table'
import {
  ORIENTATION_TOPICS,
  RESOURCE_TYPES,
  type PhysicalResource,
  type PresenterPanel,
} from '../data/orientation'
import { DEPARTMENTS, LOCATIONS } from '../data/shared'
import { type OrientationStore } from '../hooks/use-orientation'
import { SortHeader } from './columns-shared'
import { CheckboxGroup, ChipList } from './config-widgets'
import { PagerBar, RefreshButton, usePager } from './orientation-widgets'

/* ------------------------------ Physical Resources ------------------------ */

const resourceSchema = z.object({
  resource: z.string().min(2, 'Resource name is required'),
  type: z.enum(RESOURCE_TYPES),
  location: z.string().min(1),
  capacity: z.string().regex(/^[1-9]\d*$/, 'Capacity must be a positive number'),
  contactPerson: z.string().min(2, 'Contact person is required'),
  department: z.string().min(1),
  mobile: z.string().min(8, 'Mobile number is required'),
  email: z.string().email('Enter a valid email'),
})

type ResourceValues = z.infer<typeof resourceSchema>

const emptyResource: ResourceValues = {
  resource: '',
  type: 'Conference Room',
  location: 'Hyderabad',
  capacity: '20',
  contactPerson: '',
  department: 'Operations',
  mobile: '',
  email: '',
}

/** Physical resources: venue list, add/edit with capacity + contact details. */
export function PhysicalResourcesStep({ store }: { store: OrientationStore }) {
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const pager = usePager(store.resources, 5)

  const form = useForm<ResourceValues>({
    resolver: zodResolver(resourceSchema),
    defaultValues: emptyResource,
  })

  const startAdd = () => {
    setEditingId(null)
    form.reset(emptyResource)
    setOpen(true)
  }

  const startEdit = (r: PhysicalResource) => {
    setEditingId(r.id)
    form.reset({ ...r, capacity: String(r.capacity) })
    setOpen(true)
  }

  const columns: ColumnDef<PhysicalResource>[] = [
    {
      accessorKey: 'resource',
      header: ({ column }) => <SortHeader column={column} label='Resource' />,
      cell: ({ row }) => (
        <span className='text-neutral-1600 font-medium'>
          {row.original.resource}
        </span>
      ),
    },
    {
      accessorKey: 'type',
      header: ({ column }) => <SortHeader column={column} label='Type' />,
      cell: ({ row }) => <Badge variant='outline'>{row.original.type}</Badge>,
    },
    {
      accessorKey: 'location',
      header: ({ column }) => <SortHeader column={column} label='Location' />,
      cell: ({ row }) => <span className='text-sm'>{row.original.location}</span>,
    },
    {
      accessorKey: 'capacity',
      header: ({ column }) => <SortHeader column={column} label='Capacity' />,
      cell: ({ row }) => (
        <span className='text-sm font-medium'>{row.original.capacity} seats</span>
      ),
    },
    {
      accessorKey: 'contactPerson',
      header: ({ column }) => <SortHeader column={column} label='Contact' />,
      cell: ({ row }) => (
        <div className='flex min-w-0 flex-col'>
          <span className='text-sm'>{row.original.contactPerson}</span>
          <span className='text-neutral-1000 text-xs'>
            {row.original.department}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'mobile',
      header: ({ column }) => <SortHeader column={column} label='Mobile' />,
      cell: ({ row }) => <span className='text-sm'>{row.original.mobile}</span>,
    },
    {
      accessorKey: 'email',
      header: ({ column }) => <SortHeader column={column} label='Email' />,
      cell: ({ row }) => (
        <span className='text-neutral-1000 text-xs'>{row.original.email}</span>
      ),
    },
    {
      id: 'edit',
      header: () => <span className='text-paragraph-sm font-medium'>Edit</span>,
      cell: ({ row }) => (
        <Button
          variant='outline'
          size='sm'
          className='h-6 gap-1 px-1.5'
          onClick={(e) => {
            e.stopPropagation()
            startEdit(row.original)
          }}
        >
          <PencilSimple size={12} />
          Edit
        </Button>
      ),
    },
  ]

  return (
    <div className='w-full'>
      <div className='mb-3 flex items-center justify-between'>
        <div>
          <h3 className='text-neutral-1600 text-sm font-semibold'>
            Physical Resources ({store.resources.length})
          </h3>
          <p className='text-neutral-1000 mt-0.5 text-xs'>
            Venues orientation sessions can be booked into — capacity guards
            against over-scheduling.
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <RefreshButton
            onRefresh={() => store.refresh('resources', 'Physical resources')}
            refreshedAt={store.refreshedAt.resources}
          />
          <Button size='sm' className='h-7 gap-1' onClick={startAdd}>
            <Plus size={12} weight='bold' />
            Add Resource
          </Button>
        </div>
      </div>

      <DataTable columns={columns} data={pager.slice} variant='no-status' />
      <PagerBar pager={pager} label='resources' />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-h-[85vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit physical resource' : 'Add physical resource'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              className='space-y-3'
              onSubmit={form.handleSubmit((values) => {
                store.saveResource(
                  { ...values, capacity: Number(values.capacity) },
                  editingId ?? undefined
                )
                setOpen(false)
              })}
            >
              <FormField
                control={form.control}
                name='resource'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resource name</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g. Innovation Hall' {...field} />
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
                      <FormLabel>Type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger variant='secondary' className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {RESOURCE_TYPES.map((t) => (
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
                  name='location'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger variant='secondary' className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {LOCATIONS.map((l) => (
                            <SelectItem key={l} value={l}>
                              {l}
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
                  name='capacity'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity (seats)</FormLabel>
                      <FormControl>
                        <Input inputMode='numeric' placeholder='e.g. 40' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='department'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Owning department</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger variant='secondary' className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DEPARTMENTS.map((d) => (
                            <SelectItem key={d} value={d}>
                              {d}
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
                name='contactPerson'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact person</FormLabel>
                    <FormControl>
                      <Input placeholder='Who manages this venue?' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='grid grid-cols-2 gap-3'>
                <FormField
                  control={form.control}
                  name='mobile'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile</FormLabel>
                      <FormControl>
                        <Input placeholder='+91 …' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder='e.g. name@company.com' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type='button' variant='outline' onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type='submit'>
                  {editingId ? 'Save changes' : 'Add resource'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ------------------------------- Presenter Panel -------------------------- */

const panelSchema = z.object({
  panel: z.string().min(2, 'Panel name is required'),
  description: z.string().min(10, 'Describe the panel (min 10 chars)'),
  locations: z.array(z.string()).min(1, 'Pick at least one location'),
  topics: z.array(z.string()).min(1, 'Pick at least one topic'),
})

type PanelValues = z.infer<typeof panelSchema>

const emptyPanel: PanelValues = {
  panel: '',
  description: '',
  locations: [],
  topics: [],
}

/** Presenter panels: who presents which topic at which location. */
export function PresenterPanelStep({ store }: { store: OrientationStore }) {
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const pager = usePager(store.panels, 5)

  const form = useForm<PanelValues>({
    resolver: zodResolver(panelSchema),
    defaultValues: emptyPanel,
  })

  const startAdd = () => {
    setEditingId(null)
    form.reset(emptyPanel)
    setOpen(true)
  }

  const startEdit = (p: PresenterPanel) => {
    setEditingId(p.id)
    form.reset({
      panel: p.panel,
      description: p.description,
      locations: p.locations,
      topics: p.topics,
    })
    setOpen(true)
  }

  const columns: ColumnDef<PresenterPanel>[] = [
    {
      accessorKey: 'panel',
      header: ({ column }) => <SortHeader column={column} label='Panel' />,
      cell: ({ row }) => (
        <span className='text-neutral-1600 font-medium'>{row.original.panel}</span>
      ),
    },
    {
      accessorKey: 'description',
      header: ({ column }) => <SortHeader column={column} label='Description' />,
      cell: ({ row }) => (
        <span className='text-sm'>{row.original.description}</span>
      ),
    },
    {
      accessorKey: 'locations',
      header: () => <span className='text-paragraph-sm font-medium'>Locations</span>,
      cell: ({ row }) => <ChipList items={row.original.locations} />,
    },
    {
      accessorKey: 'topics',
      header: () => <span className='text-paragraph-sm font-medium'>Topics</span>,
      cell: ({ row }) => <ChipList items={row.original.topics} />,
    },
    {
      id: 'edit',
      header: () => <span className='text-paragraph-sm font-medium'>Edit</span>,
      cell: ({ row }) => (
        <Button
          variant='outline'
          size='sm'
          className='h-6 gap-1 px-1.5'
          onClick={(e) => {
            e.stopPropagation()
            startEdit(row.original)
          }}
        >
          <PencilSimple size={12} />
          Edit
        </Button>
      ),
    },
  ]

  return (
    <div className='w-full'>
      <div className='mb-3 flex items-center justify-between'>
        <div>
          <h3 className='text-neutral-1600 text-sm font-semibold'>
            Presenter Panels ({store.panels.length})
          </h3>
          <p className='text-neutral-1000 mt-0.5 text-xs'>
            Qualified presenter groups matched to orientation topics and
            locations.
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <RefreshButton
            onRefresh={() => store.refresh('panels', 'Presenter panels')}
            refreshedAt={store.refreshedAt.panels}
          />
          <Button size='sm' className='h-7 gap-1' onClick={startAdd}>
            <Plus size={12} weight='bold' />
            Add Panel
          </Button>
        </div>
      </div>

      <DataTable columns={columns} data={pager.slice} variant='no-status' />
      <PagerBar pager={pager} label='panels' />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-h-[85vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit presenter panel' : 'Add presenter panel'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              className='space-y-3'
              onSubmit={form.handleSubmit((values) => {
                store.savePanel(values, editingId ?? undefined)
                setOpen(false)
              })}
            >
              <FormField
                control={form.control}
                name='panel'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Panel name</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g. People Team Panel' {...field} />
                    </FormControl>
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
                        placeholder='Who is on this panel and what do they cover?'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='locations'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Locations</FormLabel>
                    <CheckboxGroup
                      options={LOCATIONS}
                      value={field.value}
                      onChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='topics'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Topics presented</FormLabel>
                    <CheckboxGroup
                      options={ORIENTATION_TOPICS}
                      value={field.value}
                      onChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type='button' variant='outline' onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type='submit'>
                  {editingId ? 'Save changes' : 'Add panel'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
