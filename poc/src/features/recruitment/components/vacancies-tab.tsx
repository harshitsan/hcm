import { useMemo, useState } from 'react'
import { Plus } from 'phosphor-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { RoleGate, useRole } from '@/context/role-context'
import type { PostingChannel } from '../data/config'
import { RECRUITERS } from '../data/requisitions'
import {
  POSITION_LEVELS,
  POSTING_MODES,
  VACANCY_STATUSES,
  type PostingMode,
  type Vacancy,
} from '../data/vacancies'
import type { VacanciesStore } from '../hooks/use-vacancies'
import { StatusBadge } from './badges'

interface VacanciesTabProps {
  store: VacanciesStore
  postingChannels: PostingChannel[]
  assignmentMethod: string
}

type VacancyFilter = (typeof VACANCY_STATUSES)[number] | 'all'

/**
 * Job vacancies with lifecycle status tabs, recruiter assignment per the
 * configured method, and channel postings routed through posting-source
 * approvers (TA-34…TA-38).
 */
export function VacanciesTab({
  store,
  postingChannels,
  assignmentMethod,
}: VacanciesTabProps) {
  const { hasRole } = useRole()
  const [filter, setFilter] = useState<VacancyFilter>('all')
  const [sortByClosing, setSortByClosing] = useState(false)
  const [assigning, setAssigning] = useState<Vacancy | null>(null)
  const [recruiter, setRecruiter] = useState<string>(RECRUITERS[0])
  const [postingOpen, setPostingOpen] = useState(false)
  const [postingVacancy, setPostingVacancy] = useState<string>('')
  const [postingChannel, setPostingChannel] = useState<string>('')
  const [postingLevel, setPostingLevel] = useState<string>(POSITION_LEVELS[1])
  const [postingMode, setPostingMode] = useState<PostingMode>('External')

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: store.vacancies.length }
    VACANCY_STATUSES.forEach((s) => {
      c[s] = store.vacancies.filter((v) => v.status === s).length
    })
    return c
  }, [store.vacancies])

  const rows = useMemo(() => {
    const filtered =
      filter === 'all'
        ? store.vacancies
        : store.vacancies.filter((v) => v.status === filter)
    return sortByClosing
      ? [...filtered].sort((a, b) => a.closingDate.localeCompare(b.closingDate))
      : filtered
  }, [store.vacancies, filter, sortByClosing])

  const activeChannels = postingChannels.filter((c) => c.active)
  const openVacancies = store.vacancies.filter((v) =>
    ['new', 'assigned', 'in-process'].includes(v.status)
  )

  const createPosting = () => {
    const vacancy = store.vacancies.find((v) => v.code === postingVacancy)
    const channel = activeChannels.find((c) => c.id === postingChannel)
    if (!vacancy || !channel) return
    store.addPosting({
      vacancyCode: vacancy.code,
      position: vacancy.position,
      department: vacancy.position.includes('Engineer') ? 'Engineering' : 'General',
      channelId: channel.id,
      channelName: channel.name,
      source: channel.name,
      positionLevel: postingLevel,
      workLocation: vacancy.workLocation,
      employeeClass: vacancy.employeeClass,
      vacancies: vacancy.vacancies,
      postingMode,
    })
    setPostingOpen(false)
  }

  return (
    <div className='w-full space-y-5'>
      {/* TA-34: lifecycle status tabs with counts */}
      <div>
        <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
          <div className='flex flex-wrap items-center gap-1.5'>
            {(['all', ...VACANCY_STATUSES] as VacancyFilter[]).map((s) => (
              <Button
                key={s}
                variant={filter === s ? 'default' : 'outline'}
                className='h-7 px-2.5 text-xs capitalize'
                onClick={() => setFilter(s)}
              >
                {s === 'all' ? 'All' : s.replace('-', ' ')} ({counts[s]})
              </Button>
            ))}
          </div>
          <Button
            variant='outline'
            className='h-7 text-xs'
            onClick={() => setSortByClosing((v) => !v)}
          >
            {sortByClosing ? 'Sorted by closing date' : 'Sort by closing date'}
          </Button>
        </div>

        <div className='rounded-[8px] border border-gray-200 bg-white'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vacancy code</TableHead>
                <TableHead>RRF ID</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Work location</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Openings</TableHead>
                <TableHead>Closing date</TableHead>
                <TableHead>Recruiters</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className='font-medium'>{v.code}</TableCell>
                  <TableCell>{v.rrfId}</TableCell>
                  <TableCell>{v.position}</TableCell>
                  <TableCell>{v.workLocation}</TableCell>
                  <TableCell>{v.employeeClass}</TableCell>
                  <TableCell>{v.vacancies}</TableCell>
                  <TableCell>{v.closingDate}</TableCell>
                  <TableCell>
                    {v.recruiters.length > 0 ? v.recruiters.join(', ') : '—'}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={v.status} />
                  </TableCell>
                  <TableCell className='text-right'>
                    <RoleGate roles={['Company Admin']}>
                      <div className='flex justify-end gap-1'>
                        {['new', 'assigned'].includes(v.status) && (
                          <Button
                            variant='outline'
                            className='h-6 px-2 text-xs'
                            onClick={() => setAssigning(v)}
                          >
                            Assign
                          </Button>
                        )}
                        {!['closed', 'withdrawn'].includes(v.status) && (
                          <>
                            <Button
                              variant='outline'
                              className='h-6 px-2 text-xs'
                              onClick={() => store.setVacancyStatus(v.id, 'closed')}
                            >
                              Close
                            </Button>
                            <Button
                              variant='outline'
                              className='h-6 px-2 text-xs'
                              onClick={() =>
                                store.setVacancyStatus(v.id, 'withdrawn')
                              }
                            >
                              Withdraw
                            </Button>
                          </>
                        )}
                      </div>
                    </RoleGate>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className='text-neutral-1000 text-center'>
                    No vacancies in this state
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <p className='text-paragraph-sm text-neutral-1000 mt-1.5'>
          Assignment method in effect: <b className='capitalize'>{assignmentMethod}</b>{' '}
          (Configuration → Sourcing). Closed and withdrawn vacancies are excluded
          from active sourcing.
        </p>
      </div>

      {/* TA-36, TA-38: postings */}
      <div>
        <div className='mb-3 flex items-center justify-between'>
          <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
            Job Postings ({store.postings.length})
          </h2>
          <RoleGate roles={['Company Admin']}>
            <Button
              variant='red'
              className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
              onClick={() => setPostingOpen(true)}
            >
              <Plus size={10} weight='bold' />
              New Posting
            </Button>
          </RoleGate>
        </div>
        {store.postings.length === 0 ? (
          <div className='text-neutral-1000 rounded-[8px] border border-gray-200 bg-white p-6 text-center text-sm'>
            No postings yet — publish an open vacancy to a channel to advertise it.
          </div>
        ) : (
          <div className='rounded-[8px] border border-gray-200 bg-white'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source / channel</TableHead>
                  <TableHead>Vacancy</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Openings</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='text-right'>Approval</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {store.postings.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className='font-medium'>{p.channelName}</TableCell>
                    <TableCell>
                      {p.vacancyCode} · {p.position}
                    </TableCell>
                    <TableCell>{p.positionLevel}</TableCell>
                    <TableCell>{p.workLocation}</TableCell>
                    <TableCell>{p.employeeClass}</TableCell>
                    <TableCell>{p.vacancies}</TableCell>
                    <TableCell>{p.postingMode}</TableCell>
                    <TableCell>{p.createdDate}</TableCell>
                    <TableCell>
                      <StatusBadge status={p.status} />
                    </TableCell>
                    <TableCell className='text-right'>
                      {p.status === 'pending-approval' &&
                      hasRole('Company Admin') ? (
                        <div className='flex justify-end gap-1'>
                          <Button
                            variant='outline'
                            className='h-6 px-2 text-xs'
                            onClick={() =>
                              store.decidePosting(p.id, 'approved', 'Sunita Patil')
                            }
                          >
                            Approve
                          </Button>
                          <Button
                            variant='outline'
                            className='h-6 px-2 text-xs'
                            onClick={() =>
                              store.decidePosting(p.id, 'rejected', 'Sunita Patil')
                            }
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className='text-neutral-1000 text-paragraph-sm'>
                          {p.approver ? `${p.approver} · ${p.decidedAt}` : '—'}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* TA-35: assignment respects the configured method */}
      <Dialog open={assigning !== null} onOpenChange={(o) => !o && setAssigning(null)}>
        <DialogContent className='sm:max-w-[380px]'>
          <DialogHeader>
            <DialogTitle>Assign {assigning?.code} to a recruiter</DialogTitle>
          </DialogHeader>
          <Select value={recruiter} onValueChange={setRecruiter}>
            <SelectTrigger className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RECRUITERS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className='text-paragraph-sm text-neutral-1000'>
            Method: <span className='capitalize'>{assignmentMethod}</span>
            {assignmentMethod !== 'manual' &&
              ' — the system pre-selects the recruiter; manual override shown for the demo.'}
          </p>
          <DialogFooter>
            <Button variant='outline' onClick={() => setAssigning(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (assigning) store.assignRecruiter(assigning.id, recruiter)
                setAssigning(null)
              }}
            >
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TA-36: create posting */}
      <Dialog open={postingOpen} onOpenChange={setPostingOpen}>
        <DialogContent className='sm:max-w-[420px]'>
          <DialogHeader>
            <DialogTitle>Post a vacancy</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div>
              <p className='mb-1 text-sm font-medium'>Open vacancy</p>
              <Select value={postingVacancy} onValueChange={setPostingVacancy}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select vacancy' />
                </SelectTrigger>
                <SelectContent>
                  {openVacancies.map((v) => (
                    <SelectItem key={v.code} value={v.code}>
                      {v.code} — {v.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className='mb-1 text-sm font-medium'>Posting channel</p>
              <Select value={postingChannel} onValueChange={setPostingChannel}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Active channels only' />
                </SelectTrigger>
                <SelectContent>
                  {activeChannels.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.postingMode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div>
                <p className='mb-1 text-sm font-medium'>Position level</p>
                <Select value={postingLevel} onValueChange={setPostingLevel}>
                  <SelectTrigger className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITION_LEVELS.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className='mb-1 text-sm font-medium'>Posting mode</p>
                <Select
                  value={postingMode}
                  onValueChange={(v) => setPostingMode(v as PostingMode)}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POSTING_MODES.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setPostingOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!postingVacancy || !postingChannel}
              onClick={createPosting}
            >
              Create posting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
