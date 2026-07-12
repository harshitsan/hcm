import { useMemo, useState } from 'react'
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  CircleStop,
  Eye,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Send,
  Trash2,
} from 'lucide-react'
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
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { SURVEY_PERIODS, SURVEY_STATUSES, type Survey } from '../data/surveys'
import { type SurveysStore } from '../hooks/use-surveys'
import { SurveyDetailSheet } from './survey-detail-sheet'
import { SurveyFormDialog } from './survey-form-dialog'
import { SurveyResponsesSheet } from './survey-responses-sheet'
import { surveyStatusVariant } from './survey-status'

const PAGE_SIZE = 5
const ALL = 'all'

/**
 * Survey List screen (SVL-01..07): search by title/period/status with reset,
 * the full column set (title, dates, anonymity, created by, published,
 * applicability, status), View / Responses / Edit / Publish / Close / Delete
 * task actions, plus refresh and pagination — mirroring the Kensium Survey
 * List with the P4 lifecycle (Draft → Published → Closed) on top.
 */
export function SurveyListPanel({ store }: { store: SurveysStore }) {
  const [search, setSearch] = useState('')
  const [period, setPeriod] = useState<string>(ALL)
  const [status, setStatus] = useState<string>(ALL)
  const [page, setPage] = useState(0)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Survey | null>(null)
  const [viewing, setViewing] = useState<Survey | null>(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [resultsFor, setResultsFor] = useState<Survey | null>(null)
  const [resultsOpen, setResultsOpen] = useState(false)
  const [publishTarget, setPublishTarget] = useState<Survey | null>(null)
  const [closeTarget, setCloseTarget] = useState<Survey | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Survey | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return store.surveys.filter(
      (s) =>
        (q === '' || s.title.toLowerCase().includes(q)) &&
        (period === ALL || s.period === period) &&
        (status === ALL || s.status === status)
    )
  }, [store.surveys, search, period, status])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

  const hasFilters = search.trim() !== '' || period !== ALL || status !== ALL

  const resetFilters = () => {
    setSearch('')
    setPeriod(ALL)
    setStatus(ALL)
    setPage(0)
  }

  // Live copies for the open sheets, so responses submitted elsewhere and
  // lifecycle changes reflect immediately.
  const viewingLive = viewing
    ? (store.surveys.find((s) => s.id === viewing.id) ?? null)
    : null
  const resultsLive = resultsFor
    ? (store.surveys.find((s) => s.id === resultsFor.id) ?? null)
    : null

  return (
    <Card className='gap-3 border-none bg-white py-4'>
      <CardHeader className='px-4'>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
              Survey List ({filtered.length})
            </CardTitle>
            <p className='text-paragraph-sm text-neutral-1000'>
              Last refreshed {store.lastRefreshedAt}. New surveys route to the
              configured survey approvers before publishing; published surveys
              collect responses until they are closed.
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              onClick={store.refresh}
              className='h-8 gap-1'
              aria-label='Refresh survey list'
            >
              <RefreshCw className='size-3.5' /> Refresh
            </Button>
            <Button
              onClick={() => {
                setEditing(null)
                setFormOpen(true)
              }}
              className='h-8 gap-1'
            >
              <Plus className='size-3.5' /> Add new survey
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-3 px-4'>
        <div className='flex flex-wrap items-center gap-2'>
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
            placeholder='Search by survey title'
            className='h-8 max-w-60'
          />
          <Select
            value={period}
            onValueChange={(v) => {
              setPeriod(v)
              setPage(0)
            }}
          >
            <SelectTrigger variant='secondary' className='h-8 w-[140px]'>
              <SelectValue placeholder='Period' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All periods</SelectItem>
              {SURVEY_PERIODS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v)
              setPage(0)
            }}
          >
            <SelectTrigger variant='secondary' className='h-8 w-[170px]'>
              <SelectValue placeholder='Status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              {SURVEY_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant='outline' onClick={resetFilters} className='h-8 gap-1'>
              <RotateCcw className='size-3.5' /> Reset
            </Button>
          )}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Survey Title</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Anonymity</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Published Date</TableHead>
              <TableHead>Applicability</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className='w-44 text-right'>Tasks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className='text-neutral-1000 py-6 text-center text-sm'>
                  No surveys match the current filters.
                </TableCell>
              </TableRow>
            )}
            {pageRows.map((s) => {
              const responseCount = store.responsesFor(s.id).length
              const canPublish = s.status === 'Draft' || s.status === 'Pending Approval'
              const canClose = s.status === 'Published'
              const hasResults = s.status === 'Published' || s.status === 'Completed'
              return (
                <TableRow key={s.id}>
                  <TableCell>
                    <p className='text-sm font-medium'>{s.title}</p>
                    <p className='text-neutral-1000 text-xs'>
                      {s.questions.length} question{s.questions.length === 1 ? '' : 's'}
                      {hasResults &&
                        ` · ${responseCount} response${responseCount === 1 ? '' : 's'}`}
                    </p>
                  </TableCell>
                  <TableCell className='text-sm'>{s.period}</TableCell>
                  <TableCell className='text-sm'>{s.startDate}</TableCell>
                  <TableCell className='text-sm'>{s.endDate}</TableCell>
                  <TableCell>
                    <Badge variant={s.anonymous ? 'open' : 'pending'}>
                      {s.anonymous ? 'Anonymous' : 'Identified'}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-sm'>{s.createdBy}</TableCell>
                  <TableCell className='text-sm'>{s.publishedOn ?? '—'}</TableCell>
                  <TableCell className='max-w-44 text-sm'>{s.applicability}</TableCell>
                  <TableCell>
                    <Badge variant={surveyStatusVariant(s.status)}>{s.status}</Badge>
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
                      {hasResults && (
                        <Button
                          variant='icon2'
                          className='text-neutral-1900 h-7 w-7'
                          aria-label={`Responses for ${s.title}`}
                          onClick={() => {
                            setResultsFor(s)
                            setResultsOpen(true)
                          }}
                        >
                          <BarChart3 className='size-4' />
                        </Button>
                      )}
                      <Button
                        variant='icon2'
                        className='text-neutral-1900 h-7 w-7'
                        aria-label={`Edit ${s.title}`}
                        onClick={() => {
                          setEditing(s)
                          setFormOpen(true)
                        }}
                      >
                        <Pencil className='size-4' />
                      </Button>
                      {canPublish && (
                        <Button
                          variant='icon2'
                          className='text-blue-1400 h-7 w-7'
                          aria-label={`Publish ${s.title}`}
                          onClick={() => setPublishTarget(s)}
                        >
                          <Send className='size-4' />
                        </Button>
                      )}
                      {canClose && (
                        <Button
                          variant='icon2'
                          className='text-neutral-1900 h-7 w-7'
                          aria-label={`Close ${s.title}`}
                          onClick={() => setCloseTarget(s)}
                        >
                          <CircleStop className='size-4' />
                        </Button>
                      )}
                      <Button
                        variant='icon2'
                        className='text-red-1400 h-7 w-7'
                        aria-label={`Delete ${s.title}`}
                        onClick={() => setDeleteTarget(s)}
                      >
                        <Trash2 className='size-4' />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        <div className='flex items-center justify-between'>
          <p className='text-paragraph-sm text-neutral-1000'>
            Page {safePage + 1} of {pageCount} · {filtered.length} survey(s)
          </p>
          <div className='flex items-center gap-1'>
            <Button
              variant='outline'
              className='h-7 gap-1 px-2'
              disabled={safePage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft className='size-3.5' /> Prev
            </Button>
            <Button
              variant='outline'
              className='h-7 gap-1 px-2'
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            >
              Next <ChevronRight className='size-3.5' />
            </Button>
          </div>
        </div>
      </CardContent>

      <SurveyFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditing(null)
        }}
        survey={editing}
        onSubmit={(draft) => {
          if (editing) store.updateSurvey(editing.id, draft)
          else store.addSurvey(draft)
        }}
      />

      <SurveyDetailSheet
        survey={viewingLive}
        responses={viewingLive ? store.responsesFor(viewingLive.id) : []}
        open={viewOpen}
        onOpenChange={(open) => {
          setViewOpen(open)
          if (!open) setViewing(null)
        }}
      />

      <SurveyResponsesSheet
        survey={resultsLive}
        responses={resultsLive ? store.responsesFor(resultsLive.id) : []}
        participants={resultsLive ? store.participantsFor(resultsLive.id) : []}
        open={resultsOpen}
        onOpenChange={(open) => {
          setResultsOpen(open)
          if (!open) setResultsFor(null)
        }}
      />

      {/* Publish — releases the survey to its resolved audience. */}
      <ConfirmDialog
        open={publishTarget !== null}
        onOpenChange={(open) => !open && setPublishTarget(null)}
        title='Publish survey?'
        desc={
          publishTarget
            ? `"${publishTarget.title}" will open to its targeted audience (${publishTarget.applicability}) and start accepting responses. Anonymity (currently ${publishTarget.anonymous ? 'Anonymous' : 'Identified'}) and the questionnaire lock on publish. This action is recorded in the audit trail.`
            : ''
        }
        confirmText='Publish'
        handleConfirm={() => {
          if (publishTarget) store.publishSurvey(publishTarget.id)
          setPublishTarget(null)
        }}
      />

      {/* Close — stops response collection, results remain available. */}
      <ConfirmDialog
        open={closeTarget !== null}
        onOpenChange={(open) => !open && setCloseTarget(null)}
        title='Close survey?'
        desc={
          closeTarget
            ? `"${closeTarget.title}" will stop accepting responses. Collected results stay available in the Responses view. This action is recorded in the audit trail.`
            : ''
        }
        confirmText='Close survey'
        handleConfirm={() => {
          if (closeTarget) store.closeSurvey(closeTarget.id)
          setCloseTarget(null)
        }}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete survey?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `"${deleteTarget.title}" (${deleteTarget.period}), its questionnaire and any collected responses will be removed. This cannot be undone in the POC.`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) store.deleteSurvey(deleteTarget.id)
                setDeleteTarget(null)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
