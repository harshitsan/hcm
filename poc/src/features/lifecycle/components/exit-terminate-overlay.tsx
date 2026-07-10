import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  EXIT_EMPLOYEE_DIRECTORY,
  POLICY_DEVIATION_OPTIONS,
  TERMINATION_EXIT_TYPES,
  TERMINATION_QUESTIONS,
  type TerminationExitType,
} from '../data/exits'
import { type TerminationDraft } from '../hooks/use-exits'

interface ExitTerminateOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (draft: TerminationDraft) => void
}

const TYPE_HELP: Partial<Record<TerminationExitType, string>> = {
  Suspension:
    'The employee loses HRMS access during the suspension window. Approvers can adjust the From/Till range; after final approval a Suspension review offers Revoke / Continue / Terminate.',
  'Employee Death':
    'No approval workflow — the case auto-approves on submit. Nominee benefits per policy are handled via Employee Master (no computation here).',
  'Poor Performance':
    'Typically initiated by the Reporting Manager after the configured minimum quarters of performance evaluation.',
  Absconding:
    'Record the date from which the employee has been absent without intimation.',
  'Policy Deviation':
    'Select every policy the employee deviated from; the list is attached to the case for the approvers.',
}

/**
 * Admin-initiated Terminate flow — exit-type-specific fields (policy
 * deviation multi-select, absconding date, suspension window, employee
 * death auto-approval) with an HR-answered inline questionnaire.
 */
