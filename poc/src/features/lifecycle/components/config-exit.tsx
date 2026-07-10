import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import {
  type DefaultLwdBasis,
  type DocumentCollectWhen,
  type ExitDocumentToTrack,
  type ExitTypeDef,
  type NoticePeriodUnit,
  type NoticeRule,
} from '../data/config'
import { DEPARTMENTS, LOCATIONS, POSITION_LEVELS } from '../data/shared'
import { type LifecycleConfigStore } from '../hooks/use-lifecycle-config'
import { CheckboxGroup, ChipList, SectionCard } from './config-widgets'

const CATEGORIES = ['Voluntary', 'Involuntary', 'Retirement'] as const

const LAYOFF_FIXED_BEHAVIOURS = [
  'No approval workflow — layoffs are processed directly once initiated.',
  'No exit interview or exit questionnaire is conducted.',
  'Employees are not notified through the system.',
  'A layoff cannot be edited after initiation.',
]

/** Exit enablement, exit-type catalog, notice rules and layoff gating. */
export function ConfigExit({ config }: { config: LifecycleConfigStore }) {
  const [typeDialog, setTypeDialog] = useState<ExitTypeDef | 'new' | null>(null)
  const [typeName, setTypeName] = useState('')
  const [typeCategory, setTypeCategory] =
    useState<(typeof CATEGORIES)[number]>('Voluntary')
  const [typeClassSpecific, setTypeClassSpecific] = useState(false)
  // Common per-type configuration (Kensium exit configuration chapter).
  const [typePolicyDocs, setTypePolicyDocs] = useState('')
  const [typeSlaDays, setTypeSlaDays] = useState('3')
  const [typeConflictLwd, setTypeConflictLwd] = useState(false)
  const [typeDocsToTrack, setTypeDocsToTrack] = useState<ExitDocumentToTrack[]>([])
  const [trackDocName, setTrackDocName] = useState('')
  const [trackDocWhen, setTrackDocWhen] = useState<DocumentCollectWhen>('before-exit')
  // Formal resignation extras.
  const [remindAfterDays, setRemindAfterDays] = useState('3')
  const [maxBackdateDays, setMaxBackdateDays] = useState('7')
  const [lwdBasis, setLwdBasis] = useState<DefaultLwdBasis>('resignation-date')
  // Retirement extras.
  const [retirementAge, setRetirementAge] = useState('60')
  // Absconding extras.
  const [abscondingDays, setAbscondingDays] = useState('5')
  const [absWeeklyOffs, setAbsWeeklyOffs] = useState(false)
  const [absHolidays, setAbsHolidays] = useState(false)
  const [absAlertRM, setAbsAlertRM] = useState(true)
  const [absAlertCoord, setAbsAlertCoord] = useState(true)
  // Poor performance extras.
  const [minQuarters, setMinQuarters] = useState('2')
  // Layoff extras.
  const [layoffMinEmp, setLayoffMinEmp] = useState('10')
  const [layoffTypeApprovers, setLayoffTypeApprovers] = useState<
    { location: string; approver: string }[]
  >([])
  const [layoffTypeLoc, setLayoffTypeLoc] = useState('Hyderabad')
  const [layoffTypeApprover, setLayoffTypeApprover] = useState('')

  // Notice rule filters — drafted in the selects, applied on Search (NP-02).
  const [ruleFilterLoc, setRuleFilterLoc] = useState('all')
  const [ruleFilterDept, setRuleFilterDept] = useState('all')
  const [ruleFilterPos, setRuleFilterPos] = useState('all')
  const [appliedRuleFilters, setAppliedRuleFilters] = useState({
    loc: 'all',
    dept: 'all',
    pos: 'all',
  })
  const [ruleOpen, setRuleOpen] = useState(false)
  const [ruleEditing, setRuleEditing] = useState<string | null>(null)
  const [ruleName, setRuleName] = useState('')
  const [rulePeriodValue, setRulePeriodValue] = useState('30')
  const [rulePeriodUnit, setRulePeriodUnit] = useState<NoticePeriodUnit>('days')
  const [ruleCalendarMonth, setRuleCalendarMonth] = useState(false)
  const [ruleWeeklyOffs, setRuleWeeklyOffs] = useState(true)
  const [ruleHolidays, setRuleHolidays] = useState(true)
  const [ruleDescription, setRuleDescription] = useState('')
  const [ruleLocs, setRuleLocs] = useState<string[]>([])
  const [ruleDepts, setRuleDepts] = useState<string[]>([])
  const [rulePos, setRulePos] = useState<string[]>([])

  const [layoffCount, setLayoffCount] = useState('')
  const [layoffLocation, setLayoffLocation] = useState('Hyderabad')
  const [layoffApprover, setLayoffApprover] = useState('')

  const rules = config.noticeRules.items.filter(
    (r) =>
      (appliedRuleFilters.loc === 'all' ||
        r.locations.includes(appliedRuleFilters.loc)) &&
      (appliedRuleFilters.dept === 'all' ||
        r.departments.includes(appliedRuleFilters.dept)) &&
      (appliedRuleFilters.pos === 'all' ||
        r.positionLevels.includes(appliedRuleFilters.pos))
  )

  // Which conditional editor sections apply to the drafted exit type.
  const nameLc = typeName.toLowerCase()
  const isResignation = typeCategory === 'Voluntary' && nameLc.includes('resignation')
  const isRetirement = typeCategory === 'Retirement'
  const isAbsconding = nameLc.includes('abscond')
  const isPoorPerformance = nameLc.includes('poor performance')
  const isLayoff = nameLc.includes('layoff')

  const openTypeDialog = (t: ExitTypeDef | 'new') => {
    setTypeDialog(t)
    const def = t === 'new' ? null : t
    setTypeName(def?.name ?? '')
    setTypeCategory(def?.category ?? 'Voluntary')
    setTypeClassSpecific(def?.employeeClassSpecific ?? false)
    setTypePolicyDocs(def?.policyDocuments?.join(', ') ?? '')
    setTypeSlaDays(String(def?.slaDays ?? 3))
    setTypeConflictLwd(def?.isConflictLwd ?? false)
    setTypeDocsToTrack(def?.documentsToTrack ? [...def.documentsToTrack] : [])
    setTrackDocName('')
    setTrackDocWhen('before-exit')
    setRemindAfterDays(String(def?.remindAfterDays ?? 3))
    setMaxBackdateDays(String(def?.maxBackdateDays ?? 7))
    setLwdBasis(def?.defaultLwdBasis ?? 'resignation-date')
    setRetirementAge(String(def?.retirementAge ?? 60))
    setAbscondingDays(String(def?.abscondingDays ?? 5))
    setAbsWeeklyOffs(def?.includeWeeklyOffs ?? false)
    setAbsHolidays(def?.includeHolidays ?? false)
    setAbsAlertRM(def?.alertReportingManager ?? true)
    setAbsAlertCoord(def?.alertCoordinator ?? true)
    setMinQuarters(String(def?.minQuarters ?? 2))
    setLayoffMinEmp(String(def?.minEmployees ?? config.settings.layoffMinEmployees))
    setLayoffTypeApprovers(
      def?.layoffApproversByLocation ? [...def.layoffApproversByLocation] : []
    )
    setLayoffTypeApprover('')
  }

  const saveType = () => {
    if (!typeName.trim()) {
      toast.error('Exit type name is required')
      return
    }
    const payload: Omit<ExitTypeDef, 'id'> = {
      name: typeName.trim(),
      category: typeCategory,
      employeeClassSpecific: typeClassSpecific,
      policyDocuments: typePolicyDocs
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean),
      slaDays: Math.max(0, Number(typeSlaDays) || 0),
      isConflictLwd: typeConflictLwd,
      documentsToTrack: typeDocsToTrack,
      ...(isResignation && {
        remindAfterDays: Math.max(0, Number(remindAfterDays) || 0),
        maxBackdateDays: Math.max(0, Number(maxBackdateDays) || 0),
        defaultLwdBasis: lwdBasis,
      }),
      ...(isRetirement && {
        retirementAge: Math.max(0, Number(retirementAge) || 0),
      }),
      ...(isAbsconding && {
        abscondingDays: Math.max(0, Number(abscondingDays) || 0),
        includeWeeklyOffs: absWeeklyOffs,
        includeHolidays: absHolidays,
        alertReportingManager: absAlertRM,
        alertCoordinator: absAlertCoord,
      }),
      ...(isPoorPerformance && {
        minQuarters: Math.max(0, Number(minQuarters) || 0),
      }),
      ...(isLayoff && {
        minEmployees: Math.max(0, Number(layoffMinEmp) || 0),
        layoffApproversByLocation: layoffTypeApprovers,
      }),
    }
    if (typeDialog === 'new') {
      config.exitTypes.add(payload, 'xt')
      config.logConfigChange('Exit type added', payload.name)
      toast.success('Exit type added — selectable on new exit requests')
    } else if (typeDialog) {
      config.exitTypes.update(typeDialog.id, payload)
      config.logConfigChange('Exit type updated', payload.name)
      toast.success('Exit type saved — applies to subsequent exit requests')
    }
    setTypeDialog(null)
  }

  const openRuleDialog = (r: NoticeRule | null) => {
    setRuleEditing(r?.id ?? null)
    setRuleName(r?.name ?? '')
    setRulePeriodValue(String(r?.periodValue ?? r?.durationDays ?? 30))
    setRulePeriodUnit(r?.periodUnit ?? 'days')
    setRuleCalendarMonth(r?.considerCalendarMonth ?? false)
    setRuleWeeklyOffs(r?.includeWeeklyOffs ?? true)
    setRuleHolidays(r?.includeHolidays ?? true)
    setRuleDescription(r?.description ?? '')
    setRuleLocs(r ? [...r.locations] : [...LOCATIONS])
    setRuleDepts(r ? [...r.departments] : [...DEPARTMENTS])
    setRulePos(r ? [...r.positionLevels] : [...POSITION_LEVELS])
    setRuleOpen(true)
  }

  const saveRule = () => {
    const value = Number(rulePeriodValue)
    if (!ruleName.trim() || !value || value < 0) {
      toast.error('Name and a positive period are required')
      return
    }
    if (ruleLocs.length === 0 || ruleDepts.length === 0 || rulePos.length === 0) {
      toast.error('Pick at least one location, department and position level')
      return
    }
    const payload = {
      name: ruleName.trim(),
      durationDays: rulePeriodUnit === 'months' ? value * 30 : value,
      employeeClassSpecific: false,
      locations: ruleLocs,
      departments: ruleDepts,
      positionLevels: rulePos,
      periodValue: value,
      periodUnit: rulePeriodUnit,
      considerCalendarMonth: ruleCalendarMonth,
      includeWeeklyOffs: ruleCalendarMonth ? true : ruleWeeklyOffs,
      includeHolidays: ruleCalendarMonth ? true : ruleHolidays,
      description: ruleDescription.trim(),
    }
    if (ruleEditing) {
      config.noticeRules.update(ruleEditing, payload)
      config.logConfigChange('Notice period rule updated', payload.name)
      toast.success('Notice rule saved — the default LWD of subsequent exits uses it')
    } else {
      config.noticeRules.add(payload, 'nr')
      config.logConfigChange('Notice period rule added', payload.name)
      toast.success('Notice rule added — applies to subsequent exits')
    }
    setRuleOpen(false)
  }

  return (
    <div>
      <SectionCard title='Exit Management setup'>
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <Label>Does your organization support exit management?</Label>
            <Switch
              checked={config.settings.exitManagementEnabled}
              onCheckedChange={(v) =>
                config.updateSettings({ exitManagementEnabled: v }, 'Exit management')
              }
            />
          </div>
          <div className='flex items-center justify-between'>
            <Label>Do you perform exit questionnaire?</Label>
            <Switch
              checked={config.settings.exitQuestionnaireEnabled}
              onCheckedChange={(v) =>
                config.updateSettings({ exitQuestionnaireEnabled: v }, 'Exit questionnaire')
              }
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title='Exit types'
        description='Only configured exit types are selectable when an exit is raised. Each type carries its policy documents, approver SLA and documents to track.'
        actions={
          <Button size='sm' onClick={() => openTypeDialog('new')}>
            Add exit type
          </Button>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Employee-class specific</TableHead>
              <TableHead>Approver SLA</TableHead>
              <TableHead>Policy documents</TableHead>
              <TableHead>Docs to track</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {config.exitTypes.items.map((t) => (
              <TableRow key={t.id}>
                <TableCell className='font-medium'>{t.name}</TableCell>
                <TableCell>
                  <Badge variant='outline'>{t.category}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={t.employeeClassSpecific ? 'badge_active' : 'badge_inactive'}>
                    {t.employeeClassSpecific ? 'Yes' : 'No'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {t.slaDays !== undefined ? `${t.slaDays} day(s)` : '—'}
                </TableCell>
                <TableCell>
                  <ChipList items={t.policyDocuments ?? []} />
                </TableCell>
                <TableCell>
                  <ChipList items={(t.documentsToTrack ?? []).map((d) => d.name)} />
                </TableCell>
                <TableCell>
                  <Button size='sm' variant='outline' onClick={() => openTypeDialog(t)}>
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>

      <SectionCard
        title='Notice period rules'
        description='The rule matching an employee’s location, department and position level derives their notice on exit — the notice period determines the Default LWD.'
        actions={
          <Button size='sm' onClick={() => openRuleDialog(null)}>
            Add rule
          </Button>
        }
      >
        <div className='mb-3 flex flex-wrap items-center gap-2'>
          <Select value={ruleFilterLoc} onValueChange={setRuleFilterLoc}>
            <SelectTrigger variant='secondary' className='h-7 w-[160px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All locations</SelectItem>
              {LOCATIONS.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={ruleFilterDept} onValueChange={setRuleFilterDept}>
            <SelectTrigger variant='secondary' className='h-7 w-[170px]'>
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
          <Select value={ruleFilterPos} onValueChange={setRuleFilterPos}>
            <SelectTrigger variant='secondary' className='h-7 w-[180px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All position levels</SelectItem>
              {POSITION_LEVELS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size='sm'
            onClick={() => {
              setAppliedRuleFilters({
                loc: ruleFilterLoc,
                dept: ruleFilterDept,
                pos: ruleFilterPos,
              })
              toast.success('Notice period rules filtered')
            }}
          >
            Search
          </Button>
          <Button
            size='sm'
            variant='outline'
            onClick={() => {
              setRuleFilterLoc('all')
              setRuleFilterDept('all')
              setRuleFilterPos('all')
              setAppliedRuleFilters({ loc: 'all', dept: 'all', pos: 'all' })
            }}
          >
            Reset
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rule</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Counting basis</TableHead>
              <TableHead>Class specific</TableHead>
              <TableHead>Locations</TableHead>
              <TableHead>Departments</TableHead>
              <TableHead>Position levels</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className='text-neutral-1000 text-center text-sm'>
                  No records found
                </TableCell>
              </TableRow>
            ) : (
              rules.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className='font-medium'>{r.name}</TableCell>
                  <TableCell>
                    {r.periodValue ?? r.durationDays} {r.periodUnit ?? 'days'}
                  </TableCell>
                  <TableCell className='text-xs'>
                    {r.considerCalendarMonth
                      ? 'Calendar month'
                      : `Offs: ${r.includeWeeklyOffs === false ? 'No' : 'Yes'} · Holidays: ${
                          r.includeHolidays === false ? 'No' : 'Yes'
                        }`}
                  </TableCell>
                  <TableCell>{r.employeeClassSpecific ? 'Yes' : 'No'}</TableCell>
                  <TableCell><ChipList items={r.locations} /></TableCell>
                  <TableCell><ChipList items={r.departments} /></TableCell>
                  <TableCell><ChipList items={r.positionLevels} /></TableCell>
                  <TableCell>
                    <Button size='sm' variant='outline' onClick={() => openRuleDialog(r)}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </SectionCard>

      <SectionCard
        title='Layoff threshold & approvers'
        description='Layoffs below the minimum headcount are not processed as layoffs; requests route to the location approver.'
      >
        <div className='mb-3 flex flex-wrap items-end gap-2'>
          <div className='space-y-1'>
            <Label>Minimum employees to initiate a layoff</Label>
            <Input
              type='number'
              className='w-[220px]'
              value={config.settings.layoffMinEmployees}
              onChange={(e) =>
                config.updateSettings(
                  { layoffMinEmployees: Number(e.target.value) || 0 },
                  'Layoff threshold'
                )
              }
            />
          </div>
          <div className='space-y-1'>
            <Label>Simulate: affected employees</Label>
            <Input
              type='number'
              className='w-[180px]'
              value={layoffCount}
              onChange={(e) => setLayoffCount(e.target.value)}
              placeholder='e.g. 6'
            />
          </div>
          <Button
            size='sm'
            onClick={() => {
              const n = Number(layoffCount)
              if (!n || n < config.settings.layoffMinEmployees) {
                toast.error(
                  `Not processed as a layoff — fewer than ${config.settings.layoffMinEmployees} employees`
                )
              } else {
                toast.success('Layoff initiated — routed to the location approvers')
              }
            }}
          >
            Initiate layoff (demo)
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Location</TableHead>
              <TableHead>Approver</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {LOCATIONS.map((loc) => {
              const entries = config.layoffApprovers.items.filter(
                (a) => a.location === loc
              )
              return entries.length === 0 ? (
                <TableRow key={loc}>
                  <TableCell>{loc}</TableCell>
                  <TableCell className='text-neutral-1000 text-xs'>
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.location}</TableCell>
                    <TableCell>{a.approver}</TableCell>
                  </TableRow>
                ))
              )
            })}
          </TableBody>
        </Table>
        <div className='mt-3 flex flex-wrap items-end gap-2'>
          <Select value={layoffLocation} onValueChange={setLayoffLocation}>
            <SelectTrigger variant='secondary' className='h-8 w-[160px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOCATIONS.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            className='w-[200px]'
            placeholder='Approver name'
            value={layoffApprover}
            onChange={(e) => setLayoffApprover(e.target.value)}
          />
          <Button
            size='sm'
            onClick={() => {
              if (!layoffApprover.trim()) {
                toast.error('Approver name is required')
                return
              }
              config.layoffApprovers.add(
                { location: layoffLocation, approver: layoffApprover.trim() },
                'la'
              )
              config.logConfigChange('Layoff approver added', `${layoffLocation} · ${layoffApprover.trim()}`)
              toast.success('Layoff approver added')
              setLayoffApprover('')
            }}
          >
            Add approver
          </Button>
        </div>
      </SectionCard>

      {/* Exit type dialog */}
      <Dialog open={typeDialog !== null} onOpenChange={(o) => !o && setTypeDialog(null)}>
        <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-[560px]'>
          <DialogHeader>
            <DialogTitle>
              {typeDialog === 'new' ? 'Add exit type' : 'Edit exit type'}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1'>
              <Label>Name</Label>
              <Input value={typeName} onChange={(e) => setTypeName(e.target.value)} />
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1'>
                <Label>Type</Label>
                <Select
                  value={typeCategory}
                  onValueChange={(v) => setTypeCategory(v as (typeof CATEGORIES)[number])}
                >
                  <SelectTrigger variant='secondary' className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-1'>
                <Label>Approver SLA (days)</Label>
                <Input
                  type='number'
                  value={typeSlaDays}
                  onChange={(e) => setTypeSlaDays(e.target.value)}
                />
                <p className='text-neutral-1000 text-xs'>
                  Each approver must act within this many days.
                </p>
              </div>
            </div>
            <div className='flex items-center justify-between'>
              <Label>Employee-class specific</Label>
              <Switch checked={typeClassSpecific} onCheckedChange={setTypeClassSpecific} />
            </div>
            <div className='space-y-1'>
              <Label>Policy documents (comma separated)</Label>
              <Input
                value={typePolicyDocs}
                onChange={(e) => setTypePolicyDocs(e.target.value)}
                placeholder='Exit policy, Notice period policy'
              />
              <p className='text-neutral-1000 text-xs'>
                Viewable by participants during exit transactions.
              </p>
            </div>
            <div className='space-y-1'>
              <div className='flex items-center justify-between'>
                <Label>Resolve conflicting LWDs</Label>
                <Switch checked={typeConflictLwd} onCheckedChange={setTypeConflictLwd} />
              </div>
              <p className='text-neutral-1000 text-xs'>
                When approvers across departments recommend conflicting LWDs,
                the conflict goes to their common approver. Within the same
                department the higher approver&apos;s LWD wins.
              </p>
            </div>

            {/* Documents to track */}
            <div className='space-y-1'>
              <Label>Documents to track</Label>
              {typeDocsToTrack.length > 0 && (
                <div className='space-y-1.5'>
                  {typeDocsToTrack.map((d, i) => (
                    <div
                      key={`${d.name}-${i}`}
                      className='flex items-center justify-between rounded-[6px] border border-gray-200 px-2 py-1.5'
                    >
                      <span className='text-sm'>{d.name}</span>
                      <div className='flex items-center gap-2'>
                        <Badge variant='outline' className='text-[11px]'>
                          {d.collectWhen === 'before-exit' ? 'Before exit' : 'On LWD'}
                        </Badge>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() =>
                            setTypeDocsToTrack((prev) => prev.filter((_, j) => j !== i))
                          }
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className='flex flex-wrap items-center gap-2'>
                <Input
                  className='w-[220px]'
                  value={trackDocName}
                  onChange={(e) => setTrackDocName(e.target.value)}
                  placeholder='Document name'
                />
                <Select
                  value={trackDocWhen}
                  onValueChange={(v) => setTrackDocWhen(v as DocumentCollectWhen)}
                >
                  <SelectTrigger variant='secondary' className='h-8 w-[150px]'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='before-exit'>Before exit</SelectItem>
                    <SelectItem value='on-lwd'>On LWD</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => {
                    if (!trackDocName.trim()) {
                      toast.error('Document name is required')
                      return
                    }
                    setTypeDocsToTrack((prev) => [
                      ...prev,
                      { name: trackDocName.trim(), collectWhen: trackDocWhen },
                    ])
                    setTrackDocName('')
                  }}
                >
                  Add document
                </Button>
              </div>
            </div>

            {/* Formal resignation extras */}
            {isResignation && (
              <div className='space-y-3 rounded-[6px] border border-gray-200 p-3'>
                <p className='text-sm font-medium'>Formal resignation settings</p>
                <div className='grid grid-cols-2 gap-3'>
                  <div className='space-y-1'>
                    <Label>Remind after (days)</Label>
                    <Input
                      type='number'
                      value={remindAfterDays}
                      onChange={(e) => setRemindAfterDays(e.target.value)}
                    />
                    <p className='text-neutral-1000 text-xs'>
                      Exit coordinator and reporting manager are reminded if
                      the employee has not submitted the resignation form.
                    </p>
                  </div>
                  <div className='space-y-1'>
                    <Label>Max backdate (days)</Label>
                    <Input
                      type='number'
                      value={maxBackdateDays}
                      onChange={(e) => setMaxBackdateDays(e.target.value)}
                    />
                    <p className='text-neutral-1000 text-xs'>
                      Max prior days allowed for a backdated resignation date.
                    </p>
                  </div>
                </div>
                <div className='space-y-1'>
                  <Label>Default LWD basis</Label>
                  <Select
                    value={lwdBasis}
                    onValueChange={(v) => setLwdBasis(v as DefaultLwdBasis)}
                  >
                    <SelectTrigger variant='secondary' className='w-full'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='resignation-date'>Resignation date</SelectItem>
                      <SelectItem value='approval-date'>Approval date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Retirement extras */}
            {isRetirement && (
              <div className='space-y-3 rounded-[6px] border border-gray-200 p-3'>
                <p className='text-sm font-medium'>Retirement settings</p>
                <div className='space-y-1'>
                  <Label>Retirement age (years)</Label>
                  <Input
                    type='number'
                    value={retirementAge}
                    onChange={(e) => setRetirementAge(e.target.value)}
                  />
                  <p className='text-neutral-1000 text-xs'>
                    HR is auto-notified based on the employee&apos;s date of birth.
                  </p>
                </div>
              </div>
            )}

            {/* Absconding extras */}
            {isAbsconding && (
              <div className='space-y-3 rounded-[6px] border border-gray-200 p-3'>
                <p className='text-sm font-medium'>Absconding settings</p>
                <div className='space-y-1'>
                  <Label>Absent days before eligibility</Label>
                  <Input
                    type='number'
                    value={abscondingDays}
                    onChange={(e) => setAbscondingDays(e.target.value)}
                  />
                  <p className='text-neutral-1000 text-xs'>
                    An employee absent for this many days becomes eligible for
                    an absconding exit.
                  </p>
                </div>
                <div className='flex items-center justify-between'>
                  <Label>Include weekly offs in the count</Label>
                  <Switch checked={absWeeklyOffs} onCheckedChange={setAbsWeeklyOffs} />
                </div>
                <div className='flex items-center justify-between'>
                  <Label>Include holidays in the count</Label>
                  <Switch checked={absHolidays} onCheckedChange={setAbsHolidays} />
                </div>
                <div className='flex items-center justify-between'>
                  <Label>Alert reporting manager</Label>
                  <Switch checked={absAlertRM} onCheckedChange={setAbsAlertRM} />
                </div>
                <div className='flex items-center justify-between'>
                  <Label>Alert exit coordinator</Label>
                  <Switch checked={absAlertCoord} onCheckedChange={setAbsAlertCoord} />
                </div>
              </div>
            )}

            {/* Poor performance extras */}
            {isPoorPerformance && (
              <div className='space-y-3 rounded-[6px] border border-gray-200 p-3'>
                <p className='text-sm font-medium'>Poor performance settings</p>
                <div className='space-y-1'>
                  <Label>Minimum evaluation quarters</Label>
                  <Input
                    type='number'
                    value={minQuarters}
                    onChange={(e) => setMinQuarters(e.target.value)}
                  />
                  <p className='text-neutral-1000 text-xs'>
                    Minimum quarters of performance evaluation before a poor
                    performance exit can be initiated.
                  </p>
                </div>
              </div>
            )}

            {/* Layoff extras */}
            {isLayoff && (
              <div className='space-y-3 rounded-[6px] border border-gray-200 p-3'>
                <p className='text-sm font-medium'>Layoff settings</p>
                <div className='space-y-1'>
                  <Label>Minimum employees to initiate a layoff</Label>
                  <Input
                    type='number'
                    value={layoffMinEmp}
                    onChange={(e) => setLayoffMinEmp(e.target.value)}
                  />
                </div>
                <div className='space-y-1'>
                  <Label>Layoff approvers by location</Label>
                  {layoffTypeApprovers.length > 0 && (
                    <div className='space-y-1.5'>
                      {layoffTypeApprovers.map((a, i) => (
                        <div
                          key={`${a.location}-${i}`}
                          className='flex items-center justify-between rounded-[6px] border border-gray-200 px-2 py-1.5'
                        >
                          <span className='text-sm'>
                            {a.location} · {a.approver}
                          </span>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() =>
                              setLayoffTypeApprovers((prev) =>
                                prev.filter((_, j) => j !== i)
                              )
                            }
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className='flex flex-wrap items-center gap-2'>
                    <Select value={layoffTypeLoc} onValueChange={setLayoffTypeLoc}>
                      <SelectTrigger variant='secondary' className='h-8 w-[150px]'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LOCATIONS.map((l) => (
                          <SelectItem key={l} value={l}>
                            {l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      className='w-[180px]'
                      value={layoffTypeApprover}
                      onChange={(e) => setLayoffTypeApprover(e.target.value)}
                      placeholder='Approver name'
                    />
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => {
                        if (!layoffTypeApprover.trim()) {
                          toast.error('Approver name is required')
                          return
                        }
                        setLayoffTypeApprovers((prev) => [
                          ...prev,
                          { location: layoffTypeLoc, approver: layoffTypeApprover.trim() },
                        ])
                        setLayoffTypeApprover('')
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
                <div className='space-y-1'>
                  <Label>Fixed layoff behaviours</Label>
                  <ul className='text-neutral-1000 list-disc space-y-0.5 pl-4 text-xs'>
                    {LAYOFF_FIXED_BEHAVIOURS.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setTypeDialog(null)}>
              Cancel
            </Button>
            <Button onClick={saveType}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notice rule dialog */}
      <Dialog open={ruleOpen} onOpenChange={setRuleOpen}>
        <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-[560px]'>
          <DialogHeader>
            <DialogTitle>
              {ruleEditing ? 'Edit notice period rule' : 'Add notice period rule'}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1'>
              <Label>Rule name</Label>
              <Input value={ruleName} onChange={(e) => setRuleName(e.target.value)} />
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1'>
                <Label>Notice period</Label>
                <Input
                  type='number'
                  value={rulePeriodValue}
                  onChange={(e) => setRulePeriodValue(e.target.value)}
                />
              </div>
              <div className='space-y-1'>
                <Label>Unit</Label>
                <Select
                  value={rulePeriodUnit}
                  onValueChange={(v) => setRulePeriodUnit(v as NoticePeriodUnit)}
                >
                  <SelectTrigger variant='secondary' className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='days'>Days</SelectItem>
                    <SelectItem value='months'>Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className='space-y-1'>
              <div className='flex items-center justify-between'>
                <Label>Consider calendar month</Label>
                <Switch checked={ruleCalendarMonth} onCheckedChange={setRuleCalendarMonth} />
              </div>
              <p className='text-neutral-1000 text-xs'>
                When on, the notice is counted as calendar time — weekly offs
                and holidays are ignored.
              </p>
            </div>
            <div className='flex items-center justify-between'>
              <Label className={ruleCalendarMonth ? 'text-neutral-1000' : undefined}>
                Include weekly offs
              </Label>
              <Switch
                checked={ruleCalendarMonth ? true : ruleWeeklyOffs}
                onCheckedChange={setRuleWeeklyOffs}
                disabled={ruleCalendarMonth}
              />
            </div>
            <div className='flex items-center justify-between'>
              <Label className={ruleCalendarMonth ? 'text-neutral-1000' : undefined}>
                Include holidays
              </Label>
              <Switch
                checked={ruleCalendarMonth ? true : ruleHolidays}
                onCheckedChange={setRuleHolidays}
                disabled={ruleCalendarMonth}
              />
            </div>
            <div className='space-y-1'>
              <Label>Description</Label>
              <Textarea
                value={ruleDescription}
                onChange={(e) => setRuleDescription(e.target.value)}
                placeholder='When this rule applies…'
              />
            </div>
            <div className='space-y-1'>
              <Label>Applicable locations</Label>
              <CheckboxGroup options={LOCATIONS} value={ruleLocs} onChange={setRuleLocs} />
            </div>
            <div className='space-y-1'>
              <Label>Applicable departments</Label>
              <CheckboxGroup options={DEPARTMENTS} value={ruleDepts} onChange={setRuleDepts} />
            </div>
            <div className='space-y-1'>
              <Label>Applicable position levels</Label>
              <CheckboxGroup options={POSITION_LEVELS} value={rulePos} onChange={setRulePos} />
            </div>
            <p className='text-neutral-1000 text-xs'>
              The notice period determines the Default LWD on an exit request.
            </p>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setRuleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveRule}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
