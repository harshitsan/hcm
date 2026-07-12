import { useMemo, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { DownloadSimple, FloppyDisk } from 'phosphor-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  adhocRecords,
  GROUPING_OPTIONS,
  type AdhocFieldKey,
  type AdhocRecord,
  type FieldDef,
  type GroupingKey,
  type SavedView,
} from '../data/builder'
import { seedFieldDefinitions } from '@/features/custom-fields/data/custom-fields'
import { DEPARTMENTS, type Company } from '../data/report-catalog'
import { type SavedViewsStore } from '../hooks/use-saved-views'
import { CustomFieldBadge } from './badges'
import { ChartCard, HBarChart } from './charts'
import { SavedViewsPanel } from './saved-views-panel'

/**
 * Read-only view of the tenant's Custom Fields (F9) registry — the builder
 * surfaces employee-entity definitions so UDF columns trace back to their
 * governed definition (RPT-23).
 */
const F9_EMPLOYEE_DEFS = seedFieldDefinitions.filter(
  (d) => d.entity === 'Employees'
)

const saveViewSchema = z.object({
  name: z.string().min(2, 'View name is required'),
})

type SaveViewValues = z.infer<typeof saveViewSchema>

interface BuilderTabProps {
  /** Metadata-driven field catalog — hidden fields excluded (RPT-23). */
  fields: FieldDef[]
  companies: Company[]
  views: SavedViewsStore
}

/**
 * Ad hoc report builder (RPT-06, RPT-07): pick fields from the tenant
 * metadata schema (incl. custom/UDF fields, RPT-23), combine filters, group
 * with subtotals, and save/reuse configurations as views (RPT-08). Only
 * in-scope company rows are ever available (RPT-12, RPT-20).
 */
