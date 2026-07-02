import { useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { DataTable } from '@/components/common/data-table/table'
import { RoleGate, useRole } from '@/context/role-context'
import {
  DISCIPLINARY_ACTION_TYPES,
  type DisciplinaryCase,
} from '../data/disciplinary'
import { DEPARTMENTS, LOCATIONS, PERSONAS, fmtDate } from '../data/shared'
import { type DisciplinaryStore } from '../hooks/use-disciplinary'
import { ApprovalSteps } from './approval-steps'
import { StatusBadge } from './badges'
import { SortHeader } from './columns-shared'

const columns: ColumnDef<DisciplinaryCase>[] = [
  {
    accessorKey: 'employeeName',
    header: ({ column }) => <SortHeader column={column} label='Employee' />,
    cell: ({ row }) => (
      <div className='flex min-w-0 flex-col'>
        <span className='text-neutral-1600 font-medium'>
          {row.original.employeeName}
        </span>
        <span className='text-neutral-1000 text-xs'>
          {row.original.employeeCode} · {row.original.department}
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'location',
    header: ({ column }) => <SortHeader column={column} label='Location' />,
    cell: ({ row }) => <span className='text-sm'>{row.original.location}</span>,
  },
  {
    accessorKey: 'actionType',
    header: ({ column }) => <SortHeader column={column} label='Action' />,
    cell: ({ row }) => <Badge variant='outline'>{row.original.actionType}</Badge>,
  },
  {
    accessorKey: 'initiatedOn',
    header: ({ column }) => <SortHeader column={column} label='Initiated' />,
    cell: ({ row }) => (
      <span className='text-sm'>
        {fmtDate(row.original.initiatedOn)} · {row.original.initiatedBy}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <SortHeader column={column} label='Status' />,
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
]

const schema = z.object({
  employeeName: z.string().min(2, 'Employee is required'),
  employeeCode: z.string().min(3, 'Employee code is required'),
  department: z.string().min(1),
  location: z.string().min(1),
  actionType: z.enum(DISCIPLINARY_ACTION_TYPES),
  reason: z.string().min(10, 'Describe the incident (min 10 chars)'),
})

type FormValues = z.infer<typeof schema>

interface DisciplinaryTabProps {
  store: DisciplinaryStore
}

/** Disciplinary actions: initiate → location approver → letter issuance. */
export function DisciplinaryTab({ store }: DisciplinaryTabProps) {
  const { role, hasRole } = useRole()
  const [newOpen, setNewOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = store.cases.find((c) => c.id === selectedId) ?? null
  const isAdmin = hasRole('Company Admin')

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      employeeName: '',
      employeeCode: '',
      department: 'Engineering',
      location: 'Hyderabad',
      actionType: 'Warning Letter',
      reason: '',
    },
  })

  return (
    <div className='w-full'>
      <div className='mb-3 flex items-center justify-between'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          Disciplinary Actions ({store.cases.length})
        </h2>
        <RoleGate roles={['Company Admin']}>
          <Button
            variant='red'
            onClick={() => {
              form.reset()
              setNewOpen(true)
            }}
            className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
          >
            <Plus size={10} weight='bold' />
            Initiate Action
          </Button>
        </RoleGate>
      </div>

      <DataTable
        columns={columns}
        data={store.cases}
        variant='no-status'
        onRowClick={(row: DisciplinaryCase) => setSelectedId(row.id)}
      />

      {/* Initiate */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className='max-h-[85vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Initiate disciplinary action</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              className='space-y-3'
              onSubmit={form.handleSubmit((values) => {
                store.initiate({ ...values, initiatedBy: PERSONAS[role] })
                setNewOpen(false)
              })}
            >
              <FormField
                control={form.control}
                name='employeeName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee</FormLabel>
                    <FormControl>
                      <Input placeholder='Employee name' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='employeeCode'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee code</FormLabel>
                    <FormControl>
                      <Input placeholder='EMP-0000' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='grid grid-cols-2 gap-3'>
                <FormField
                  control={form.control}
                  name='department'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
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
                <FormField
                  control={form.control}
                  name='location'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location (drives routing)</FormLabel>
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
              <FormField
                control={form.control}
                name='actionType'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Action type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DISCIPLINARY_ACTION_TYPES.map((t) => (
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
                name='reason'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Incident / reason</FormLabel>
                    <FormControl>
                      <Textarea placeholder='What happened?' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setNewOpen(false)}
                >
                  Cancel
                </Button>
                <Button type='submit'>Route to location approver</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Detail */}
      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null)
        }}
      >
        <DialogContent className='max-h-[85vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              {selected?.employeeName} · {selected?.actionType}
              {selected && <StatusBadge status={selected.status} />}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className='space-y-4'>
              <p className='text-neutral-1000 text-sm'>{selected.reason}</p>
              <ApprovalSteps
                steps={selected.approvals}
                disabled={selected.status !== 'pending-approval'}
                canAct={() => isAdmin}
                onApprove={() => store.approve(selected)}
                onReject={(note) => store.reject(selected, note)}
              />
              {selected.status === 'approved' && isAdmin && (
                <Button size='sm' onClick={() => store.issueLetter(selected)}>
                  Issue letter from template
                </Button>
              )}
              {selected.status === 'letter-issued' && (
                <Badge variant='completed'>
                  Letter issued from the configured disciplinary template
                </Badge>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
