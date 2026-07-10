import { useState } from 'react'
import { ArrowDown, ArrowUp, PencilSimple, Plus, Trash } from 'phosphor-react'
import { toast } from 'sonner'
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
import type {
  AssessmentQuestion,
  RatingOption,
  RatingSet,
} from '../data/assessment'
import type { AssessmentStore } from '../hooks/use-assessment'

const NO_RATING_SET = 'none'

type OptionDraft = { value: string; label: string; displayOrder: string }

const emptyQuestionDraft = {
  question: '',
  responseRequired: true,
  ratingRequired: false,
  ratingSetId: NO_RATING_SET,
  applicableTo: 'all' as 'all' | 'specific',
  positionsText: '',
}

/**
 * Interview assessment questions configuration (Kensium PDF —
 * Configuration → Interview Assessment Questions): rating sets with an
 * options editor, plus the ordered question list interviewers answer on
 * the assessment form.
 */
export function ConfigAssessment({ store }: { store: AssessmentStore }) {
  // Rating set dialog
  const [setOpen, setSetOpen] = useState(false)
  const [editingSet, setEditingSet] = useState<RatingSet | null>(null)
  const [setName, setSetName] = useState('')
  const [optionRows, setOptionRows] = useState<OptionDraft[]>([])

  // Question dialog
  const [qOpen, setQOpen] = useState(false)
  const [editingQ, setEditingQ] = useState<AssessmentQuestion | null>(null)
  const [qDraft, setQDraft] = useState(emptyQuestionDraft)
  const [deleteQ, setDeleteQ] = useState<AssessmentQuestion | null>(null)

  const orderedQuestions = [...store.questions].sort(
    (a, b) => a.displayOrder - b.displayOrder
  )

  const ratingSetName = (id: string | null) =>
    store.ratingSets.find((r) => r.id === id)?.name ?? '—'

  const openSetForm = (s: RatingSet | null) => {
    setEditingSet(s)
    setSetName(s?.name ?? '')
    setOptionRows(
      s
        ? [...s.options]
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((o) => ({
              value: String(o.value),
              label: o.label,
              displayOrder: String(o.displayOrder),
            }))
        : [
            { value: '1', label: '', displayOrder: '1' },
            { value: '2', label: '', displayOrder: '2' },
          ]
    )
    setSetOpen(true)
  }

  const saveRatingSet = () => {
    const options: RatingOption[] = optionRows
      .filter((r) => r.label.trim() !== '')
      .map((r) => ({
        value: Number(r.value) || 0,
        label: r.label.trim(),
        displayOrder: Number(r.displayOrder) || 0,
      }))
    if (options.length < 2) {
      toast.error('A rating set needs at least two labelled options')
      return
    }
    if (editingSet)
      store.updateRatingSet(editingSet.id, { name: setName, options })
    else store.addRatingSet({ name: setName, options })
    setSetOpen(false)
  }

  const openQuestionForm = (q: AssessmentQuestion | null) => {
    setEditingQ(q)
    setQDraft(
      q
        ? {
            question: q.question,
            responseRequired: q.responseRequired,
            ratingRequired: q.ratingRequired,
            ratingSetId: q.ratingSetId ?? NO_RATING_SET,
            applicableTo: q.applicablePositions === 'all' ? 'all' : 'specific',
            positionsText:
              q.applicablePositions === 'all'
                ? ''
                : q.applicablePositions.join(', '),
          }
        : { ...emptyQuestionDraft }
    )
    setQOpen(true)
  }

  const saveQuestion = () => {
    const positions =
      qDraft.applicableTo === 'all'
        ? ('all' as const)
        : qDraft.positionsText
            .split(',')
            .map((p) => p.trim())
            .filter(Boolean)
    if (positions !== 'all' && positions.length === 0) {
      toast.error('List at least one position, or apply to all positions')
      return
    }
    const ratingSetId =
      qDraft.ratingRequired && qDraft.ratingSetId !== NO_RATING_SET
        ? qDraft.ratingSetId
        : null
    if (qDraft.ratingRequired && !ratingSetId) {
      toast.error('Pick a rating set for a rating-required question')
      return
    }
    const payload = {
      question: qDraft.question,
      responseRequired: qDraft.responseRequired,
      ratingRequired: qDraft.ratingRequired,
      ratingSetId,
      applicablePositions: positions,
    }
    if (editingQ) store.updateQuestion(editingQ.id, payload)
    else store.addQuestion({ ...payload, active: true })
    setQOpen(false)
  }

  return (
    <div className='w-full space-y-5'>
      {/* Rating sets */}
      <section>
        <div className='mb-2 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Rating sets ({store.ratingSets.length})
          </h3>
          <Button
            variant='outline'
            className='h-7 gap-1 text-xs'
            onClick={() => openSetForm(null)}
          >
            <Plus size={12} /> Add rating set
          </Button>
        </div>
        <div className='rounded-[8px] border border-gray-200 bg-white'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Options (in display order)</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {store.ratingSets.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className='font-medium'>{s.name}</TableCell>
                  <TableCell className='text-paragraph-sm text-neutral-1000'>
                    {[...s.options]
                      .sort((a, b) => a.displayOrder - b.displayOrder)
                      .map((o) => `${o.label} (${o.value})`)
                      .join(' · ')}
                  </TableCell>
                  <TableCell className='text-right'>
                    <Button
                      variant='outline'
                      className='h-6 gap-1 px-2 text-xs'
                      onClick={() => openSetForm(s)}
                    >
                      <PencilSimple size={12} /> Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className='text-paragraph-sm text-neutral-1000 mt-1.5'>
          Rating sets define the options an interviewer can pick when a
          question requires a rating.
        </p>
      </section>

      {/* Assessment questions */}
      <section>
        <div className='mb-2 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Assessment questions ({store.questions.length})
          </h3>
          <Button
            variant='outline'
            className='h-7 gap-1 text-xs'
            onClick={() => openQuestionForm(null)}
          >
            <Plus size={12} /> Add question
          </Button>
        </div>
        <div className='rounded-[8px] border border-gray-200 bg-white'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-[60px]'>Order</TableHead>
                <TableHead>Question</TableHead>
                <TableHead>Response</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Rating set</TableHead>
                <TableHead>Applies to</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderedQuestions.map((q, i) => (
                <TableRow key={q.id}>
                  <TableCell>
                    <div className='flex items-center gap-1'>
                      <span className='text-sm'>{q.displayOrder}</span>
                      <div className='flex flex-col'>
                        <Button
                          variant='outline'
                          className='h-4 w-4 p-0'
                          disabled={i === 0}
                          onClick={() => store.moveQuestion(q.id, 'up')}
                        >
                          <ArrowUp size={10} />
                        </Button>
                        <Button
                          variant='outline'
                          className='h-4 w-4 p-0'
                          disabled={i === orderedQuestions.length - 1}
                          onClick={() => store.moveQuestion(q.id, 'down')}
                        >
                          <ArrowDown size={10} />
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className='max-w-[320px] text-sm font-medium'>
                    {q.question}
                  </TableCell>
                  <TableCell className='text-sm'>
                    {q.responseRequired ? 'Required' : 'Optional'}
                  </TableCell>
                  <TableCell className='text-sm'>
                    {q.ratingRequired ? 'Required' : '—'}
                  </TableCell>
                  <TableCell className='text-sm'>
                    {ratingSetName(q.ratingSetId)}
                  </TableCell>
                  <TableCell className='text-paragraph-sm text-neutral-1000'>
                    {q.applicablePositions === 'all'
                      ? 'All positions'
                      : q.applicablePositions.join(', ')}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={q.active}
                      onCheckedChange={(v) =>
                        store.updateQuestion(q.id, { active: v })
                      }
                    />
                  </TableCell>
                  <TableCell className='text-right'>
                    <div className='flex justify-end gap-1'>
                      <Button
                        variant='outline'
                        className='h-6 gap-1 px-2 text-xs'
                        onClick={() => openQuestionForm(q)}
                      >
                        <PencilSimple size={12} /> Edit
                      </Button>
                      <Button
                        variant='outline'
                        className='h-6 gap-1 px-2 text-xs text-red-600'
                        onClick={() => setDeleteQ(q)}
                      >
                        <Trash size={12} /> Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className='text-paragraph-sm text-neutral-1000 mt-1.5'>
          Questions render on the interview assessment form in this order;
          inactive questions are hidden from new assessments.
        </p>
      </section>

      {/* Add / edit rating set */}
      <Dialog open={setOpen} onOpenChange={setSetOpen}>
        <DialogContent className='sm:max-w-[520px]'>
          <DialogHeader>
            <DialogTitle>
              {editingSet ? 'Edit rating set' : 'Add rating set'}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <Input
              placeholder='Rating set name'
              value={setName}
              onChange={(e) => setSetName(e.target.value)}
            />
            <div>
              <div className='mb-1 flex items-center justify-between'>
                <p className='text-sm font-medium'>Options</p>
                <Button
                  variant='outline'
                  className='h-7 gap-1 text-xs'
                  onClick={() =>
                    setOptionRows((rows) => [
                      ...rows,
                      {
                        value: String(rows.length + 1),
                        label: '',
                        displayOrder: String(rows.length + 1),
                      },
                    ])
                  }
                >
                  <Plus size={12} /> Add option
                </Button>
              </div>
              <div className='space-y-2 rounded-[8px] border border-gray-200 p-2'>
                <div className='text-neutral-1000 grid grid-cols-[80px_1fr_100px_32px] gap-2 text-xs font-medium'>
                  <span>Value</span>
                  <span>Display label</span>
                  <span>Display order</span>
                  <span />
                </div>
                {optionRows.map((r, i) => (
                  <div
                    key={i}
                    className='grid grid-cols-[80px_1fr_100px_32px] items-center gap-2'
                  >
                    <Input
                      type='number'
                      className='h-8'
                      value={r.value}
                      onChange={(e) =>
                        setOptionRows((rows) =>
                          rows.map((x, j) =>
                            j === i ? { ...x, value: e.target.value } : x
                          )
                        )
                      }
                    />
                    <Input
                      className='h-8'
                      placeholder='Label'
                      value={r.label}
                      onChange={(e) =>
                        setOptionRows((rows) =>
                          rows.map((x, j) =>
                            j === i ? { ...x, label: e.target.value } : x
                          )
                        )
                      }
                    />
                    <Input
                      type='number'
                      className='h-8'
                      value={r.displayOrder}
                      onChange={(e) =>
                        setOptionRows((rows) =>
                          rows.map((x, j) =>
                            j === i
                              ? { ...x, displayOrder: e.target.value }
                              : x
                          )
                        )
                      }
                    />
                    <Button
                      variant='outline'
                      className='h-8 w-8 p-0 text-red-600'
                      onClick={() =>
                        setOptionRows((rows) =>
                          rows.filter((_, j) => j !== i)
                        )
                      }
                    >
                      <Trash size={12} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setSetOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!setName} onClick={saveRatingSet}>
              {editingSet ? 'Save changes' : 'Save rating set'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / edit assessment question */}
      <Dialog open={qOpen} onOpenChange={setQOpen}>
        <DialogContent className='sm:max-w-[520px]'>
          <DialogHeader>
            <DialogTitle>
              {editingQ ? 'Edit assessment question' : 'Add assessment question'}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <Textarea
              placeholder='Question text'
              rows={3}
              value={qDraft.question}
              onChange={(e) =>
                setQDraft((d) => ({ ...d, question: e.target.value }))
              }
            />
            <div className='grid gap-2 md:grid-cols-2'>
              <label className='flex items-center gap-2 text-sm'>
                <Switch
                  checked={qDraft.responseRequired}
                  onCheckedChange={(v) =>
                    setQDraft((d) => ({ ...d, responseRequired: v }))
                  }
                />
                Response required
              </label>
              <label className='flex items-center gap-2 text-sm'>
                <Switch
                  checked={qDraft.ratingRequired}
                  onCheckedChange={(v) =>
                    setQDraft((d) => ({ ...d, ratingRequired: v }))
                  }
                />
                Rating required
              </label>
            </div>
            <Select
              value={qDraft.ratingSetId}
              onValueChange={(v) =>
                setQDraft((d) => ({ ...d, ratingSetId: v }))
              }
              disabled={!qDraft.ratingRequired}
            >
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Rating set' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_RATING_SET}>No rating set</SelectItem>
                {store.ratingSets.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className='space-y-2'>
              <Select
                value={qDraft.applicableTo}
                onValueChange={(v) =>
                  setQDraft((d) => ({
                    ...d,
                    applicableTo: v as 'all' | 'specific',
                  }))
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>
                    Applicable to all positions
                  </SelectItem>
                  <SelectItem value='specific'>
                    Applicable to specific positions
                  </SelectItem>
                </SelectContent>
              </Select>
              {qDraft.applicableTo === 'specific' && (
                <Input
                  placeholder='Positions, comma-separated (e.g. Senior Backend Engineer, Staff Engineer)'
                  value={qDraft.positionsText}
                  onChange={(e) =>
                    setQDraft((d) => ({ ...d, positionsText: e.target.value }))
                  }
                />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setQOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!qDraft.question.trim()} onClick={saveQuestion}>
              {editingQ ? 'Save changes' : 'Save question'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete question confirm */}
      <Dialog
        open={deleteQ !== null}
        onOpenChange={(o) => !o && setDeleteQ(null)}
      >
        <DialogContent className='sm:max-w-[380px]'>
          <DialogHeader>
            <DialogTitle>Delete assessment question?</DialogTitle>
          </DialogHeader>
          <p className='text-sm'>
            "{deleteQ?.question}" will be removed from the assessment form.
            Submitted assessments keep their recorded answers.
          </p>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteQ(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (deleteQ) store.removeQuestion(deleteQ.id)
                setDeleteQ(null)
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
