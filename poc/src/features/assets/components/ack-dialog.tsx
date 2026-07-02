import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { type Acknowledgement, type AckResponse } from '../data/acknowledgements'
import { type QuestionnaireVersion } from '../data/config'

const RATING_OPTIONS = ['Excellent', 'Good', 'Fair', 'Poor'] as const

interface AckDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ack: Acknowledgement | null
  questionnaireVersions: QuestionnaireVersion[]
  /** Who is capturing it — the employee, or the admin on behalf (ASM-14). */
  recordedBy: string
  onBehalf: boolean
  onSubmit: (ackId: string, responses: AckResponse[]) => void
}

/**
 * Digital acknowledgement with a condition assessment rendered dynamically
 * from the effective template version (ASM-07/08/24). Required fields block
 * submission; captured values stay bound to the version used at capture.
 */
export function AckDialog({
  open,
  onOpenChange,
  ack,
  questionnaireVersions,
  recordedBy,
  onBehalf,
  onSubmit,
}: AckDialogProps) {
  const [values, setValues] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) setValues({})
  }, [open])

  if (!ack) return null

  const template =
    questionnaireVersions.find((q) => q.version === ack.templateVersion) ??
    questionnaireVersions[questionnaireVersions.length - 1]

  const handleSubmit = () => {
    const missing = template.fields.filter((f) => f.required && !values[f.id]?.trim())
    if (missing.length > 0) {
      toast.error(`Complete the required fields: ${missing.map((f) => f.label).join(', ')}`)
      return
    }
    const responses: AckResponse[] = template.fields
      .filter((f) => values[f.id]?.trim())
      .map((f) => ({ fieldId: f.id, label: f.label, value: values[f.id].trim() }))
    onSubmit(ack.id, responses)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[440px]'>
        <DialogHeader>
          <DialogTitle>
            {ack.type} acknowledgement{onBehalf ? ' (on behalf)' : ''}
          </DialogTitle>
          <DialogDescription>
            {ack.assetLabel} — {ack.employeeName}. Condition form rendered from
            template v{template.version} (effective {template.effectiveFrom}).
            {onBehalf
              ? ` Recorded by ${recordedBy} on behalf of a workforce member without system access.`
              : ' Your acknowledgement is timestamped and linked to you and this asset.'}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-3'>
          {template.fields.map((field) => (
            <div key={field.id} className='flex flex-col gap-1'>
              <Label className='text-paragraph-sm'>
                {field.label}
                {field.required ? ' *' : ''}
              </Label>
              {field.type === 'text' ? (
                <Textarea
                  rows={2}
                  value={values[field.id] ?? ''}
                  onChange={(e) => setValues((v) => ({ ...v, [field.id]: e.target.value }))}
                />
              ) : (
                <Select
                  value={values[field.id] ?? ''}
                  onValueChange={(val) => setValues((v) => ({ ...v, [field.id]: val }))}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Select…' />
                  </SelectTrigger>
                  <SelectContent>
                    {(field.type === 'rating' ? RATING_OPTIONS : (['Yes', 'No'] as const)).map(
                      (opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Acknowledge</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
