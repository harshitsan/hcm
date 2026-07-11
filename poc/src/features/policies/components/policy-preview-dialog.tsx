import { DownloadSimple, FilePdf } from 'phosphor-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { type Policy, type PolicyVersion } from '../data/policies'
import {
  currentVersion,
  formatDate,
  policyStatus,
  scopeSummary,
} from '../data/policy-utils'
import { PolicyStatusBadge, PolicyTypeBadge } from './policy-badges'

interface PolicyPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  policy: Policy | null
  /** Specific version to render; defaults to the in-force (or latest) one. */
  version?: PolicyVersion | null
  /** When provided and the shown version is a draft, offers Publish (POL-27). */
  onPublish?: (policy: Policy, version: PolicyVersion) => void
}

/**
 * Read-only rendering of a policy exactly as employees see it (POL-27/30/20):
 * content, applicability, exclusions and the attached document. Previewing a
 * draft does not activate it.
 */
export function PolicyPreviewDialog({
  open,
  onOpenChange,
  policy,
  version,
  onPublish,
}: PolicyPreviewDialogProps) {
  if (!policy) return null
  const shown =
    version ?? currentVersion(policy) ?? policy.versions[policy.versions.length - 1]
  if (!shown) return null
  const isDraft = shown.status === 'draft'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-[620px]'>
        <DialogHeader>
          <DialogTitle className='text-neutral-1600 flex flex-wrap items-center gap-2'>
            {shown.editionName}
            <PolicyTypeBadge type={policy.type} />
            <PolicyStatusBadge status={isDraft ? 'draft' : policyStatus(policy)} />
          </DialogTitle>
          <DialogDescription>
            {policy.category} · Version v{shown.version} ·{' '}
            {formatDate(shown.effectiveFrom)} →{' '}
            {shown.effectiveTill ? formatDate(shown.effectiveTill) : 'Open-ended'}
          </DialogDescription>
        </DialogHeader>

        {isDraft && (
          <div className='rounded-[6px] bg-neutral-100 px-3 py-2'>
            <p className='text-paragraph-sm text-neutral-1000'>
              Draft preview — this version is not active and not visible to
              employees until it is published.
            </p>
          </div>
        )}

        <div className='space-y-3'>
          <div className='border-gray-200 rounded-[6px] border p-3'>
            <p className='text-neutral-1600 mb-1 text-sm font-medium'>Policy content</p>
            <p className='text-paragraph-sm text-neutral-1900 whitespace-pre-wrap'>
              {shown.content}
            </p>
          </div>

          <div className='border-gray-200 rounded-[6px] border p-3'>
            <p className='text-neutral-1600 mb-1 text-sm font-medium'>Applicability</p>
            <p className='text-paragraph-sm text-neutral-1000'>
              {scopeSummary(policy.scope)}
            </p>
            {policy.scope.excludedPositionLevels.length > 0 && (
              <div className='mt-2 flex flex-wrap gap-1'>
                {policy.scope.excludedPositionLevels.map((level) => (
                  <Badge key={level} variant='dropped'>
                    Excludes {level}
                  </Badge>
                ))}
              </div>
            )}
            {policy.linkedModules.length > 0 && (
              <p className='text-paragraph-sm text-neutral-1000 mt-2'>
                Enforced by modules: {policy.linkedModules.join(', ')}
              </p>
            )}
          </div>

          {shown.attachment ? (
            <div className='border-gray-200 flex items-center justify-between rounded-[6px] border p-3'>
              <div className='flex items-center gap-2'>
                <FilePdf size={20} className='text-red-1400' />
                <div className='flex flex-col'>
                  <span className='text-neutral-1900 text-sm font-medium'>
                    {shown.attachment.fileName}
                  </span>
                  <span className='text-paragraph-sm text-neutral-1000'>
                    {shown.attachment.sizeKb.toLocaleString('en-US')} KB · attached to v
                    {shown.version}
                  </span>
                </div>
              </div>
              <Button
                variant='outline'
                size='sm'
                onClick={() =>
                  toast.info('Document download isn’t available in this demo')
                }
              >
                <DownloadSimple size={14} weight='bold' />
                Download
              </Button>
            </div>
          ) : (
            <p className='text-paragraph-sm text-neutral-1000'>
              No document file attached to this version.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {isDraft && onPublish && (
            <Button onClick={() => onPublish(policy, shown)}>
              Publish this version
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
