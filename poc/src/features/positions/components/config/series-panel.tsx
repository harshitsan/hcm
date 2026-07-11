import { useState } from 'react'
import { ArrowsClockwise, PencilSimple, Plus } from 'phosphor-react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  SERIES_APPLIES_TO,
  renderSeries,
  type NumberSeries,
  type SeriesAppliesTo,
} from '../../data/org-config'
import type { OrgConfigStore } from '../../hooks/use-org-config'

interface SeriesPanelProps {
  companyId: string
  orgConfig: OrgConfigStore
}

/**
 * Configure Series (POS-35): numbering rules that auto-generate Position IDs
 * and employee codes. Editing a rule changes future IDs only — identifiers
 * already issued remain unchanged.
 */
export function SeriesPanel({ companyId, orgConfig }: SeriesPanelProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<NumberSeries | null>(null)
  const [name, setName] = useState('')
  const [template, setTemplate] = useState('')
  const [appliesTo, setAppliesTo] = useState<SeriesAppliesTo>('Position ID')

  const rows = orgConfig.series.filter((s) => s.companyId === companyId)

  const openDialog = (series: NumberSeries | null) => {
    setEditing(series)
    setName(series?.name ?? '')
    setTemplate(series?.template ?? 'PREFIX-{####}')
    setAppliesTo(series?.appliesTo ?? 'Position ID')
    setDialogOpen(true)
  }

  const templateValid = template.includes('{####}')

  const handleSave = () => {
    const draft = {
      companyId,
      name: name.trim(),
      template: template.trim(),
      appliesTo,
      nextNumber: editing?.nextNumber ?? 1,
    }
    if (editing) {
      orgConfig.updateSeries(editing.id, draft)
    } else {
      orgConfig.addSeries(draft)
    }
    setDialogOpen(false)
    setEditing(null)
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <p className='text-paragraph-sm text-neutral-1000'>
          New positions and employees get their identifier from the applicable
          series automatically — never typed by hand.
        </p>
        <div className='flex items-center gap-2'>
          <Button
            variant='icon2'
            className='text-neutral-1900 h-7 w-7'
            aria-label='Refresh series'
            onClick={() => toast.success('Series list refreshed')}
          >
            <ArrowsClockwise size={14} weight='bold' />
          </Button>
          <Button className='h-7' onClick={() => openDialog(null)}>
            <Plus size={12} weight='bold' />
            New series
          </Button>
        </div>
      </div>

      <div className='divide-grey-200 border-gray-200 divide-y rounded-[6px] border'>
        {rows.map((s) => (
          <div key={s.id} className='flex items-center justify-between px-3 py-2'>
            <div className='flex min-w-0 flex-col gap-0.5'>
              <div className='flex items-center gap-2'>
                <span className='text-neutral-1600 text-sm font-medium'>
                  {s.name}
                </span>
                <Badge variant='pending'>{s.appliesTo}</Badge>
              </div>
              <span className='text-paragraph-sm text-neutral-1000 font-mono'>
                {s.template} · next: {renderSeries(s.template, s.nextNumber)}
              </span>
            </div>
            <Button
              variant='icon2'
              className='text-neutral-1900 h-7 w-7'
              aria-label={`Edit ${s.name}`}
              onClick={() => openDialog(s)}
            >
              <PencilSimple size={14} weight='fill' />
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='sm:max-w-[420px]'>
          <DialogHeader>
            <DialogTitle>
              {editing ? `Edit ${editing.name}` : 'New numbering series'}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? 'Future IDs use the updated rule; existing identifiers remain unchanged.'
                : 'The rule template must contain {####}, replaced by the zero-padded next number.'}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1.5'>
              <Label>Series name</Label>
              <Input
                placeholder='e.g. Contractor Code Series'
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className='space-y-1.5'>
              <Label>Rule / template</Label>
              <Input
                placeholder='e.g. CTR-MER-{####}'
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
              />
              {!templateValid && template.length > 0 && (
                <p className='text-destructive text-paragraph-sm'>
                  Template must contain the {'{####}'} placeholder.
                </p>
              )}
              {templateValid && (
                <p className='text-paragraph-sm text-neutral-1000'>
                  Preview: {renderSeries(template, editing?.nextNumber ?? 1)}
                </p>
              )}
            </div>
            <div className='space-y-1.5'>
              <Label>Applies to</Label>
              <Select
                value={appliesTo}
                onValueChange={(v) => setAppliesTo(v as SeriesAppliesTo)}
              >
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERIES_APPLIES_TO.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={name.trim().length < 2 || !templateValid}
              onClick={handleSave}
            >
              {editing ? 'Save rule' : 'Create series'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
