import { useCallback, useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Paperclip, X } from 'phosphor-react'
import { toast } from 'sonner'
import {
  CustomFieldsSection,
  validateCustomFields,
} from '@/features/custom-fields/components/custom-fields-section'
import { type FieldValue } from '@/features/custom-fields/data/records'
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
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
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
import { type LeaveType } from '../data/leave-types'
import { type FmlaReason } from '../data/config'
import { EMPLOYEES, daySpan, employeeById } from '../data/shared'
import { type RequestDraft } from '../hooks/use-leave-requests'
import { getArtifacts } from '@/features/workflows/hooks/use-business-logic'
import { linkedFlows } from '@/features/workflows/data/flow-links'
import { triggerFormFlows } from '@/features/workflows/hooks/use-flow-runs'
import { WorkflowChip } from '@/features/workflows/components/workflow-chip'

const LEAVE_SUBMIT_EVENT = 'Leave request submitted'
const LEAVE_MODULE = 'Leave Management' as const

const emailList = z
  .string()
  .refine(
    (v) =>
      v.trim() === '' ||
      v.split(',').every((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim())),
    'One or more email ids are invalid'
  )

const formSchema = z
  .object({
    typeId: z.string().min(1, 'Select a leave type'),
    from: z.string().min(1, 'From date is required'),
    to: z.string().min(1, 'To date is required'),
    fromTime: z.string(),
    toTime: z.string(),
    halfDay: z.boolean(),
    reason: z.string().min(3, 'Reason is required'),
    tentative: z.boolean(),
    tentativeReason: z.string(),
    notifyPeersEnabled: z.boolean(),
    notifyEmails: emailList,
    peerMessage: z.string(),
    fmlaQualifyingReason: z.string(),
    dynamicExtra: z.string(),
  })
  .refine((v) => v.to >= v.from, {
    message: 'To date must be on or after From date',
    path: ['to'],
  })
  .refine((v) => !v.tentative || v.tentativeReason.trim().length > 0, {
    message: 'A reason is required for tentative requests',
    path: ['tentativeReason'],
  })

type FormValues = z.infer<typeof formSchema>

const emptyValues: FormValues = {
  typeId: '',
  from: '',
  to: '',
  fromTime: '',
  toTime: '',
  halfDay: false,
  reason: '',
  tentative: false,
  tentativeReason: '',
  notifyPeersEnabled: false,
  notifyEmails: '',
  peerMessage: '',
  fmlaQualifyingReason: '',
  dynamicExtra: '',
}

interface ApplyLeaveOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The employee the leave is for (self-service or on-behalf). */
  employeeId: string
  leaveTypes: LeaveType[]
  fmlaReasons: FmlaReason[]
  remainingFor: (employeeId: string, typeId: string) => number
  hasOverlap: (employeeId: string, from: string, to: string) => boolean
  onSubmit: (draft: RequestDraft) => void
  /** Set when a Company Admin records leave on behalf (LVE-17). */
  onBehalfOf: string | null
}

/**
 * Apply Time Off form (LVE-03/16/28/30/31/32/38/49). Fields are rendered
 * per leave-type config by the dynamic-fields engine; exceeding the balance
 * triggers the loss-of-pay confirmation.
 */
