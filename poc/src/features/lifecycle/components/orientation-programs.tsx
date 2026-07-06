import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus } from 'phosphor-react'
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
import { DataTable } from '@/components/common/data-table/table'
import { RoleGate } from '@/context/role-context'
import {
  TRAINING_MODES,
  type OrientationProgram,
} from '../data/orientation'
import { LOCATIONS, fmtDate, todayISO } from '../data/shared'
import { type OrientationStore } from '../hooks/use-orientation'
import { StatusBadge } from './badges'
import { SortHeader } from './columns-shared'
import { PagerBar, RefreshButton, usePager } from './orientation-widgets'

const scheduleSchema = z.object({
  title: z.string().min(5, 'Give the orientation a title'),
  mode: z.enum(TRAINING_MODES),
  participants: z
    .string()
    .regex(/^[1-9]\d*$/, 'Participants must be a positive number'),
  location: z.string().min(1),
  startDate: z.string().min(1, 'Pick a start date'),
  panel: z.string().min(1, 'Pick a presenter panel'),
})

type ScheduleValues = z.infer<typeof scheduleSchema>

interface OrientationProgramsProps {
  store: OrientationStore
}

/**
 * Orientation Programs: list with title / training mode / participants /
 * status, a Task column of row-level actions, scheduling, refresh and paging.
 */
export function OrientationPrograms({ store }: OrientationProgramsProps) {
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const pager = usePager(store.programs, 5)

  const form = useForm<ScheduleValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      title: '',
      mode: 'In-person',
      participants: '10',
      location: 'Hyderabad',
      startDate: todayISO(),
      panel: store.panels[0]?.panel ?? '',
    },
  })

  const columns = useMemo<ColumnDef<OrientationProgram>[]>(
    () => [
      {
        accessorKey: 'title',
        header: ({ column }) => <SortHeader column={column} label='Title' />,
        cell: ({ row }) => (
          <div className='flex min-w-0 flex-col'>
            <span className='text-neutral-1600 font-medium'>
              {row.original.title}
            </span>
            <span className='text-neutral-1000 text-xs'>
              {row.original.location} · starts {fmtDate(row.original.startDate)} ·{' '}
              {row.original.panel}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'mode',
        header: ({ column }) => (
          <SortHeader column={column} label='Training Mode' />
        ),
        cell: ({ row }) => <Badge variant='outline'>{row.original.mode}</Badge>,
      },
      {
        accessorKey: 'participants',
        header: ({ column }) => (
          <SortHeader column={column} label='Participants' />
        ),
        cell: ({ row }) => (
          <span className='text-sm font-medium'>
            {row.original.participants}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <SortHeader column={column} label='Status' />,
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: 'task',
        header: () => <span className='text-paragraph-sm font-medium'>Task</span>,
        cell: ({ row }) => {
          const p = row.original
          return (
            <div className='flex flex-wrap gap-1'>
              {p.status === 'scheduled' && (
                <>
                  <Button
                    variant='outline'
                    size='sm'
                    className='h-6 px-1.5'
                    onClick={(e) => {
                      e.stopPropagation()
                      store.setProgramStatus(
                        p,
                        'in-progress',
                        'Sessions kicked off with the assigned presenter panel'
                      )
                    }}
                  >
                    Start
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    className='text-orange-1200 h-6 px-1.5'
                    onClick={(e) => {
                      e.stopPropagation()
                      store.setProgramStatus(
                        p,
                        'cancelled',
                        'Program cancelled before kick-off; participants informed'
                      )
                    }}
                  >
                    Cancel
                  </Button>
                </>
              )}
              {p.status === 'in-progress' && (
                <Button
                  variant='outline'
                  size='sm'
                  className='h-6 px-1.5'
                  onClick={(e) => {
                    e.stopPropagation()
                    store.setProgramStatus(
                      p,
                      'completed',
                      'All sessions delivered; evaluation reminders queued'
                    )
                  }}
                >
                  Complete
                </Button>
              )}
              {(p.status === 'scheduled' || p.status === 'in-progress') && (
                <Button
                  variant='outline'
                  size='sm'
                  className='h-6 px-1.5'
                  onClick={(e) => {
                    e.stopPropagation()
                    store.notifyParticipants(p)
                  }}
                >
                  Notify
                </Button>
              )}
              {(p.status === 'completed' || p.status === 'cancelled') && (
                <span className='text-neutral-1000 text-xs'>—</span>
              )}
            </div>
          )
        },
      },
    ],
    [store]
  )

  return (
    <div className='w-full'>
      <div className='mb-3 flex items-center justify-between'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          Orientation Programs ({store.programs.length})
        </h2>
        <div className='flex items-center gap-2'>
          <RefreshButton
            onRefresh={() => store.refresh('programs', 'Orientation programs')}
            refreshedAt={store.refreshedAt.programs}
          />
          <RoleGate roles={['Company Admin']}>
            <Button
              variant='red'
              disabled={!store.moduleEnabled}
              onClick={() => {
                form.reset()
                setScheduleOpen(true)
              }}
              className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
            >
              <Plus size={10} weight='bold' />
              Schedule Orientation
            </Button>
          </RoleGate>
        </div>
      </div>

      {!store.moduleEnabled && (
        <div className='mb-3 rounded-[6px] border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800'>
          The Orientation Module is disabled — enable it under Configuration →
          Setup to schedule new orientations.
        </div>
      )}

      <DataTable columns={columns} data={pager.slice} variant='no-status' />
      <PagerBar pager={pager} label='programs' />

      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className='max-h-[85vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Schedule a new orientation</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              className='space-y-3'
              onSubmit={form.handleSubmit((values) => {
                store.scheduleProgram({
                  title: values.title,
                  mode: values.mode,
                  participants: Number(values.participants),
                  location: values.location,
                  startDate: values.startDate,
                  panel: values.panel,
                })
                setScheduleOpen(false)
              })}
            >
              <FormField
                control={form.control}
                name='title'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='e.g. August 2026 New Hire Induction'
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
                  name='mode'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Training mode</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger variant='secondary' className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TRAINING_MODES.map((m) => (
                            <SelectItem key={m} value={m}>
                              {m}
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
                  name='participants'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Participants</FormLabel>
                      <FormControl>
                        <Input inputMode='numeric' placeholder='e.g. 12' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className='grid grid-cols-2 gap-3'>
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
                <FormField
                  control={form.control}
                  name='startDate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start date</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name='panel'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Presenter panel</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue placeholder='Pick the presenting panel' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {store.panels.map((p) => (
                          <SelectItem key={p.id} value={p.panel}>
                            {p.panel}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setScheduleOpen(false)}
                >
                  Cancel
                </Button>
                <Button type='submit'>Schedule orientation</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
