import { useMemo, useState } from 'react'
import { EnvelopeSimple, Plus, Trash, UploadSimple } from 'phosphor-react'
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
import { Checkbox } from '@/components/ui/checkbox'
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
import { RoleGate } from '@/context/role-context'
import { TALENT_FOLDERS, type Candidate } from '../data/candidates'
import type { Requisition } from '../data/requisitions'
import { seedVacancies, type Vacancy } from '../data/vacancies'
import type { CandidatesStore } from '../hooks/use-candidates'
import { StatusBadge } from './badges'
import { BulkUploadDialog } from './bulk-upload-dialog'
import { CandidateOverlay } from './candidate-overlay'

interface TalentPoolTabProps {
  store: CandidatesStore
  requisitions: Requisition[]
  mailboxEnabled: boolean
  /** Live vacancies for the shortlist / applied-for-vacancy pick; falls back to seeds. */
  vacancies?: Vacancy[]
}

type ReviewFilter = 'all' | 'not-reviewed' | 'reviewed'

/**
 * Talent pool — sourcing with duplicate detection, skill/source search,
 * folder organisation, review-status tabs, bulk resume upload, mailbox
 * import, mass delete and candidate shortlisting (TA-05, TA-24, TA-33,
 * TA-39, TA-40; Kensium Resume Bank).
 */
