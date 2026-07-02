import { useEffect, useState } from 'react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { type Company, type CompanyStatus } from '../data/companies'

export interface LifecycleRequest {
  company: Company
  target: CompanyStatus
}

interface LifecycleDialogProps {
  request: LifecycleRequest | null
  onOpenChange: (open: boolean) => void
  onConfirm: (request: LifecycleRequest, reason: string) => void
}

interface TransitionSpec {
  title: (c: Company) => string
  description: string
  /** Behaviors executed with the transition (COMP-FR-011/012/013). */
  effects: string[]
  needsApproval: boolean
  needsExtraConfirmation: boolean
  needsReason: boolean
  confirmLabel: string
}

function specFor(req: LifecycleRequest): TransitionSpec {
  const { company, target } = req
  if (target === 'suspended')
    return {
      title: (c) => `Suspend ${c.tradeName || c.legalName}?`,
      description:
        'Requires Platform Super Administrator approval. Normal operations will be blocked with COMP_004 (403).',
      effects: [
        'New logins prevented for everyone except Platform Administrators',
        'Existing sessions get read-only access for a 30-minute grace period',
        'Queued background jobs are allowed to complete',
        'Company administrators are notified',
      ],
      needsApproval: true,
      needsExtraConfirmation: false,
      needsReason: true,
      confirmLabel: 'Suspend company',
    }
  if (target === 'active' && company.status === 'suspended')
    return {
      title: (c) => `Reactivate ${c.tradeName || c.legalName}?`,
      description:
        'Requires Platform Super Administrator approval. Access and operations resume immediately.',
      effects: [
        'Logins re-enabled for all company users',
        'Normal operations resume; COMP_004 blocks are lifted',
      ],
      needsApproval: true,
      needsExtraConfirmation: false,
      needsReason: true,
      confirmLabel: 'Reactivate company',
    }
  if (target === 'active')
    return {
      title: (c) => `Activate ${c.tradeName || c.legalName}?`,
      description:
        'Setup is complete — the Draft company transitions to Active and the tenant becomes operational.',
      effects: ['Tenant opens for onboarding and normal operations'],
      needsApproval: false,
      needsExtraConfirmation: false,
      needsReason: false,
      confirmLabel: 'Activate company',
    }
  if (target === 'inactive')
    return {
      title: (c) => `Inactivate (close) ${c.tradeName || c.legalName}?`,
      description:
        'Requires Platform Super Administrator approval plus confirmation. Modifications will be blocked with COMP_005 (409).',
      effects: [
        'All user accounts are disabled',
        'Pending workflows are completed or cancelled with an audit entry',
        'A company data export package is generated',
        'A 7-year data retention timer starts (archival fees apply)',
        'Confirmation sent to company administrators and Platform Operations',
      ],
      needsApproval: true,
      needsExtraConfirmation: true,
      needsReason: true,
      confirmLabel: 'Inactivate company',
    }
  if (target === 'archived')
    return {
      title: (c) => `Archive ${c.tradeName || c.legalName}?`,
      description:
        'Terminal state — no further transitions are possible after archival.',
      effects: [
        'Complete data export produced in JSON/CSV format',
        'Audit log export and document attachment export included',
        'Verification checksum generated to confirm data integrity',
        'Data securely deleted after integrity verification',
      ],
      needsApproval: false,
      needsExtraConfirmation: true,
      needsReason: true,
      confirmLabel: 'Archive company',
    }
  // cancelled
  return {
    title: (c) => `Cancel draft ${c.tradeName || c.legalName}?`,
    description: 'The draft company is cancelled and cannot be resumed.',
    effects: ['Draft record is closed; the company code is not reused'],
    needsApproval: false,
    needsExtraConfirmation: false,
    needsReason: false,
    confirmLabel: 'Cancel draft',
  }
}

/** COMP-FR-010 — governed lifecycle transitions with approval + reason. */
export function LifecycleDialog({
  request,
  onOpenChange,
  onConfirm,
}: LifecycleDialogProps) {
  const [approved, setApproved] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (request) {
      setApproved(false)
      setConfirmed(false)
      setReason('')
    }
  }, [request])

  if (!request) return null
  const spec = specFor(request)
  const canConfirm =
    (!spec.needsApproval || approved) &&
    (!spec.needsExtraConfirmation || confirmed) &&
    (!spec.needsReason || reason.trim().length > 0)

  return (
    <AlertDialog open={Boolean(request)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{spec.title(request.company)}</AlertDialogTitle>
          <AlertDialogDescription>{spec.description}</AlertDialogDescription>
        </AlertDialogHeader>

        <ul className='space-y-1 rounded-[6px] bg-neutral-100 p-3'>
          {spec.effects.map((effect) => (
            <li
              key={effect}
              className='text-paragraph-sm text-neutral-1600 list-inside list-disc'
            >
              {effect}
            </li>
          ))}
        </ul>

        {spec.needsReason && (
          <div className='space-y-1'>
            <Label htmlFor='lifecycle-reason'>Reason (audited) *</Label>
            <Textarea
              id='lifecycle-reason'
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder='Recorded in COMPANY_STATUS_CHANGED'
              rows={2}
            />
          </div>
        )}
        {spec.needsApproval && (
          <div className='flex items-center gap-2'>
            <Checkbox
              id='psa-approval'
              variant='blue'
              checked={approved}
              onCheckedChange={(v) => setApproved(!!v)}
            />
            <Label htmlFor='psa-approval' className='text-paragraph-sm'>
              I approve as Platform Super Administrator
            </Label>
          </div>
        )}
        {spec.needsExtraConfirmation && (
          <div className='flex items-center gap-2'>
            <Checkbox
              id='extra-confirm'
              variant='blue'
              checked={confirmed}
              onCheckedChange={(v) => setConfirmed(!!v)}
            />
            <Label htmlFor='extra-confirm' className='text-paragraph-sm'>
              I understand the consequences and confirm this action
            </Label>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            disabled={!canConfirm}
            onClick={() => {
              onConfirm(request, reason.trim() || 'Setup complete')
              onOpenChange(false)
            }}
            className='bg-destructive hover:bg-destructive/90 text-white'
          >
            {spec.confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