export function ExitTerminateOverlay({
  open,
  onOpenChange,
  onSubmit,
}: ExitTerminateOverlayProps) {
  const [employee, setEmployee] = useState('')
  const [exitType, setExitType] = useState<TerminationExitType>('Termination')
  const [proposedLwd, setProposedLwd] = useState('')
  const [reason, setReason] = useState('')
  const [docDraft, setDocDraft] = useState('')
  const [documents, setDocuments] = useState<string[]>([])
  const [answers, setAnswers] = useState<string[]>(TERMINATION_QUESTIONS.map(() => ''))
  const [comment, setComment] = useState('')
  const [policies, setPolicies] = useState<string[]>([])
  const [abscondingDate, setAbscondingDate] = useState('')
  const [suspensionFrom, setSuspensionFrom] = useState('')
  const [suspensionTill, setSuspensionTill] = useState('')
  const [withPay, setWithPay] = useState(false)

  useEffect(() => {
    if (!open) return
    setEmployee('')
    setExitType('Termination')
    setProposedLwd('')
    setReason('')
    setDocDraft('')
    setDocuments([])
    setAnswers(TERMINATION_QUESTIONS.map(() => ''))
    setComment('')
    setPolicies([])
    setAbscondingDate('')
    setSuspensionFrom('')
    setSuspensionTill('')
    setWithPay(false)
  }, [open])

  const ref = EXIT_EMPLOYEE_DIRECTORY.find((e) => e.name === employee) ?? null
  const isSuspension = exitType === 'Suspension'

  const submit = () => {
    if (!ref) {
      toast.error('Select the employee first')
      return
    }
    if (reason.trim().length < 5) {
      toast.error('A reason is required')
      return
    }
    if (isSuspension) {
      if (!suspensionFrom || !suspensionTill || suspensionTill < suspensionFrom) {
        toast.error('Provide a valid suspension From / Till range')
        return
      }
    } else if (!proposedLwd) {
      toast.error('Set the proposed last working day (not defaulted from notice)')
      return
    }
    if (exitType === 'Policy Deviation' && policies.length === 0) {
      toast.error('Select at least one deviated policy')
      return
    }
    if (exitType === 'Absconding' && !abscondingDate) {
      toast.error('Record the absconding date')
      return
    }
    if (answers.some((a) => !a.trim())) {
      toast.error('Answer the inline exit questionnaire (HR) before submitting')
      return
    }
    onSubmit({
      employeeName: ref.name,
      employeeCode: ref.code,
      department: ref.department,
      location: ref.location,
      positionLevel: ref.positionLevel,
      exitType,
      proposedLwd: isSuspension ? null : proposedLwd,
      reason: reason.trim(),
      documents,
      answers: TERMINATION_QUESTIONS.map((question, i) => ({
        question,
        answer: answers[i].trim(),
      })),
      comment,
      policiesDeviated: exitType === 'Policy Deviation' ? policies : undefined,
      abscondingDate: exitType === 'Absconding' ? abscondingDate : null,
      suspensionFrom: isSuspension ? suspensionFrom : null,
      suspensionTill: isSuspension ? suspensionTill : null,
      withPay: isSuspension ? withPay : undefined,
    })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[480px]'>
        <SheetHeader className='border-grey-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            Terminate / involuntary exit
          </SheetTitle>
          <p className='text-neutral-1000 text-xs'>
            Admin-initiated exit with exit-type-specific fields. The proposed
            LWD is never defaulted from notice rules.
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
                    {e.name} ({e.code} · {e.department})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-1'>
            <Label className='text-xs'>Exit type</Label>
            <Select
              value={exitType}
              onValueChange={(v) => setExitType(v as TerminationExitType)}
            >
              <SelectTrigger variant='secondary' className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TERMINATION_EXIT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {TYPE_HELP[exitType] && (
              <p className='text-neutral-1000 text-xs'>{TYPE_HELP[exitType]}</p>
            )}
          </div>

          {exitType === 'Policy Deviation' && (
            <div className='space-y-2 rounded-[8px] border border-gray-200 bg-white px-3 py-2'>
              <p className='text-xs font-medium'>Policies deviated</p>
              {POLICY_DEVIATION_OPTIONS.map((p) => (
                <label key={p} className='flex items-center gap-2 text-sm'>
                  <Checkbox
                    checked={policies.includes(p)}
                    onCheckedChange={(checked) =>
                      setPolicies((prev) =>
                        checked ? [...prev, p] : prev.filter((x) => x !== p)
                      )
                    }
                    variant='blue'
                  />
                  {p}
                </label>
              ))}
            </div>
          )}

          {exitType === 'Absconding' && (
            <div className='space-y-1'>
              <Label className='text-xs'>Absconding date (absent since)</Label>
              <Input
                type='date'
                value={abscondingDate}
                onChange={(ev) => setAbscondingDate(ev.target.value)}
              />
            </div>
          )}

          {isSuspension ? (
            <div className='space-y-2'>
              <div className='grid grid-cols-2 gap-3'>
                <div className='space-y-1'>
                  <Label className='text-xs'>Suspension From</Label>
                  <Input
                    type='date'
                    value={suspensionFrom}
                    onChange={(ev) => setSuspensionFrom(ev.target.value)}
                  />
                </div>
                <div className='space-y-1'>
                  <Label className='text-xs'>Suspension Till</Label>
                  <Input
                    type='date'
                    value={suspensionTill}
                    onChange={(ev) => setSuspensionTill(ev.target.value)}
                  />
                </div>
              </div>
              <label className='flex items-center gap-2 text-sm'>
                <Switch checked={withPay} onCheckedChange={setWithPay} />
                With pay (label only — no amounts computed)
              </label>
            </div>
          ) : (
            <div className='space-y-1'>
              <Label className='text-xs'>Proposed last working day</Label>
              <Input
                type='date'
                value={proposedLwd}
                onChange={(ev) => setProposedLwd(ev.target.value)}
              />
            </div>
          )}

          <div className='space-y-1'>
            <Label className='text-xs'>Reason</Label>
            <Textarea
              placeholder='Grounds for this exit'
              value={reason}
              onChange={(ev) => setReason(ev.target.value)}
            />
          </div>

          <div className='space-y-2'>
            <Label className='text-xs'>Upload documents</Label>
            <div className='flex gap-2'>
              <Input
                placeholder='File name, e.g. inquiry-report.pdf'
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

          <div className='space-y-2'>
            <p className='text-xs font-medium'>Exit questionnaire (answered by HR)</p>
            {TERMINATION_QUESTIONS.map((q, i) => (
              <div key={q} className='space-y-1'>
                <p className='text-sm'>
                  {q}
                  <span className='text-destructive'> *</span>
                </p>
                <Input
                  placeholder='HR answer'
                  value={answers[i]}
                  onChange={(ev) =>
                    setAnswers((prev) =>
                      prev.map((a, j) => (j === i ? ev.target.value : a))
                    )
                  }
                />
              </div>
            ))}
          </div>

          <div className='space-y-1'>
            <Label className='text-xs'>Comments (visible to HR &amp; managers)</Label>
            <Textarea
              placeholder='Internal notes for the approval chain'
              value={comment}
              onChange={(ev) => setComment(ev.target.value)}
            />
          </div>
        </div>

        <div className='border-grey-200 flex items-center justify-end gap-3 border-t px-5 py-4'>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type='button' onClick={submit}>
            {exitType === 'Employee Death' ? 'Submit (auto-approves)' : 'Initiate exit'}
          </Button>
        </div>
      </FloatingSheetContent>
    </Sheet>
  )
}
