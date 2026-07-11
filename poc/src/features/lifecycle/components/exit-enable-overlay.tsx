import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { type ExitTypeDef } from '../data/config'
import { addDays, fmtDate } from '../data/shared'
import {
  EMPLOYEE_OPEN_TASKS,
  EXIT_EMPLOYEE_DIRECTORY,
  EXIT_TODAY,
  MAX_BACKDATE_DAYS,
  POLICY_DOCUMENT_PLACEHOLDER,
} from '../data/exits'
import { type EnableExitInput } from '../hooks/use-exits'

interface ExitEnableOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  exitTypes: ExitTypeDef[]
  /** Notice derivation from the store (location/dept/position scoped rules). */
  deriveNotice: (input: {
    location: string
    department: string
    positionLevel: string
  }) => { days: number; ruleName: string }
  onSubmit: (input: EnableExitInput) => void
}

/**
 * Exit coordinator "Enable Exit" — captures the (backdatable) resignation
 * date, shows the policy-derived LWD, and opens the case in the
 * exit-enabled state until the employee submits the resignation form.
 */
export function ExitEnableOverlay({
  open,
  onOpenChange,
  exitTypes,
  deriveNotice,
  onSubmit,
}: ExitEnableOverlayProps) {
  const [employee, setEmployee] = useState('')
  const [exitType, setExitType] = useState('')
  const [resignationDate, setResignationDate] = useState(EXIT_TODAY)
  const [requestedLwd, setRequestedLwd] = useState('')
  const [reason, setReason] = useState('')
  const [docDraft, setDocDraft] = useState('')
  const [documents, setDocuments] = useState<string[]>([])

  useEffect(() => {
    if (!open) return
    setEmployee('')
    setExitType('')
    setResignationDate(EXIT_TODAY)
    setRequestedLwd('')
    setReason('')
    setDocDraft('')
    setDocuments([])
  }, [open])

  const ref = EXIT_EMPLOYEE_DIRECTORY.find((e) => e.name === employee) ?? null
  const typeDef = exitTypes.find((t) => t.name === exitType) ?? null
  const backdateCap = typeDef?.maxBackdateDays ?? MAX_BACKDATE_DAYS
  const earliest = addDays(EXIT_TODAY, -backdateCap)
  const backdateError =
    resignationDate && resignationDate < earliest
      ? `Resignation date can be backdated at most ${backdateCap} day(s) — earliest allowed is ${fmtDate(earliest)}`
      : resignationDate > EXIT_TODAY
        ? 'Resignation date cannot be in the future'
        : null

  const notice = useMemo(
    () => (ref ? deriveNotice(ref) : null),
    [deriveNotice, ref]
  )
  const policyLwd =
    ref && notice && resignationDate && !backdateError
      ? addDays(resignationDate, notice.days)
      : null

  const openTasks = EMPLOYEE_OPEN_TASKS[employee] ?? []

  const submit = () => {
    if (!ref) {
      toast.error('Select the employee first')
      return
    }
    if (!exitType) {
      toast.error('Select a configured exit type')
      return
    }
    if (backdateError) {
      toast.error(backdateError)
      return
    }
    if (!requestedLwd) {
      toast.error('Capture the requested last working day')
      return
    }
    if (reason.trim().length < 5) {
      toast.error('A reason is required')
      return
    }
    onSubmit({
      employeeName: ref.name,
      employeeCode: ref.code,
      department: ref.department,
      location: ref.location,
      positionLevel: ref.positionLevel,
      exitType,
      resignationDate,
      requestedLwd,
      reason: reason.trim(),
      supportingDocuments: documents,
      documentsToTrack: typeDef?.documentsToTrack,
    })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[480px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            Enable Exit
          </SheetTitle>
          <p className='text-neutral-1000 text-xs'>
            Opens the case in “Exit Enabled” until the employee submits the
            formal resignation form. Disable with a reason at any point before
            submission.
          </p>
        </SheetHeader>

        <div className='flex-1 space-y-4 overflow-y-auto px-5 py-5'>
          <div className='space-y-1'>
            <Label className='text-xs'>Employee</Label>
            <Select value={employee} onValueChange={setEmployee}>
              <SelectTrigger variant='secondary' className='w-full'>
                <SelectValue placeholder='Select employee' />
              </SelectTrigger>
              <SelectContent>
                {EXIT_EMPLOYEE_DIRECTORY.map((e) => (
                  <SelectItem key={e.code} value={e.name}>
                    {e.name} ({e.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {ref && (
            <div className='rounded-[8px] border border-gray-200 bg-white px-3 py-2 text-xs'>
              <p className='text-neutral-1600 font-medium'>
                {ref.department} · {ref.positionLevel}
              </p>
              <p className='text-neutral-1000'>
                {ref.location} · notice rule:{' '}
                {notice ? `${notice.days} days (${notice.ruleName})` : '—'}
              </p>
            </div>
          )}

          <div className='space-y-1'>
            <Label className='text-xs'>Exit type</Label>
            <Select value={exitType} onValueChange={setExitType}>
              <SelectTrigger variant='secondary' className='w-full'>
                <SelectValue placeholder='Select exit type' />
              </SelectTrigger>
              <SelectContent>
                {exitTypes.map((t) => (
                  <SelectItem key={t.id} value={t.name}>
                    {t.name} ({t.category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {typeDef && (
              <button
                type='button'
                className='text-blue-1400 text-xs underline underline-offset-2'
                onClick={() =>
                  toast.info(
                    (typeDef.policyDocuments ?? []).length > 0
                      ? `${typeDef.policyDocuments!.join(', ')} — ${POLICY_DOCUMENT_PLACEHOLDER}`
                      : POLICY_DOCUMENT_PLACEHOLDER
                  )
                }
              >
                View policy document
              </button>
            )}
          </div>

          <div className='grid grid-cols-2 gap-3'>
            <div className='space-y-1'>
              <Label className='text-xs'>Resignation date (backdatable)</Label>
              <Input
                type='date'
                value={resignationDate}
                onChange={(ev) => setResignationDate(ev.target.value)}
              />
              {backdateError ? (
                <p className='text-destructive text-xs'>{backdateError}</p>
              ) : (
                <p className='text-neutral-1000 text-xs'>
                  Backdate cap: {backdateCap} day(s)
                </p>
              )}
            </div>
            <div className='space-y-1'>
              <Label className='text-xs'>Requested LWD</Label>
              <Input
                type='date'
                value={requestedLwd}
                onChange={(ev) => setRequestedLwd(ev.target.value)}
              />
            </div>
          </div>

          <div className='rounded-[8px] border border-gray-200 bg-white px-3 py-2'>
            <p className='text-neutral-1000 text-xs'>LWD as per policy (display-only)</p>
            <p className='text-neutral-1600 text-sm font-medium'>
              {policyLwd
                ? `${fmtDate(policyLwd)} — resignation date + ${notice?.days} day notice`
                : 'Select employee, exit type and a valid resignation date'}
            </p>
          </div>

          <div className='space-y-1'>
            <Label className='text-xs'>Reason</Label>
            <Textarea
              placeholder='Why is this exit being enabled?'
              value={reason}
              onChange={(ev) => setReason(ev.target.value)}
            />
          </div>

          <div className='space-y-2'>
            <Label className='text-xs'>Supporting documents</Label>
            <div className='flex gap-2'>
              <Input
                placeholder='File name, e.g. resignation-email.pdf'
                value={docDraft}
                onChange={(ev) => setDocDraft(ev.target.value)}
              />
              <Button
                type='button'
                size='sm'
                variant='outline'
                disabled={!docDraft.trim()}
                onClick={() => {
                  setDocuments((prev) => [...prev, docDraft.trim()])
                  setDocDraft('')
                }}
              >
                Add
              </Button>
            </div>
            {documents.length > 0 && (
              <div className='flex flex-wrap gap-1'>
                {documents.map((d) => (
                  <Badge key={d} variant='outline'>
                    {d}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {employee && (
            <div className='rounded-[8px] border border-gray-200 bg-white px-3 py-2'>
              <p className='text-neutral-1000 text-xs font-medium'>
                Open tasks assigned to {employee} (read-only)
              </p>
              {openTasks.length === 0 ? (
                <p className='text-neutral-1000 text-xs'>
                  No open tasks on record for this employee.
                </p>
              ) : (
                <ul className='text-neutral-1600 mt-1 list-disc pl-4 text-xs'>
                  {openTasks.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className='border-gray-200 flex items-center justify-end gap-3 border-t px-5 py-4'>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type='button' onClick={submit}>
            Enable Exit
          </Button>
        </div>
      </FloatingSheetContent>
    </Sheet>
  )
}
