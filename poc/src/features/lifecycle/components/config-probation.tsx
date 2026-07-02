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
  type ConfirmationQuestionUse,
  type DecisionRow,
} from '../data/config'
import { DEPARTMENTS, LOCATIONS, POSITION_LEVELS, fmtDate } from '../data/shared'
import { type LifecycleConfigStore } from '../hooks/use-lifecycle-config'
import { CheckboxGroup, ChipList, SectionCard } from './config-widgets'

/** Probation decision table, confirmation approver groups & question bank. */
export function ConfigProbation({ config }: { config: LifecycleConfigStore }) {
  const [editRow, setEditRow] = useState<DecisionRow | null>(null)
  const [minScore, setMinScore] = useState('')
  const [maxScore, setMaxScore] = useState('')

  // Confirmation approver group filters + add form
  const [filterLoc, setFilterLoc] = useState('all')
  const [filterDept, setFilterDept] = useState('all')
  const [filterPos, setFilterPos] = useState('all')
  const [groupOpen, setGroupOpen] = useState(false)
  const [groupLocs, setGroupLocs] = useState<string[]>([])
  const [groupApprovers, setGroupApprovers] = useState('')
  const [groupApplicability, setGroupApplicability] = useState('')

  // Question add form + preview
  const [questionOpen, setQuestionOpen] = useState(false)
  const [qText, setQText] = useState('')
  const [qType, setQType] = useState<(typeof QUESTION_TYPES)[number]>('Rating')
  const [qScore, setQScore] = useState('1')
  const [qUses, setQUses] = useState<string[]>(['Confirmation'])
  const [preview, setPreview] = useState<ConfirmationQuestionUse | null>(null)

  const groups = config.confirmationApprovers.items.filter(
    (g) =>
      (filterLoc === 'all' || g.locations.includes(filterLoc)) &&
      (filterDept === 'all' || g.departments.includes(filterDept)) &&
      (filterPos === 'all' || g.positionLevels.includes(filterPos))
  )

  return (
    <div>
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
          <Button size='sm' onClick={() => setGroupOpen(true)}>
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className='text-neutral-1000 text-center text-sm'>
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
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </SectionCard>

      <SectionCard
        title='Confirmation question bank'
        description='One bank drives the confirmation, peer-review and periodic questionnaires.'
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
            <Button size='sm' onClick={() => setQuestionOpen(true)}>
              Add question
            </Button>
          </>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Question</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Mandatory</TableHead>
              <TableHead>Used in</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...config.confirmationQuestions.items]
              .sort((a, b) => a.order - b.order)
              .map((q) => (
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
                </TableRow>
              ))}
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

      {/* Add approver group */}
      <Dialog open={groupOpen} onOpenChange={setGroupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add confirmation approver group</DialogTitle>
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
            <Button
              onClick={() => {
                const approvers = groupApprovers.split(',').map((a) => a.trim()).filter(Boolean)
                if (!groupApplicability.trim() || groupLocs.length === 0 || approvers.length === 0) {
                  toast.error('Applicability, at least one location and one approver are required')
                  return
                }
                config.confirmationApprovers.add(
                  {
                    applicability: groupApplicability.trim(),
                    locations: groupLocs,
                    departments: [...DEPARTMENTS],
                    positionLevels: [...POSITION_LEVELS],
                    approvers,
                  },
                  'cg'
                )
                config.logConfigChange('Confirmation approver group added', groupApplicability.trim())
                toast.success('Approver group added')
                setGroupOpen(false)
                setGroupLocs([])
                setGroupApprovers('')
                setGroupApplicability('')
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add question */}
      <Dialog open={questionOpen} onOpenChange={setQuestionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add confirmation question</DialogTitle>
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
            <Button
              onClick={() => {
                if (!qText.trim() || qUses.length === 0) {
                  toast.error('Question text and at least one usage are required')
                  return
                }
                config.confirmationQuestions.add(
                  {
                    text: qText.trim(),
                    type: qType,
                    options: qType === 'Yes/No' ? ['Yes', 'No'] : [],
                    score: Number(qScore) || 0,
                    order: config.confirmationQuestions.items.length + 1,
                    mandatory: true,
                    usedIn: qUses as ConfirmationQuestionUse[],
                  },
                  'cq'
                )
                config.logConfigChange('Confirmation question added', qText.trim())
                toast.success('Question added to the bank')
                setQuestionOpen(false)
                setQText('')
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
