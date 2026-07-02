import { useEffect, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PencilSimple, Plus } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { MultiSelectDropdown } from '@/components/ui/multi-select-dropdown'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@/components/common/data-table/table'
import { LongText } from '@/components/common/long-text'
import type {
  AttendanceRule,
  AuditorPanel,
  AuditRecurrencePattern,
} from '../data/attendance-config'
import { LOCATIONS, PEOPLE } from '../data/shared'
import type { AttendanceConfigStore } from '../hooks/use-attendance-config'
import { SectionToolbar, SortableHeader } from './table-helpers'

/* ------------------------------ Rule dialog ------------------------------ */

const ruleSchema = z.object({
  name: z.string().min(2, 'Rule name is required'),
  expression: z.string().min(3, 'Rule expression is required'),
  timePeriod: z.string().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Use a hex color like #E8590C'),
  applicability: z.string().min(2, 'Applicability scope is required'),
  status: z.enum(['active', 'inactive']),
})

type RuleValues = z.infer<typeof ruleSchema>

function RuleDialog({
  open,
  onOpenChange,
  rule,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  rule?: AttendanceRule | null
  onSave: (values: RuleValues) => void
}) {
  const form = useForm<RuleValues>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      name: '',
      expression: '',
      timePeriod: 'Daily',
      color: '#E8590C',
      applicability: '',
      status: 'active',
    },
  })

  useEffect(() => {
    if (!open) return
    form.reset(
      rule ?? {
        name: '',
        expression: '',
        timePeriod: 'Daily',
        color: '#E8590C',
        applicability: '',
        status: 'active',
      }
    )
  }, [open, rule, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[480px]'>
        <DialogHeader>
          <DialogTitle>
            {rule ? 'Edit attendance rule' : 'New attendance rule'}
          </DialogTitle>
          <DialogDescription>
            Named rule expressions flag attendance events (late coming, early
            leaving, missed punches) within their applicability scope.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => {
              onSave(v)
              onOpenChange(false)
            })}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rule name</FormLabel>
                  <FormControl>
                    <Input placeholder='Late Coming — Grace 15m' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='expression'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rule expression</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='check_in > shift_start + 15m'
                      className='font-mono'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='grid grid-cols-3 gap-4'>
              <FormField
                control={form.control}
                name='timePeriod'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time period</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {['Daily', 'Weekly', 'Monthly'].map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
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
                name='color'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <Input placeholder='#E8590C' {...field} />
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
                        <SelectTrigger variant='secondary' className='w-full'>
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
            <FormField
              control={form.control}
              name='applicability'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Applicability</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='All locations · Operations'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>{rule ? 'Save changes' : 'Add rule'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

/* --------------------------- Recurrence dialog --------------------------- */

const recurrenceSchema = z.object({
  pattern: z.string().min(3, 'Recurrence pattern is required'),
  location: z.string().min(1),
  workArea: z.string().min(2, 'Work area is required'),
  nextRun: z.string().min(1, 'Next run date is required'),
})

type RecurrenceValues = z.infer<typeof recurrenceSchema>

function RecurrenceDialog({
  open,
  onOpenChange,
  pattern,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  pattern?: AuditRecurrencePattern | null
  onSave: (values: RecurrenceValues) => void
}) {
  const form = useForm<RecurrenceValues>({
    resolver: zodResolver(recurrenceSchema),
    defaultValues: {
      pattern: '',
      location: LOCATIONS[0],
      workArea: '',
      nextRun: '',
    },
  })

  useEffect(() => {
    if (!open) return
    form.reset(
      pattern ?? {
        pattern: '',
        location: LOCATIONS[0],
        workArea: '',
        nextRun: '',
      }
    )
  }, [open, pattern, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[440px]'>
        <DialogHeader>
          <DialogTitle>
            {pattern ? 'Edit audit recurrence' : 'New audit recurrence'}
          </DialogTitle>
          <DialogDescription>
            Attendance audits for the scoped location and work area recur
            automatically on this schedule.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => {
              onSave(v)
              onOpenChange(false)
            })}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='pattern'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recurrence pattern</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Weekly — every Monday 10:00'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='grid grid-cols-2 gap-4'>
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
                name='workArea'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work area</FormLabel>
                    <FormControl>
                      <Input placeholder='Packaging Line A' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name='nextRun'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Next occurrence</FormLabel>
                  <FormControl>
                    <Input type='date' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>
                {pattern ? 'Save changes' : 'Add recurrence'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------ Panel dialog ----------------------------- */

const panelSchema = z.object({
  name: z.string().min(2, 'Panel name is required'),
  description: z.string().min(2, 'Description is required'),
  location: z.string().min(1),
  members: z.array(z.string()).min(1, 'Add at least one auditor'),
})

type PanelValues = z.infer<typeof panelSchema>

function PanelDialog({
  open,
  onOpenChange,
  panel,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  panel?: AuditorPanel | null
  onSave: (values: PanelValues) => void
}) {
  const form = useForm<PanelValues>({
    resolver: zodResolver(panelSchema),
    defaultValues: {
      name: '',
      description: '',
      location: LOCATIONS[0],
      members: [],
    },
  })

  useEffect(() => {
    if (!open) return
    form.reset(
      panel
        ? {
            name: panel.name,
            description: panel.description,
            location: panel.location,
            members: [...panel.members],
          }
        : { name: '', description: '', location: LOCATIONS[0], members: [] }
    )
  }, [open, panel, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[440px]'>
        <DialogHeader>
          <DialogTitle>
            {panel ? 'Edit auditor panel' : 'New auditor panel'}
          </DialogTitle>
          <DialogDescription>
            Auditor groups are assigned to attendance audits for their
            applicable location.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => {
              onSave(v)
              onOpenChange(false)
            })}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Panel name</FormLabel>
                  <FormControl>
                    <Input placeholder='Plant Audit Panel' {...field} />
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
                    <Input
                      placeholder='Shift-floor attendance audits'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='location'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Applicable location</FormLabel>
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
              name='members'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Panel members</FormLabel>
                  <FormControl>
                    <MultiSelectDropdown
                      items={PEOPLE.map((p) => ({ id: p, label: p }))}
                      selectedIds={field.value}
                      onSelectionChange={field.onChange}
                      placeholder='Select auditors'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>
                {panel ? 'Save changes' : 'Add panel'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------- The section ----------------------------- */

/**
 * Attendance decision rules (WFE-31), recurring audit schedules (WFE-32) and
 * auditor panels (WFE-34) — the rules-engine side of the workflow module.
 */
export function AttendanceRulesSection({
  store,
  canConfigure,
}: {
  store: AttendanceConfigStore
  canConfigure: boolean
}) {
  const { rules, patterns, panels, saveRule, savePattern, savePanel } = store

  const [ruleDialog, setRuleDialog] = useState(false)
  const [editingRule, setEditingRule] = useState<AttendanceRule | null>(null)
  const [recurrenceDialog, setRecurrenceDialog] = useState(false)
  const [editingPattern, setEditingPattern] =
    useState<AuditRecurrencePattern | null>(null)
  const [panelDialog, setPanelDialog] = useState(false)
  const [editingPanel, setEditingPanel] = useState<AuditorPanel | null>(null)

  const ruleColumns: ColumnDef<AttendanceRule>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => <SortableHeader column={column} label='Rule' />,
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <span
            className='h-3 w-3 shrink-0 rounded-full'
            style={{ backgroundColor: row.original.color }}
          />
          <LongText className='text-neutral-1600 font-medium'>
            {row.original.name}
          </LongText>
        </div>
      ),
    },
    {
      accessorKey: 'expression',
      header: ({ column }) => (
        <SortableHeader column={column} label='Expression' />
      ),
      cell: ({ row }) => (
        <code className='text-neutral-1900 text-xs'>
          {row.original.expression}
        </code>
      ),
    },
    {
      accessorKey: 'timePeriod',
      header: ({ column }) => <SortableHeader column={column} label='Period' />,
      cell: ({ row }) => (
        <span className='text-neutral-1900 text-sm'>
          {row.original.timePeriod}
        </span>
      ),
    },
    {
      accessorKey: 'applicability',
      header: ({ column }) => (
        <SortableHeader column={column} label='Applicability' />
      ),
      cell: ({ row }) => (
        <LongText className='text-neutral-1900 text-sm'>
          {row.original.applicability}
        </LongText>
      ),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <SortableHeader column={column} label='Status' />,
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.status === 'active' ? 'badge_active' : 'badge_inactive'
          }
        >
          {row.original.status === 'active' ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: () => null,
      cell: ({ row }) =>
        canConfigure ? (
          <Button
            variant='icon2'
            className='text-neutral-1900 h-7 w-7'
            aria-label='Edit rule'
            onClick={() => {
              setEditingRule(row.original)
              setRuleDialog(true)
            }}
          >
            <PencilSimple size={14} weight='fill' />
          </Button>
        ) : null,
      size: 50,
    },
  ]

  const patternColumns: ColumnDef<AuditRecurrencePattern>[] = [
    {
      accessorKey: 'pattern',
      header: ({ column }) => (
        <SortableHeader column={column} label='Recurrence' />
      ),
      cell: ({ row }) => (
        <LongText className='text-neutral-1600 font-medium'>
          {row.original.pattern}
        </LongText>
      ),
    },
    {
      accessorKey: 'location',
      header: ({ column }) => (
        <SortableHeader column={column} label='Location' />
      ),
      cell: ({ row }) => (
        <span className='text-neutral-1900 text-sm'>
          {row.original.location}
        </span>
      ),
    },
    {
      accessorKey: 'workArea',
      header: ({ column }) => (
        <SortableHeader column={column} label='Work area' />
      ),
      cell: ({ row }) => (
        <span className='text-neutral-1900 text-sm'>
          {row.original.workArea}
        </span>
      ),
    },
    {
      accessorKey: 'nextRun',
      header: ({ column }) => (
        <SortableHeader column={column} label='Next occurrence' />
      ),
      cell: ({ row }) => (
        <span className='text-neutral-1900 text-sm'>{row.original.nextRun}</span>
      ),
    },
    {
      id: 'actions',
      header: () => null,
      cell: ({ row }) =>
        canConfigure ? (
          <Button
            variant='icon2'
            className='text-neutral-1900 h-7 w-7'
            aria-label='Edit recurrence'
            onClick={() => {
              setEditingPattern(row.original)
              setRecurrenceDialog(true)
            }}
          >
            <PencilSimple size={14} weight='fill' />
          </Button>
        ) : null,
      size: 50,
    },
  ]

  const panelColumns: ColumnDef<AuditorPanel>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => <SortableHeader column={column} label='Panel' />,
      cell: ({ row }) => (
        <div className='flex min-w-0 flex-col'>
          <LongText className='text-neutral-1600 font-medium'>
            {row.original.name}
          </LongText>
          <span className='text-paragraph-sm text-neutral-1000 truncate'>
            {row.original.description}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'location',
      header: ({ column }) => (
        <SortableHeader column={column} label='Location' />
      ),
      cell: ({ row }) => (
        <span className='text-neutral-1900 text-sm'>
          {row.original.location}
        </span>
      ),
    },
    {
      id: 'members',
      header: () => (
        <span className='text-paragraph-sm font-medium'>Members</span>
      ),
      cell: ({ row }) => (
        <LongText className='text-neutral-1900 text-sm'>
          {row.original.members.join(', ')}
        </LongText>
      ),
    },
    {
      id: 'actions',
      header: () => null,
      cell: ({ row }) =>
        canConfigure ? (
          <Button
            variant='icon2'
            className='text-neutral-1900 h-7 w-7'
            aria-label='Edit panel'
            onClick={() => {
              setEditingPanel(row.original)
              setPanelDialog(true)
            }}
          >
            <PencilSimple size={14} weight='fill' />
          </Button>
        ) : null,
      size: 50,
    },
  ]

  return (
    <div className='w-full'>
      <SectionToolbar title={`Attendance decision rules (${rules.length})`}>
        {canConfigure && (
          <Button
            variant='red'
            onClick={() => {
              setEditingRule(null)
              setRuleDialog(true)
            }}
            className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
          >
            <Plus size={10} weight='bold' />
            New Rule
          </Button>
        )}
      </SectionToolbar>
      <DataTable columns={ruleColumns} data={rules} variant='no-status' />

      <div className='mt-6'>
        <SectionToolbar
          title={`Audit recurrence patterns (${patterns.length})`}
        >
          {canConfigure && (
            <Button
              variant='red'
              onClick={() => {
                setEditingPattern(null)
                setRecurrenceDialog(true)
              }}
              className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
            >
              <Plus size={10} weight='bold' />
              New Recurrence
            </Button>
          )}
        </SectionToolbar>
        <DataTable columns={patternColumns} data={patterns} variant='no-status' />
      </div>

      <div className='mt-6'>
        <SectionToolbar title={`Attendance auditor panels (${panels.length})`}>
          {canConfigure && (
            <Button
              variant='red'
              onClick={() => {
                setEditingPanel(null)
                setPanelDialog(true)
              }}
              className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
            >
              <Plus size={10} weight='bold' />
              New Panel
            </Button>
          )}
        </SectionToolbar>
        <DataTable columns={panelColumns} data={panels} variant='no-status' />
      </div>

      <RuleDialog
        open={ruleDialog}
        onOpenChange={(open) => {
          setRuleDialog(open)
          if (!open) setEditingRule(null)
        }}
        rule={editingRule}
        onSave={(values) => saveRule(values, editingRule?.id)}
      />
      <RecurrenceDialog
        open={recurrenceDialog}
        onOpenChange={(open) => {
          setRecurrenceDialog(open)
          if (!open) setEditingPattern(null)
        }}
        pattern={editingPattern}
        onSave={(values) => savePattern(values, editingPattern?.id)}
      />
      <PanelDialog
        open={panelDialog}
        onOpenChange={(open) => {
          setPanelDialog(open)
          if (!open) setEditingPanel(null)
        }}
        panel={editingPanel}
        onSave={(values) => savePanel(values, editingPanel?.id)}
      />
    </div>
  )
}
