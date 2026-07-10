import { useState } from 'react'
import { ArrowsClockwise, PencilSimple, Plus } from 'phosphor-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
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
import {
  RECRUITMENT_POSITIONS,
  type InterviewPanel,
  type PreInterviewQuestion,
  type RoundsConfig,
} from '../data/config'
import { DEPARTMENTS, EMPLOYEE_CLASSES, LOCATIONS } from '../data/requisitions'
import { POSITION_LEVELS } from '../data/vacancies'
import type { RecruitmentConfigStore } from '../hooks/use-recruitment-config'
import { StatusBadge } from './badges'

/** Toggle-chip multi-pick used for panel department/position applicability. */
function ChipPicker({
  label,
  options,
  selected,
  onChange,
}: {
  label: string
  options: readonly string[]
  selected: string[]
  onChange: (next: string[]) => void
}) {
  return (
    <div>
      <p className='text-paragraph-sm text-neutral-1000 mb-1.5'>{label}</p>
      <div className='flex flex-wrap gap-1.5'>
        {options.map((opt) => {
          const active = selected.includes(opt)
          return (
            <button
              key={opt}
              type='button'
              onClick={() =>
                onChange(
                  active
                    ? selected.filter((s) => s !== opt)
                    : [...selected, opt]
                )
              }
              className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                active
                  ? 'border-blue-1200 bg-blue-150 text-blue-1400 font-medium'
                  : 'border-gray-200 bg-white text-neutral-1000 hover:border-gray-300'
              }`}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Interview configuration — panels, sequential rounds mapped to panels,
 * versioned scorecard criteria and the weighted pre-interview questionnaire
 * (TA-07, TA-16, TA-41, TA-43).
 */
export function ConfigHiring({ config }: { config: RecruitmentConfigStore }) {
  const [panelOpen, setPanelOpen] = useState(false)
  const [panelName, setPanelName] = useState('')
  const [panelMembers, setPanelMembers] = useState('')
  // Panel description + cascading location → departments → positions scope
  const [panelExtras, setPanelExtras] = useState({
    description: '',
    applicableLocation: 'All',
    applicableDepartments: [] as string[],
    applicablePositions: [] as string[],
  })
  const [editingPanel, setEditingPanel] = useState<InterviewPanel | null>(null)
  const [editMembers, setEditMembers] = useState('')
  const [editPanelExtras, setEditPanelExtras] = useState({
    description: '',
    applicableLocation: 'All',
    applicableDepartments: [] as string[],
    applicablePositions: [] as string[],
  })

  // IPN-05: paging over the panel list
  const [panelPage, setPanelPage] = useState(0)
  const PANEL_PAGE_SIZE = 3
  const panelPageCount = Math.max(
    1,
    Math.ceil(config.panels.length / PANEL_PAGE_SIZE)
  )
  const safePanelPage = Math.min(panelPage, panelPageCount - 1)
  const pagedPanels = config.panels.slice(
    safePanelPage * PANEL_PAGE_SIZE,
    (safePanelPage + 1) * PANEL_PAGE_SIZE
  )

  const [roundsOpen, setRoundsOpen] = useState(false)
  const [roundsName, setRoundsName] = useState('')
  const [roundsDept, setRoundsDept] = useState<string>(DEPARTMENTS[0])
  const [roundsClass, setRoundsClass] = useState<string>('All')
  const [roundPanels, setRoundPanels] = useState<string[]>([''])
  // Parallel per-round mandatory flags for the add-rounds dialog
  const [roundMandatory, setRoundMandatory] = useState<boolean[]>([false])
  const [roundsFilter, setRoundsFilter] = useState('all')
  // IRD-02: additional filters — employee class, location, position level
  const [roundsClassFilter, setRoundsClassFilter] = useState('all')
  const [roundsLocationFilter, setRoundsLocationFilter] = useState('all')
  const [roundsPositionFilter, setRoundsPositionFilter] = useState('all')

  // IRD-04: view / edit an existing rounds entry
  const [editingRounds, setEditingRounds] = useState<RoundsConfig | null>(null)
  const [editRoundsDraft, setEditRoundsDraft] = useState({
    name: '',
    department: DEPARTMENTS[0] as string,
    employeeClass: 'All',
    panelIds: [] as string[],
    mandatory: [] as boolean[],
  })

  const [weights, setWeights] = useState<Record<string, string>>({})

  const [qOpen, setQOpen] = useState(false)
  const [qDraft, setQDraft] = useState({
    category: 'Experience',
    question: '',
    questionType: 'Objective' as PreInterviewQuestion['questionType'],
    fieldType: 'Number' as PreInterviewQuestion['fieldType'],
    positionLevel: 'All',
    employeeClass: 'All',
    value: '1',
    score: '5',
    mandatory: false,
    weightage: '25',
  })

  const saveCriteria = () => {
    config.saveCriteria(
      config.criteria.map((c) => ({
        ...c,
        weight: Number(weights[c.id] ?? c.weight),
      }))
    )
    setWeights({})
  }

  const filteredRounds = config.roundsConfigs.filter(
    (r) =>
      (roundsFilter === 'all' || r.department === roundsFilter) &&
      (roundsClassFilter === 'all' ||
        r.employeeClass === 'All' ||
        r.employeeClass === roundsClassFilter) &&
      (roundsLocationFilter === 'all' ||
        r.location === 'All' ||
        r.location === roundsLocationFilter) &&
      (roundsPositionFilter === 'all' ||
        r.position === 'All' ||
        r.position === roundsPositionFilter)
  )

  // IRD-03: reset every rounds filter in one action
  const resetRoundsFilters = () => {
    setRoundsFilter('all')
    setRoundsClassFilter('all')
    setRoundsLocationFilter('all')
    setRoundsPositionFilter('all')
  }

  return (
    <div className='w-full space-y-5'>
      {/* TA-07, IPN-01, IPN-05: interview panels */}
      <section>
        <div className='mb-2 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <h3 className='text-neutral-1600 text-sm font-medium'>
              Interview panels ({config.panels.length})
            </h3>
            {/* IPN-01: enable/disable interview panel support */}
            <Switch
              checked={config.panelSupportEnabled}
              onCheckedChange={config.setPanelSupportEnabled}
            />
            <span className='text-paragraph-sm text-neutral-1000'>
              {config.panelSupportEnabled
                ? 'Panel support enabled'
                : 'Disabled — panels unavailable in scheduling'}
            </span>
          </div>
          <div className='flex items-center gap-2'>
            {/* IPN-05: refresh the panel list */}
            <Button
              variant='outline'
              className='h-7 gap-1 text-xs'
              disabled={!config.panelSupportEnabled}
              onClick={() =>
                toast.success(
                  'Interview panel list refreshed — showing the latest panels'
                )
              }
            >
              <ArrowsClockwise size={12} weight='bold' /> Refresh
            </Button>
            <Button
              variant='outline'
              className='h-7 gap-1 text-xs'
              disabled={!config.panelSupportEnabled}
              onClick={() => setPanelOpen(true)}
            >
              <Plus size={12} /> Define panel
            </Button>
          </div>
        </div>
        {config.panelSupportEnabled && (
          <>
            <div className='rounded-[8px] border border-gray-200 bg-white'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Panel</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Departments / Positions</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedPanels.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <p className='font-medium'>{p.name}</p>
                        {p.description && (
                          <p className='text-paragraph-sm text-neutral-1000'>
                            {p.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className='text-sm'>
                        {p.members.join(', ')}
                      </TableCell>
                      <TableCell className='text-sm'>
                        {p.applicableLocation ?? 'All'}
                      </TableCell>
                      <TableCell className='text-paragraph-sm text-neutral-1000'>
                        {(p.applicableDepartments?.length
                          ? p.applicableDepartments.join(', ')
                          : 'All') +
                          ' / ' +
                          (p.applicablePositions?.length
                            ? p.applicablePositions.join(', ')
                            : 'All')}
                      </TableCell>
                      <TableCell className='text-right'>
                        <Button
                          variant='outline'
                          className='h-6 px-2 text-xs'
                          onClick={() => {
                            setEditingPanel(p)
                            setEditMembers(p.members.join(', '))
                            setEditPanelExtras({
                              description: p.description ?? '',
                              applicableLocation: p.applicableLocation ?? 'All',
                              applicableDepartments:
                                p.applicableDepartments ?? [],
                              applicablePositions: p.applicablePositions ?? [],
                            })
                          }}
                        >
                          View / edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {/* IPN-05: page through the panel list */}
            <div className='mt-2 flex items-center justify-between'>
              <p className='text-paragraph-sm text-neutral-1000'>
                Page {safePanelPage + 1} of {panelPageCount} ·{' '}
                {config.panels.length} panels
              </p>
              <div className='flex gap-1'>
                <Button
                  variant='outline'
                  className='h-7 px-2 text-xs'
                  disabled={safePanelPage === 0}
                  onClick={() => setPanelPage((p) => Math.max(0, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant='outline'
                  className='h-7 px-2 text-xs'
                  disabled={safePanelPage >= panelPageCount - 1}
                  onClick={() =>
                    setPanelPage((p) => Math.min(panelPageCount - 1, p + 1))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* TA-41: sequential rounds mapped to panels */}
      <section>
        <div className='mb-2 flex items-center justify-between gap-2'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Interview rounds ({filteredRounds.length})
          </h3>
          <Button
            variant='outline'
            className='h-7 gap-1 text-xs'
            onClick={() => setRoundsOpen(true)}
          >
            <Plus size={12} /> Add rounds set
          </Button>
        </div>
        {/* IRD-02/03: filter by class, location, department, position + reset */}
        <div className='mb-2 flex flex-wrap items-center gap-2'>
          <Select value={roundsClassFilter} onValueChange={setRoundsClassFilter}>
            <SelectTrigger className='h-7 w-[150px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All classes</SelectItem>
              {EMPLOYEE_CLASSES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={roundsLocationFilter}
            onValueChange={setRoundsLocationFilter}
          >
            <SelectTrigger className='h-7 w-[160px]'>
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
          <Select value={roundsFilter} onValueChange={setRoundsFilter}>
            <SelectTrigger className='h-7 w-[160px]'>
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
          <Select
            value={roundsPositionFilter}
            onValueChange={setRoundsPositionFilter}
          >
            <SelectTrigger className='h-7 w-[150px]'>
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
            variant='outline'
            className='h-7 px-2 text-xs'
            onClick={resetRoundsFilters}
          >
            Reset filters
          </Button>
        </div>
        <div className='space-y-1.5'>
          {filteredRounds.map((rc) => (
            <div
              key={rc.id}
              className='rounded-[8px] border border-gray-200 bg-white px-3 py-2'
            >
              <div className='flex items-center justify-between'>
                <p className='text-sm font-medium'>{rc.name}</p>
                <div className='flex items-center gap-2'>
                  <p className='text-paragraph-sm text-neutral-1000'>
                    {rc.department} · {rc.employeeClass} · {rc.location}
                  </p>
                  {/* IRD-04: view / edit the rounds entry */}
                  <Button
                    variant='outline'
                    className='h-6 gap-1 px-2 text-xs'
                    onClick={() => {
                      setEditingRounds(rc)
                      setEditRoundsDraft({
                        name: rc.name,
                        department: rc.department,
                        employeeClass: rc.employeeClass,
                        panelIds: rc.rounds.map((r) => r.panelId),
                        mandatory: rc.rounds.map((r) => r.mandatory ?? false),
                      })
                    }}
                  >
                    <PencilSimple size={12} /> View / edit
                  </Button>
                </div>
              </div>
              <p className='text-paragraph-sm text-neutral-1000'>
                {rc.rounds
                  .map(
                    (r) =>
                      `R${r.round} ${r.name}${r.mandatory ? ' (mandatory)' : ''} → ${
                        config.panels.find((p) => p.id === r.panelId)?.name ??
                        r.panelId
                      }`
                  )
                  .join('  ·  ')}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* TA-16: versioned scorecard criteria */}
      <section>
        <div className='mb-2 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Scorecard evaluation criteria (v{config.criteriaVersion})
          </h3>
          <Button className='h-7 text-xs' onClick={saveCriteria}>
            Save as new version
          </Button>
        </div>
        <div className='rounded-[8px] border border-gray-200 bg-white'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Criterion</TableHead>
                <TableHead>Rating scale</TableHead>
                <TableHead>Weighting %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {config.criteria.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className='font-medium'>{c.name}</TableCell>
                  <TableCell className='text-sm'>1–{c.scaleMax}</TableCell>
                  <TableCell>
                    <Input
                      type='number'
                      className='h-7 w-[90px]'
                      value={weights[c.id] ?? String(c.weight)}
                      onChange={(e) =>
                        setWeights((prev) => ({
                          ...prev,
                          [c.id]: e.target.value,
                        }))
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className='text-paragraph-sm text-neutral-1000 mt-1.5'>
          Subsequent interviews use the updated criteria; completed scorecards
          retain the criteria in effect at the time.
        </p>
      </section>

      {/* TA-43: weighted pre-interview questionnaire */}
      <section>
        <div className='mb-2 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Pre-interview questionnaire ({config.preInterviewQuestions.length})
          </h3>
          <div className='flex items-center gap-2'>
            {/* PIQ-05: refresh the questionnaire list */}
            <Button
              variant='outline'
              className='h-7 gap-1 text-xs'
              onClick={() =>
                toast.success(
                  'Pre-interview questionnaire refreshed — showing the latest questions'
                )
              }
            >
              <ArrowsClockwise size={12} weight='bold' /> Refresh
            </Button>
            <Button
              variant='outline'
              className='h-7 gap-1 text-xs'
              onClick={() => setQOpen(true)}
            >
              <Plus size={12} /> Add question
            </Button>
          </div>
        </div>
        <div className='rounded-[8px] border border-gray-200 bg-white'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Question</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type / field</TableHead>
                <TableHead>Level / class</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Weightage</TableHead>
                <TableHead>Mandatory</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {config.preInterviewQuestions.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className='font-medium'>{q.question}</TableCell>
                  <TableCell className='text-sm'>{q.category}</TableCell>
                  <TableCell className='text-sm'>
                    {q.questionType} / {q.fieldType}
                  </TableCell>
                  <TableCell className='text-sm'>
                    {q.positionLevel} / {q.employeeClass}
                  </TableCell>
                  <TableCell className='text-sm'>{q.value}</TableCell>
                  <TableCell className='text-sm'>{q.score}</TableCell>
                  <TableCell className='text-sm'>{q.weightage}%</TableCell>
                  <TableCell>
                    {q.mandatory ? (
                      <StatusBadge status='active' />
                    ) : (
                      <Badge variant='pending'>Optional</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Define panel dialog — name, members + description/location/department/position scope */}
      <Dialog open={panelOpen} onOpenChange={setPanelOpen}>
        <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-[480px]'>
          <DialogHeader>
            <DialogTitle>Define interview panel</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <Input
              placeholder='Panel name'
              value={panelName}
              onChange={(e) => setPanelName(e.target.value)}
            />
            <Input
              placeholder='Members, comma separated'
              value={panelMembers}
              onChange={(e) => setPanelMembers(e.target.value)}
            />
            <Input
              placeholder='Description'
              value={panelExtras.description}
              onChange={(e) =>
                setPanelExtras((d) => ({ ...d, description: e.target.value }))
              }
            />
            <div>
              <p className='text-paragraph-sm text-neutral-1000 mb-1.5'>
                Applicable location
              </p>
              <Select
                value={panelExtras.applicableLocation}
                onValueChange={(v) =>
                  setPanelExtras((d) => ({ ...d, applicableLocation: v }))
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['All', ...LOCATIONS].map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ChipPicker
              label='Applicable departments (none = all)'
              options={DEPARTMENTS}
              selected={panelExtras.applicableDepartments}
              onChange={(next) =>
                setPanelExtras((d) => ({ ...d, applicableDepartments: next }))
              }
            />
            <ChipPicker
              label='Applicable positions (none = all)'
              options={RECRUITMENT_POSITIONS}
              selected={panelExtras.applicablePositions}
              onChange={(next) =>
                setPanelExtras((d) => ({ ...d, applicablePositions: next }))
              }
            />
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setPanelOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!panelName || !panelMembers}
              onClick={() => {
                config.addPanel(
                  panelName,
                  panelMembers.split(',').map((m) => m.trim()).filter(Boolean),
                  panelExtras
                )
                setPanelOpen(false)
                setPanelName('')
                setPanelMembers('')
                setPanelExtras({
                  description: '',
                  applicableLocation: 'All',
                  applicableDepartments: [],
                  applicablePositions: [],
                })
              }}
            >
              Save panel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit panel dialog — members plus description/location/scope */}
      <Dialog
        open={editingPanel !== null}
        onOpenChange={(o) => !o && setEditingPanel(null)}
      >
        <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-[480px]'>
          <DialogHeader>
            <DialogTitle>Edit panel — {editingPanel?.name}</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <Input
              placeholder='Members, comma separated'
              value={editMembers}
              onChange={(e) => setEditMembers(e.target.value)}
            />
            <Input
              placeholder='Description'
              value={editPanelExtras.description}
              onChange={(e) =>
                setEditPanelExtras((d) => ({
                  ...d,
                  description: e.target.value,
                }))
              }
            />
            <div>
              <p className='text-paragraph-sm text-neutral-1000 mb-1.5'>
                Applicable location
              </p>
              <Select
                value={editPanelExtras.applicableLocation}
                onValueChange={(v) =>
                  setEditPanelExtras((d) => ({ ...d, applicableLocation: v }))
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['All', ...LOCATIONS].map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ChipPicker
              label='Applicable departments (none = all)'
              options={DEPARTMENTS}
              selected={editPanelExtras.applicableDepartments}
              onChange={(next) =>
                setEditPanelExtras((d) => ({
                  ...d,
                  applicableDepartments: next,
                }))
              }
            />
            <ChipPicker
              label='Applicable positions (none = all)'
              options={RECRUITMENT_POSITIONS}
              selected={editPanelExtras.applicablePositions}
              onChange={(next) =>
                setEditPanelExtras((d) => ({ ...d, applicablePositions: next }))
              }
            />
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setEditingPanel(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editingPanel)
                  config.updatePanel(editingPanel.id, {
                    members: editMembers
                      .split(',')
                      .map((m) => m.trim())
                      .filter(Boolean),
                    ...editPanelExtras,
                  })
                setEditingPanel(null)
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add rounds set dialog */}
      <Dialog open={roundsOpen} onOpenChange={setRoundsOpen}>
        <DialogContent className='sm:max-w-[440px]'>
          <DialogHeader>
            <DialogTitle>Add interview rounds set</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <Input
              placeholder='Configuration name'
              value={roundsName}
              onChange={(e) => setRoundsName(e.target.value)}
            />
            <div className='grid grid-cols-2 gap-3'>
              <Select value={roundsDept} onValueChange={setRoundsDept}>
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={roundsClass} onValueChange={setRoundsClass}>
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['All', ...EMPLOYEE_CLASSES].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {roundPanels.map((pid, i) => (
              <div key={i} className='flex items-center gap-2'>
                <span className='text-sm'>Round {i + 1} panel</span>
                <Select
                  value={pid}
                  onValueChange={(v) =>
                    setRoundPanels((prev) =>
                      prev.map((x, xi) => (xi === i ? v : x))
                    )
                  }
                >
                  <SelectTrigger className='h-7 flex-1'>
                    <SelectValue placeholder='Select panel' />
                  </SelectTrigger>
                  <SelectContent>
                    {config.panels.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Mandatory rounds cannot be skipped in the pipeline */}
                <label className='flex items-center gap-1.5 text-xs'>
                  <Checkbox
                    variant='blue'
                    checked={roundMandatory[i] ?? false}
                    onCheckedChange={(v) =>
                      setRoundMandatory((prev) =>
                        prev.map((x, xi) => (xi === i ? v === true : x))
                      )
                    }
                  />
                  Mandatory
                </label>
              </div>
            ))}
            <Button
              variant='outline'
              className='h-7 text-xs'
              onClick={() => {
                setRoundPanels((prev) => [...prev, ''])
                setRoundMandatory((prev) => [...prev, false])
              }}
            >
              + Add round
            </Button>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setRoundsOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!roundsName || roundPanels.some((p) => !p)}
              onClick={() => {
                config.addRoundsConfig({
                  name: roundsName,
                  employeeClass: roundsClass,
                  location: 'All',
                  department: roundsDept,
                  position: 'All',
                  rounds: roundPanels.map((panelId, i) => ({
                    round: i + 1,
                    name: `Round ${i + 1}`,
                    panelId,
                    mandatory: roundMandatory[i] ?? false,
                  })),
                })
                setRoundsOpen(false)
                setRoundsName('')
                setRoundPanels([''])
                setRoundMandatory([false])
              }}
            >
              Save rounds
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add pre-interview question dialog */}
      <Dialog open={qOpen} onOpenChange={setQOpen}>
        <DialogContent className='sm:max-w-[440px]'>
          <DialogHeader>
            <DialogTitle>Add pre-interview question</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <Input
              placeholder='Question'
              value={qDraft.question}
              onChange={(e) =>
                setQDraft((d) => ({ ...d, question: e.target.value }))
              }
            />
            <div className='grid grid-cols-2 gap-3'>
              <Input
                placeholder='Category'
                value={qDraft.category}
                onChange={(e) =>
                  setQDraft((d) => ({ ...d, category: e.target.value }))
                }
              />
              <Select
                value={qDraft.fieldType}
                onValueChange={(v) =>
                  setQDraft((d) => ({
                    ...d,
                    fieldType: v as PreInterviewQuestion['fieldType'],
                  }))
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['Text', 'Number', 'Yes/No', 'Choice'] as const).map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <Select
                value={qDraft.positionLevel}
                onValueChange={(v) =>
                  setQDraft((d) => ({ ...d, positionLevel: v }))
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['All', ...POSITION_LEVELS].map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={qDraft.mandatory ? 'yes' : 'no'}
                onValueChange={(v) =>
                  setQDraft((d) => ({ ...d, mandatory: v === 'yes' }))
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='yes'>Mandatory</SelectItem>
                  <SelectItem value='no'>Optional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='grid grid-cols-3 gap-3'>
              <Input
                type='number'
                placeholder='Value'
                value={qDraft.value}
                onChange={(e) =>
                  setQDraft((d) => ({ ...d, value: e.target.value }))
                }
              />
              <Input
                type='number'
                placeholder='Score'
                value={qDraft.score}
                onChange={(e) =>
                  setQDraft((d) => ({ ...d, score: e.target.value }))
                }
              />
              <Input
                type='number'
                placeholder='Weightage %'
                value={qDraft.weightage}
                onChange={(e) =>
                  setQDraft((d) => ({ ...d, weightage: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setQOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!qDraft.question}
              onClick={() => {
                config.addPreInterviewQuestion({
                  category: qDraft.category,
                  question: qDraft.question,
                  questionType: qDraft.questionType,
                  fieldType: qDraft.fieldType,
                  positionLevel: qDraft.positionLevel,
                  employeeClass: qDraft.employeeClass,
                  value: Number(qDraft.value),
                  score: Number(qDraft.score),
                  mandatory: qDraft.mandatory,
                  weightage: Number(qDraft.weightage),
                })
                setQOpen(false)
                setQDraft((d) => ({ ...d, question: '' }))
              }}
            >
              Save question
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* IRD-04: view / edit interview rounds entry */}
      <Dialog
        open={editingRounds !== null}
        onOpenChange={(o) => !o && setEditingRounds(null)}
      >
        <DialogContent className='sm:max-w-[440px]'>
          <DialogHeader>
            <DialogTitle>Edit interview rounds — {editingRounds?.name}</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <Input
              placeholder='Configuration name'
              value={editRoundsDraft.name}
              onChange={(e) =>
                setEditRoundsDraft((d) => ({ ...d, name: e.target.value }))
              }
            />
            <div className='grid grid-cols-2 gap-3'>
              <Select
                value={editRoundsDraft.department}
                onValueChange={(v) =>
                  setEditRoundsDraft((d) => ({ ...d, department: v }))
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={editRoundsDraft.employeeClass}
                onValueChange={(v) =>
                  setEditRoundsDraft((d) => ({ ...d, employeeClass: v }))
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['All', ...EMPLOYEE_CLASSES].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {editingRounds?.rounds.map((r, i) => (
              <div key={r.round} className='flex items-center gap-2'>
                <span className='w-[140px] text-sm'>
                  R{r.round} {r.name} panel
                </span>
                <Select
                  value={editRoundsDraft.panelIds[i] ?? r.panelId}
                  onValueChange={(v) =>
                    setEditRoundsDraft((d) => ({
                      ...d,
                      panelIds: d.panelIds.map((x, xi) => (xi === i ? v : x)),
                    }))
                  }
                >
                  <SelectTrigger className='h-7 flex-1'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {config.panels.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Mandatory rounds cannot be skipped in the pipeline */}
                <label className='flex items-center gap-1.5 text-xs'>
                  <Checkbox
                    variant='blue'
                    checked={editRoundsDraft.mandatory[i] ?? false}
                    onCheckedChange={(v) =>
                      setEditRoundsDraft((d) => ({
                        ...d,
                        mandatory: d.mandatory.map((x, xi) =>
                          xi === i ? v === true : x
                        ),
                      }))
                    }
                  />
                  Mandatory
                </label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setEditingRounds(null)}>
              Cancel
            </Button>
            <Button
              disabled={!editRoundsDraft.name}
              onClick={() => {
                if (editingRounds)
                  config.updateRoundsConfig(editingRounds.id, {
                    name: editRoundsDraft.name,
                    department: editRoundsDraft.department,
                    employeeClass: editRoundsDraft.employeeClass,
                    rounds: editingRounds.rounds.map((r, i) => ({
                      ...r,
                      panelId: editRoundsDraft.panelIds[i] ?? r.panelId,
                      mandatory: editRoundsDraft.mandatory[i] ?? r.mandatory,
                    })),
                  })
                setEditingRounds(null)
              }}
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
