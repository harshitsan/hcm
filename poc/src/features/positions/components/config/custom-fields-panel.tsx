import { useState } from 'react'
import { Plus, Trash } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { PositionsStore } from '../../hooks/use-positions'

interface CustomFieldsPanelProps {
  companyId: string
  store: PositionsStore
}

/**
 * Governed per-tenant custom fields on positions (POS-13): extra attributes
 * are captured on every position without any code change, and downstream
 * modules read the current governed values scoped to this company only.
 */
export function CustomFieldsPanel({ companyId, store }: CustomFieldsPanelProps) {
  const [label, setLabel] = useState('')
  const [type, setType] = useState<'text' | 'select'>('text')
  const [options, setOptions] = useState('')

  const defs = store.customFieldDefs.filter((d) => d.companyId === companyId)

  const handleAdd = () => {
    store.addCustomFieldDef({
      companyId,
      label: label.trim(),
      type,
      options:
        type === 'select'
          ? options
              .split(',')
              .map((o) => o.trim())
              .filter(Boolean)
          : undefined,
    })
    setLabel('')
    setOptions('')
    setType('text')
  }

  return (
    <div className='space-y-4'>
      <p className='text-paragraph-sm text-neutral-1000'>
        Positions are governed reference metadata for this tenant. Custom
        fields configured here appear on every position form immediately — no
        code change — and recruitment, onboarding and reporting resolve them
        from this list rather than free text.
      </p>

      <div className='divide-grey-200 border-gray-200 divide-y rounded-[6px] border'>
        {defs.length === 0 && (
          <p className='text-paragraph-sm text-neutral-1000 px-3 py-2'>
            No custom fields configured yet.
          </p>
        )}
        {defs.map((def) => (
          <div key={def.id} className='flex items-center justify-between px-3 py-2'>
            <div className='flex items-center gap-2'>
              <span className='text-neutral-1600 text-sm font-medium'>
                {def.label}
              </span>
              <Badge variant='pending'>
                {def.type === 'select' ? 'Dropdown' : 'Text'}
              </Badge>
              {def.options && (
                <span className='text-paragraph-sm text-neutral-1000'>
                  {def.options.join(' / ')}
                </span>
              )}
            </div>
            <Button
              variant='icon2'
              className='text-neutral-1900 h-7 w-7'
              aria-label={`Remove ${def.label}`}
              onClick={() => store.removeCustomFieldDef(def.id)}
            >
              <Trash size={14} weight='bold' />
            </Button>
          </div>
        ))}
      </div>

      <div className='flex flex-wrap items-end gap-3'>
        <div className='space-y-1'>
          <Label className='text-paragraph-sm'>Field label</Label>
          <Input
            placeholder='e.g. Travel Required'
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className='h-8 w-[200px]'
          />
        </div>
        <div className='space-y-1'>
          <Label className='text-paragraph-sm'>Type</Label>
          <Select
            value={type}
            onValueChange={(v) => setType(v as 'text' | 'select')}
          >
            <SelectTrigger variant='secondary' className='h-8 w-[130px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='text'>Text</SelectItem>
              <SelectItem value='select'>Dropdown</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {type === 'select' && (
          <div className='space-y-1'>
            <Label className='text-paragraph-sm'>Options (comma-separated)</Label>
            <Input
              placeholder='Yes, No, Occasional'
              value={options}
              onChange={(e) => setOptions(e.target.value)}
              className='h-8 w-[240px]'
            />
          </div>
        )}
        <Button
          className='h-8'
          disabled={
            label.trim().length < 2 ||
            (type === 'select' && options.trim().length === 0)
          }
          onClick={handleAdd}
        >
          <Plus size={12} weight='bold' />
          Add field
        </Button>
      </div>
    </div>
  )
}