export function TalentPoolTab({
  store,
  requisitions,
  mailboxEnabled,
  vacancies = seedVacancies,
}: TalentPoolTabProps) {
  const [review, setReview] = useState<ReviewFilter>('all')
  const [search, setSearch] = useState('')
  const [folderFilter, setFolderFilter] = useState<string>('all')
  const [selected, setSelected] = useState<string[]>([])
  const [targetFolder, setTargetFolder] = useState<string>(TALENT_FOLDERS[0])
  const [addOpen, setAddOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [shortlistFor, setShortlistFor] = useState<Candidate | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const counts = useMemo(
    () => ({
      all: store.candidates.length,
      'not-reviewed': store.candidates.filter(
        (c) => c.reviewStatus === 'not-reviewed'
      ).length,
      reviewed: store.candidates.filter((c) => c.reviewStatus === 'reviewed')
        .length,
    }),
    [store.candidates]
  )

  const rows = useMemo(() => {
    const q = search.toLowerCase()
    return store.candidates.filter((c) => {
      if (review !== 'all' && c.reviewStatus !== review) return false
      if (folderFilter !== 'all' && !c.folders.includes(folderFilter))
        return false
      if (!q) return true
      return (
        c.name.toLowerCase().includes(q) ||
        c.currentRole.toLowerCase().includes(q) ||
        c.source.toLowerCase().includes(q) ||
        c.skills.some((s) => s.toLowerCase().includes(q))
      )
    })
  }, [store.candidates, review, folderFilter, search])

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )

  const resetFilters = () => {
    setReview('all')
    setSearch('')
    setFolderFilter('all')
    setSelected([])
  }

  return (
    <div className='w-full'>
      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
        {/* TA-39: review-status tabs with counts */}
        <div className='flex items-center gap-1.5'>
          {(['all', 'not-reviewed', 'reviewed'] as ReviewFilter[]).map((r) => (
            <Button
              key={r}
              variant={review === r ? 'default' : 'outline'}
              className='h-7 px-2.5 text-xs capitalize'
              onClick={() => setReview(r)}
            >
              {r.replace('-', ' ')} ({counts[r]})
            </Button>
          ))}
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          {/* TA-05: search by skills, role, status or source */}
          <Input
            placeholder='Search skills, role, source…'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='h-7 w-[210px]'
          />
          <Select value={folderFilter} onValueChange={setFolderFilter}>
            <SelectTrigger className='h-7 w-[170px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All folders</SelectItem>
              {TALENT_FOLDERS.map((f) => (
                <SelectItem key={f} value={f}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant='outline' className='h-7 text-xs' onClick={resetFilters}>
            Reset
          </Button>
          <RoleGate roles={['Company Admin', 'Group Company Admin']}>
            {mailboxEnabled && (
              <Button
                variant='outline'
                className='h-7 gap-1 text-xs'
                onClick={store.runMailboxImport}
              >
                <EnvelopeSimple size={14} /> Run mailbox import
              </Button>
            )}
            <Button
              variant='outline'
              className='h-7 gap-1 text-xs'
              onClick={() => setBulkOpen(true)}
            >
              <UploadSimple size={14} /> Bulk resume upload
            </Button>
            <Button
              variant='red'
              className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
              onClick={() => setAddOpen(true)}
            >
              <Plus size={10} weight='bold' />
              Add Candidate
            </Button>
          </RoleGate>
        </div>
      </div>

      {selected.length > 0 && (
        <div className='mb-3 flex items-center gap-2 rounded-[8px] border border-gray-200 bg-white px-3 py-2'>
          <span className='text-sm'>{selected.length} selected — add to folder:</span>
          <Select value={targetFolder} onValueChange={setTargetFolder}>
            <SelectTrigger className='h-7 w-[170px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TALENT_FOLDERS.map((f) => (
                <SelectItem key={f} value={f}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            className='h-7 text-xs'
            onClick={() => {
              store.assignFolders(selected, [targetFolder])
              setSelected([])
            }}
          >
            Assign
          </Button>
          {/* Kensium Mass Delete — profiles in an active process are skipped */}
          <RoleGate roles={['Company Admin', 'Group Company Admin']}>
            <Button
              variant='outline'
              className='text-red-1400 h-7 gap-1 text-xs'
              onClick={() => setConfirmDelete(true)}
            >
              <Trash size={14} /> Delete selected
            </Button>
          </RoleGate>
        </div>
      )}

      <div className='rounded-[8px] border border-gray-200 bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[40px]' />
              <TableHead>Candidate</TableHead>
              <TableHead>Current role</TableHead>
              <TableHead>Skills</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Folders</TableHead>
              <TableHead>Linked requisition</TableHead>
              <TableHead>Resume</TableHead>
              <TableHead>Review</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((c: Candidate) => (
              <TableRow key={c.id}>
                <TableCell>
                  <Checkbox
                    variant='blue'
                    checked={selected.includes(c.id)}
                    onCheckedChange={() => toggle(c.id)}
                  />
                </TableCell>
                <TableCell>
                  <div className='flex flex-col'>
                    <span className='text-neutral-1600 font-medium'>{c.name}</span>
                    <span className='text-paragraph-sm text-neutral-1000'>
                      {c.email} · {c.phone}
                    </span>
                  </div>
                </TableCell>
                <TableCell className='text-sm'>{c.currentRole}</TableCell>
                <TableCell>
                  <div className='flex max-w-[180px] flex-wrap gap-1'>
                    {c.skills.map((s) => (
                      <Badge key={s} variant='open'>
                        {s}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className='text-sm'>{c.source}</TableCell>
                <TableCell className='text-sm'>
                  {c.folders.length > 0 ? c.folders.join(', ') : '—'}
                </TableCell>
                <TableCell className='text-sm'>
                  {c.linkedRequisitionId ?? '—'}
                </TableCell>
                <TableCell className='text-paragraph-sm text-blue-1400'>
                  {c.resume}
                </TableCell>
                <TableCell>
                  <div className='flex items-center gap-1'>
                    <StatusBadge status={c.reviewStatus} />
                    <RoleGate roles={['Company Admin']}>
                      {c.reviewStatus === 'not-reviewed' && (
                        <Button
                          variant='outline'
                          className='h-6 px-2 text-xs'
                          onClick={() => store.setReviewStatus(c.id, 'reviewed')}
                        >
                          Mark reviewed
                        </Button>
                      )}
                    </RoleGate>
                    <RoleGate roles={['Company Admin', 'Group Company Admin']}>
                      <Button
                        variant='outline'
                        className='h-6 px-2 text-xs'
                        onClick={() => setShortlistFor(c)}
                      >
                        Shortlist
                      </Button>
                    </RoleGate>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className='text-neutral-1000 text-center'>
                  No candidates match the applied filters
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add New Resume — full Kensium field set incl. Applied for Vacancy */}
      <CandidateOverlay
        open={addOpen}
        onOpenChange={setAddOpen}
        requisitions={requisitions}
        vacancies={vacancies}
        onSubmit={(draft) => store.addCandidate(draft)}
      />

      {/* Candidate shortlisting — 15-pointer form prefilled from the profile */}
      <CandidateOverlay
        open={Boolean(shortlistFor)}
        onOpenChange={(o) => !o && setShortlistFor(null)}
        requisitions={requisitions}
        vacancies={vacancies}
        mode='shortlist'
        candidate={shortlistFor}
        onSubmit={() => {}}
        onShortlist={(id, form) => store.shortlistCandidate(id, form)}
      />

      <BulkUploadDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        requisitions={requisitions}
        onProcess={store.bulkImport}
      />

      {/* Mass-delete confirmation (Kensium Mass Delete) */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selected.length} candidate{selected.length === 1 ? '' : 's'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Selected profiles are removed from the resume bank. Candidates in
              an active hiring process are skipped and reported.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                store.massDeleteCandidates(selected)
                setSelected([])
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
