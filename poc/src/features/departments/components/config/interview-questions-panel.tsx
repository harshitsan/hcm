import { useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  ArrowsClockwise,
  Eye,
  PencilSimple,
  Plus,
  Trash,
} from 'phosphor-react'
import { toast } from 'sonner'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { type Department } from '../../data/departments'
import { type InterviewQuestion, type RatingSet } from '../../data/governance'
import {
  type DepartmentConfigStore,
  type InterviewQuestionDraft,
} from '../../hooks/use-department-config'
import { FlaggedBadge } from '../department-badges'

const NO_RATING_SET = 'none'

interface PanelProps {
  config: DepartmentConfigStore
  departments: Department[]
}

type DeleteTarget =
  | { kind: 'question'; item: InterviewQuestion }
  | { kind: 'rating-set'; item: RatingSet }
  | null

/**
 * Interview assessment questions management (IAQ-02/03/05/06/07): full
 * question CRUD with Response/Rating required flags, checklist reordering,
 * named rating sets (value lists) and a questionnaire preview.
 */
export function InterviewQuestionsPanel({ config, departments }: PanelProps) {
  const sortedQuestions = [...config.interviewQuestions].sort((a, b) => a.order - b.order)

  const deptName = (id: string) =>
    departments.find((d) => d.id === id)?.name ?? `${id} (deleted)`
  const ratingSetById = (id: string | null) =>
    id ? config.ratingSets.find((r) => r.id === id) : undefined

  /* ---------------- question add/edit dialog state ---------------- */

  const [questionDialogOpen, setQuestionDialogOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<InterviewQuestion | null>(null)
  const [questionText, setQuestionText] = useState('')
  const [responseRequired, setResponseRequired] = useState(false)
  const [ratingRequired, setRatingRequired] = useState(false)
  const [ratingSetId, setRatingSetId] = useState<string>(NO_RATING_SET)

  const openQuestionDialog = (question: InterviewQuestion | null) => {
    setEditingQuestion(question)
    setQuestionText(question?.question ?? '')
    setResponseRequired(question?.responseRequired ?? true)
    setRatingRequired(question?.ratingRequired ?? true)
    setRatingSetId(question?.ratingSetId ?? config.ratingSets[0]?.id ?? NO_RATING_SET)
    setQuestionDialogOpen(true)
  }

  const submitQuestion = () => {
    if (questionText.trim().length < 5) {
      toast.error('Enter the question text (at least 5 characters)')
      return
    }
    const resolvedSetId = ratingSetId === NO_RATING_SET ? null : ratingSetId
    if (ratingRequired && !resolvedSetId) {
      toast.error('A question with a required rating needs a rating set')
      return
    }
    const draft: InterviewQuestionDraft = {
      question: questionText.trim(),
      departmentIds: editingQuestion?.departmentIds ?? [],
      responseRequired,
      ratingRequired,
      ratingSetId: resolvedSetId,
    }
    if (editingQuestion) {
      config.updateQuestion(editingQuestion.id, draft)
    } else {
      config.addQuestion(draft)
    }
    setQuestionDialogOpen(false)
    setEditingQuestion(null)
  }

  /* ---------------- rating-set add/edit state ---------------- */

  const [newSetName, setNewSetName] = useState('')
  const [newSetValues, setNewSetValues] = useState('')
  const [setDialogOpen, setSetDialogOpen] = useState(false)
  const [editingSet, setEditingSet] = useState<RatingSet | null>(null)
  const [editSetName, setEditSetName] = useState('')
  const [editSetValues, setEditSetValues] = useState('')

  const parseValues = (raw: string) =>
    raw
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)

  const submitNewSet = () => {
    const values = parseValues(newSetValues)
    if (newSetName.trim().length < 2) {
      toast.error('Enter a rating set name')
      return
    }
    if (values.length < 2) {
      toast.error('Enter at least two rating values (comma separated)')
      return
    }
    config.addRatingSet(newSetName.trim(), values)
    setNewSetName('')
    setNewSetValues('')
  }

  const openSetDialog = (set: RatingSet) => {
    setEditingSet(set)
    setEditSetName(set.name)
    setEditSetValues(set.values.join(', '))
    setSetDialogOpen(true)
  }

  const submitEditSet = () => {
    if (!editingSet) return
    const values = parseValues(editSetValues)
    if (editSetName.trim().length < 2) {
      toast.error('Enter a rating set name')
      return
    }
    if (values.length < 2) {
      toast.error('Enter at least two rating values (comma separated)')
      return
    }
    config.updateRatingSet(editingSet.id, editSetName.trim(), values)
    setSetDialogOpen(false)
    setEditingSet(null)
  }

  /* ---------------- delete confirmation + preview ---------------- */

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const onConfirmDelete = () => {
    if (!deleteTarget) return
    if (deleteTarget.kind === 'question') {
      config.removeQuestion(deleteTarget.item.id)
    } else {
      config.removeRatingSet(deleteTarget.item.id)
    }
    setDeleteTarget(null)
  }

  return (
    <div className='space-y-4'>
      {/* -------- questions checklist (IAQ-03/05/07) -------- */}
      <Card className='border-gray-200'>
        <CardHeader>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
              Interview assessment questions ({sortedQuestions.length})
            </CardTitle>
            <div className='flex items-center gap-2'>
              <Button
                variant='icon2'
                className='text-neutral-1900 h-7 w-7'
                aria-label='Refresh questions'
                onClick={() => config.refreshQuestions()}
              >
                <ArrowsClockwise size={16} weight='bold' />
              </Button>
              <Button
                variant='outline'
                className='h-7 gap-1 px-2 text-xs'
                onClick={() => setPreviewOpen(true)}
              >
                <Eye size={13} weight='bold' />
                Preview questionnaire
              </Button>
              <Button className='h-7 gap-1 px-2 text-xs' onClick={() => openQuestionDialog(null)}>
                <Plus size={12} weight='bold' />
                New question
              </Button>
            </div>
          </div>
          <p className='text-neutral-1000 text-xs'>
            Questions render to interviewers in checklist order, scoped to the selected
            departments. Required flags enforce mandatory feedback during interviews.
          </p>
        </CardHeader>
        <CardContent className='space-y-3'>
          {sortedQuestions.map((q, index) => {
            const set = ratingSetById(q.ratingSetId)
            return (
              <div key={q.id} className='rounded-md border border-gray-200 p-3'>
                <div className='flex flex-wrap items-center gap-2'>
                  <Badge variant='secondary'>#{q.order}</Badge>
                  <span className='text-neutral-1600 text-sm font-medium'>{q.question}</span>
                  {q.flagged && <FlaggedBadge />}
                  <span className='ml-auto flex items-center gap-1'>
                    <Button
                      variant='icon2'
                      className='text-neutral-1900 h-6 w-6'
                      aria-label='Move up in checklist'
                      disabled={index === 0}
                      onClick={() => config.moveQuestion(q.id, 'up')}
                    >
                      <ArrowUp size={13} weight='bold' />
                    </Button>
                    <Button
                      variant='icon2'
                      className='text-neutral-1900 h-6 w-6'
                      aria-label='Move down in checklist'
                      disabled={index === sortedQuestions.length - 1}
                      onClick={() => config.moveQuestion(q.id, 'down')}
                    >
                      <ArrowDown size={13} weight='bold' />
                    </Button>
                    <Button
                      variant='icon2'
                      className='text-neutral-1900 h-6 w-6'
                      aria-label={`Edit question #${q.order}`}
                      onClick={() => openQuestionDialog(q)}
                    >
                      <PencilSimple size={13} weight='fill' />
                    </Button>
                    <Button
                      variant='icon2'
                      className='text-neutral-1900 h-6 w-6'
                      aria-label={`Delete question #${q.order}`}
                      onClick={() => setDeleteTarget({ kind: 'question', item: q })}
                    >
                      <Trash size={13} weight='bold' />
                    </Button>
                  </span>
                </div>
                <div className='mt-2 flex flex-wrap items-center gap-1.5'>
                  <Badge variant={q.responseRequired ? 'completed' : 'secondary'}>
                    Response {q.responseRequired ? 'required' : 'optional'}
                  </Badge>
                  <Badge variant={q.ratingRequired ? 'completed' : 'secondary'}>
                    Rating {q.ratingRequired ? 'required' : 'optional'}
                  </Badge>
                  {set ? (
                    <Badge variant='open'>
                      {set.name}: {set.values.join(' / ')}
                    </Badge>
                  ) : (
                    <Badge variant='pending'>No rating set</Badge>
                  )}
                </div>
                <div className='mt-2 flex flex-wrap items-center gap-1.5'>
                  <span className='text-neutral-1000 text-xs'>Applies to:</span>
                  {q.departmentIds.map((id) => (
                    <Badge key={id} variant='open'>
                      {deptName(id)}
                    </Badge>
                  ))}
                  {q.departmentIds.length === 0 && (
                    <span className='text-neutral-1000 text-xs'>all departments</span>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='outline' className='h-6 px-2 text-xs'>
                        Edit departments
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='start' className='min-w-[240px] p-2'>
                      {departments.map((d) => (
                        <label
                          key={d.id}
                          className='flex items-center gap-2 rounded-sm px-1 py-1 text-sm hover:bg-neutral-200'
                        >
                          <Checkbox
                            variant='blue'
                            checked={q.departmentIds.includes(d.id)}
                            onCheckedChange={() => config.toggleQuestionDepartment(q.id, d.id)}
                          />
                          <span className='text-neutral-1900'>{d.name}</span>
                        </label>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )
          })}
          {sortedQuestions.length === 0 && (
            <p className='text-neutral-1000 text-sm'>
              No questions yet — add the first one to start the checklist.
            </p>
          )}
        </CardContent>
      </Card>

      {/* -------- rating sets (IAQ-02) -------- */}
      <Card className='border-gray-200'>
        <CardHeader>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Rating sets
          </CardTitle>
          <p className='text-neutral-1000 text-xs'>
            Named value lists (e.g. Average / Good / Excellent) that interviewers pick from
            when scoring a question.
          </p>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex flex-wrap items-center gap-2'>
            <Input
              value={newSetName}
              onChange={(e) => setNewSetName(e.target.value)}
              placeholder='Rating set name'
              className='w-[180px]'
            />
            <Input
              value={newSetValues}
              onChange={(e) => setNewSetValues(e.target.value)}
              placeholder='Values (comma separated, low → high)'
              className='w-[280px]'
            />
            <Button onClick={submitNewSet} className='h-8'>
              <Plus size={12} weight='bold' />
              Add rating set
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Values (low → high)</TableHead>
                <TableHead>Used by</TableHead>
                <TableHead className='w-[110px]'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {config.ratingSets.map((set) => {
                const usedBy = config.interviewQuestions.filter(
                  (q) => q.ratingSetId === set.id
                ).length
                return (
                  <TableRow key={set.id}>
                    <TableCell className='text-neutral-1600 text-sm font-medium'>
                      {set.name}
                    </TableCell>
                    <TableCell>
                      <span className='flex flex-wrap gap-1'>
                        {set.values.map((v) => (
                          <Badge key={v} variant='secondary'>
                            {v}
                          </Badge>
                        ))}
                      </span>
                    </TableCell>
                    <TableCell className='text-neutral-1900 text-sm'>
                      {usedBy} question{usedBy === 1 ? '' : 's'}
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <Button
                          variant='icon2'
                          className='text-neutral-1900 h-7 w-7'
                          aria-label={`Edit ${set.name}`}
                          onClick={() => openSetDialog(set)}
                        >
                          <PencilSimple size={14} weight='fill' />
                        </Button>
                        <Button
                          variant='icon2'
                          className='text-neutral-1900 h-7 w-7'
                          aria-label={`Delete ${set.name}`}
                          onClick={() => setDeleteTarget({ kind: 'rating-set', item: set })}
                        >
                          <Trash size={14} weight='bold' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* -------- question add/edit dialog (IAQ-03/07) -------- */}
      <Dialog
        open={questionDialogOpen}
        onOpenChange={(open) => {
          setQuestionDialogOpen(open)
          if (!open) setEditingQuestion(null)
        }}
      >
        <DialogContent className='sm:max-w-[480px]'>
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? `Edit question #${editingQuestion.order}` : 'New question'}
            </DialogTitle>
            <DialogDescription>
              Required flags enforce mandatory interviewer feedback; the rating set defines
              the score values.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-3'>
            <div>
              <p className='text-neutral-1600 mb-1 text-sm font-medium'>Question</p>
              <Textarea
                rows={2}
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder='e.g. Describe a time you resolved a critical escalation.'
              />
            </div>
            <label className='flex items-center gap-2 text-sm'>
              <Switch checked={responseRequired} onCheckedChange={setResponseRequired} />
              <span className='text-neutral-1900'>
                Response required — interviewer must capture a written response
              </span>
            </label>
            <label className='flex items-center gap-2 text-sm'>
              <Switch checked={ratingRequired} onCheckedChange={setRatingRequired} />
              <span className='text-neutral-1900'>
                Rating required — interviewer must pick a rating value
              </span>
            </label>
            <div>
              <p className='text-neutral-1600 mb-1 text-sm font-medium'>Rating set</p>
              <Select value={ratingSetId} onValueChange={setRatingSetId}>
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_RATING_SET}>No rating set</SelectItem>
                  {config.ratingSets.map((set) => (
                    <SelectItem key={set.id} value={set.id}>
                      {set.name} ({set.values.join(' / ')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setQuestionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitQuestion}>
              {editingQuestion ? 'Save question' : 'Add question'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* -------- rating-set edit dialog (IAQ-02) -------- */}
      <Dialog
        open={setDialogOpen}
        onOpenChange={(open) => {
          setSetDialogOpen(open)
          if (!open) setEditingSet(null)
        }}
      >
        <DialogContent className='sm:max-w-[440px]'>
          <DialogHeader>
            <DialogTitle>Edit rating set</DialogTitle>
            <DialogDescription>
              Questions linked to this set immediately score with the updated values.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-3'>
            <div>
              <p className='text-neutral-1600 mb-1 text-sm font-medium'>Name</p>
              <Input value={editSetName} onChange={(e) => setEditSetName(e.target.value)} />
            </div>
            <div>
              <p className='text-neutral-1600 mb-1 text-sm font-medium'>
                Values (comma separated, low → high)
              </p>
              <Input
                value={editSetValues}
                onChange={(e) => setEditSetValues(e.target.value)}
                placeholder='Average, Good, Excellent'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setSetDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitEditSet}>Save rating set</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* -------- questionnaire preview (IAQ-06) -------- */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className='max-h-[80vh] overflow-y-auto sm:max-w-[560px]'>
          <DialogHeader>
            <DialogTitle>Interview assessment questionnaire — preview</DialogTitle>
            <DialogDescription>
              Read-only view of what interviewers see, in checklist order.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-3'>
            {sortedQuestions.map((q) => {
              const set = ratingSetById(q.ratingSetId)
              return (
                <div key={q.id} className='rounded-md border border-gray-200 p-3'>
                  <p className='text-neutral-1600 text-sm font-medium'>
                    {q.order}. {q.question}
                    {(q.responseRequired || q.ratingRequired) && (
                      <span className='text-red-1400'> *</span>
                    )}
                  </p>
                  {set && (
                    <div className='mt-2 flex flex-wrap items-center gap-1.5'>
                      <span className='text-neutral-1000 text-xs'>
                        Rating{q.ratingRequired ? ' (required)' : ' (optional)'}:
                      </span>
                      {set.values.map((v) => (
                        <span
                          key={v}
                          className='text-neutral-1900 rounded-md border border-gray-200 px-2 py-0.5 text-xs'
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                  )}
                  <Textarea
                    rows={2}
                    disabled
                    className='mt-2'
                    placeholder={
                      q.responseRequired
                        ? 'Interviewer response (required)…'
                        : 'Interviewer response (optional)…'
                    }
                  />
                </div>
              )
            })}
            {sortedQuestions.length === 0 && (
              <p className='text-neutral-1000 text-sm'>No questions to preview.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setPreviewOpen(false)}>
              Close preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* -------- delete confirmation -------- */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTarget === null
                ? ''
                : deleteTarget.kind === 'question'
                  ? `Delete question #${deleteTarget.item.order}?`
                  : `Delete rating set "${deleteTarget.item.name}"?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.kind === 'question'
                ? 'The checklist is renumbered after removal. Completed interview feedback is unaffected.'
                : 'Rating sets still linked to questions cannot be deleted — repoint those questions first.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirmDelete}
              className='bg-destructive hover:bg-destructive/90 text-white'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
