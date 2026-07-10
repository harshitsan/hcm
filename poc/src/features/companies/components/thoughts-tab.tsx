import { useState } from 'react'
import { toast } from 'sonner'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  PUBLISH_TYPES,
  TEXT_COLORS,
  type PublishType,
  type Thought,
} from '../data/org-config'
import { type OrgConfigStore } from '../hooks/use-org-config'

interface ThoughtsTabProps {
  store: OrgConfigStore
}

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

/**
 * Configuration → Organization → Thought of the day. Feature toggle, publish
 * type (Sequential/Random), text color + default text, plus full add / edit /
 * delete management of the thought list.
 */
export function ThoughtsTab({ store }: ThoughtsTabProps) {
  const saved = store.thoughtSettings

  // Settings draft (Save persists, Cancel reverts).
  const [enabled, setEnabled] = useState(saved.enabled)
  const [publishType, setPublishType] = useState<PublishType>(saved.publishType)
  const [textColor, setTextColor] = useState(saved.textColor)
  const [defaultText, setDefaultText] = useState(saved.defaultText)

  const dirty =
    enabled !== saved.enabled ||
    publishType !== saved.publishType ||
    textColor !== saved.textColor ||
    defaultText !== saved.defaultText

  // Thought add/edit dialog state.
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Thought | null>(null)
  const [text, setText] = useState('')
  const [author, setAuthor] = useState('')
  const [pendingDelete, setPendingDelete] = useState<Thought | null>(null)

  const openNew = () => {
    setEditing(null)
    setText('')
    setAuthor('')
    setDialogOpen(true)
  }

  const openEdit = (thought: Thought) => {
    setEditing(thought)
    setText(thought.text)
    setAuthor(thought.author)
    setDialogOpen(true)
  }

  const submitThought = () => {
    if (!text.trim()) {
      toast.error('Thought text is required')
      return
    }
    const draft = { text: text.trim(), author: author.trim() || 'Unknown' }
    if (editing) store.updateThought(editing.id, draft)
    else store.addThought(draft)
    setDialogOpen(false)
  }

  const saveSettings = () => {
    if (!defaultText.trim()) {
      toast.error('Default text is required so the display is never empty')
      return
    }
    store.saveThoughtSettings({
      enabled,
      publishType,
      textColor,
      defaultText: defaultText.trim(),
    })
  }

  const cancelSettings = () => {
    setEnabled(saved.enabled)
    setPublishType(saved.publishType)
    setTextColor(saved.textColor)
    setDefaultText(saved.defaultText)
    toast.info('Unsaved thought-of-the-day settings discarded')
  }

  return (
    <div className='w-full space-y-4'>
      {/* Settings */}
      <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
        <div className='mb-3 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Thought of the day — settings
          </h3>
          <Badge variant={saved.enabled ? 'open' : 'dropped'}>
            {saved.enabled ? 'Shown to employees' : 'Hidden'}
          </Badge>
        </div>

        <div className='grid gap-4 lg:grid-cols-2'>
          <div className='space-y-4'>
            <div className='flex items-center justify-between gap-2 rounded-[6px] border border-gray-200 p-3'>
              <div>
                <p className='text-neutral-1600 text-sm font-medium'>
                  Enable thought of the day
                </p>
                <p className='text-neutral-1000 text-xs'>
                  Controls whether the widget appears on employee dashboards.
                </p>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>
            <div className='space-y-1'>
              <Label className='text-paragraph-sm'>Publish type</Label>
              <Select
                value={publishType}
                onValueChange={(v) => setPublishType(v as PublishType)}
                disabled={!enabled}
              >
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PUBLISH_TYPES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className='text-neutral-1000 text-xs'>
                Sequential cycles the list in order; Random picks any entry.
              </p>
            </div>
            <div className='space-y-1'>
              <Label className='text-paragraph-sm'>Text color</Label>
              <Select
                value={textColor}
                onValueChange={setTextColor}
                disabled={!enabled}
              >
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEXT_COLORS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <span className='flex items-center gap-2'>
                        <span
                          className='inline-block h-3 w-3 rounded-full border border-gray-200'
                          style={{ backgroundColor: c.value }}
                        />
                        {c.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-1'>
              <Label className='text-paragraph-sm'>Default text *</Label>
              <Input
                value={defaultText}
                onChange={(e) => setDefaultText(e.target.value)}
                disabled={!enabled}
                placeholder='Shown when no thought is scheduled'
              />
            </div>
            <div className='flex items-center gap-2'>
              <Button className='h-7' onClick={saveSettings} disabled={!dirty}>
                Save
              </Button>
              <Button
                variant='outline'
                className='h-7'
                onClick={cancelSettings}
                disabled={!dirty}
              >
                Cancel
              </Button>
              {dirty && (
                <span className='text-neutral-1000 text-xs'>
                  Unsaved changes
                </span>
              )}
            </div>
          </div>

          <div className='rounded-[6px] border border-dashed border-gray-300 p-4'>
            <p className='text-neutral-1000 mb-2 text-xs font-medium'>
              Dashboard preview
            </p>
            {enabled ? (
              <blockquote
                className='text-paragraph-md font-medium'
                style={{ color: textColor }}
              >
                “{store.thoughts[0]?.text ?? defaultText}”
                <footer className='text-neutral-1000 mt-1 text-xs'>
                  — {store.thoughts[0]?.author ?? 'Default'} ·{' '}
                  {publishType} publishing
                </footer>
              </blockquote>
            ) : (
              <p className='text-neutral-1000 text-sm'>
                The widget is disabled and will not be shown to employees.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Thought list */}
      <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
        <div className='mb-3 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Thoughts ({store.thoughts.length})
          </h3>
          <Button className='h-7' onClick={openNew}>
            Add thought
          </Button>
        </div>
        <div className='space-y-2'>
          {store.thoughts.length === 0 && (
            <p className='text-neutral-1000 text-sm'>
              No thoughts yet — the default text will be displayed.
            </p>
          )}
          {store.thoughts.map((t, idx) => (
            <div
              key={t.id}
              className='flex flex-wrap items-center justify-between gap-2 rounded-[6px] border border-gray-200 px-3 py-2'
            >
              <div>
                <p className='text-neutral-1600 text-sm'>
                  {saved.publishType === 'Sequential' && (
                    <span className='text-neutral-1000 mr-2 text-xs'>
                      #{idx + 1}
                    </span>
                  )}
                  “{t.text}”
                </p>
                <p className='text-neutral-1000 text-xs'>
                  — {t.author} · added {dateFmt.format(new Date(t.addedOn))}
                </p>
              </div>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  className='h-7 px-2 text-xs'
                  onClick={() => openEdit(t)}
                >
                  Edit
                </Button>
                <Button
                  variant='outline'
                  className='text-destructive h-7 px-2 text-xs'
                  onClick={() => setPendingDelete(t)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Edit thought' : 'Add thought of the day'}
            </DialogTitle>
            <DialogDescription>
              Motivational content shown on employee dashboards.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1'>
              <Label className='text-paragraph-sm'>Thought text *</Label>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                placeholder='e.g. The secret of getting ahead is getting started.'
              />
            </div>
            <div className='space-y-1'>
              <Label className='text-paragraph-sm'>Author</Label>
              <Input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder='e.g. Mark Twain'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitThought}>
              {editing ? 'Save changes' : 'Add thought'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this thought?</AlertDialogTitle>
            <AlertDialogDescription>
              “{pendingDelete?.text}” will no longer appear on employee
              dashboards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className='bg-destructive hover:bg-destructive/90 text-white'
              onClick={() => {
                if (pendingDelete) store.deleteThought(pendingDelete.id)
                setPendingDelete(null)
              }}
            >
              Delete thought
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
