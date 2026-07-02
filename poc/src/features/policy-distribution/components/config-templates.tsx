import { useState } from 'react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { type NotificationTemplate } from '../data/config'
import { type PolicyConfigStore } from '../hooks/use-policy-config'

/**
 * Governed notification & receipt templates. Edits create a new versioned,
 * effective-dated row — prior versions remain on record for in-flight sends.
 */
export function ConfigTemplates({ config }: { config: PolicyConfigStore }) {
  const [editing, setEditing] = useState<NotificationTemplate | null>(null)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')

  const openEditor = (t: NotificationTemplate) => {
    setEditing(t)
    setSubject(t.subject)
    setBody(t.body)
  }

  const save = () => {
    if (!editing || !subject.trim() || !body.trim()) return
    config.updateTemplate(editing.id, subject.trim(), body.trim())
    setEditing(null)
  }

  return (
    <div className='space-y-2'>
      <h3 className='text-neutral-1600 text-sm font-semibold'>
        Notification & receipt templates
      </h3>
      <p className='text-paragraph-sm text-neutral-1000'>
        Reminder, escalation and receipt content is template-driven — the
        notification engine reads the version effective at send time. Merge
        variables: {'{{employeeName}} {{policyTitle}} {{dueDate}} {{inboxLink}}'}
      </p>
      <div className='space-y-2'>
        {config.activeTemplates.map((t) => {
          const priorVersions = config.templates.filter(
            (x) => x.kind === t.kind && x.superseded
          ).length
          return (
            <div
              key={t.id}
              className='border-grey-200 flex items-center justify-between gap-3 rounded-[6px] border bg-white px-4 py-3'
            >
              <div className='min-w-0'>
                <div className='flex items-center gap-2'>
                  <span className='text-neutral-1600 text-sm font-medium'>
                    {t.name}
                  </span>
                  <Badge variant='open'>{t.kind}</Badge>
                  <Badge variant='pending'>v{t.version}</Badge>
                </div>
                <p className='text-paragraph-sm text-neutral-1000 mt-1 truncate'>
                  “{t.subject}” · effective from {t.effectiveFrom}
                  {priorVersions > 0 && ` · ${priorVersions} prior version(s) on record`}
                </p>
              </div>
              <Button size='sm' variant='outline' onClick={() => openEditor(t)}>
                Edit
              </Button>
            </div>
          )
        })}
      </div>

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
        }}
      >
        <DialogContent className='sm:max-w-[520px]'>
          <DialogHeader>
            <DialogTitle>Edit {editing?.name}</DialogTitle>
            <DialogDescription>
              Saving creates version {(editing?.version ?? 0) + 1}, effective
              today. The current v{editing?.version} stays on record for
              in-flight assignments.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1.5'>
              <Label htmlFor='tpl-subject'>Subject</Label>
              <Input
                id='tpl-subject'
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className='space-y-1.5'>
              <Label htmlFor='tpl-body'>Body</Label>
              <Textarea
                id='tpl-body'
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={7}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={!subject.trim() || !body.trim()}>
              Save as new version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
