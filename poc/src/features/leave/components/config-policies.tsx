import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'phosphor-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  policySpecificity,
  type LeavePolicy,
  type PolicyScope,
} from '../data/policies'
import {
  COMPANIES,
  DEPARTMENTS,
  EMPLOYEE_TYPES,
  GROUP_COMPANIES,
  JURISDICTIONS,
  LOCATIONS,
  fmtDate,
} from '../data/shared'
import { type LeaveConfigStore } from '../hooks/use-leave-config'
import { StatusBadge } from './badges'

const ANY = '__any__'

const policySchema = z.object({
  name: z.string().min(3, 'Policy name is required'),
  employeeType: z.string(),
  group: z.string(),
  jurisdiction: z.string(),
  company: z.string(),
  department: z.string(),
  location: z.string(),
  entitlementSummary: z.string().min(3, 'Describe the entitlements'),
  accrual: z.enum(['monthly', 'quarterly', 'annual grant']),
  carryForwardCap: z
    .string()
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, 'Enter a valid cap'),
  effectiveFrom: z.string().min(1, 'Effective date is required'),
  note: z.string().min(3, 'A change note is required (kept in version history)'),
})

type PolicyValues = z.infer<typeof policySchema>

function scopeLabel(scope: PolicyScope) {
  const parts = Object.entries(scope)
    .filter(([, v]) => v !== null)
    .map(([k, v]) => `${k}: ${v}`)
  return parts.length ? parts.join(' · ') : 'All employees (least specific)'
}

interface ConfigPoliciesProps {
  config: LeaveConfigStore
  /** Group admins manage baselines; company admins manage company policies. */
  isGroupAdmin: boolean
}

/**
 * Differentiated leave policies (LVE-01): scope by employee type, group,
 * jurisdiction, company, department, location; effective-dated versions with
 * retained history (LVE-21) and group baselines (LVE-18).
 */
