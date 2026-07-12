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
import { type LetterTemplate } from '../data/hr-letters'

interface TemplatePreviewDialogProps {
  template: LetterTemplate | null
  onOpenChange: (open: boolean) => void
}

/**
 * Read-only template preview (HLC-26): merge-field tokens and layout are
 * shown exactly as configured; Cancel exits without saving anything. Also
 * lists the effective-dated version history (HLC-18).
 */
export function TemplatePreviewDialog({
  template,
  onOpenChange,
}: TemplatePreviewDialogProps) {
  return (
    <Dialog open={Boolean(template)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{template?.name} — read-only view</DialogTitle>
          <DialogDescription>
            {template?.docType} · {template?.layout} layout
            {template?.letterhead ? ' · letterhead' : ''} · current v
            {template?.currentVersion}
          </DialogDescription>
        </DialogHeader>
        <pre className='text-neutral-1900 max-h-56 overflow-y-auto rounded bg-neutral-100 p-3 font-sans text-sm whitespace-pre-wrap'>
          {template?.body}
        </pre>
        <div>
          <p className='text-paragraph-sm mb-1 font-medium'>
            Version history (effective-dated, prior versions retained)
          </p>
          <ul className='max-h-32 space-y-1 overflow-y-auto'>
            {template?.versions.map((ver) => (
              <li key={ver.version} className='flex items-center gap-2 text-sm'>
                <Badge
                  variant={
                    ver.version === template.currentVersion
                      ? 'badge_active'
                      : 'pending'
                  }
                >
                  v{ver.version}
                </Badge>
                <span>
                  effective {ver.effectiveFrom} — {ver.summary} ({ver.editedBy})
                </span>
              </li>
            ))}
          </ul>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
