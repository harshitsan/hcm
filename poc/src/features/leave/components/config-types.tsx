import { Fragment, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, X } from 'lucide-react'
import { Plus } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { type LeaveType, type ServicePeriod } from '../data/leave-types'
import { seedPolicies } from '../data/policies'
import {
  DEPARTMENTS,
  GROUP_COMPANIES,
  LOCATIONS,
  POSITION_LEVELS,
} from '../data/shared'
import { type LeaveConfigStore, type LeaveTypeDraft } from '../hooks/use-leave-config'
import { PagerControls, RefreshButton, usePager } from './list-controls'

const TYPES_PAGE_SIZE = 8

const POLICY_NAMES = seedPolicies.map((p) => p.name)

const numStr = (msg = 'Enter a valid number') =>
  z.string().refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, msg)

const typeSchema = z.object({
  // Basics
  name: z.string().min(2, 'Name is required'),
  description: z.string(),
  category: z.enum(['paid', 'unpaid']),
  unit: z.enum(['days', 'hours']),
  allotted: numStr(),
  instancesPerDay: numStr(),
  fmla: z.boolean(),
  applicability: z.string().min(2, 'Applicability is required'),
  // Carry forward & payout
  canCarryForward: z.boolean(),
  maxCarryForward: numStr(),
  canBePaidOut: z.boolean(),
  minPayoutEligibility: numStr(),
  // Exemptions & availability
  exemptHolidays: z.boolean(),
  exemptWeeklyOffs: z.boolean(),
  availDuringNotice: z.boolean(),
  availDuringPip: z.boolean(),
  // Credits & accrual
  appliedBasedOnCredit: z.boolean(),
  creditTiming: z.enum(['beginning', 'end', 'service-date']),
  creditFrequency: z.enum(['monthly', 'quarterly', 'semi-annually', 'annually']),
  proRataAccrual: z.boolean(),
  // Eligibility
  policyDocument: z.string(),
  gender: z.enum(['All', 'Female', 'Male']),
  maxTimesEnabled: z.boolean(),
  maxTimesCount: numStr(),
  maxTimesPer: z.enum(['year', 'service']),
  // Applicable from
  applicableFrom: z.enum(['doj', 'confirmation', 'confirmation-plus-months', 'after-months']),
  applicableFromMonths: numStr(),
  // Documents
  documentsRequired: z.boolean(),
  documentReminderDays: numStr(),
  documentResponseDays: numStr(),
})

type TypeValues = z.infer<typeof typeSchema>

const NONE_POLICY = '__none__'

const EMPTY_VALUES: TypeValues = {
  name: '',
  description: '',
  category: 'paid',
  unit: 'days',
  allotted: '0',
  instancesPerDay: '2',
  fmla: false,
  applicability: 'All employees',
  canCarryForward: false,
  maxCarryForward: '0',
  canBePaidOut: false,
  minPayoutEligibility: '0',
  exemptHolidays: true,
  exemptWeeklyOffs: true,
  availDuringNotice: false,
  availDuringPip: false,
  appliedBasedOnCredit: false,
  creditTiming: 'beginning',
  creditFrequency: 'annually',
  proRataAccrual: false,
  policyDocument: NONE_POLICY,
  gender: 'All',
  maxTimesEnabled: false,
  maxTimesCount: '1',
  maxTimesPer: 'year',
  applicableFrom: 'doj',
  applicableFromMonths: '0',
  documentsRequired: false,
  documentReminderDays: '0',
  documentResponseDays: '0',
}

function toValues(t: LeaveType): TypeValues {
  return {
    name: t.name,
    description: t.description,
    category: t.category,
    unit: t.unit,
    allotted: String(t.allotted),
    instancesPerDay: String(t.instancesPerDay),
    fmla: t.fmla,
    applicability: t.applicability,
    canCarryForward: t.canCarryForward,
    maxCarryForward: String(t.maxCarryForward),
    canBePaidOut: t.canBePaidOut,
    minPayoutEligibility: String(t.minPayoutEligibility),
    exemptHolidays: t.exemptHolidays,
    exemptWeeklyOffs: t.exemptWeeklyOffs,
    availDuringNotice: t.availDuringNotice,
    availDuringPip: t.availDuringPip,
    appliedBasedOnCredit: t.appliedBasedOnCredit,
    creditTiming: t.creditTiming,
    creditFrequency: t.creditFrequency,
    proRataAccrual: t.proRataAccrual,
    policyDocument: t.policyDocument ?? NONE_POLICY,
    gender: t.gender,
    maxTimesEnabled: t.maxTimesAvailable !== null,
    maxTimesCount: String(t.maxTimesAvailable?.count ?? 1),
    maxTimesPer: t.maxTimesAvailable?.per ?? 'year',
    applicableFrom: t.applicableFrom,
    applicableFromMonths: String(t.applicableFromMonths),
    documentsRequired: t.documentsRequired,
    documentReminderDays: String(t.documentReminderDays),
    documentResponseDays: String(t.documentResponseDays),
  }
}

