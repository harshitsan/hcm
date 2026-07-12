import { FileText, Paperclip } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { POSITION_LEVELS, type PolicyAttachment } from '../data/policies'
import { formatDate, scopeSummary } from '../data/policy-utils'
import { toScope, type WizardValues } from './policy-wizard-schema'
import { CheckboxGroup, type StepProps } from './policy-wizard-steps'
import { PolicyTypeBadge } from './policy-badges'

export function ExclusionsStep({ form }: StepProps) {
  const values = form.watch()
  return (
    <div className='space-y-4'>
      <FormField
        control={form.control}
        name='excludedPositionLevels'
        render={({ field }) => (
          <FormItem>
            <CheckboxGroup
              label='Excluded position level(s)'
              hint='Workers at these levels are carved out even when the rest of the scope matches them.'
              options={POSITION_LEVELS}
              value={field.value}
              onChange={field.onChange}
            />
            <FormMessage />
          </FormItem>
        )}
      />
      <div className='border-gray-200 rounded-[6px] border bg-neutral-100 p-3'>
        <p className='text-neutral-1600 mb-1 text-sm font-medium'>
          Resulting applicability
        </p>
        <p className='text-paragraph-sm text-neutral-1000'>
          {scopeSummary(toScope(values))}
        </p>
        {values.excludedPositionLevels.length > 0 && (
          <div className='mt-2 flex flex-wrap gap-1'>
            {values.excludedPositionLevels.map((level) => (
              <Badge key={level} variant='dropped'>
                Excludes {level}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface DatingStepProps extends StepProps {
  attachment: PolicyAttachment | null
  attachmentError: string | null
  onFileSelect: (file: File | null) => void
  nextVersionNumber: number
}

export function DatingStep({
  form,
  attachment,
  attachmentError,
  onFileSelect,
  nextVersionNumber,
}: DatingStepProps) {
  return (
    <div className='space-y-4'>
      <div className='border-gray-200 rounded-[6px] border bg-neutral-100 p-3'>
        <p className='text-neutral-1600 text-sm font-medium'>
          Creating version v{nextVersionNumber}
        </p>
        <p className='text-paragraph-sm text-neutral-1000'>
          Prior versions are preserved read-only. An open-ended prior version is
          auto-closed the day before this one starts; overlapping closed windows
          are rejected as an integrity violation.
        </p>
      </div>
      <div className='grid grid-cols-2 gap-3'>
        <FormField
          control={form.control}
          name='effectiveFrom'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Effective from</FormLabel>
              <FormControl>
                <Input type='date' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='effectiveTill'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Effective till (optional)</FormLabel>
              <FormControl>
                <Input type='date' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name='changeNote'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Change note (version history)</FormLabel>
            <FormControl>
              <Textarea
                rows={2}
                placeholder='What changed in this version and why…'
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name='regulatoryUpdate'
        render={({ field }) => (
          <FormItem>
            <div className='border-gray-200 flex items-start gap-2 rounded-[6px] border p-3'>
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(v) => field.onChange(v === true)}
                  variant='blue'
                />
              </FormControl>
              <div>
                <FormLabel className='text-neutral-1600 text-sm font-medium'>
                  Mark as regulatory update
                </FormLabel>
                <p className='text-paragraph-sm text-neutral-1000'>
                  Use this when the change is driven by a law or regulation.
                  On publish, employees are asked to re-acknowledge as a
                  priority with a shorter deadline.
                </p>
              </div>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className='space-y-1.5'>
        <p className='text-neutral-1600 text-sm font-medium'>
          Policy document file (PDF / DOCX, max 5 MB)
        </p>
        <Input
          type='file'
          accept='.pdf,.docx,.doc,.txt'
          onChange={(e) => onFileSelect(e.target.files?.[0] ?? null)}
        />
        {attachment && (
          <p className='text-paragraph-sm text-neutral-1900 flex items-center gap-1'>
            <Paperclip className='size-3.5' />
            {attachment.fileName} · {attachment.sizeKb.toLocaleString('en-US')} KB
          </p>
        )}
        {attachmentError && (
          <p className='text-destructive text-paragraph-sm'>{attachmentError}</p>
        )}
      </div>
    </div>
  )
}

interface ReviewStepProps {
  values: WizardValues
  attachment: PolicyAttachment | null
  nextVersionNumber: number
}

/** Read-only summary of everything the wizard will save (POL-27 pre-check). */
export function ReviewStep({ values, attachment, nextVersionNumber }: ReviewStepProps) {
  const rows: [string, string][] = [
    ['Policy', `${values.name} — ${values.editionName} (v${nextVersionNumber})`],
    ['Category', values.category],
    ['Owner', `${values.ownerLevel}-level · ${values.ownerName}`],
    ['Applicability', scopeSummary(toScope(values))],
    [
      'Excluded levels',
      values.excludedPositionLevels.length > 0
        ? values.excludedPositionLevels.join(', ')
        : 'None',
    ],
    [
      'Effective window',
      `${formatDate(values.effectiveFrom)} → ${
        values.effectiveTill ? formatDate(values.effectiveTill) : 'Open-ended'
      }`,
    ],
    [
      'Integrated modules',
      values.linkedModules.length > 0 ? values.linkedModules.join(', ') : 'None',
    ],
    ['Document', attachment ? attachment.fileName : 'No file attached'],
    [
      'Regulatory update',
      values.regulatoryUpdate
        ? 'Yes — priority re-acknowledgment on publish'
        : 'No',
    ],
  ]
  return (
    <div className='space-y-3'>
      <div className='flex items-center gap-2'>
        <FileText className='text-neutral-1000 size-4' />
        <PolicyTypeBadge type={values.type} />
      </div>
      <div className='border-gray-200 divide-grey-200 divide-y rounded-[6px] border'>
        {rows.map(([label, value]) => (
          <div key={label} className='grid grid-cols-[140px_1fr] gap-2 px-3 py-2'>
            <span className='text-neutral-1000 text-sm'>{label}</span>
            <span className='text-neutral-1900 text-sm'>{value}</span>
          </div>
        ))}
      </div>
      <div className='border-gray-200 rounded-[6px] border bg-neutral-100 p-3'>
        <p className='text-neutral-1600 mb-1 text-sm font-medium'>Content preview</p>
        <p className='text-paragraph-sm text-neutral-1000 whitespace-pre-wrap'>
          {values.content}
        </p>
      </div>
      <p className='text-paragraph-sm text-neutral-1000'>
        Save as draft keeps this version invisible to employees; Publish makes it
        active per its effective dates and notifies the in-scope population.
      </p>
      {nextVersionNumber > 1 && (
        <p className='text-paragraph-sm text-neutral-1000'>
          Because this replaces an already-published edition, publishing asks
          for re-acknowledgment — only from the policy's applicable population.
          Employees the policy no longer covers are not asked again.
        </p>
      )}
    </div>
  )
}
