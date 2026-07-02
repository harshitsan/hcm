import { useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PencilSimple, Plus, Trash } from 'phosphor-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTable } from '@/components/common/data-table/table'
import type { WorkflowDefinition } from '../data/definitions'
import { ANY, evaluateRouting, type RoutingRule } from '../data/routing'
import {
  COMPANIES,
  DEPARTMENTS,
  JURISDICTIONS,
  LOCATIONS,
  ORG_GROUPS,
  TRANSACTION_TYPES,
} from '../data/shared'
import type { AttendanceConfigStore } from '../hooks/use-attendance-config'
import type { RoutingStore, RoutingRuleDraft } from '../hooks/use-routing'
import { AttendanceRulesSection } from './attendance-rules-section'
import { SectionToolbar, selectColumn, SortableHeader } from './table-helpers'

const ruleColumns: ColumnDef<RoutingRule>[] = [
  selectColumn<RoutingRule>(),
  {
    accessorKey: 'priority',
    header: ({ column }) => <SortableHeader column={column} label='Priority' />,
    cell: ({ row }) => (
      <span className='text-neutral-1600 text-sm font-medium'>
        {row.original.priority}
      </span>
    ),
    size: 70,
  },
  {
    accessorKey: 'transactionType',
    header: ({ column }) => (
      <SortableHeader column={column} label='Transaction' />
    ),
    cell: ({ row }) => (
      <span className='text-neutral-1900 text-sm'>
        {row.original.transactionType}
      </span>
    ),
  },
  {
    accessorKey: 'company',
    header: ({ column }) => <SortableHeader column={column} label='Company' />,
    cell: ({ row }) => (
      <span className='text-neutral-1900 text-sm'>{row.original.company}</span>
    ),
  },
  {
    accessorKey: 'jurisdiction',
    header: ({ column }) => (
      <SortableHeader column={column} label='Jurisdiction' />
    ),
    cell: ({ row }) => (
      <span className='text-neutral-1900 text-sm'>
        {row.original.jurisdiction}
      </span>
    ),
  },
  {
    accessorKey: 'location',
    header: ({ column }) => <SortableHeader column={column} label='Location' />,
    cell: ({ row }) => (
      <span className='text-neutral-1900 text-sm'>{row.original.location}</span>
    ),
  },
  {
    accessorKey: 'department',
    header: ({ column }) => (
      <SortableHeader column={column} label='Department' />
    ),
    cell: ({ row }) => (
      <span className='text-neutral-1900 text-sm'>
        {row.original.department}
      </span>
    ),
  },
  {
    accessorKey: 'orgGroup',
    header: ({ column }) => <SortableHeader column={column} label='Group' />,
    cell: ({ row }) => (
      <span className='text-neutral-1900 text-sm'>{row.original.orgGroup}</span>
    ),
  },
  {
    accessorKey: 'routeTo',
    header: ({ column }) => <SortableHeader column={column} label='Routes to' />,
    cell: ({ row }) => (
      <div className='flex items-center gap-2'>
        <span className='text-neutral-1600 text-sm font-medium'>
          {row.original.routeTo}
        </span>
        {row.original.isDefault && <Badge variant='open'>Default path</Badge>}
      </div>
    ),
  },
]

const ruleSchema = z.object({
  priority: z.string().regex(/^\d+$/, 'Priority must be a number'),
  transactionType: z.string().min(1),
  company: z.string().min(1),
  jurisdiction: z.string().min(1),
  location: z.string().min(1),
  department: z.string().min(1),
  orgGroup: z.string().min(1),
  routeTo: z.string().min(1, 'Select a target workflow'),
})

type RuleValues = z.infer<typeof ruleSchema>

function RuleSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: readonly string[]
}) {
  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <Select value={value} onValueChange={onChange}>
        <FormControl>
          <SelectTrigger variant='secondary' className='w-full'>
            <SelectValue placeholder='Select' />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )
}

