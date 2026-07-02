import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { type CatalogTemplate } from '../data/catalogs'

export type CatalogDialogMode = 'view' | 'edit' | 'new'

export interface CatalogTemplateSave {
  templateType: string
  description: string
  body: string
}

interface CatalogTemplateDialogProps {
  mode: CatalogDialogMode | null
  template: CatalogTemplate | null
  domainName: string
  channel: string
  onClose: () => void
  onSave: (values: CatalogTemplateSave) => void
}

/**
 * View / edit / create a catalog template (HLC-24/25/26): View is strictly
 * read-only with Cancel; Edit changes only the selected channel's wording;
 * New files the template under the current domain catalog with a fresh
 * Template Type ID.
 */
export function CatalogTemplateDialog({
  mode,
  template,
  domainName,
  channel,
  onClose,
  onSave,
}: CatalogTemplateDialogProps) {
  const [type, setType] = useState('')
  const [description, setDescription] = useState('')
  const [body, setBody] = useState('')

  useEffect(() => {
    if (mode === null) return
    setType(template?.templateType ?? '')
    setDescription(template?.description ?? '')
    setBody(template?.body ?? '')
  }, [mode, template])

  return (
    <Dialog open={mode !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'new'
              ? `New ${channel} template — ${domainName}`
              : `${template?.id} — ${template?.templateType}`}
          </DialogTitle>
          <DialogDescription>
            {mode === 'view' &&
              'Read-only view — merge-field tokens and layout shown as configured.'}
            {mode === 'edit' &&
              `Editing the ${template?.channel} wording for this event only — the other channel is independent.`}
            {mode === 'new' &&
              'A unique Template Type ID is assigned and the template is filed under this domain catalog.'}
          </DialogDescription>
        </DialogHeader>
        {mode === 'view' ? (
          <pre className='text-neutral-1900 rounded bg-neutral-100 p-3 font-sans text-sm whitespace-pre-wrap'>
            {template?.body}
          </pre>
        ) : (
          <div className='space-y-2'>
            {mode === 'new' && (
              <Input
                placeholder='Template type (event name)'
                value={type}
                onChange={(e) => setType(e.target.value)}
              />
            )}
            <Input
              placeholder='Description'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Textarea
              rows={5}
              placeholder='Message body with {{merge.fields}}'
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
        )}
        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          {mode !== 'view' && mode !== null && (
            <Button
              disabled={
                body.trim().length < 10 ||
                (mode === 'new' && type.trim().length < 3)
              }
              onClick={() =>
                onSave({
                  templateType: type.trim(),
                  description: description.trim(),
                  body: body.trim(),
                })
              }
            >
              Save
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
