import { useMemo, useState } from 'react'
import { Eye, PencilLine, RotateCcw } from 'lucide-react'
import { ClipboardText } from 'phosphor-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from '@/components/ui/textarea'
import { CURRENT_EMPLOYEE } from '../data/entries'
import { type Survey } from '../data/surveys'
import { type SurveysStore } from '../hooks/use-surveys'
import { SurveyDetailSheet } from './survey-detail-sheet'
import { surveyStatusVariant } from './survey-status'

const ALL = 'all'

const MY_STATUSES = ['Pending response', 'Responded'] as const
type MySurveyStatus = (typeof MY_STATUSES)[number]

interface MySurveysTabProps {
  store: SurveysStore
}

/** Response the signed-in employee recorded against a survey (POC in-memory). */
interface SurveyResponse {
  respondedOn: string
  answer: string
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Employee-facing survey list (SUR-01..04): every survey published to the
 * employee with title, start/end dates and a personal Pending response /
 * Responded status, filterable by a From/To period window and by status,
 * with a single Reset restoring the full list. Responding is done inline
 * through a dialog and flips the survey to Responded.
 */
export function MySurveysTab({ store }: MySurveysTabProps) {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>(ALL)
  const [responses, setResponses] = useState<Record<string, SurveyResponse>>({
    // The completed engagement pulse was already answered by this employee.
    'svy-1': { respondedOn: '2026-04-12', answer: 'Submitted via pulse form.' },
  })
  const [viewing, setViewing] = useState<Survey | null>(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [responding, setResponding] = useState<Survey | null>(null)
  const [answer, setAnswer] = useState('')

  /** Only surveys actually released to employees appear here. */
  const published = useMemo(
    () =>
      store.surveys.filter(
        (s) => s.status === 'Published' || s.status === 'Completed'
      ),
    [store.surveys]
  )

  const myStatusOf = (s: Survey): MySurveyStatus =>
    responses[s.id] ? 'Responded' : 'Pending response'

  /** SUR-01 — period From/To window; SUR-02 — my-status filter. */
  const filtered = useMemo(
    () =>
      published.filter((s) => {
        if (from !== '' && s.endDate < from) return false
        if (to !== '' && s.startDate > to) return false
        const mine: MySurveyStatus = responses[s.id]
          ? 'Responded'
          : 'Pending response'
        if (statusFilter !== ALL && mine !== statusFilter) return false
        return true
      }),
    [published, from, to, statusFilter, responses]
  )

  const pendingCount = published.filter((s) => !responses[s.id]).length

  const hasFilters = from !== '' || to !== '' || statusFilter !== ALL

  /** SUR-04 — one Reset shows every survey again. */
  const resetFilters = () => {
    setFrom('')
    setTo('')
    setStatusFilter(ALL)
  }

  const submitResponse = () => {
    if (!responding) return
    setResponses((prev) => ({
      ...prev,
      [responding.id]: { respondedOn: today(), answer: answer.trim() },
    }))
    toast.success('Survey response submitted', {
      description: `Your ${responding.anonymous ? 'anonymous ' : ''}response to "${responding.title}" was recorded for ${CURRENT_EMPLOYEE}.`,
    })
    setResponding(null)
    setAnswer('')
  }

  if (!store.settings.moduleEnabled) {
    return (
      <div className='border-grey-200 flex flex-col items-center gap-2 rounded-[6px] border bg-white px-6 py-12 text-center'>
        <ClipboardText size={32} className='text-neutral-1000' />
        <p className='text-neutral-1600 text-paragraph-md font-medium'>
          The Survey Module is disabled for this company
        </p>
        <p className='text-paragraph-sm text-neutral-1000 max-w-md'>
          Your Company Admin can enable it from Admin → Surveys →
          Configuration (Setup step).
        </p>
      </div>
    )
  }

  return (
    <Card className='gap-3 border-none bg-white py-4'>
      <CardHeader className='px-4'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <div>
            <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
              My Surveys ({filtered.length})
            </CardTitle>
            <p className='text-paragraph-sm text-neutral-1000'>
              Surveys published to you, with their open window and whether you
              have responded. {pendingCount} still awaiting your response.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-3 px-4'>
        {/* SUR-01/02/04 — From/To period filter, status filter and Reset. */}
        <div className='flex flex-wrap items-end gap-3'>
          <div className='flex flex-col gap-1'>
            <Label htmlFor='my-survey-from' className='text-xs'>
              Period from
            </Label>
            <Input
              id='my-survey-from'
              type='date'
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className='h-8 w-[150px] text-xs'
            />
          </div>
          <div className='flex flex-col gap-1'>
            <Label htmlFor='my-survey-to' className='text-xs'>
              Period to
            </Label>
            <Input
              id='my-survey-to'
              type='date'
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className='h-8 w-[150px] text-xs'
            />
          </div>
          <div className='flex flex-col gap-1'>
            <Label className='text-xs'>Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger variant='secondary' className='h-8 w-[180px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All statuses</SelectItem>
                {MY_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant='outline'
            onClick={resetFilters}
            disabled={!hasFilters}
            className='h-8 gap-1'
          >
            <RotateCcw className='size-3.5' /> Reset
          </Button>
        </div>

        {/* SUR-03 — title, start date, end date and status per survey. */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Survey Title</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Anonymity</TableHead>
              <TableHead>Survey Status</TableHead>
              <TableHead>My Status</TableHead>
              <TableHead className='w-40 text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className='text-neutral-1000 py-6 text-center text-sm'
                >
                  No surveys match the current filters.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((s) => {
              const mine = myStatusOf(s)
              const response = responses[s.id]
              const open = s.status === 'Published'
              return (
                <TableRow key={s.id}>
                  <TableCell>
                    <p className='text-sm font-medium'>{s.title}</p>
                    <p className='text-neutral-1000 text-xs'>{s.description}</p>
                  </TableCell>
                  <TableCell className='text-sm'>{s.startDate}</TableCell>
                  <TableCell className='text-sm'>{s.endDate}</TableCell>
                  <TableCell>
                    <Badge variant={s.anonymous ? 'booked' : 'pending'}>
                      {s.anonymous ? 'Anonymous' : 'Identified'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={surveyStatusVariant(s.status)}>
                      {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        mine === 'Responded' ? 'badge_active' : 'pending'
                      }
                    >
                      {mine}
                    </Badge>
                    {response && (
                      <p className='text-neutral-1000 mt-0.5 text-[11px]'>
                        on {response.respondedOn}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className='text-right'>
                    <div className='flex items-center justify-end gap-1'>
                      <Button
                        variant='icon2'
                        className='text-neutral-1900 h-7 w-7'
                        aria-label={`View ${s.title}`}
                        onClick={() => {
                          setViewing(s)
                          setViewOpen(true)
                        }}
                      >
                        <Eye className='size-4' />
                      </Button>
                      <Button
                        variant='outline'
                        className='h-7 gap-1 px-2 text-xs'
                        disabled={!open || mine === 'Responded'}
                        onClick={() => {
                          setResponding(s)
                          setAnswer('')
                        }}
                      >
                        <PencilLine className='size-3.5' />
                        {mine === 'Responded'
                          ? 'Responded'
                          : open
                            ? 'Respond'
                            : 'Closed'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>

      <SurveyDetailSheet
        survey={viewing}
        open={viewOpen}
        onOpenChange={(open) => {
          setViewOpen(open)
          if (!open) setViewing(null)
        }}
      />

      {/* Respond dialog — records the employee's response in memory. */}
      <Dialog
        open={responding !== null}
        onOpenChange={(open) => {
          if (!open) {
            setResponding(null)
            setAnswer('')
          }
        }}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Respond to survey</DialogTitle>
            <DialogDescription>
              {responding
                ? `"${responding.title}" is open ${responding.startDate} – ${responding.endDate}. ${
                    responding.anonymous
                      ? 'Responses are anonymous.'
                      : 'Your response is recorded with your name.'
                  }`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='my-survey-answer' className='text-xs'>
              Your response
            </Label>
            <Textarea
              id='my-survey-answer'
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder='Share your feedback for this survey…'
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setResponding(null)
                setAnswer('')
              }}
            >
              Cancel
            </Button>
            <Button onClick={submitResponse} disabled={answer.trim() === ''}>
              Submit response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
