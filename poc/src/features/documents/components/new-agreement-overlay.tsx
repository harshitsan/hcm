import { useEffect, useMemo, useState } from 'react'
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
import { Switch } from '@/components/ui/switch'
import { EMPLOYEES, todayIso } from '@/features/hr-letters/data/hr-letters'
import {
  CONTRACT_AGREEMENT_TYPES,
  EXPIRY_RULES,
  noticeDaysOf,
  renderAgreementBody,
  templatesForType,
  type ContractAgreementType,
  type ExpiryRule,
} from '../data/agreements'
import { type AgreementDraft } from '../hooks/use-agreements'

interface NewAgreementOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGenerate: (draft: AgreementDraft) => void
}

/**
 * "New agreement" flow (O10): pick type → template (F8) → employee →
 * validity dates + expiry rule, then generate. The Template Engine's merge
 * resolver gap-checks the pick live — generation stays blocked with a
 * plain-language gap list until the employee record has every merge field.
 */
export function NewAgreementOverlay({
  open,
  onOpenChange,
  onGenerate,
}: NewAgreementOverlayProps) {
  const [type, setType] = useState<ContractAgreementType>(
    CONTRACT_AGREEMENT_TYPES[0]
  )
  const [templateId, setTemplateId] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [executedOn, setExecutedOn] = useState(todayIso())
  const [validFrom, setValidFrom] = useState(todayIso())
  const [validUntil, setValidUntil] = useState('')
  const [expiryRule, setExpiryRule] = useState<ExpiryRule>(
    'Notify 30 days before'
  )
  const [ackRequired, setAckRequired] = useState(true)

  const templates = useMemo(() => templatesForType(type), [type])
  const template = templates.find((t) => t.id === templateId) ?? null

  useEffect(() => {
    if (!open) return
    setType(CONTRACT_AGREEMENT_TYPES[0])
    setTemplateId('')
    setEmployeeId('')
    setExecutedOn(todayIso())
    setValidFrom(todayIso())
    setValidUntil('')
    setExpiryRule('Notify 30 days before')
    setAckRequired(true)
  }, [open])

  // Type change resets the template pick; the acknowledgment default follows
  // the chosen template's setting and stays editable (W11 is optional).
  useEffect(() => {
    const first = templatesForType(type)[0]
    setTemplateId(first?.id ?? '')
    setAckRequired(first?.requiresAcknowledgment ?? true)
  }, [type])

  const needsValidUntil = expiryRule !== 'No expiry'

  const merge = useMemo(() => {
    if (!template || !employeeId) return null
    return renderAgreementBody(template.body, employeeId, {
      executedOn,
      validFrom,
      validUntil: needsValidUntil && validUntil ? validUntil : undefined,
    })
  }, [template, employeeId, executedOn, validFrom, validUntil, needsValidUntil])

  const dateError =
    needsValidUntil && validUntil && validUntil <= validFrom
      ? 'The valid-until date must be after the valid-from date'
      : needsValidUntil && !validUntil
        ? 'Pick a valid-until date — this expiry rule tracks an end date'
        : null

  const blocked =
    !template ||
    !employeeId ||
    !executedOn ||
    !validFrom ||
    dateError !== null ||
    (merge !== null && merge.gaps.length > 0)

  function handleGenerate() {
    if (blocked || !template) return
    onGenerate({
      type,
      templateId: template.id,
      employeeId,
      executedOn,
      validFrom,
      validUntil: needsValidUntil ? validUntil : undefined,
      expiryRule,
      acknowledgmentRequired: ackRequired,
    })
    onOpenChange(false)
  }

  const notice = noticeDaysOf(expiryRule)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[520px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            New agreement
          </SheetTitle>
        </SheetHeader>

        <div className='flex-1 space-y-4 overflow-y-auto px-5 py-5'>
          <div className='space-y-1.5'>
            <Label>Agreement type</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as ContractAgreementType)}
            >
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='e.g. Non-disclosure agreement' />
              </SelectTrigger>
              <SelectContent>
                {CONTRACT_AGREEMENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-1.5'>
            <Label>Template (from Templates &amp; Letters)</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='e.g. Standard Employment Agreement' />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} (v{t.currentVersion})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-1.5'>
            <Label>Employee</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='e.g. Arjun Mehta' />
              </SelectTrigger>
              <SelectContent>
                {EMPLOYEES.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name} — {e.department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='grid grid-cols-2 gap-3'>
            <div className='space-y-1.5'>
              <Label htmlFor='agr-executed'>Executed on</Label>
              <Input
                id='agr-executed'
                type='date'
                value={executedOn}
                onChange={(e) => setExecutedOn(e.target.value)}
              />
            </div>
            <div className='space-y-1.5'>
              <Label htmlFor='agr-from'>Valid from</Label>
              <Input
                id='agr-from'
                type='date'
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
              />
            </div>
          </div>

          <div className='grid grid-cols-2 gap-3'>
            <div className='space-y-1.5'>
              <Label>Expiry rule</Label>
              <Select
                value={expiryRule}
                onValueChange={(v) => setExpiryRule(v as ExpiryRule)}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPIRY_RULES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {needsValidUntil && (
              <div className='space-y-1.5'>
                <Label htmlFor='agr-until'>Valid until</Label>
                <Input
                  id='agr-until'
                  type='date'
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                />
              </div>
            )}
          </div>
          {dateError && (
            <p className='text-destructive text-sm font-medium'>{dateError}</p>
          )}
          {notice !== null ? (
            <p className='text-paragraph-sm text-neutral-1000'>
              Expiry reminders go out via Notifications — email + in-app,{' '}
              {notice} days before expiry and again on the expiry date.
            </p>
          ) : (
            <p className='text-paragraph-sm text-neutral-1000'>
              No expiry date is tracked — no reminders will be scheduled.
            </p>
          )}

          <div className='flex items-center justify-between rounded-[6px] border border-gray-200 bg-white px-3 py-2'>
            <div>
              <p className='text-sm font-medium'>Employee acknowledgment</p>
              <p className='text-paragraph-sm text-neutral-1000'>
                The agreement stays "Sent for acknowledgment" until the
                employee accepts it in their portal.
              </p>
            </div>
            <Switch checked={ackRequired} onCheckedChange={setAckRequired} />
          </div>

          {merge && merge.gaps.length > 0 && (
            <div className='border-destructive/40 bg-destructive/5 rounded-[6px] border p-3'>
              <p className='text-destructive text-sm font-medium'>
                Generation blocked — missing information
              </p>
              <ul className='text-destructive mt-1 list-disc space-y-0.5 pl-4 text-sm'>
                {merge.gaps.map((gap) => (
                  <li key={gap}>{gap}</li>
                ))}
              </ul>
            </div>
          )}

          {merge && merge.gaps.length === 0 && (
            <div className='space-y-1.5'>
              <Label>Preview</Label>
              <div className='max-h-56 overflow-y-auto rounded-[6px] border border-gray-200 bg-white p-3 text-sm whitespace-pre-wrap'>
                {merge.rendered}
              </div>
            </div>
          )}
        </div>

        <div className='border-gray-200 flex items-center justify-end gap-3 border-t px-5 py-4'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={blocked} onClick={handleGenerate}>
            Generate agreement
          </Button>
        </div>
      </FloatingSheetContent>
    </Sheet>
  )
}