function RoutingRuleDialog({
  open,
  onOpenChange,
  rule,
  workflowNames,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  rule?: RoutingRule | null
  workflowNames: string[]
  onSubmit: (draft: RoutingRuleDraft) => void
}) {
  const form = useForm<RuleValues>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      priority: '10',
      transactionType: ANY,
      company: ANY,
      jurisdiction: ANY,
      location: ANY,
      department: ANY,
      orgGroup: ANY,
      routeTo: '',
    },
  })

  useEffect(() => {
    if (!open) return
    form.reset(
      rule
        ? {
            priority: String(rule.priority),
            transactionType: rule.transactionType,
            company: rule.company,
            jurisdiction: rule.jurisdiction,
            location: rule.location,
            department: rule.department,
            orgGroup: rule.orgGroup,
            routeTo: rule.routeTo,
          }
        : {
            priority: '10',
            transactionType: ANY,
            company: ANY,
            jurisdiction: ANY,
            location: ANY,
            department: ANY,
            orgGroup: ANY,
            routeTo: workflowNames[0] ?? '',
          }
    )
  }, [open, rule, form, workflowNames])

  function handleSubmit(values: RuleValues) {
    onSubmit({
      priority: Number(values.priority),
      transactionType: values.transactionType,
      company: values.company,
      jurisdiction: values.jurisdiction,
      location: values.location,
      department: values.department,
      orgGroup: values.orgGroup,
      routeTo: values.routeTo,
      isDefault: rule?.isDefault ?? false,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[520px]'>
        <DialogHeader>
          <DialogTitle>{rule ? 'Edit routing rule' : 'New routing rule'}</DialogTitle>
          <DialogDescription>
            Rules evaluate in ascending priority — first match wins; the
            default row is the terminal fallback. "{ANY}" matches every value.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='priority'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <FormControl>
                      <Input inputMode='numeric' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='transactionType'
                render={({ field }) => (
                  <RuleSelect
                    label='Transaction type'
                    value={field.value}
                    onChange={field.onChange}
                    options={[ANY, ...TRANSACTION_TYPES]}
                  />
                )}
              />
              <FormField
                control={form.control}
                name='company'
                render={({ field }) => (
                  <RuleSelect
                    label='Company'
                    value={field.value}
                    onChange={field.onChange}
                    options={[ANY, ...COMPANIES]}
                  />
                )}
              />
              <FormField
                control={form.control}
                name='jurisdiction'
                render={({ field }) => (
                  <RuleSelect
                    label='Jurisdiction'
                    value={field.value}
                    onChange={field.onChange}
                    options={[ANY, ...JURISDICTIONS]}
                  />
                )}
              />
              <FormField
                control={form.control}
                name='location'
                render={({ field }) => (
                  <RuleSelect
                    label='Location'
                    value={field.value}
                    onChange={field.onChange}
                    options={[ANY, ...LOCATIONS]}
                  />
                )}
              />
              <FormField
                control={form.control}
                name='department'
                render={({ field }) => (
                  <RuleSelect
                    label='Department'
                    value={field.value}
                    onChange={field.onChange}
                    options={[ANY, ...DEPARTMENTS]}
                  />
                )}
              />
              <FormField
                control={form.control}
                name='orgGroup'
                render={({ field }) => (
                  <RuleSelect
                    label='Org group'
                    value={field.value}
                    onChange={field.onChange}
                    options={[ANY, ...ORG_GROUPS]}
                  />
                )}
              />
              <FormField
                control={form.control}
                name='routeTo'
                render={({ field }) => (
                  <RuleSelect
                    label='Routes to workflow'
                    value={field.value}
                    onChange={field.onChange}
                    options={workflowNames}
                  />
                )}
              />
            </div>
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

function RoutingSimulator({ rules }: { rules: RoutingRule[] }) {
  const [tx, setTx] = useState({
    transactionType: 'Overtime',
    company: 'Aurora Foods',
    jurisdiction: 'India',
    location: 'Chennai',
    department: 'Operations',
    orgGroup: 'Aurora Group',
  })
  const result = evaluateRouting(rules, tx)

  const fields: {
    key: keyof typeof tx
    label: string
    options: readonly string[]
  }[] = [
    { key: 'transactionType', label: 'Transaction', options: TRANSACTION_TYPES },
    { key: 'company', label: 'Company', options: COMPANIES },
    { key: 'jurisdiction', label: 'Jurisdiction', options: JURISDICTIONS },
    { key: 'location', label: 'Location', options: LOCATIONS },
    { key: 'department', label: 'Department', options: DEPARTMENTS },
    { key: 'orgGroup', label: 'Org group', options: ORG_GROUPS },
  ]

  return (
    <Card className='mt-6 gap-2 border-gray-200 py-4'>
      <CardHeader className='px-4 pb-0'>
        <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
          Routing preview — test how a sample transaction routes
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-3 px-4'>
        <div className='grid grid-cols-2 gap-3 lg:grid-cols-6'>
          {fields.map((f) => (
            <div key={f.key} className='flex flex-col gap-1'>
              <span className='text-neutral-1000 text-xs font-medium'>
                {f.label}
              </span>
              <Select
                value={tx[f.key]}
                onValueChange={(v) => setTx((prev) => ({ ...prev, [f.key]: v }))}
              >
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {f.options.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
        <div className='rounded-md border border-gray-200 bg-neutral-100 px-3 py-2 text-sm'>
          {result ? (
            <span className='text-neutral-1900'>
              Deterministic evaluation matched rule{' '}
              <span className='font-medium'>{result.rule.id}</span> at priority{' '}
              {result.rule.priority}
              {result.matchedOnDefault ? ' (default path)' : ''} →{' '}
              <span className='font-medium'>{result.rule.routeTo}</span>
            </span>
          ) : (
            <span className='text-neutral-1900'>
              No rule matched — the transaction would fall back to its
              transaction-type default.
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Routing & Rules: the governed routing decision table with deterministic
 * priority + default fallback (WFE-02, WFE-23), a live routing preview
 * (WFE-25), and the attendance rules engine + audit scheduling
 * (WFE-31 … WFE-34).
 */
export function RoutingTab({
  routing,
  attendance,
  definitions,
  canConfigure,
}: {
  routing: RoutingStore
  attendance: AttendanceConfigStore
  definitions: WorkflowDefinition[]
  canConfigure: boolean
}) {
  const { rules, addRule, updateRule, deleteRule } = routing

  const sortedRules = useMemo(
    () => [...rules].sort((a, b) => a.priority - b.priority),
    [rules]
  )
  const workflowNames = useMemo(
    () =>
      Array.from(
        new Set(
          definitions.filter((d) => d.status === 'active').map((d) => d.name)
        )
      ),
    [definitions]
  )

  const [selectedRows, setSelectedRows] = useState<RoutingRule[]>([])
  const [resetSelectionKey, setResetSelectionKey] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<RoutingRule | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const clearSelection = () => {
    setSelectedRows([])
    setResetSelectionKey((prev) => prev + 1)
  }

  const selected = selectedRows[0] ?? null

  return (
    <div className='w-full'>
      <Tabs defaultValue='decision-table'>
        <TabsList className='mb-2 flex-wrap'>
          <TabsTrigger value='decision-table'>Routing Decision Table</TabsTrigger>
          <TabsTrigger value='attendance-rules'>
            Attendance Rules &amp; Audits
          </TabsTrigger>
        </TabsList>

        <TabsContent value='decision-table'>
          <SectionToolbar title={`Routing rules (${sortedRules.length})`}>
            {canConfigure && (
              <>
                <Button
                  variant='icon2'
                  className='text-neutral-1900 h-7 w-7'
                  disabled={selectedRows.length !== 1}
                  onClick={() => {
                    setEditing(selected)
                    setDialogOpen(true)
                  }}
                  aria-label='Edit'
                >
                  <PencilSimple size={16} weight='fill' />
                </Button>
                <Button
                  variant='icon2'
                  className='text-neutral-1900 h-7 w-7'
                  disabled={selectedRows.length !== 1 || selected?.isDefault}
                  onClick={() => setConfirmDelete(true)}
                  aria-label='Delete'
                >
                  <Trash size={16} weight='bold' />
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
                  New Rule
                </Button>
              </>
            )}
          </SectionToolbar>

          <DataTable
            columns={ruleColumns}
            data={sortedRules}
            variant='no-status'
            resetSelectionKey={resetSelectionKey}
            onSelectionChange={(rows) => setSelectedRows(rows)}
          />

          <RoutingSimulator rules={rules} />

          <RoutingRuleDialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open)
              if (!open) setEditing(null)
            }}
            rule={editing}
            workflowNames={workflowNames}
            onSubmit={(draft) => {
              if (editing) updateRule(editing.id, draft)
              else addRule(draft)
              clearSelection()
            }}
          />

          <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove routing rule?</AlertDialogTitle>
                <AlertDialogDescription>
                  Transactions that matched rule {selected?.id} will fall
                  through to the next rule in priority order.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    if (selected) deleteRule(selected.id)
                    setConfirmDelete(false)
                    clearSelection()
                  }}
                  className='bg-destructive hover:bg-destructive/90 text-white'
                >
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        <TabsContent value='attendance-rules'>
          <AttendanceRulesSection store={attendance} canConfigure={canConfigure} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