export function BuilderTab({ fields, companies, views }: BuilderTabProps) {
  const selectable = useMemo(() => fields.filter((f) => f.visible), [fields])

  const [selected, setSelected] = useState<AdhocFieldKey[]>([
    'employee',
    'department',
    'status',
    'leaveBalance',
  ])
  const [deptFilter, setDeptFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [groupBy, setGroupBy] = useState<GroupingKey>('none')
  const [saveOpen, setSaveOpen] = useState(false)

  const form = useForm<SaveViewValues>({
    resolver: zodResolver(saveViewSchema),
    defaultValues: { name: '' },
  })

  const toggleField = (key: AdhocFieldKey) =>
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )

  const activeFields = useMemo(
    () => selectable.filter((f) => selected.includes(f.key)),
    [selectable, selected]
  )

  // All filter conditions apply together (RPT-07); RLS keeps rows in scope.
  const rows = useMemo(
    () =>
      adhocRecords.filter(
        (r) =>
          companies.includes(r.company) &&
          (deptFilter === 'all' || r.department === deptFilter) &&
          (statusFilter === 'all' || r.status === statusFilter)
      ),
    [companies, deptFilter, statusFilter]
  )

  const groups = useMemo(() => {
    if (groupBy === 'none') return null
    const map = new Map<string, AdhocRecord[]>()
    rows.forEach((r) => {
      const key = String(r[groupBy])
      map.set(key, [...(map.get(key) ?? []), r])
    })
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [rows, groupBy])

  const currentConfig = {
    fields: activeFields.map((f) => f.key),
    departmentFilter: deptFilter,
    statusFilter,
    groupBy,
  }

  const openView = (view: SavedView) => {
    setSelected(view.fields)
    setDeptFilter(view.departmentFilter)
    setStatusFilter(view.statusFilter)
    setGroupBy(view.groupBy)
    toast.success(`View “${view.name}” reopened with its saved configuration`)
  }

  const submitSave = (values: SaveViewValues) => {
    views.saveView({ name: values.name, ...currentConfig })
    setSaveOpen(false)
    form.reset({ name: '' })
  }

  const renderRow = (r: AdhocRecord) => (
    <tr key={r.id} className='border-b last:border-0'>
      {activeFields.map((f) => (
        <td key={f.key} className='px-2 py-2'>
          {String(r[f.key])}
        </td>
      ))}
    </tr>
  )

  return (
    <div className='w-full space-y-4'>
      <div className='grid grid-cols-1 gap-3 lg:grid-cols-[290px_1fr]'>
        {/* Field, filter and grouping controls */}
        <div className='space-y-3 rounded-[8px] border border-gray-200 bg-white p-4'>
          <div>
            <p className='text-neutral-1600 mb-2 text-sm font-semibold'>
              Fields{' '}
              <span className='text-neutral-1000 text-xs font-normal'>
                from the tenant metadata schema
              </span>
            </p>
            <div className='space-y-1.5'>
              {selectable.map((f) => (
                <label key={f.key} className='flex items-center gap-2 text-sm'>
                  <Checkbox
                    variant='blue'
                    checked={selected.includes(f.key)}
                    onCheckedChange={() => toggleField(f.key)}
                  />
                  {f.label}
                  {f.source === 'custom' && <CustomFieldBadge />}
                </label>
              ))}
            </div>
            <p className='text-neutral-1000 mt-2 text-xs'>
              Custom/UDF fields come from the Custom Fields (F9) registry —{' '}
              {F9_EMPLOYEE_DEFS.length} definition(s) exist for Employees
              (e.g.{' '}
              {F9_EMPLOYEE_DEFS.slice(0, 3)
                .map((d) => d.name)
                .join(', ')}
              ). Definitions with captured report data appear above as
              selectable fields.
            </p>
          </div>
          <div className='space-y-2 border-t pt-3'>
            <p className='text-neutral-1600 text-sm font-semibold'>Filters</p>
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger variant='secondary' className='h-7 w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All departments</SelectItem>
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger variant='secondary' className='h-7 w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Any employment status</SelectItem>
                <SelectItem value='Active'>Active</SelectItem>
                <SelectItem value='On Notice'>On Notice</SelectItem>
                <SelectItem value='Exited'>Exited</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-2 border-t pt-3'>
            <p className='text-neutral-1600 text-sm font-semibold'>Grouping</p>
            <Select
              value={groupBy}
              onValueChange={(v) => setGroupBy(v as GroupingKey)}
            >
              <SelectTrigger variant='secondary' className='h-7 w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GROUPING_OPTIONS.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g === 'none' ? 'No grouping' : `Group by ${g}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Live output — columns track field selection exactly (RPT-06) */}
        <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
          <div className='mb-2 flex items-center justify-between'>
            <p className='text-neutral-1600 text-sm font-semibold'>
              Output · {rows.length} in-scope record(s)
            </p>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                className='h-7 gap-1'
                disabled={activeFields.length === 0}
                onClick={() => setSaveOpen(true)}
              >
                <FloppyDisk size={14} weight='bold' />
                Save as view
              </Button>
              <Button
                className='h-7 gap-1'
                disabled={activeFields.length === 0}
                onClick={() =>
                  toast.success(
                    `Ad hoc report exported — ${rows.length} record(s), ${activeFields.length} column(s)`
                  )
                }
              >
                <DownloadSimple size={14} weight='bold' />
                Export
              </Button>
            </div>
          </div>
          {activeFields.length === 0 ? (
            <p className='text-neutral-1000 py-8 text-center text-sm'>
              Select at least one field to build the report.
            </p>
          ) : groups ? (
            <div className='space-y-4'>
              <ChartCard
                title={`Records by ${groupBy}`}
                subtitle='Group subtotals for the current filters'
              >
                <HBarChart
                  data={groups.map(([key, list]) => ({
                    label: key,
                    value: list.length,
                  }))}
                />
              </ChartCard>
              {groups.map(([key, list]) => (
                <div key={key}>
                  <p className='text-neutral-1600 mb-1 text-xs font-semibold'>
                    {key} — subtotal {list.length} record(s)
                  </p>
                  <table className='w-full text-sm'>
                    <tbody>{list.map(renderRow)}</tbody>
                  </table>
                </div>
              ))}
            </div>
          ) : (
            <table className='w-full text-sm'>
              <thead>
                <tr className='text-neutral-1000 border-b text-left text-xs'>
                  {activeFields.map((f) => (
                    <th key={f.key} className='px-2 py-2 font-medium'>
                      {f.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>{rows.map(renderRow)}</tbody>
            </table>
          )}
        </div>
      </div>

      <SavedViewsPanel
        store={views}
        onOpenView={openView}
        onUpdateView={(id) => views.updateView(id, currentConfig)}
      />

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className='sm:max-w-[380px]'>
          <DialogHeader>
            <DialogTitle>Save view</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(submitSave)}
              className='space-y-4'
            >
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>View name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='e.g. Monthly ops headcount'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <p className='text-neutral-1000 text-xs'>
                Saves {activeFields.length} field(s), current filters and
                grouping for reuse.
              </p>
              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setSaveOpen(false)}
                >
                  Cancel
                </Button>
                <Button type='submit'>Save view</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