export function ConfigPolicies({ config, isGroupAdmin }: ConfigPoliciesProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<LeavePolicy | null>(null)
  const [historyFor, setHistoryFor] = useState<LeavePolicy | null>(null)

  const form = useForm<PolicyValues>({
    resolver: zodResolver(policySchema),
    defaultValues: {
      name: '',
      employeeType: ANY,
      group: ANY,
      jurisdiction: ANY,
      company: ANY,
      department: ANY,
      location: ANY,
      entitlementSummary: '',
      accrual: 'monthly',
      carryForwardCap: '0',
      effectiveFrom: '',
      note: '',
    },
  })

  const openForm = (p: LeavePolicy | null) => {
    setEditing(p)
    form.reset(
      p
        ? {
            name: p.name,
            employeeType: p.scope.employeeType ?? ANY,
            group: p.scope.group ?? ANY,
            jurisdiction: p.scope.jurisdiction ?? ANY,
            company: p.scope.company ?? ANY,
            department: p.scope.department ?? ANY,
            location: p.scope.location ?? ANY,
            entitlementSummary: p.entitlementSummary,
            accrual: p.accrual,
            carryForwardCap: String(p.carryForwardCap),
            effectiveFrom: p.effectiveFrom,
            note: '',
          }
        : undefined
    )
    setFormOpen(true)
  }

  const submit = (v: PolicyValues) => {
    const scope: PolicyScope = {
      employeeType: v.employeeType === ANY ? null : v.employeeType,
      group: v.group === ANY ? null : v.group,
      jurisdiction: v.jurisdiction === ANY ? null : v.jurisdiction,
      company: v.company === ANY ? null : v.company,
      department: v.department === ANY ? null : v.department,
      location: v.location === ANY ? null : v.location,
    }
    config.savePolicy(
      editing?.id ?? null,
      {
        name: v.name,
        scope,
        entitlementSummary: v.entitlementSummary,
        accrual: v.accrual,
        carryForwardCap: Number(v.carryForwardCap),
        effectiveFrom: v.effectiveFrom,
        source: isGroupAdmin ? 'group-baseline' : 'company',
        company: editing?.company ?? (isGroupAdmin ? 'Group (all companies)' : 'Satellite Tech India'),
      },
      v.note
    )
    setFormOpen(false)
  }

  const scopeOptions = (
    name: 'employeeType' | 'group' | 'jurisdiction' | 'company' | 'department' | 'location',
    label: string,
    options: readonly string[]
  ) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger variant='secondary' className='w-full'>
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value={ANY}>Any (not differentiated)</SelectItem>
              {options.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormItem>
      )}
    />
  )

  const visible = isGroupAdmin
    ? config.policies.filter((p) => p.source === 'group-baseline')
    : config.policies

  return (
    <div className='w-full'>
      <div className='mb-3 flex items-center justify-between'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          {isGroupAdmin ? 'Group Baseline Policies' : 'Leave Policies'} ({visible.length})
          <span className='text-neutral-1000 ml-2 text-xs'>
            most-specific scope wins when an employee matches multiple policies
          </span>
        </h2>
        <Button
          variant='red'
          onClick={() => openForm(null)}
          className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
        >
          <Plus size={10} weight='bold' />
          New Policy
        </Button>
      </div>

      <div className='space-y-2'>
        {visible.map((p) => (
          <div key={p.id} className='rounded-[8px] border border-gray-200 bg-white p-3'>
            <div className='flex items-center justify-between gap-3'>
              <div className='min-w-0'>
                <div className='flex items-center gap-2 text-sm font-medium'>
                  {p.name}
                  <StatusBadge status={p.status} />
                  <span className='text-neutral-1000 text-xs'>
                    v{p.version} · effective {fmtDate(p.effectiveFrom)} · specificity{' '}
                    {policySpecificity(p.scope)}
                    {p.source === 'group-baseline' && ' · group baseline'}
                  </span>
                </div>
                <div className='text-neutral-1000 text-xs'>{scopeLabel(p.scope)}</div>
                <div className='text-neutral-1900 text-xs'>
                  {p.entitlementSummary} · {p.accrual} accrual · carry-forward cap{' '}
                  {p.carryForwardCap}
                </div>
              </div>
              <div className='flex shrink-0 gap-2'>
                <Button variant='outline' className='h-6 px-2 text-xs' onClick={() => setHistoryFor(p)}>
                  Versions ({p.versions.length})
                </Button>
                {p.source === 'group-baseline' && isGroupAdmin && (
                  <Button
                    variant='outline'
                    className='h-6 px-2 text-xs'
                    onClick={() => config.propagateBaseline(p.id)}
                  >
                    Propagate
                  </Button>
                )}
                {p.status !== 'superseded' && (
                  <Button variant='outline' className='h-6 px-2 text-xs' onClick={() => openForm(p)}>
                    Edit (new version)
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* LVE-21: effective-dated version history */}
      <Dialog open={historyFor !== null} onOpenChange={(o) => !o && setHistoryFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Version history — {historyFor?.name}</DialogTitle>
            <DialogDescription>
              Prior versions are retained, never overwritten. Requests are
              evaluated against the version effective on the leave dates.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-2'>
            {historyFor?.versions
              .slice()
              .reverse()
              .map((v) => (
                <div key={v.version} className='rounded-[6px] border border-gray-200 px-3 py-2 text-sm'>
                  <div className='font-medium'>
                    v{v.version} — effective {fmtDate(v.effectiveFrom)}
                  </div>
                  <div className='text-neutral-1000 text-xs'>
                    recorded {new Date(v.recordedAt).toLocaleString('en-GB')} by {v.changedBy}
                  </div>
                  <div className='text-xs'>{v.note}</div>
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Policy form */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-[560px]'>
          <DialogHeader>
            <DialogTitle>{editing ? `Re-version ${editing.name}` : 'New leave policy'}</DialogTitle>
            <DialogDescription>
              Combine differentiators — the policy applies only to employees
              matching all selected criteria. Saving creates a new
              effective-dated version.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(submit)} className='space-y-3'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Policy name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='grid grid-cols-2 gap-3'>
                {scopeOptions('employeeType', 'Employee type', EMPLOYEE_TYPES)}
                {scopeOptions('group', 'Group', GROUP_COMPANIES)}
                {scopeOptions('jurisdiction', 'Jurisdiction', JURISDICTIONS)}
                {scopeOptions('company', 'Company', COMPANIES)}
                {scopeOptions('department', 'Department', DEPARTMENTS)}
                {scopeOptions('location', 'Location', LOCATIONS)}
              </div>
              <FormField
                control={form.control}
                name='entitlementSummary'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entitlement summary</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g. 18 PL / 8 CL / 12 SL days' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='grid grid-cols-3 gap-3'>
                <FormField
                  control={form.control}
                  name='accrual'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Accrual</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger variant='secondary' className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='monthly'>Monthly</SelectItem>
                          <SelectItem value='quarterly'>Quarterly</SelectItem>
                          <SelectItem value='annual grant'>Annual grant</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='carryForwardCap'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carry-forward cap</FormLabel>
                      <FormControl>
                        <Input type='number' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='effectiveFrom'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Effective from</FormLabel>
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
                name='note'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Change note (stored in version history)</FormLabel>
                    <FormControl>
                      <Input placeholder='What changed and why' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type='button' variant='outline' onClick={() => setFormOpen(false)}>
                  Cancel
                </Button>
                <Button type='submit'>
                  {editing ? 'Save as new version' : 'Create policy'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
