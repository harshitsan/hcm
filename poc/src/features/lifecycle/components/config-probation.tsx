import { Fragment, useState } from 'react'
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
import {
  CONFIRMATION_QUESTION_USES,
  QUESTION_TYPES,
  type ConfirmationApproverGroup,
  type ConfirmationQuestion,
  type ConfirmationQuestionUse,
  type DecisionRow,
} from '../data/config'
import { DEPARTMENTS, LOCATIONS, POSITION_LEVELS, fmtDate } from '../data/shared'
import { type LifecycleConfigStore } from '../hooks/use-lifecycle-config'
import {
  CheckboxGroup,
  ChipList,
  ConfirmDeleteDialog,
  SectionCard,
} from './config-widgets'

/** Probation decision table, confirmation approver groups & question bank. */
export function ConfigProbation({ config }: { config: LifecycleConfigStore }) {
  const [editRow, setEditRow] = useState<DecisionRow | null>(null)
  const [minScore, setMinScore] = useState('')
  const [maxScore, setMaxScore] = useState('')

  // Confirmation approver group filters + add/edit form
  const [filterLoc, setFilterLoc] = useState('all')
  const [filterDept, setFilterDept] = useState('all')
  const [filterPos, setFilterPos] = useState('all')
  const [groupOpen, setGroupOpen] = useState(false)
  const [groupEditing, setGroupEditing] = useState<string | null>(null)
  const [groupLocs, setGroupLocs] = useState<string[]>([])
  const [groupDepts, setGroupDepts] = useState<string[]>([])
  const [groupPos, setGroupPos] = useState<string[]>([])
  const [groupApprovers, setGroupApprovers] = useState('')
  const [groupApplicability, setGroupApplicability] = useState('')
  const [groupDeleting, setGroupDeleting] =
    useState<ConfirmationApproverGroup | null>(null)

  // Question add/edit form + preview
  const [questionOpen, setQuestionOpen] = useState(false)
  const [questionEditing, setQuestionEditing] = useState<string | null>(null)
  const [qText, setQText] = useState('')
  const [qType, setQType] = useState<(typeof QUESTION_TYPES)[number]>('Rating')
  const [qScore, setQScore] = useState('1')
  const [qMandatory, setQMandatory] = useState(true)
  const [qUses, setQUses] = useState<string[]>(['Confirmation'])
  const [qView, setQView] = useState<'order' | 'type'>('order')
  const [questionDeleting, setQuestionDeleting] =
    useState<ConfirmationQuestion | null>(null)
  const [preview, setPreview] = useState<ConfirmationQuestionUse | null>(null)

  const groups = config.confirmationApprovers.items.filter(
    (g) =>
      (filterLoc === 'all' || g.locations.includes(filterLoc)) &&
      (filterDept === 'all' || g.departments.includes(filterDept)) &&
      (filterPos === 'all' || g.positionLevels.includes(filterPos))
  )

  const sortedQuestions = [...config.confirmationQuestions.items].sort(
    (a, b) => a.order - b.order
  )

  const openGroupDialog = (g: ConfirmationApproverGroup | null) => {
    setGroupEditing(g?.id ?? null)
    setGroupApplicability(g?.applicability ?? '')
    setGroupLocs(g ? [...g.locations] : [])
    setGroupDepts(g ? [...g.departments] : [...DEPARTMENTS])
    setGroupPos(g ? [...g.positionLevels] : [...POSITION_LEVELS])
    setGroupApprovers(g ? g.approvers.join(', ') : '')
    setGroupOpen(true)
  }

  const openQuestionDialog = (q: ConfirmationQuestion | null) => {
    setQuestionEditing(q?.id ?? null)
    setQText(q?.text ?? '')
    setQType(q?.type ?? 'Rating')
    setQScore(q ? String(q.score) : '1')
    setQMandatory(q?.mandatory ?? true)
    setQUses(q ? [...q.usedIn] : ['Confirmation'])
    setQuestionOpen(true)
  }

  const saveGroup = () => {
    const approvers = groupApprovers.split(',').map((a) => a.trim()).filter(Boolean)
    if (!groupApplicability.trim() || groupLocs.length === 0 || approvers.length === 0) {
      toast.error('Applicability, at least one location and one approver are required')
      return
    }
    const payload = {
      applicability: groupApplicability.trim(),
      locations: groupLocs,
      departments: groupDepts.length > 0 ? groupDepts : [...DEPARTMENTS],
      positionLevels: groupPos.length > 0 ? groupPos : [...POSITION_LEVELS],
      approvers,
    }
    if (groupEditing) {
      config.confirmationApprovers.update(groupEditing, payload)
      config.logConfigChange(
        'Confirmation approver group updated',
        payload.applicability
      )
      toast.success('Approver group saved — applies to subsequent confirmations')
    } else {
      config.confirmationApprovers.add(payload, 'cg')
      config.logConfigChange('Confirmation approver group added', payload.applicability)
      toast.success('Approver group added')
    }
    setGroupOpen(false)
  }

  const saveQuestion = () => {
    if (!qText.trim() || qUses.length === 0) {
      toast.error('Question text and at least one usage are required')
      return
    }
    const payload = {
      text: qText.trim(),
      type: qType,
      options: qType === 'Yes/No' ? ['Yes', 'No'] : [],
      score: Number(qScore) || 0,
      mandatory: qMandatory,
      usedIn: qUses as ConfirmationQuestionUse[],
    }
    if (questionEditing) {
      config.confirmationQuestions.update(questionEditing, payload)
      config.logConfigChange('Confirmation question updated', payload.text)
      toast.success('Question updated in the bank')
    } else {
      config.confirmationQuestions.add(
        {
          ...payload,
          order: config.confirmationQuestions.items.length + 1,
        },
        'cq'
      )
      config.logConfigChange('Confirmation question added', payload.text)
      toast.success('Question added to the bank')
    }
    setQuestionOpen(false)
  }

  const organizeByType = () => {
    const reordered = [...config.confirmationQuestions.items].sort(
      (a, b) => a.type.localeCompare(b.type) || a.order - b.order
    )
    reordered.forEach((q, i) =>
      config.confirmationQuestions.update(q.id, { order: i + 1 })
    )
    config.logConfigChange(
      'Confirmation questions organized by type',
      'Confirmation question bank'
    )
    toast.success('Display order renumbered — questions grouped by question type')
  }

  const questionRow = (q: ConfirmationQuestion) => (
    <TableRow key={q.id}>
      <TableCell>{q.order}</TableCell>
      <TableCell className='max-w-[280px]'>{q.text}</TableCell>
      <TableCell>{q.type}</TableCell>
      <TableCell>{q.score}</TableCell>
      <TableCell>
        <Badge variant={q.mandatory ? 'badge_active' : 'badge_inactive'}>
          {q.mandatory ? 'Yes' : 'No'}
        </Badge>
      </TableCell>
      <TableCell><ChipList items={[...q.usedIn]} /></TableCell>
      <TableCell>
        <div className='flex gap-2'>
          <Button size='sm' variant='outline' onClick={() => openQuestionDialog(q)}>
            Edit
          </Button>
          <Button size='sm' variant='outline' onClick={() => setQuestionDeleting(q)}>
            Delete
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )

  return (
    <div>
      <SectionCard
        title='Confirmation questionnaire setup'
        description='Controls whether the employee confirmation questionnaire is part of the confirmation process.'
      >
        <div className='flex items-center justify-between'>
          <Label>Do you perform employee confirmation questions?</Label>
          <Switch
            checked={config.settings.confirmationQuestionnaireEnabled}
            onCheckedChange={(v) =>
              config.updateSettings(
                { confirmationQuestionnaireEnabled: v },
                'Confirmation questionnaire'
              )
            }
          />
        </div>
      </SectionCard>

      <SectionCard
        title={`Probation decision table (${config.decisionTable.version}, effective ${fmtDate(config.decisionTable.effectiveFrom)})`}
        description='The rules engine maps the average criteria score to a suggested outcome. Editing thresholds publishes a new version; open probation cases keep their original criteria.'
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Average score range</TableHead>
              <TableHead>Suggested outcome</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {config.decisionTable.rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  {r.minScore} – {r.maxScore}
                </TableCell>
                <TableCell>
                  <Badge variant='outline'>{r.outcome}</Badge>
                </TableCell>
                <TableCell>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => {
                      setEditRow(r)
                      setMinScore(String(r.minScore))
                      setMaxScore(String(r.maxScore))
                    }}
                  >
                    Edit thresholds
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>

      <SectionCard
        title='Confirmation approver groups'
        description='Confirmation decisions route to the group whose applicability matches the employee.'
        actions={
          <Button size='sm' onClick={() => openGroupDialog(null)}>
            Add group
          </Button>
        }
      >
        <div className='mb-3 flex flex-wrap items-center gap-2'>
          {(
            [
              [filterLoc, setFilterLoc, 'All locations', LOCATIONS],
              [filterDept, setFilterDept, 'All departments', DEPARTMENTS],
              [filterPos, setFilterPos, 'All positions', POSITION_LEVELS],
            ] as const
          ).map(([value, set, label, options], i) => (
            <Select key={i} value={value} onValueChange={set}>
              <SelectTrigger variant='secondary' className='h-7 w-[170px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>{label}</SelectItem>
                {options.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
          <Button
            size='sm'
            variant='outline'
            onClick={() => {
              setFilterLoc('all')
              setFilterDept('all')
              setFilterPos('all')
            }}
          >
            Reset
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Applicability</TableHead>
              <TableHead>Locations</TableHead>
              <TableHead>Departments</TableHead>
              <TableHead>Position levels</TableHead>
              <TableHead>Approvers</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className='text-neutral-1000 text-center text-sm'>
                  No records found
                </TableCell>
              </TableRow>
            ) : (
              groups.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className='font-medium'>{g.applicability}</TableCell>
                  <TableCell><ChipList items={g.locations} /></TableCell>
                  <TableCell><ChipList items={g.departments} /></TableCell>
                  <TableCell><ChipList items={g.positionLevels} /></TableCell>
                  <TableCell><ChipList items={g.approvers} /></TableCell>
                  <TableCell>
                    <div className='flex gap-2'>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => openGroupDialog(g)}
                      >
                        View / Edit
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => setGroupDeleting(g)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </SectionCard>

      <SectionCard
        title='Confirmation question bank'
        description={
          config.settings.confirmationQuestionnaireEnabled
            ? 'One bank drives the confirmation, peer-review and periodic questionnaires.'
            : 'Confirmation questionnaire is disabled in setup — questions are kept but not used.'
        }
        actions={
          <>
            {CONFIRMATION_QUESTION_USES.map((use) => (
              <Button
                key={use}
                size='sm'
                variant='outline'
                onClick={() => setPreview(use)}
              >
                Preview {use.toLowerCase()}
              </Button>
            ))}
            <Button
              size='sm'
              variant='outline'
              onClick={() =>
                toast.success('Questions refreshed — latest saved bank shown')
              }
            >
              Refresh
            </Button>
            <Button size='sm' onClick={() => openQuestionDialog(null)}>
              Add question
            </Button>
          </>
        }
      >
        <div className='mb-3 flex flex-wrap items-center gap-2'>
          <Label className='text-xs'>View</Label>
          <Select
            value={qView}
            onValueChange={(v) => setQView(v as 'order' | 'type')}
          >
            <SelectTrigger variant='secondary' className='h-7 w-[200px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='order'>By display order</SelectItem>
              <SelectItem value='type'>Grouped by question type</SelectItem>
            </SelectContent>
          </Select>
          <Button size='sm' variant='outline' onClick={organizeByType}>
            Organize questions by type
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Question</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Mandatory</TableHead>
              <TableHead>Used in</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {qView === 'type'
              ? QUESTION_TYPES.filter((t) =>
                  sortedQuestions.some((q) => q.type === t)
                ).map((t) => (
                  <Fragment key={t}>
                    <TableRow className='bg-neutral-200/60'>
                      <TableCell colSpan={7} className='text-xs font-semibold'>
                        {t} ({sortedQuestions.filter((q) => q.type === t).length})
                      </TableCell>
                    </TableRow>
                    {sortedQuestions.filter((q) => q.type === t).map(questionRow)}
                  </Fragment>
                ))
              : sortedQuestions.map(questionRow)}
          </TableBody>
        </Table>
      </SectionCard>

      {/* Edit decision thresholds */}
      <Dialog open={editRow !== null} onOpenChange={(o) => !o && setEditRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit thresholds → publish new version</DialogTitle>
          </DialogHeader>
          <div className='grid grid-cols-2 gap-3'>
            <div className='space-y-1'>
              <Label>Min average score</Label>
              <Input
                type='number'
                step='0.01'
                value={minScore}
                onChange={(e) => setMinScore(e.target.value)}
              />
            </div>
            <div className='space-y-1'>
              <Label>Max average score</Label>
              <Input
                type='number'
                step='0.01'
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setEditRow(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const min = Number(minScore)
                const max = Number(maxScore)
                if (Number.isNaN(min) || Number.isNaN(max) || min >= max) {
                  toast.error('Enter a valid range (min < max)')
                  return
                }
                if (editRow) config.updateDecisionRow(editRow.id, { minScore: min, maxScore: max })
                setEditRow(null)
              }}
            >
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / edit approver group */}
      <Dialog open={groupOpen} onOpenChange={setGroupOpen}>
        <DialogContent className='max-h-[85vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>
              {groupEditing
                ? 'View / edit confirmation approver group'
                : 'Add confirmation approver group'}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1'>
              <Label>Applicability label</Label>
              <Input
                value={groupApplicability}
                onChange={(e) => setGroupApplicability(e.target.value)}
                placeholder='e.g. India tech staff'
              />
            </div>
            <div className='space-y-1'>
              <Label>Locations</Label>
              <CheckboxGroup options={LOCATIONS} value={groupLocs} onChange={setGroupLocs} />
            </div>
            <div className='space-y-1'>
              <Label>Departments</Label>
              <CheckboxGroup options={DEPARTMENTS} value={groupDepts} onChange={setGroupDepts} />
            </div>
            <div className='space-y-1'>
              <Label>Position levels</Label>
              <CheckboxGroup options={POSITION_LEVELS} value={groupPos} onChange={setGroupPos} />
            </div>
            <div className='space-y-1'>
              <Label>Approvers (comma separated)</Label>
              <Input
                value={groupApprovers}
                onChange={(e) => setGroupApprovers(e.target.value)}
                placeholder='Vikram Shah, Anita Desai'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setGroupOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveGroup}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete approver group */}
      <ConfirmDeleteDialog
        open={groupDeleting !== null}
        onOpenChange={(o) => !o && setGroupDeleting(null)}
        title='Delete confirmation approver group?'
        description={`"${groupDeleting?.applicability ?? ''}" will no longer route confirmation decisions. In-flight confirmations keep their original routing.`}
        onConfirm={() => {
          if (groupDeleting) {
            config.confirmationApprovers.remove(groupDeleting.id)
            config.logConfigChange(
              'Confirmation approver group deleted',
              groupDeleting.applicability
            )
            toast.success('Approver group deleted')
          }
          setGroupDeleting(null)
        }}
      />

      {/* Add / edit question */}
      <Dialog open={questionOpen} onOpenChange={setQuestionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {questionEditing ? 'Edit confirmation question' : 'Add confirmation question'}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1'>
              <Label>Question</Label>
              <Input value={qText} onChange={(e) => setQText(e.target.value)} />
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1'>
                <Label>Type</Label>
                <Select value={qType} onValueChange={(v) => setQType(v as typeof qType)}>
                  <SelectTrigger variant='secondary' className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUESTION_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-1'>
                <Label>Score weight</Label>
                <Input type='number' value={qScore} onChange={(e) => setQScore(e.target.value)} />
              </div>
            </div>
            <div className='flex items-center justify-between'>
              <Label>Mandatory</Label>
              <Switch checked={qMandatory} onCheckedChange={setQMandatory} />
            </div>
            <div className='space-y-1'>
              <Label>Used in</Label>
              <CheckboxGroup
                options={CONFIRMATION_QUESTION_USES}
                value={qUses}
                onChange={setQUses}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setQuestionOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveQuestion}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete question */}
      <ConfirmDeleteDialog
        open={questionDeleting !== null}
        onOpenChange={(o) => !o && setQuestionDeleting(null)}
        title='Delete confirmation question?'
        description={`"${questionDeleting?.text ?? ''}" will be removed from the bank and future questionnaires.`}
        onConfirm={() => {
          if (questionDeleting) {
            config.confirmationQuestions.remove(questionDeleting.id)
            config.logConfigChange(
              'Confirmation question deleted',
              questionDeleting.text
            )
            toast.success('Question removed from the bank')
          }
          setQuestionDeleting(null)
        }}
      />

      {/* Questionnaire preview */}
      <Dialog open={preview !== null} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className='max-h-[80vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>{preview} questionnaire preview</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            {config.confirmationQuestions.items
              .filter((q) => preview !== null && q.usedIn.includes(preview))
              .sort((a, b) => a.order - b.order)
              .map((q, i) => (
                <div key={q.id} className='rounded-[6px] border border-gray-200 px-3 py-2'>
                  <p className='text-sm font-medium'>
                    {i + 1}. {q.text}
                    {q.mandatory && <span className='text-destructive'> *</span>}
                  </p>
                  <p className='text-neutral-1000 text-xs'>
                    {q.type}
                    {q.options.length > 0 && ` · options: ${q.options.join(' / ')}`}
                    {q.score > 0 && ` · score ${q.score}`}
                  </p>
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