interface ServicePeriodRow {
  fromYears: string
  toYears: string
  accrual: string
}

/** Section heading inside the add/edit dialog. */
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className='text-neutral-1600 border-b border-gray-200 pb-1 text-xs font-semibold tracking-wide uppercase'>
      {children}
    </h3>
  )
}

/** Pill-style multi-pick where 'All' is exclusive of specific selections. */
function PillMultiPick({
  label,
  options,
  value,
  onChange,
  allowAll = true,
}: {
  label: string
  options: readonly string[]
  value: string[]
  onChange: (next: string[]) => void
  allowAll?: boolean
}) {
  const toggle = (opt: string) => {
    if (opt === 'All') {
      onChange(['All'])
      return
    }
    const specific = value.filter((v) => v !== 'All')
    const next = specific.includes(opt)
      ? specific.filter((v) => v !== opt)
      : [...specific, opt]
    onChange(next.length ? next : allowAll ? ['All'] : [])
  }
  const opts = allowAll ? ['All', ...options] : [...options]
  return (
    <div>
      <FormLabel className='mb-1 block'>{label}</FormLabel>
      <div className='flex flex-wrap gap-1'>
        {opts.map((opt) => {
          const on = value.includes(opt)
          return (
            <button
              type='button'
              key={opt}
              onClick={() => toggle(opt)}
              className={
                on
                  ? 'rounded-full border border-blue-500 bg-blue-50 px-2 py-0.5 text-xs text-blue-700'
                  : 'text-neutral-1000 rounded-full border border-gray-200 px-2 py-0.5 text-xs hover:border-gray-300'
              }
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <span className='text-neutral-1000 block text-[11px]'>{label}</span>
      <span className='text-neutral-1600'>{value}</span>
    </div>
  )
}

const APPLICABLE_FROM_LABEL: Record<LeaveType['applicableFrom'], string> = {
  doj: 'From date of joining',
  confirmation: 'After confirmation',
  'confirmation-plus-months': 'After confirmation + months',
  'after-months': 'After completion of months',
}

function applicableFromText(t: LeaveType) {
  if (t.applicableFrom === 'confirmation-plus-months')
    return `After confirmation + ${t.applicableFromMonths} months`
  if (t.applicableFrom === 'after-months')
    return `After completion of ${t.applicableFromMonths} months`
  return APPLICABLE_FROM_LABEL[t.applicableFrom]
}

function listText(v: string[]) {
  return v.length ? v.join(', ') : '—'
}

/** Expandable detail row surfacing the enriched Kensium facts for a type. */
function TypeDetailRow({ t, colSpan }: { t: LeaveType; colSpan: number }) {
  return (
    <tr className='border-b bg-gray-50/70 last:border-0'>
      <td colSpan={colSpan} className='px-3 py-3'>
        <div className='grid grid-cols-2 gap-x-6 gap-y-2 text-xs md:grid-cols-4'>
          <div className='col-span-2 md:col-span-4'>
            <Fact label='Description' value={t.description || '—'} />
          </div>
          <Fact label='Instances / working day' value={t.instancesPerDay} />
          <Fact
            label='Carry forward'
            value={
              t.canCarryForward ? `Yes — max ${t.maxCarryForward} ${t.unit}` : 'No'
            }
          />
          <Fact
            label='Paid out'
            value={
              t.canBePaidOut ? `Yes — min ${t.minPayoutEligibility} ${t.unit}` : 'No'
            }
          />
          <Fact
            label='Credit basis'
            value={
              t.appliedBasedOnCredit
                ? 'Based on credit (excess = Loss of Pay)'
                : 'Yearly max cap (excess = Loss of Pay)'
            }
          />
          <Fact
            label='Exemptions'
            value={
              [
                t.exemptHolidays ? 'Holidays' : null,
                t.exemptWeeklyOffs ? 'Weekly offs' : null,
              ]
                .filter(Boolean)
                .join(', ') || 'None'
            }
          />
          <Fact
            label='Notice period / PIP'
            value={`${t.availDuringNotice ? 'Notice ✓' : 'Notice ✗'} · ${
              t.availDuringPip ? 'PIP ✓' : 'PIP ✗'
            }`}
          />
          <Fact
            label='Credited at'
            value={
              t.creditTiming === 'service-date'
                ? 'Service date'
                : `${t.creditTiming === 'beginning' ? 'Beginning' : 'End'} of period, ${t.creditFrequency}`
            }
          />
          <Fact label='Pro-rata accrual' value={t.proRataAccrual ? 'Yes' : 'No'} />
          <div className='col-span-2'>
            <Fact
              label='Service periods (years → accrual)'
              value={
                t.servicePeriods.length
                  ? t.servicePeriods
                      .map((s) => `${s.fromYears}–${s.toYears}y: ${s.accrual}`)
                      .join(' · ')
                  : '—'
              }
            />
          </div>
          <Fact label='Policy document' value={t.policyDocument ?? '—'} />
          <Fact label='Gender' value={t.gender} />
          <Fact
            label='Max times availed'
            value={
              t.maxTimesAvailable
                ? `${t.maxTimesAvailable.count} per ${
                    t.maxTimesAvailable.per === 'year' ? 'year' : 'service period'
                  }`
                : 'No limit'
            }
          />
          <Fact label='Applicable from' value={applicableFromText(t)} />
          <Fact label='Locations' value={listText(t.applicableLocations)} />
          <Fact label='Departments' value={listText(t.applicableDepartments)} />
          <Fact label='Positions' value={listText(t.applicablePositions)} />
          <Fact label='Groups' value={listText(t.applicableGroups)} />
          <Fact label='Clubbable with' value={listText(t.clubbableWith)} />
          <Fact label='Needs zero balance of' value={listText(t.zeroBalanceOf)} />
          <Fact
            label='Documents'
            value={
              t.documentsRequired
                ? `Required — remind ${t.documentReminderDays}d before due, respond within ${t.documentResponseDays}d`
                : 'Not required'
            }
          />
          <Fact
            label='Excluded levels'
            value={t.excludedLevels.length ? t.excludedLevels.join(', ') : '—'}
          />
        </div>
      </td>
    </tr>
  )
}

/**
 * One category section (the PDF treats Paid and Unpaid Time Off as separate
 * screens): same table + pagination pattern, activate/deactivate, FMLA badge,
 * plus an expandable detail row per type.
 */
function TypeSection({
  title,
  types,
  paid,
  config,
  onEdit,
}: {
  title: string
  types: LeaveType[]
  paid: boolean
  config: LeaveConfigStore
  onEdit: (t: LeaveType) => void
}) {
  const pager = usePager(types, TYPES_PAGE_SIZE)
  const [expanded, setExpanded] = useState<string | null>(null)
  const colSpan = paid ? 12 : 10

  return (
    <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
      <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
        {title} ({types.length})
      </h3>
      <table className='w-full text-sm'>
        <thead>
          <tr className='text-neutral-1000 border-b text-left text-xs'>
            <th className='w-6 py-2 pr-1' aria-label='Expand' />
            <th className='py-2 pr-3 font-medium'>#</th>
            <th className='pr-3 font-medium'>Leave type</th>
            <th className='px-2 font-medium'>Allotted</th>
            <th className='px-2 font-medium'>Unit</th>
            {paid && <th className='px-2 font-medium'>Carry fwd</th>}
            {paid && <th className='px-2 font-medium'>Payout</th>}
            <th className='px-2 font-medium'>Credit basis</th>
            <th className='px-2 font-medium'>Gender</th>
            <th className='px-2 font-medium'>Docs</th>
            <th className='px-2 font-medium'>Active</th>
            <th className='px-2 text-right font-medium'>Edit</th>
          </tr>
        </thead>
        <tbody>
          {types.length === 0 && (
            <tr>
              <td colSpan={colSpan} className='text-neutral-1000 py-6 text-center'>
                No records to display.
              </td>
            </tr>
          )}
          {pager.pageItems.map((t) => (
            <Fragment key={t.id}>
              <tr className='border-b last:border-0'>
                <td className='py-2 pr-1'>
                  <Button
                    variant='icon2'
                    className='h-5 w-5'
                    aria-label={expanded === t.id ? 'Collapse details' : 'Expand details'}
                    onClick={() => setExpanded((prev) => (prev === t.id ? null : t.id))}
                  >
                    {expanded === t.id ? (
                      <ChevronDown className='size-3.5' />
                    ) : (
                      <ChevronRight className='size-3.5' />
                    )}
                  </Button>
                </td>
                <td className='text-neutral-1000 py-2 pr-3'>{t.order}</td>
                <td className='pr-3 font-medium'>
                  <span className='inline-flex items-center gap-1.5'>
                    {t.name}
                    {t.fmla && <Badge variant='open'>FMLA</Badge>}
                  </span>
                </td>
                <td className='px-2'>{t.allotted || '—'}</td>
                <td className='px-2'>{t.unit}</td>
                {paid && (
                  <td className='px-2 text-xs'>
                    {t.canCarryForward ? `✓ max ${t.maxCarryForward}` : '—'}
                  </td>
                )}
                {paid && (
                  <td className='px-2 text-xs'>
                    {t.canBePaidOut ? `✓ min ${t.minPayoutEligibility}` : '—'}
                  </td>
                )}
                <td className='px-2 text-xs'>
                  {t.appliedBasedOnCredit ? 'Credit' : 'Yearly cap'}
                </td>
                <td className='px-2 text-xs'>{t.gender}</td>
                <td className='px-2 text-xs'>{t.documentsRequired ? 'Required' : '—'}</td>
                <td className='px-2'>
                  <Switch
                    checked={t.active}
                    onCheckedChange={() => config.toggleLeaveType(t.id)}
                  />
                </td>
                <td className='px-2 text-right'>
                  <Button
                    variant='outline'
                    className='h-6 px-2 text-xs'
                    onClick={() => onEdit(t)}
                  >
                    Edit
                  </Button>
                </td>
              </tr>
              {expanded === t.id && <TypeDetailRow t={t} colSpan={colSpan} />}
            </Fragment>
          ))}
        </tbody>
      </table>
      <PagerControls
        page={pager.page}
        pageCount={pager.pageCount}
        total={pager.total}
        onPrev={pager.prev}
        onNext={pager.next}
      />
    </div>
  )
}

/**
 * Paid/Unpaid Time Off catalog (LVE-02/35): full Kensium configuration —
 * tracking unit, instances per day, carry forward & payout, exemptions,
 * credit/accrual with service periods, eligibility, applicability,
 * dependencies, applicable-from and document rules — plus display ordering
 * (LVE-36) and activate/deactivate.
 */
export function ConfigTypes({ config }: { config: LeaveConfigStore }) {
  const [formOpen, setFormOpen] = useState(false)
  const [organizeOpen, setOrganizeOpen] = useState(false)
  const [editing, setEditing] = useState<LeaveType | null>(null)
  const [excluded, setExcluded] = useState<string[]>([])
  const [locations, setLocations] = useState<string[]>(['All'])
  const [departments, setDepartments] = useState<string[]>(['All'])
  const [positions, setPositions] = useState<string[]>(['All'])
  const [groups, setGroups] = useState<string[]>(['All'])
  const [clubbable, setClubbable] = useState<string[]>([])
  const [zeroBalance, setZeroBalance] = useState<string[]>([])
  const [servicePeriods, setServicePeriods] = useState<ServicePeriodRow[]>([])

  // PTO-06 / UPTO-05: the PDF treats paid and unpaid as separate screens.
  const paidTypes = config.orderedTypes.filter((t) => t.category === 'paid')
  const unpaidTypes = config.orderedTypes.filter((t) => t.category === 'unpaid')

  const form = useForm<TypeValues>({
    resolver: zodResolver(typeSchema),
    defaultValues: EMPTY_VALUES,
  })

  const category = form.watch('category')
  const canCarryForward = form.watch('canCarryForward')
  const canBePaidOut = form.watch('canBePaidOut')
  const appliedBasedOnCredit = form.watch('appliedBasedOnCredit')
  const creditTiming = form.watch('creditTiming')
  const maxTimesEnabled = form.watch('maxTimesEnabled')
  const applicableFrom = form.watch('applicableFrom')
  const documentsRequired = form.watch('documentsRequired')
  const unit = form.watch('unit')

  const otherTypeNames = config.orderedTypes
    .map((t) => t.name)
    .filter((n) => n !== editing?.name)

  const openForm = (t: LeaveType | null) => {
    setEditing(t)
    setExcluded(t?.excludedLevels ?? [])
    setLocations(t?.applicableLocations ?? ['All'])
    setDepartments(t?.applicableDepartments ?? ['All'])
    setPositions(t?.applicablePositions ?? ['All'])
    setGroups(t?.applicableGroups ?? ['All'])
    setClubbable(t?.clubbableWith ?? [])
    setZeroBalance(t?.zeroBalanceOf ?? [])
    setServicePeriods(
      (t?.servicePeriods ?? []).map((s) => ({
        fromYears: String(s.fromYears),
        toYears: String(s.toYears),
        accrual: String(s.accrual),
      }))
    )
    form.reset(t ? toValues(t) : EMPTY_VALUES)
    setFormOpen(true)
  }

  const submit = (v: TypeValues) => {
    const unpaid = v.category === 'unpaid'
    const periods: ServicePeriod[] = unpaid
      ? []
      : servicePeriods
          .map((s) => ({
            fromYears: Number(s.fromYears) || 0,
            toYears: Number(s.toYears) || 0,
            accrual: Number(s.accrual) || 0,
          }))
          .filter((s) => s.toYears > s.fromYears || s.accrual > 0)
    const draft: LeaveTypeDraft = {
      name: v.name,
      category: v.category,
      unit: v.unit,
      allotted: Number(v.allotted),
      fmla: v.fmla,
      applicability: v.applicability,
      excludedLevels: excluded,
      description: v.description,
      instancesPerDay: Number(v.instancesPerDay),
      // PDF: unpaid time off can never carry forward or be paid out.
      canCarryForward: unpaid ? false : v.canCarryForward,
      maxCarryForward: unpaid || !v.canCarryForward ? 0 : Number(v.maxCarryForward),
      canBePaidOut: unpaid ? false : v.canBePaidOut,
      minPayoutEligibility:
        unpaid || !v.canBePaidOut ? 0 : Number(v.minPayoutEligibility),
      exemptHolidays: v.exemptHolidays,
      exemptWeeklyOffs: v.exemptWeeklyOffs,
      availDuringNotice: v.availDuringNotice,
      availDuringPip: v.availDuringPip,
      appliedBasedOnCredit: v.appliedBasedOnCredit,
      creditTiming: v.creditTiming,
      creditFrequency: v.creditFrequency,
      proRataAccrual: unpaid ? false : v.proRataAccrual,
      servicePeriods: periods,
      policyDocument: v.policyDocument === NONE_POLICY ? null : v.policyDocument,
      gender: v.gender,
      maxTimesAvailable: v.maxTimesEnabled
        ? { count: Number(v.maxTimesCount), per: v.maxTimesPer }
        : null,
      applicableLocations: locations,
      applicableDepartments: departments,
      applicablePositions: positions,
      applicableGroups: groups,
      clubbableWith: clubbable,
      zeroBalanceOf: zeroBalance,
      applicableFrom: v.applicableFrom,
      applicableFromMonths:
        v.applicableFrom === 'confirmation-plus-months' ||
        v.applicableFrom === 'after-months'
          ? Number(v.applicableFromMonths)
          : 0,
      documentsRequired: v.documentsRequired,
      documentReminderDays: v.documentsRequired ? Number(v.documentReminderDays) : 0,
      documentResponseDays: v.documentsRequired ? Number(v.documentResponseDays) : 0,
    }
    if (editing) config.updateLeaveType(editing.id, draft)
    else config.addLeaveType(draft)
    setFormOpen(false)
  }

  const toggleName = (
    name: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) =>
    setter((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
    )

  return (
    <div className='w-full'>
      <div className='mb-3 flex items-center justify-between'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          Time Off Types ({config.orderedTypes.length})
        </h2>
        <div className='flex items-center gap-2'>
          {/* PTO-06 / UPTO-05: refresh the type list. */}
          <RefreshButton label='Time off types' />
          <Button variant='outline' className='h-7' onClick={() => setOrganizeOpen(true)}>
            Organize Leave Type
          </Button>
          <Button
            variant='red'
            onClick={() => openForm(null)}
            className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
          >
            <Plus size={10} weight='bold' />
            New Type
          </Button>
        </div>
      </div>

      <div className='space-y-4'>
        <TypeSection
          title='Paid time off'
          types={paidTypes}
          paid
          config={config}
          onEdit={openForm}
        />
        <TypeSection
          title='Unpaid time off'
          types={unpaidTypes}
          paid={false}
          config={config}
          onEdit={openForm}
        />
      </div>

      {/* LVE-36: Organize display order */}
      <Dialog open={organizeOpen} onOpenChange={setOrganizeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Organize Leave Type</DialogTitle>
            <DialogDescription>
              The saved order is the sequence employees see in the apply
              dropdown.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-1'>
            {config.orderedTypes.map((t, i) => (
              <div
                key={t.id}
                className='flex items-center justify-between rounded-[6px] border border-gray-200 px-3 py-1.5 text-sm'
              >
                <span>
                  {t.order}. {t.name}
                </span>
                <span className='flex gap-1'>
                  <Button
                    variant='icon2'
                    className='h-6 w-6'
                    disabled={i === 0}
                    onClick={() => config.moveLeaveType(t.id, -1)}
                    aria-label='Move up'
                  >
                    <ArrowUp className='size-3.5' />
                  </Button>
                  <Button
                    variant='icon2'
                    className='h-6 w-6'
                    disabled={i === config.orderedTypes.length - 1}
                    onClick={() => config.moveLeaveType(t.id, 1)}
                    aria-label='Move down'
                  >
                    <ArrowDown className='size-3.5' />
                  </Button>
                </span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setOrganizeOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Type add/edit form — full Kensium PTO (31-field) / UPTO (22-field) set */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-2xl'>
          <DialogHeader>
            <DialogTitle>
              {editing
                ? `Edit ${category} time off`
                : `New ${category} time off`}
            </DialogTitle>
            <DialogDescription>
              Configuration &gt; Leave Management &gt;{' '}
              {category === 'paid' ? 'Paid Time Off' : 'Unpaid Time Off'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(submit)} className='space-y-4'>
              {/* ------------------------------------------------ Basics */}
              <SectionHeading>Basics</SectionHeading>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time off type</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g. Casual leaves, Medical leave' {...field} />
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
                        rows={2}
                        placeholder='Brief description about the leave'
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
                <FormField
                  control={form.control}
                  name='category'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger variant='secondary' className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='paid'>Paid</SelectItem>
                          <SelectItem value='unpaid'>Unpaid</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='unit'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Track in days or hours?</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger variant='secondary' className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='days'>Days</SelectItem>
                          <SelectItem value='hours'>Hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='allotted'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max time offs / year</FormLabel>
                      <FormControl>
                        <Input type='number' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='instancesPerDay'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instances / working day</FormLabel>
                      <FormControl>
                        <Input type='number' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <p className='text-neutral-1000 -mt-2 text-xs'>
                A working day can be split into leave instances by work hours —
                e.g. an 8-hour day where leave can be applied per 4 hours gives
                2 instances.
              </p>
              <FormField
                control={form.control}
                name='fmla'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center gap-2'>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(v) => field.onChange(!!v)}
                        variant='blue'
                      />
                    </FormControl>
                    <FormLabel className='mb-0'>
                      FMLA time-off type (routes via FMLA approvers)
                    </FormLabel>
                  </FormItem>
                )}
              />

              {/* ------------------------- Carry forward & payout (paid only) */}
              {category === 'paid' && (
                <>
                  <SectionHeading>Carry forward &amp; payout</SectionHeading>
                  <div className='grid grid-cols-2 gap-3'>
                    <FormField
                      control={form.control}
                      name='canCarryForward'
                      render={({ field }) => (
                        <FormItem className='flex flex-row items-center gap-2'>
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(v) => field.onChange(!!v)}
                              variant='blue'
                            />
                          </FormControl>
                          <FormLabel className='mb-0'>Can carry forward</FormLabel>
                        </FormItem>
                      )}
                    />
                    {canCarryForward && (
                      <FormField
                        control={form.control}
                        name='maxCarryForward'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max {unit} carried forward</FormLabel>
                            <FormControl>
                              <Input type='number' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                  <div className='grid grid-cols-2 gap-3'>
                    <FormField
                      control={form.control}
                      name='canBePaidOut'
                      render={({ field }) => (
                        <FormItem className='flex flex-row items-center gap-2'>
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(v) => field.onChange(!!v)}
                              variant='blue'
                            />
                          </FormControl>
                          <FormLabel className='mb-0'>Can be paid out</FormLabel>
                        </FormItem>
                      )}
                    />
                    {canBePaidOut && (
                      <FormField
                        control={form.control}
                        name='minPayoutEligibility'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Min {unit} for payout eligibility</FormLabel>
                            <FormControl>
                              <Input type='number' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </>
              )}

              {/* ------------------------------ Exemptions & availability */}
              <SectionHeading>Exemptions &amp; availability</SectionHeading>
              <div className='grid grid-cols-2 gap-2'>
                {(
                  [
                    ['exemptHolidays', 'Exempt holidays falling during leave'],
                    ['exemptWeeklyOffs', 'Exempt weekly offs falling during leave'],
                    ['availDuringNotice', 'Can avail during notice period'],
                    ['availDuringPip', 'Can avail during PIP'],
                  ] as const
                ).map(([name, label]) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name}
                    render={({ field }) => (
                      <FormItem className='flex flex-row items-center gap-2'>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(v) => field.onChange(!!v)}
                            variant='blue'
                          />
                        </FormControl>
                        <FormLabel className='mb-0 text-sm font-normal'>{label}</FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              {/* --------------------------------------- Credits & accrual */}
              <SectionHeading>Credits &amp; accrual</SectionHeading>
              <FormField
                control={form.control}
                name='appliedBasedOnCredit'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-start gap-2'>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(v) => field.onChange(!!v)}
                        variant='blue'
                      />
                    </FormControl>
                    <FormLabel className='mb-0 font-normal'>
                      Time off can be applied based on credit
                    </FormLabel>
                  </FormItem>
                )}
              />
              <p className='text-neutral-1000 -mt-2 text-xs'>
                {appliedBasedOnCredit
                  ? 'Checked: employees can apply only if they have balance in their account. Anything applied beyond the balance goes as Loss of Pay.'
                  : 'Unchecked: employees see the yearly maximum as their balance and can apply up to that duration. Any additional duration is treated as Loss of Pay.'}
              </p>
              {category === 'paid' && (
                <>
                  <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
                    <FormField
                      control={form.control}
                      name='creditTiming'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time off(s) credited at</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger variant='secondary' className='w-full'>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value='beginning'>
                                Beginning of accrual period
                              </SelectItem>
                              <SelectItem value='end'>End of accrual period</SelectItem>
                              <SelectItem value='service-date'>Service date</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    {creditTiming !== 'service-date' && (
                      <FormField
                        control={form.control}
                        name='creditFrequency'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Credit frequency</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger variant='secondary' className='w-full'>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value='monthly'>Monthly</SelectItem>
                                <SelectItem value='quarterly'>Quarterly</SelectItem>
                                <SelectItem value='semi-annually'>Semi-annually</SelectItem>
                                <SelectItem value='annually'>Annually</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    )}
                    <FormField
                      control={form.control}
                      name='proRataAccrual'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pro-rata based accrual?</FormLabel>
                          <div className='flex h-8 items-center'>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div>
                    <div className='mb-1 flex items-center justify-between'>
                      <FormLabel className='mb-0'>Service periods &amp; accrual</FormLabel>
                      <Button
                        type='button'
                        variant='outline'
                        className='h-6 px-2 text-xs'
                        onClick={() =>
                          setServicePeriods((prev) => [
                            ...prev,
                            {
                              fromYears: prev.length
                                ? prev[prev.length - 1].toYears
                                : '0',
                              toYears: '',
                              accrual: '',
                            },
                          ])
                        }
                      >
                        Add new service period
                      </Button>
                    </div>
                    {servicePeriods.length === 0 && (
                      <p className='text-neutral-1000 text-xs'>
                        No service periods — the yearly allotment applies uniformly.
                      </p>
                    )}
                    <div className='space-y-1'>
                      {servicePeriods.map((s, i) => (
                        <div key={i} className='flex items-center gap-2'>
                          <Input
                            type='number'
                            className='h-7 w-20'
                            placeholder='From (yrs)'
                            value={s.fromYears}
                            onChange={(e) =>
                              setServicePeriods((prev) =>
                                prev.map((x, j) =>
                                  j === i ? { ...x, fromYears: e.target.value } : x
                                )
                              )
                            }
                          />
                          <span className='text-neutral-1000 text-xs'>to</span>
                          <Input
                            type='number'
                            className='h-7 w-20'
                            placeholder='To (yrs)'
                            value={s.toYears}
                            onChange={(e) =>
                              setServicePeriods((prev) =>
                                prev.map((x, j) =>
                                  j === i ? { ...x, toYears: e.target.value } : x
                                )
                              )
                            }
                          />
                          <span className='text-neutral-1000 text-xs'>years →</span>
                          <Input
                            type='number'
                            className='h-7 w-24'
                            placeholder='Accrual'
                            value={s.accrual}
                            onChange={(e) =>
                              setServicePeriods((prev) =>
                                prev.map((x, j) =>
                                  j === i ? { ...x, accrual: e.target.value } : x
                                )
                              )
                            }
                          />
                          <span className='text-neutral-1000 text-xs'>
                            {unit} / period
                          </span>
                          <Button
                            type='button'
                            variant='icon2'
                            className='h-6 w-6'
                            aria-label='Remove service period'
                            onClick={() =>
                              setServicePeriods((prev) =>
                                prev.filter((_, j) => j !== i)
                              )
                            }
                          >
                            <X className='size-3.5' />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* -------------------------------------------- Eligibility */}
              <SectionHeading>Eligibility</SectionHeading>
              <div className='grid grid-cols-2 gap-3'>
                <FormField
                  control={form.control}
                  name='policyDocument'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Policy document</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger variant='secondary' className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NONE_POLICY}>None</SelectItem>
                          {POLICY_NAMES.map((n) => (
                            <SelectItem key={n} value={n}>
                              {n}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='gender'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger variant='secondary' className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='All'>All</SelectItem>
                          <SelectItem value='Female'>Female</SelectItem>
                          <SelectItem value='Male'>Male</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
              <div className='flex flex-wrap items-end gap-3'>
                <FormField
                  control={form.control}
                  name='maxTimesEnabled'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-center gap-2 pb-1.5'>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(v) => field.onChange(!!v)}
                          variant='blue'
                        />
                      </FormControl>
                      <FormLabel className='mb-0 font-normal'>
                        Limit maximum no. of times availed
                      </FormLabel>
                    </FormItem>
                  )}
                />
                {maxTimesEnabled && (
                  <>
                    <FormField
                      control={form.control}
                      name='maxTimesCount'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Times</FormLabel>
                          <FormControl>
                            <Input type='number' className='w-20' {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='maxTimesPer'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Per</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger variant='secondary' className='w-[160px]'>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value='year'>Year</SelectItem>
                              <SelectItem value='service'>Service period</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>

              {/* ------------------------------------------ Applicability */}
              <SectionHeading>Applicability</SectionHeading>
              <FormField
                control={form.control}
                name='applicability'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Applicability summary</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g. All employees / US employees' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='space-y-2'>
                <PillMultiPick
                  label='Applicable locations'
                  options={LOCATIONS}
                  value={locations}
                  onChange={setLocations}
                />
                <PillMultiPick
                  label='Applicable departments'
                  options={DEPARTMENTS}
                  value={departments}
                  onChange={setDepartments}
                />
                <PillMultiPick
                  label='Applicable positions'
                  options={POSITION_LEVELS}
                  value={positions}
                  onChange={setPositions}
                />
                <PillMultiPick
                  label='Applicable groups'
                  options={GROUP_COMPANIES}
                  value={groups}
                  onChange={setGroups}
                />
              </div>
              <div>
                <FormLabel className='mb-1 block'>Excluded position levels</FormLabel>
                <div className='grid grid-cols-2 gap-1'>
                  {POSITION_LEVELS.map((lvl) => (
                    <label key={lvl} className='flex items-center gap-2 text-sm'>
                      <Checkbox
                        checked={excluded.includes(lvl)}
                        onCheckedChange={(v) =>
                          setExcluded((prev) =>
                            v ? [...prev, lvl] : prev.filter((x) => x !== lvl)
                          )
                        }
                        variant='blue'
                      />
                      {lvl}
                    </label>
                  ))}
                </div>
              </div>

              {/* ------------------------------------------- Dependencies */}
              <SectionHeading>Dependencies</SectionHeading>
              <div>
                <FormLabel className='mb-1 block'>
                  Can be availed with other selected time offs each year
                </FormLabel>
                <div className='flex flex-wrap gap-1'>
                  {otherTypeNames.map((n) => (
                    <button
                      type='button'
                      key={n}
                      onClick={() => toggleName(n, setClubbable)}
                      className={
                        clubbable.includes(n)
                          ? 'rounded-full border border-blue-500 bg-blue-50 px-2 py-0.5 text-xs text-blue-700'
                          : 'text-neutral-1000 rounded-full border border-gray-200 px-2 py-0.5 text-xs hover:border-gray-300'
                      }
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <FormLabel className='mb-1 block'>
                  Can avail only when there is zero balance in selected time offs
                </FormLabel>
                <div className='flex flex-wrap gap-1'>
                  {otherTypeNames.map((n) => (
                    <button
                      type='button'
                      key={n}
                      onClick={() => toggleName(n, setZeroBalance)}
                      className={
                        zeroBalance.includes(n)
                          ? 'rounded-full border border-blue-500 bg-blue-50 px-2 py-0.5 text-xs text-blue-700'
                          : 'text-neutral-1000 rounded-full border border-gray-200 px-2 py-0.5 text-xs hover:border-gray-300'
                      }
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* ---------------------------------------- Applicable from */}
              <SectionHeading>Applicable from</SectionHeading>
              <FormField
                control={form.control}
                name='applicableFrom'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className='gap-1.5'
                      >
                        {(
                          [
                            ['doj', 'From the date of joining'],
                            ['confirmation', 'After confirmation'],
                            [
                              'confirmation-plus-months',
                              'After confirmation and after completion of “x” months',
                            ],
                            ['after-months', 'After completion of “x” months'],
                          ] as const
                        ).map(([value, label]) => (
                          <label
                            key={value}
                            className='flex items-center gap-2 text-sm'
                          >
                            <RadioGroupItem value={value} />
                            {label}
                          </label>
                        ))}
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
              {(applicableFrom === 'confirmation-plus-months' ||
                applicableFrom === 'after-months') && (
                <FormField
                  control={form.control}
                  name='applicableFromMonths'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>“x” months</FormLabel>
                      <FormControl>
                        <Input type='number' className='w-24' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* ---------------------------------------------- Documents */}
              <SectionHeading>Documents</SectionHeading>
              <FormField
                control={form.control}
                name='documentsRequired'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center gap-2'>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(v) => field.onChange(!!v)}
                        variant='blue'
                      />
                    </FormControl>
                    <FormLabel className='mb-0 font-normal'>
                      Documents are required to submit after availing the time off
                    </FormLabel>
                  </FormItem>
                )}
              />
              {documentsRequired && (
                <div className='grid grid-cols-2 gap-3'>
                  <FormField
                    control={form.control}
                    name='documentReminderDays'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Remind employees “x” days before due date</FormLabel>
                        <FormControl>
                          <Input type='number' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='documentResponseDays'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Response duration from avail date (days)</FormLabel>
                        <FormControl>
                          <Input type='number' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <DialogFooter>
                <Button type='button' variant='outline' onClick={() => setFormOpen(false)}>
                  Cancel
                </Button>
                <Button type='submit'>{editing ? 'Save changes' : 'Add type'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
