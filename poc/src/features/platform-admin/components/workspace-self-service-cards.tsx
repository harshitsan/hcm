import { useState } from 'react'
import { useRole } from '@/context/role-context'
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
import { type WorkspaceStore } from '../hooks/use-workspace'
import { MiniTable, SectionCard, ToneBadge } from './shared'

/** Employee self-service snapshot (SYS-18) — full for Employee (User),
 * read-only limited access for Employee (Non-User). */
export function SelfServiceCard({ store }: { store: WorkspaceStore }) {
  const { role, hasRole } = useRole()
  const readOnly = role === 'Employee (Non-User)'
  const [profile, setProfile] = useState(store.profile)
  const [leaveType, setLeaveType] = useState('Casual')
  const [leaveFrom, setLeaveFrom] = useState('')
  const [leaveTo, setLeaveTo] = useState('')

  return (
    <SectionCard
      title='My self-service'
      description={
        readOnly
          ? 'Limited access — read-only with transactions blocked by policy'
          : 'View and update your profile, submit leave, check attendance, and read announcements and documents'
      }
    >
      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <div>
          <h3 className='text-paragraph-sm text-neutral-1600 mb-2 font-medium'>
            Profile
          </h3>
          <div className='space-y-2'>
            <div className='flex flex-col gap-1'>
              <Label>Phone</Label>
              <Input
                value={profile.phone}
                disabled={readOnly}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </div>
            <div className='flex flex-col gap-1'>
              <Label>Address</Label>
              <Input
                value={profile.address}
                disabled={readOnly}
                onChange={(e) =>
                  setProfile({ ...profile, address: e.target.value })
                }
              />
            </div>
            <Button
              className='h-8'
              onClick={() =>
                readOnly
                  ? store.blockedTransaction('Profile update')
                  : store.updateProfile(profile)
              }
            >
              Save profile
            </Button>
          </div>

          <h3 className='text-paragraph-sm text-neutral-1600 mt-4 mb-2 font-medium'>
            Submit leave
          </h3>
          <div className='flex flex-wrap items-end gap-2'>
            <div className='flex flex-col gap-1'>
              <Label>Type</Label>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger className='h-8 w-[130px] bg-white'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['Casual', 'Sick', 'Earned'].map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='flex flex-col gap-1'>
              <Label>From</Label>
              <Input
                type='date'
                value={leaveFrom}
                onChange={(e) => setLeaveFrom(e.target.value)}
                className='h-8 w-[145px]'
              />
            </div>
            <div className='flex flex-col gap-1'>
              <Label>To</Label>
              <Input
                type='date'
                value={leaveTo}
                onChange={(e) => setLeaveTo(e.target.value)}
                className='h-8 w-[145px]'
              />
            </div>
            <Button
              className='h-8'
              disabled={leaveFrom === '' || leaveTo === ''}
              onClick={() =>
                readOnly
                  ? store.blockedTransaction('Leave submission')
                  : store.submitLeave(leaveType, leaveFrom, leaveTo)
              }
            >
              Submit
            </Button>
          </div>
          <p className='text-paragraph-sm text-neutral-1000 mt-2'>
            Attendance this month: 19 present · 1 leave · 0 exceptions
          </p>
        </div>

        <div>
          <h3 className='text-paragraph-sm text-neutral-1600 mb-2 font-medium'>
            Announcements
          </h3>
          <ul className='space-y-1'>
            {store.announcements.map((a) => (
              <li key={a.id} className='flex items-center justify-between text-sm'>
                <span>{a.title}</span>
                <span className='text-paragraph-sm text-neutral-1000'>
                  {a.postedOn}
                </span>
              </li>
            ))}
          </ul>

          <h3 className='text-paragraph-sm text-neutral-1600 mt-4 mb-2 font-medium'>
            My documents
          </h3>
          <ul className='space-y-1'>
            {store.documents.map((d) => (
              <li key={d.id} className='flex items-center gap-2 text-sm'>
                <ToneBadge tone='grey'>{d.category}</ToneBadge>
                {d.name}
              </li>
            ))}
          </ul>
          {hasRole('Employee (User)') && (
            <p className='text-paragraph-sm text-neutral-1000 mt-3'>
              You can also participate in feedback workflows from here.
            </p>
          )}
        </div>
      </div>
    </SectionCard>
  )
}

/** Interview panel participation & candidate conversion (SYS-19). */
export function InterviewPanelsCard({ store }: { store: WorkspaceStore }) {
  const [feedbackFor, setFeedbackFor] = useState<string | null>(null)
  const [rating, setRating] = useState('Strong hire')
  const panel = store.panels.find((p) => p.id === feedbackFor)

  return (
    <SectionCard
      title='My interview panels'
      description='Candidates are managed as prospective employees; on conversion they become an employee record in the target company'
    >
      <MiniTable
        headers={['Candidate', 'Role', 'Interview', 'Status', '']}
        rows={store.panels.map((p) => [
          <div key='c' className='flex items-center gap-2'>
            <span className='font-medium'>{p.candidate}</span>
            {p.converted && <ToneBadge tone='green'>Converted to employee</ToneBadge>}
          </div>,
          p.role,
          p.interviewAt,
          <ToneBadge
            key='s'
            tone={
              p.status === 'completed'
                ? 'green'
                : p.status === 'feedback due'
                  ? 'amber'
                  : 'blue'
            }
          >
            {p.status}
          </ToneBadge>,
          <div key='a' className='flex justify-end'>
            {p.status !== 'completed' && (
              <Button
                variant='outline'
                className='h-7 px-2 text-xs'
                onClick={() => setFeedbackFor(p.id)}
              >
                Submit feedback
              </Button>
            )}
          </div>,
        ])}
      />

      <Dialog
        open={feedbackFor !== null}
        onOpenChange={(open) => !open && setFeedbackFor(null)}
      >
        <DialogContent className='sm:max-w-[380px]'>
          <DialogHeader>
            <DialogTitle>Interview feedback — {panel?.candidate}</DialogTitle>
          </DialogHeader>
          <div className='flex flex-col gap-1.5'>
            <Label>Recommendation</Label>
            <Select value={rating} onValueChange={setRating}>
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['Strong hire', 'Hire', 'No hire'].map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setFeedbackFor(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (feedbackFor) store.submitFeedback(feedbackFor, rating)
                setFeedbackFor(null)
              }}
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SectionCard>
  )
}
