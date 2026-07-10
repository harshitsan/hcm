import { useMemo, useState } from 'react'
import { FilePdf, FileXls, SquaresFour } from 'phosphor-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Application, Candidate } from '../data/candidates'
import type { Offer } from '../data/offers'
import { DEPARTMENTS, LOCATIONS, type Requisition } from '../data/requisitions'
import { StatusBadge } from './badges'

/** Fixed reference "today" used across the POC. */
const REPORT_TODAY = '2026-07-09'

/** New joiners within this window are reported as on probation. */
const PROBATION_DAYS = 90

/**
 * Minimal candidate-document row consumed by the Candidate Custodian report.
 * Kept local so this tab has no dependency on the documents data module —
 * index.tsx adapts whatever store it owns into this shape.
 */
export interface DocumentRow {
  candidateName: string
  applicationId: string
  docName: string
  docType: string
  requiredAtStage: string
  custodian?: string
  issuanceDate?: string
  expiryDate?: string
  note?: string
  status: string
}

interface RecruitmentReportsTabProps {
  applications: Application[]
  candidates: Candidate[]
  offers: Offer[]
  requisitions: Requisition[]
  documents?: DocumentRow[]
}

const daysBetween = (from: string, to: string) =>
  Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000)

/** Inclusive date-range predicate; empty bounds pass everything. */
const inRange = (date: string, from: string, to: string) =>
  (!from || date >= from) && (!to || date <= to)

/** Export + add-as-widget actions shared by every report header. */
function ReportActions({
  report,
  onAddWidget,
}: {
  report: string
  onAddWidget: () => void
}) {
  return (
    <div className='flex flex-wrap items-center gap-1.5'>
      <Button
        variant='outline'
        className='h-7 gap-1 text-xs'
        onClick={() => toast.success(`${report} exported (simulated)`)}
      >
        <FilePdf size={14} /> Export PDF
      </Button>
      <Button
        variant='outline'
        className='h-7 gap-1 text-xs'
        onClick={() => toast.success(`${report} exported (simulated)`)}
      >
        <FileXls size={14} /> Export Excel
      </Button>
      <Button
        variant='outline'
        className='h-7 gap-1 text-xs'
        onClick={onAddWidget}
      >
        <SquaresFour size={14} /> Add as widget
      </Button>
    </div>
  )
}

/**
 * Recruitment reports — Employee Joining, Interview Assessments and
 * Candidate Custodian reports with filterable rows, simulated PDF/Excel
 * exports and add-as-home-widget (Kensium Recruitment — Reports chapter).
 */