export function ApplyLeaveOverlay({
  open,
  onOpenChange,
  employeeId,
  leaveTypes,
  fmlaReasons,
  remainingFor,
  hasOverlap,
  onSubmit,
  onBehalfOf,
}: ApplyLeaveOverlayProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: emptyValues,
  })
  const [peers, setPeers] = useState<string[]>([])
  // ATO-05: uploaded supporting documents (file names kept in mock state).
  const [attachments, setAttachments] = useState<string[]>([])
  const [lopConfirm, setLopConfirm] = useState<{
    draft: RequestDraft
    excess: number
    unit: string
  } | null>(null)
  // PTO #19: policy document linked to the selected leave type.
  const [policyOpen, setPolicyOpen] = useState(false)
  // Custom fields state (A6): keyed by FieldDefinition.id.
  const [customValues, setCustomValues] = useState<Record<string, FieldValue>>({})
  const [customErrors, setCustomErrors] = useState<Record<string, string>>({})

  const handleCustomChange = useCallback((fieldId: string, value: FieldValue) => {
    setCustomValues((prev) => ({ ...prev, [fieldId]: value }))
    setCustomErrors((prev) => {
      if (!prev[fieldId]) return prev
      const next = { ...prev }
      delete next[fieldId]
      return next
    })
  }, [])

  useEffect(() => {
    if (!open) return
    form.reset(emptyValues)
    setPeers([])
    setAttachments([])
    setCustomValues({})
    setCustomErrors({})
  }, [open, form, employeeId])

  // A7 / Task 5: flow artifacts linked to the Leave apply form (chip per flow).
  const linkedFlowArtifacts = useMemo(
    () => linkedFlows(getArtifacts(), LEAVE_MODULE, LEAVE_SUBMIT_EVENT),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open]
  )

  const employee = employeeById(employeeId)
  const values = form.watch()
  const selectedType = leaveTypes.find((t) => t.id === values.typeId)

  // LVE-35/36: active types in configured order, minus excluded levels.
  const selectableTypes = useMemo(
    () =>
      leaveTypes
        .filter(
          (t) =>
            t.active &&
            t.id !== 'lt-lop' &&
            !(employee && t.excludedLevels.includes(employee.positionLevel))
        )
        .sort((a, b) => a.order - b.order),
    [employee, leaveTypes]
  )

  // LVE-49: precise duration from date + time for hour-tracked types.
  const amount = useMemo(() => {
    if (!values.from || !values.to || !selectedType) return 0
    if (values.halfDay) return selectedType.unit === 'hours' ? 4 : 0.5
    const days = daySpan(values.from, values.to)
    if (selectedType.unit === 'hours') {
      if (values.from === values.to && values.fromTime && values.toTime) {
        const [fh, fm] = values.fromTime.split(':').map(Number)
        const [th, tm] = values.toTime.split(':').map(Number)
        return Math.max(1, Math.round((th * 60 + tm - fh * 60 - fm) / 60))
      }
      return days * 8
    }
    return days
  }, [selectedType, values.from, values.fromTime, values.halfDay, values.to, values.toTime])

  const balance = selectedType ? remainingFor(employeeId, selectedType.id) : 0
  const excess = selectedType?.category === 'paid' ? Math.max(0, amount - balance) : 0
  const overlap =
    values.from && values.to && hasOverlap(employeeId, values.from, values.to)

  const buildDraft = (v: FormValues, lopAmount: number): RequestDraft => ({
    employeeId,
    typeId: v.typeId,
    from: v.from,
    to: v.to,
    fromTime: v.fromTime || null,
    toTime: v.toTime || null,
    amount,
    lopAmount,
    reason: v.dynamicExtra ? `${v.reason} [${v.dynamicExtra}]` : v.reason,
    tentative: v.tentative,
    tentativeReason: v.tentative ? v.tentativeReason : null,
    notifyPeers: v.notifyPeersEnabled ? peers : [],
    notifyEmails:
      v.notifyPeersEnabled && v.notifyEmails.trim()
        ? v.notifyEmails.split(',').map((e) => e.trim())
        : [],
    peerMessage:
      v.notifyPeersEnabled && v.peerMessage.trim()
        ? v.peerMessage.trim()
        : undefined,
    fmlaQualifyingReason: v.fmlaQualifyingReason || null,
    attachments,
    onBehalfOf,
    custom: customValues,
  })

  const handleSubmit = (v: FormValues) => {
    if (overlap) {
      toast.error('These dates overlap an existing request — adjust the dates')
      return
    }
    if (selectedType?.fmla && !v.fmlaQualifyingReason) {
      form.setError('fmlaQualifyingReason', {
        message: 'Select an FMLA qualifying reason',
      })
      return
    }
    if (selectedType?.id === 'lt-compoff' && amount > balance) {
      toast.error('Not enough comp-off credits — request is validated against your comp-off balance')
      return
    }
    // A6: validate custom fields before proceeding.
    const cfErrors = validateCustomFields('Leave Request', customValues, 'employee')
    if (Object.keys(cfErrors).length > 0) {
      setCustomErrors(cfErrors)
      toast.error('Please complete the required additional fields')
      return
    }
    if (excess > 0 && selectedType?.category === 'paid') {
      // LVE-32: warn and ask to proceed on loss of pay for the excess.
      setLopConfirm({
        draft: buildDraft(v, excess),
        excess,
        unit: selectedType.unit,
      })
      return
    }
    const draft = buildDraft(v, selectedType?.category === 'unpaid' ? amount : 0)
    onSubmit(draft)
    // A7: trigger any flow artifacts linked to this form.
    triggerFormFlows({
      module: LEAVE_MODULE,
      event: LEAVE_SUBMIT_EVENT,
      summary: `${selectedType?.name ?? 'Leave'} · ${amount} ${selectedType?.unit ?? 'days'}`,
      requester: employee?.name ?? employeeId,
    })
    onOpenChange(false)
  }

  const qualifying = fmlaReasons.filter((r) => r.kind === 'qualifying')
  const peerOptions = EMPLOYEES.filter((e) => e.id !== employeeId && e.active)

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[520px]'>
          <SheetHeader className='border-grey-200 border-b px-5 py-4'>
            <div className='flex items-center gap-3'>
              <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
                {onBehalfOf
                  ? `Record time off — ${employee?.name}`
                  : 'Apply Time Off'}
              </SheetTitle>
              {linkedFlowArtifacts.map((a) => (
                <WorkflowChip key={a.id} artifactId={a.id} label={a.name} />
              ))}
            </div>
          </SheetHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className='flex min-h-0 flex-1 flex-col'
            >
              <div className='flex-1 space-y-4 overflow-y-auto px-5 py-5'>
                <FormField
                  control={form.control}
                  name='typeId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Leave type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger variant='secondary' className='w-full'>
                            <SelectValue placeholder='Select leave type' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {selectableTypes.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.name} ({t.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedType && (
                        <div className='space-y-0.5'>
                          {/* PTO #14: credit-based types apply against balance;
                              others are capped by the yearly allotment. */}
                          <p className='text-neutral-1000 text-xs'>
                            {selectedType.appliedBasedOnCredit ? (
                              <>Available balance: {balance} {selectedType.unit}</>
                            ) : (
                              <>
                                Max per year: {selectedType.allotted}{' '}
                                {selectedType.unit} · taken so far:{' '}
                                {Math.max(0, selectedType.allotted - balance)}{' '}
                                {selectedType.unit}
                              </>
                            )}
                            {selectedType.fmla && ' · FMLA-protected'}
                            {selectedType.policyDocument && (
                              <>
                                {' · '}
                                <button
                                  type='button'
                                  className='text-blue-700 underline underline-offset-2'
                                  onClick={() => setPolicyOpen(true)}
                                >
                                  View policy
                                </button>
                              </>
                            )}
                          </p>
                          {!selectedType.appliedBasedOnCredit &&
                            selectedType.category === 'paid' && (
                              <p className='text-xs text-orange-600'>
                                Days beyond the yearly cap are recorded as Loss
                                of Pay.
                              </p>
                            )}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='grid grid-cols-2 gap-3'>
                  <FormField
                    control={form.control}
                    name='from'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>From date</FormLabel>
                        <FormControl>
                          <Input type='date' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='to'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>To date</FormLabel>
                        <FormControl>
                          <Input type='date' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {selectedType?.unit === 'hours' && (
                  <div className='grid grid-cols-2 gap-3'>
                    <FormField
                      control={form.control}
                      name='fromTime'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>From time (partial day)</FormLabel>
                          <FormControl>
                            <Input type='time' {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='toTime'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>To time</FormLabel>
                          <FormControl>
                            <Input type='time' {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {selectedType?.dynamicFields.includes('Half-day option') && (
                  <FormField
                    control={form.control}
                    name='halfDay'
                    render={({ field }) => (
                      <FormItem className='flex flex-row items-center gap-2'>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(v) => field.onChange(!!v)}
                            variant='blue'
                          />
                        </FormControl>
                        <FormLabel className='mb-0'>Half day</FormLabel>
                      </FormItem>
                    )}
                  />
                )}

                {selectedType && values.from && values.to && (
                  <div className='bg-blue-150 rounded-[6px] px-3 py-2 text-sm'>
                    Requested: <strong>{amount} {selectedType.unit}</strong>
                    {excess > 0 && selectedType.category === 'paid' && (
                      <span className='text-red-1400'>
                        {' '}— exceeds balance by {excess} {selectedType.unit} (loss of pay confirmation will apply)
                      </span>
                    )}
                    {overlap && (
                      <span className='text-red-1400'>
                        {' '}— overlaps an existing request
                      </span>
                    )}
                  </div>
                )}

                {selectedType?.fmla && (
                  <FormField
                    control={form.control}
                    name='fmlaQualifyingReason'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>FMLA qualifying reason</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger variant='secondary' className='w-full'>
                              <SelectValue placeholder='Select a configured qualifying reason' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {qualifying.map((r) => (
                              <SelectItem key={r.id} value={r.reason}>
                                {r.fmlaType}: {r.reason}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {selectedType?.dynamicFields
                  .filter((f) => !['Half-day option', 'FMLA qualifying reason'].includes(f))
                  .map((f) => (
                    <FormField
                      key={f}
                      control={form.control}
                      name='dynamicExtra'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{f}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={`${f} (rendered by the dynamic-fields engine)`}
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  ))}

                <FormField
                  control={form.control}
                  name='reason'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason</FormLabel>
                      <FormControl>
                        <Textarea placeholder='Why are you taking time off?' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* PTO #29–#31: document requirement configured on the type. */}
                {selectedType?.documentsRequired && (
                  <div className='rounded-[6px] border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-700'>
                    {selectedType.name} requires supporting documents — submit
                    them within {selectedType.documentResponseDays} days of
                    availing this time off (a reminder is sent after{' '}
                    {selectedType.documentReminderDays} days). You can upload
                    after submission from My Leave → Submit document.
                  </div>
                )}

                {/* ATO-05: supporting documents, e.g. medical certificates. */}
                <div className='space-y-2'>
                  <Label>Supporting documents (optional)</Label>
                  <Input
                    type='file'
                    multiple
                    onChange={(e) => {
                      const names = Array.from(e.target.files ?? []).map(
                        (f) => f.name
                      )
                      if (names.length === 0) return
                      setAttachments((prev) => [
                        ...prev,
                        ...names.filter((n) => !prev.includes(n)),
                      ])
                      e.target.value = ''
                      toast.success(
                        `${names.length} document${names.length === 1 ? '' : 's'} attached to this request`
                      )
                    }}
                  />
                  <p className='text-neutral-1000 text-xs'>
                    Attach proof such as a medical certificate — reviewers see
                    the documents on the request detail.
                  </p>
                  {attachments.length > 0 && (
                    <div className='flex flex-wrap gap-1.5'>
                      {attachments.map((name) => (
                        <span
                          key={name}
                          className='inline-flex items-center gap-1 rounded-[6px] border border-gray-200 px-2 py-1 text-xs'
                        >
                          <Paperclip size={12} weight='bold' />
                          {name}
                          <button
                            type='button'
                            aria-label={`Remove ${name}`}
                            className='text-neutral-1000 hover:text-destructive'
                            onClick={() =>
                              setAttachments((prev) =>
                                prev.filter((n) => n !== name)
                              )
                            }
                          >
                            <X size={12} weight='bold' />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name='tentative'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-center gap-2'>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(v) => field.onChange(!!v)}
                          variant='blue'
                        />
                      </FormControl>
                      <FormLabel className='mb-0'>
                        Tentative request — dates may change before I confirm
                      </FormLabel>
                    </FormItem>
                  )}
                />
                {values.tentative && (
                  <FormField
                    control={form.control}
                    name='tentativeReason'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Why is this tentative?</FormLabel>
                        <FormControl>
                          <Input placeholder='e.g. visa appointment pending' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name='notifyPeersEnabled'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-center gap-2'>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(v) => field.onChange(!!v)}
                          variant='blue'
                        />
                      </FormControl>
                      <FormLabel className='mb-0'>Notify peers of my absence</FormLabel>
                    </FormItem>
                  )}
                />
                {values.notifyPeersEnabled && (
                  <div className='space-y-3 rounded-[6px] border border-gray-200 p-3'>
                    <div className='grid grid-cols-2 gap-2'>
                      {peerOptions.map((p) => (
                        <label key={p.id} className='flex items-center gap-2 text-sm'>
                          <Checkbox
                            checked={peers.includes(p.name)}
                            onCheckedChange={(v) =>
                              setPeers((prev) =>
                                v ? [...prev, p.name] : prev.filter((x) => x !== p.name)
                              )
                            }
                            variant='blue'
                          />
                          {p.name}
                        </label>
                      ))}
                    </div>
                    <FormField
                      control={form.control}
                      name='peerMessage'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message to peers (optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder='e.g. Reach out to Priya for anything urgent while I am away'
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='notifyEmails'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notify (emails, comma separated)</FormLabel>
                          <FormControl>
                            <Input placeholder='a@ext.com, b@ext.com' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* A6: custom fields targeting the Leave Request form. */}
                <CustomFieldsSection
                  entity='Leave Request'
                  values={customValues}
                  onChange={handleCustomChange}
                  errors={customErrors}
                  audience='employee'
                />
              </div>

              <div className='border-grey-200 flex items-center justify-end gap-3 border-t px-5 py-4'>
                <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type='submit'>Submit request</Button>
              </div>
            </form>
          </Form>
        </FloatingSheetContent>
      </Sheet>

      {/* PTO #19: linked policy document for the selected leave type. */}
      <Dialog open={policyOpen} onOpenChange={setPolicyOpen}>
        <DialogContent className='sm:max-w-[420px]'>
          <DialogHeader>
            <DialogTitle>{selectedType?.policyDocument}</DialogTitle>
            <DialogDescription>
              Policy document linked to {selectedType?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className='text-neutral-1600 space-y-2 text-sm'>
            <p>{selectedType?.description}</p>
            <p className='text-neutral-1000 text-xs'>
              {selectedType?.exemptHolidays
                ? 'Holidays within the period are exempt from the count.'
                : 'Holidays within the period count towards the leave.'}{' '}
              {selectedType?.exemptWeeklyOffs
                ? 'Weekly offs are exempt.'
                : 'Weekly offs count towards the leave.'}{' '}
              {selectedType?.availDuringNotice
                ? 'Can be availed during the notice period.'
                : 'Cannot be availed during the notice period.'}
              {selectedType?.maxTimesAvailable &&
                ` Can be availed at most ${selectedType.maxTimesAvailable.count} time${selectedType.maxTimesAvailable.count === 1 ? '' : 's'} per ${selectedType.maxTimesAvailable.per === 'service' ? 'service period' : 'year'}.`}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* LVE-32: loss-of-pay confirmation when the balance is exceeded. */}
      <AlertDialog
        open={lopConfirm !== null}
        onOpenChange={(o) => {
          if (!o) setLopConfirm(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Proceed on loss of pay?</AlertDialogTitle>
            <AlertDialogDescription>
              Your request exceeds the available balance by{' '}
              <strong>
                {lopConfirm?.excess} {lopConfirm?.unit}
              </strong>
              . The excess will be recorded as unpaid (loss of pay) and routed
              to the loss-of-pay approver. Your paid balance is deducted only
              for the covered portion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Don’t submit</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (lopConfirm) {
                  onSubmit(lopConfirm.draft)
                  // A7: trigger linked flows on the LOP-confirm submit path too.
                  const leaveName = leaveTypes.find((t) => t.id === lopConfirm.draft.typeId)?.name ?? 'Leave'
                  triggerFormFlows({
                    module: LEAVE_MODULE,
                    event: LEAVE_SUBMIT_EVENT,
                    summary: `${leaveName} · ${lopConfirm.draft.amount} ${leaveTypes.find((t) => t.id === lopConfirm.draft.typeId)?.unit ?? 'days'} (LOP)`,
                    requester: employee?.name ?? employeeId,
                  })
                }
                setLopConfirm(null)
                onOpenChange(false)
              }}
            >
              Confirm LOP & submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
