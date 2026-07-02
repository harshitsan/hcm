import { useState } from 'react'
import { Plus } from 'phosphor-react'
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
import type { InterviewPanel, PreInterviewQuestion } from '../data/config'
import { DEPARTMENTS, EMPLOYEE_CLASSES } from '../data/requisitions'
import { POSITION_LEVELS } from '../data/vacancies'
import type { RecruitmentConfigStore } from '../hooks/use-recruitment-config'
import { StatusBadge } from './badges'

/**
 * Interview configuration — panels, sequential rounds mapped to panels,
 * versioned scorecard criteria and the weighted pre-interview questionnaire
 * (TA-07, TA-16, TA-41, TA-43).
 */
export function ConfigHiring({ config }: { config: RecruitmentConfigStore }) {
  const [panelOpen, setPanelOpen] = useState(false)
  const [panelName, setPanelName] = useState('')
  const [panelMembers, setPanelMembers] = useState('')
  const [editingPanel, setEditingPanel] = useState<InterviewPanel | null>(null)
  const [editMembers, setEditMembers] = useState('')

  const [roundsOpen, setRoundsOpen] = useState(false)
  const [roundsName, setRoundsName] = useState('')
  const [roundsDept, setRoundsDept] = useState<string>(DEPARTMENTS[0])
  const [roundsClass, setRoundsClass] = useState<string>('All')
  const [roundPanels, setRoundPanels] = useState<string[]>([''])
  const [roundsFilter, setRoundsFilter] = useState('all')

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

  const filteredRounds =
    roundsFilter === 'all'
      ? config.roundsConfigs
      : config.roundsConfigs.filter((r) => r.department === roundsFilter)

  return (
    <div className='w-full space-y-5'>
      {/* TA-07: interview panels */}
      <section>
        <div className='mb-2 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Interview panels ({config.panels.length})
          </h3>
          <Button
            variant='outline'
            className='h-7 gap-1 text-xs'
            onClick={() => setPanelOpen(true)}
          >
            <Plus size={12} /> Define panel
          </Button>
        </div>
        <div className='rounded-[8px] border border-gray-200 bg-white'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Panel</TableHead>
                <TableHead>Members</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {config.panels.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className='font-medium'>{p.name}</TableCell>
                  <TableCell className='text-sm'>{p.members.join(', ')}</TableCell>
                  <TableCell className='text-right'>
                    <Button
                      variant='outline'
                      className='h-6 px-2 text-xs'
                      onClick={() => {
                        setEditingPanel(p)
                        setEditMembers(p.members.join(', '))
                      }}
                    >
                      Update members
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* TA-41: sequential rounds mapped to panels */}
      <section>
        <div className='mb-2 flex items-center justify-between gap-2'>
          <div className='flex items-center gap-2'>
            <h3 className='text-neutral-1600 text-sm font-medium'>
              Interview rounds ({filteredRounds.length})
            </h3>
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
          </div>
          <Button
            variant='outline'
            className='h-7 gap-1 text-xs'
            onClick={() => setRoundsOpen(true)}
          >
            <Plus size={12} /> Add rounds set
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
                <p className='text-paragraph-sm text-neutral-1000'>
                  {rc.department} · {rc.employeeClass} · {rc.location}
                </p>
              </div>
              <p className='text-paragraph-sm text-neutral-1000'>
                {rc.rounds
                  .map(
                    (r) =>
                      `R${r.round} ${r.name} → ${
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
          <Button
            variant='outline'
            className='h-7 gap-1 text-xs'
            onClick={() => setQOpen(true)}
          >
            <Plus size={12} /> Add question
          </Button>
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

      {/* Define panel dialog */}
      <Dialog open={panelOpen} onOpenChange={setPanelOpen}>
        <DialogContent className='sm:max-w-[400px]'>
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
                  panelMembers.split(',').map((m) => m.trim()).filter(Boolean)
                )
                setPanelOpen(false)
                setPanelName('')
                setPanelMembers('')
              }}
            >
              Save panel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update panel members dialog */}
      <Dialog
        open={editingPanel !== null}
        onOpenChange={(o) => !o && setEditingPanel(null)}
      >
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader>
            <DialogTitle>Update members — {editingPanel?.name}</DialogTitle>
          </DialogHeader>
          <Input
            value={editMembers}
            onChange={(e) => setEditMembers(e.target.value)}
          />
          <DialogFooter>
            <Button variant='outline' onClick={() => setEditingPanel(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editingPanel)
                  config.updatePanelMembers(
                    editingPanel.id,
                    editMembers.split(',').map((m) => m.trim()).filter(Boolean)
                  )
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
              </div>
            ))}
            <Button
              variant='outline'
              className='h-7 text-xs'
              onClick={() => setRoundPanels((prev) => [...prev, ''])}
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
                  })),
                })
                setRoundsOpen(false)
                setRoundsName('')
                setRoundPanels([''])
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
    </div>
  )
}