export function RecruitmentReportsTab({
  applications,
  candidates,
  offers,
  requisitions,
  documents,
}: RecruitmentReportsTabProps) {
  // ---- Add-as-widget dialog (shared by all three reports) ----------------
  const [widgetReport, setWidgetReport] = useState<string | null>(null)
  const [widgetName, setWidgetName] = useState('')

  const openWidgetDialog = (report: string) => {
    setWidgetReport(report)
    setWidgetName(report)
  }

  // ---- Employee Joining Report -------------------------------------------
  const [joinFrom, setJoinFrom] = useState('')
  const [joinTo, setJoinTo] = useState('')
  const [joinLocation, setJoinLocation] = useState('all')
  const [joinDepartment, setJoinDepartment] = useState('all')
  const [joinSearch, setJoinSearch] = useState('')
  const [joinStatus, setJoinStatus] = useState('all')

  const joiningRows = useMemo(
    () =>
      offers
        .filter((o) => o.joined)
        .map((o) => {
          const req = requisitions.find((r) => r.id === o.requisitionId)
          const dateOfJoining = o.respondedAt ?? o.releasedAt ?? '—'
          return {
            offerId: o.id,
            employeeCode: `EMP-${o.id.replace(/\D/g, '')}`,
            name: o.candidateName,
            department: req?.department ?? '—',
            location: o.location,
            dateOfJoining,
            position: o.requisitionTitle,
            // Position level from the requisition band UDF where captured,
            // falling back to the employee class.
            level: req?.custom['cf-band'] ?? req?.employeeClass ?? '—',
            status:
              dateOfJoining !== '—' &&
              daysBetween(dateOfJoining, REPORT_TODAY) <= PROBATION_DAYS
                ? 'Probation'
                : 'Joined',
          }
        }),
    [offers, requisitions]
  )

  const joiningFiltered = useMemo(() => {
    const q = joinSearch.toLowerCase()
    return joiningRows.filter((r) => {
      if (!inRange(r.dateOfJoining, joinFrom, joinTo)) return false
      if (joinLocation !== 'all' && r.location !== joinLocation) return false
      if (joinDepartment !== 'all' && r.department !== joinDepartment)
        return false
      if (joinStatus !== 'all' && r.status !== joinStatus) return false
      return !q || r.name.toLowerCase().includes(q)
    })
  }, [joiningRows, joinFrom, joinTo, joinLocation, joinDepartment, joinStatus, joinSearch])

  // ---- Interview Assessments Report --------------------------------------
  const [assessFrom, setAssessFrom] = useState('')
  const [assessTo, setAssessTo] = useState('')
  const [assessDepartment, setAssessDepartment] = useState('all')
  const [assessSearch, setAssessSearch] = useState('')
  const [assessRound, setAssessRound] = useState('all')
  const [assessInterviewer, setAssessInterviewer] = useState('all')
  const [assessResolution, setAssessResolution] = useState('all')

  const assessmentRows = useMemo(
    () =>
      applications.flatMap((a) => {
        const req = requisitions.find((r) => r.id === a.requisitionId)
        return a.scorecards.map((sc) => {
          const interview = a.interviews.find((iv) => iv.round === sc.round)
          const avg =
            sc.ratings.length > 0
              ? sc.ratings.reduce((sum, r) => sum + r.score, 0) /
                sc.ratings.length
              : 0
          return {
            id: sc.id,
            candidate: a.candidateName,
            department: req?.department ?? '—',
            position: a.requisitionTitle,
            round: sc.round,
            interviewer: sc.interviewer,
            scheduleDate: interview?.date ?? sc.submittedAt.slice(0, 10),
            resolution: sc.recommendation,
            comments: sc.comments,
            ratings: `${avg.toFixed(1)}/5 avg`,
          }
        })
      }),
    [applications, requisitions]
  )

  const rounds = useMemo(
    () => [...new Set(assessmentRows.map((r) => r.round))].sort(),
    [assessmentRows]
  )
  const interviewers = useMemo(
    () => [...new Set(assessmentRows.map((r) => r.interviewer))].sort(),
    [assessmentRows]
  )

  const assessmentsFiltered = useMemo(() => {
    const q = assessSearch.toLowerCase()
    return assessmentRows.filter((r) => {
      if (!inRange(r.scheduleDate, assessFrom, assessTo)) return false
      if (assessDepartment !== 'all' && r.department !== assessDepartment)
        return false
      if (assessRound !== 'all' && String(r.round) !== assessRound) return false
      if (assessInterviewer !== 'all' && r.interviewer !== assessInterviewer)
        return false
      if (assessResolution !== 'all' && r.resolution !== assessResolution)
        return false
      return !q || r.candidate.toLowerCase().includes(q)
    })
  }, [assessmentRows, assessFrom, assessTo, assessDepartment, assessRound, assessInterviewer, assessResolution, assessSearch])

  // ---- Candidate Custodian Report ----------------------------------------
  const [docType, setDocType] = useState('all')
  const [docSearch, setDocSearch] = useState('')
  const [docCustodian, setDocCustodian] = useState('all')
  const [docStatus, setDocStatus] = useState('all')

  const custodianRows = useMemo(
    () =>
      (documents ?? []).map((d, i) => {
        const app = applications.find((a) => a.id === d.applicationId)
        const candidate = candidates.find((c) => c.name === d.candidateName)
        return {
          id: `${d.applicationId}-${i}`,
          ...d,
          email: app?.candidateEmail ?? candidate?.email ?? '—',
          position: app?.requisitionTitle ?? '—',
        }
      }),
    [documents, applications, candidates]
  )

  const docTypes = useMemo(
    () => [...new Set(custodianRows.map((r) => r.docType))].sort(),
    [custodianRows]
  )
  const custodians = useMemo(
    () =>
      [...new Set(custodianRows.map((r) => r.custodian).filter(Boolean))].sort() as string[],
    [custodianRows]
  )
  const docStatuses = useMemo(
    () => [...new Set(custodianRows.map((r) => r.status))].sort(),
    [custodianRows]
  )

  const custodianFiltered = useMemo(() => {
    const q = docSearch.toLowerCase()
    return custodianRows.filter((r) => {
      if (docType !== 'all' && r.docType !== docType) return false
      if (docCustodian !== 'all' && r.custodian !== docCustodian) return false
      if (docStatus !== 'all' && r.status !== docStatus) return false
      return !q || r.candidateName.toLowerCase().includes(q)
    })
  }, [custodianRows, docType, docCustodian, docStatus, docSearch])

  return (
    <div className='w-full'>
      <Tabs defaultValue='joining' className='w-full'>
        <TabsList className='mb-2'>
          <TabsTrigger value='joining' variant='ghost'>
            Employee Joining Report
          </TabsTrigger>
          <TabsTrigger value='assessments' variant='ghost'>
            Interview Assessments
          </TabsTrigger>
          <TabsTrigger value='custodian' variant='ghost'>
            Candidate Custodian
          </TabsTrigger>
        </TabsList>

        {/* ---- Employee Joining Report ---- */}
        <TabsContent value='joining'>
          <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
            <h3 className='text-neutral-1600 text-sm font-medium'>
              Employee Joining Report
            </h3>
            <ReportActions
              report='Employee Joining Report'
              onAddWidget={() => openWidgetDialog('Employee Joining Report')}
            />
          </div>
          <div className='mb-3 flex flex-wrap items-center gap-2'>
            <Input
              type='date'
              value={joinFrom}
              onChange={(e) => setJoinFrom(e.target.value)}
              className='h-7 w-[140px]'
              aria-label='Joined from'
            />
            <span className='text-neutral-1000 text-xs'>to</span>
            <Input
              type='date'
              value={joinTo}
              onChange={(e) => setJoinTo(e.target.value)}
              className='h-7 w-[140px]'
              aria-label='Joined to'
            />
            <Select value={joinLocation} onValueChange={setJoinLocation}>
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
            <Select value={joinDepartment} onValueChange={setJoinDepartment}>
              <SelectTrigger className='h-7 w-[170px]'>
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
            <Input
              placeholder='Search by name…'
              value={joinSearch}
              onChange={(e) => setJoinSearch(e.target.value)}
              className='h-7 w-[180px]'
            />
            <Select value={joinStatus} onValueChange={setJoinStatus}>
              <SelectTrigger className='h-7 w-[140px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All statuses</SelectItem>
                <SelectItem value='Joined'>Joined</SelectItem>
                <SelectItem value='Probation'>Probation</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='rounded-[8px] border border-gray-200 bg-white'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Date of joining</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {joiningFiltered.map((r) => (
                  <TableRow key={r.offerId}>
                    <TableCell className='font-medium'>{r.employeeCode}</TableCell>
                    <TableCell className='text-sm'>{r.name}</TableCell>
                    <TableCell className='text-sm'>{r.department}</TableCell>
                    <TableCell className='text-sm'>{r.location}</TableCell>
                    <TableCell className='text-sm'>{r.dateOfJoining}</TableCell>
                    <TableCell className='text-sm'>{r.position}</TableCell>
                    <TableCell className='text-sm'>{r.level}</TableCell>
                    <TableCell>
                      <Badge
                        variant={r.status === 'Joined' ? 'badge_active' : 'pending'}
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {joiningFiltered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className='text-neutral-1000 text-center'>
                      No joiners match the applied filters
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <p className='text-paragraph-sm text-neutral-1000 mt-1.5'>
            {joiningFiltered.length} joiner
            {joiningFiltered.length === 1 ? '' : 's'} in the selected period
          </p>
        </TabsContent>

        {/* ---- Interview Assessments Report ---- */}
        <TabsContent value='assessments'>
          <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
            <h3 className='text-neutral-1600 text-sm font-medium'>
              Interview Assessments Report
            </h3>
            <ReportActions
              report='Interview Assessments Report'
              onAddWidget={() =>
                openWidgetDialog('Interview Assessments Report')
              }
            />
          </div>
          <div className='mb-3 flex flex-wrap items-center gap-2'>
            <Input
              type='date'
              value={assessFrom}
              onChange={(e) => setAssessFrom(e.target.value)}
              className='h-7 w-[140px]'
              aria-label='Assessed from'
            />
            <span className='text-neutral-1000 text-xs'>to</span>
            <Input
              type='date'
              value={assessTo}
              onChange={(e) => setAssessTo(e.target.value)}
              className='h-7 w-[140px]'
              aria-label='Assessed to'
            />
            <Select value={assessDepartment} onValueChange={setAssessDepartment}>
              <SelectTrigger className='h-7 w-[170px]'>
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
            <Input
              placeholder='Search candidate…'
              value={assessSearch}
              onChange={(e) => setAssessSearch(e.target.value)}
              className='h-7 w-[170px]'
            />
            <Select value={assessRound} onValueChange={setAssessRound}>
              <SelectTrigger className='h-7 w-[120px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All rounds</SelectItem>
                {rounds.map((r) => (
                  <SelectItem key={r} value={String(r)}>
                    Round {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={assessInterviewer} onValueChange={setAssessInterviewer}>
              <SelectTrigger className='h-7 w-[170px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All interviewers</SelectItem>
                {interviewers.map((i) => (
                  <SelectItem key={i} value={i}>
                    {i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={assessResolution} onValueChange={setAssessResolution}>
              <SelectTrigger className='h-7 w-[150px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All resolutions</SelectItem>
                <SelectItem value='advance'>Advance</SelectItem>
                <SelectItem value='hold'>Hold</SelectItem>
                <SelectItem value='reject'>Reject</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='rounded-[8px] border border-gray-200 bg-white'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Round</TableHead>
                  <TableHead>Interviewer</TableHead>
                  <TableHead>Schedule date</TableHead>
                  <TableHead>Resolution</TableHead>
                  <TableHead>Ratings</TableHead>
                  <TableHead>Comments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assessmentsFiltered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className='font-medium'>{r.candidate}</TableCell>
                    <TableCell className='text-sm'>{r.department}</TableCell>
                    <TableCell className='text-sm'>{r.position}</TableCell>
                    <TableCell className='text-sm'>Round {r.round}</TableCell>
                    <TableCell className='text-sm'>{r.interviewer}</TableCell>
                    <TableCell className='text-sm'>{r.scheduleDate}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          r.resolution === 'advance'
                            ? 'badge_active'
                            : r.resolution === 'hold'
                              ? 'pending'
                              : 'dropped'
                        }
                        className='capitalize'
                      >
                        {r.resolution}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-sm'>{r.ratings}</TableCell>
                    <TableCell className='text-paragraph-sm text-neutral-1000 max-w-[220px]'>
                      {r.comments}
                    </TableCell>
                  </TableRow>
                ))}
                {assessmentsFiltered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className='text-neutral-1000 text-center'>
                      No assessments match the applied filters
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <p className='text-paragraph-sm text-neutral-1000 mt-1.5'>
            {assessmentsFiltered.length} assessment
            {assessmentsFiltered.length === 1 ? '' : 's'} in the selected period
          </p>
        </TabsContent>

        {/* ---- Candidate Custodian Report ---- */}
        <TabsContent value='custodian'>
          <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
            <h3 className='text-neutral-1600 text-sm font-medium'>
              Candidate Custodian Report
            </h3>
            <ReportActions
              report='Candidate Custodian Report'
              onAddWidget={() => openWidgetDialog('Candidate Custodian Report')}
            />
          </div>
          <div className='mb-3 flex flex-wrap items-center gap-2'>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger className='h-7 w-[160px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All document types</SelectItem>
                {docTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder='Search candidate…'
              value={docSearch}
              onChange={(e) => setDocSearch(e.target.value)}
              className='h-7 w-[170px]'
            />
            <Select value={docCustodian} onValueChange={setDocCustodian}>
              <SelectTrigger className='h-7 w-[160px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All custodians</SelectItem>
                {custodians.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={docStatus} onValueChange={setDocStatus}>
              <SelectTrigger className='h-7 w-[150px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All statuses</SelectItem>
                {docStatuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='rounded-[8px] border border-gray-200 bg-white'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Position considered</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Custodian</TableHead>
                  <TableHead>Issuance date</TableHead>
                  <TableHead>Expiry date</TableHead>
                  <TableHead>Required at</TableHead>
                  <TableHead>Comments</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {custodianFiltered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className='flex flex-col'>
                        <span className='text-neutral-1600 font-medium'>
                          {r.candidateName}
                        </span>
                        <span className='text-paragraph-sm text-neutral-1000'>
                          {r.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className='text-sm'>{r.position}</TableCell>
                    <TableCell className='text-sm'>{r.docName}</TableCell>
                    <TableCell className='text-sm'>{r.docType}</TableCell>
                    <TableCell className='text-sm'>{r.custodian ?? '—'}</TableCell>
                    <TableCell className='text-sm'>{r.issuanceDate ?? '—'}</TableCell>
                    <TableCell className='text-sm'>{r.expiryDate ?? '—'}</TableCell>
                    <TableCell className='text-sm capitalize'>
                      {r.requiredAtStage}
                    </TableCell>
                    <TableCell className='text-paragraph-sm text-neutral-1000 max-w-[200px]'>
                      {r.note ?? '—'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                  </TableRow>
                ))}
                {custodianRows.length > 0 && custodianFiltered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className='text-neutral-1000 text-center'>
                      No documents match the applied filters
                    </TableCell>
                  </TableRow>
                )}
                {custodianRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className='text-neutral-1000 text-center'>
                      No candidate documents collected yet — documents received
                      through the hiring pipeline will appear here with their
                      custodian and validity details
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <p className='text-paragraph-sm text-neutral-1000 mt-1.5'>
            {custodianFiltered.length} document
            {custodianFiltered.length === 1 ? '' : 's'} tracked with custodians
          </p>
        </TabsContent>
      </Tabs>

      {/* Add-as-widget dialog — pins a report snapshot to the Home screen */}
      <Dialog
        open={widgetReport !== null}
        onOpenChange={(o) => !o && setWidgetReport(null)}
      >
        <DialogContent className='sm:max-w-[380px]'>
          <DialogHeader>
            <DialogTitle>Add as widget — {widgetReport}</DialogTitle>
          </DialogHeader>
          <div>
            <p className='mb-1 text-sm font-medium'>Widget name</p>
            <Input
              value={widgetName}
              onChange={(e) => setWidgetName(e.target.value)}
              placeholder='e.g. Joiners this quarter'
            />
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setWidgetReport(null)}>
              Cancel
            </Button>
            <Button
              disabled={widgetName.trim().length < 2}
              onClick={() => {
                toast.success('Widget added to Home (simulated)')
                setWidgetReport(null)
              }}
            >
              Add widget
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
