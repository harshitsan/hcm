import { Paperclip } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { type FieldDefinition } from '../data/custom-fields'
import { applyMask } from '../data/field-engine'
import { type FieldValue } from '../data/records'

interface DynamicFieldControlProps {
  def: FieldDefinition
  value: FieldValue
  onChange: (value: FieldValue) => void
  readOnly: boolean
  error?: string
  /** Referenced record names for lookup fields, resolved from metadata. */
  lookupOptions: string[]
}

/**
 * Renders the correct control for ANY custom field purely from its type
 * metadata — the L3 Forms/Dynamic-Fields engine. No per-field code exists.
 */
export function DynamicFieldControl({
  def,
  value,
  onChange,
  readOnly,
  error,
  lookupOptions,
}: DynamicFieldControlProps) {
  const text = typeof value === 'string' ? value : ''

  const control = (() => {
    switch (def.type) {
      case 'boolean':
        return (
          <Switch
            checked={value === true}
            disabled={readOnly}
            onCheckedChange={(checked) => onChange(checked)}
            aria-label={def.name}
          />
        )
      case 'multi-line-text':
        return (
          <Textarea
            value={text}
            disabled={readOnly}
            rows={3}
            onChange={(e) => onChange(e.target.value)}
          />
        )
      case 'single-select':
        return (
          <Select
            value={text || undefined}
            disabled={readOnly}
            onValueChange={(v) => onChange(v)}
          >
            <SelectTrigger variant='secondary' className='w-full'>
              <SelectValue placeholder='Select an option' />
            </SelectTrigger>
            <SelectContent>
              {def.options.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case 'checkbox':
        return (
          <label className='flex w-fit items-center gap-2 text-sm'>
            <Checkbox
              variant='blue'
              checked={value === true}
              disabled={readOnly}
              onCheckedChange={(checked) => onChange(checked === true)}
              aria-label={def.name}
            />
            {value === true ? 'Checked' : 'Not checked'}
          </label>
        )
      case 'radio':
        return (
          <RadioGroup
            value={text || undefined}
            disabled={readOnly}
            onValueChange={(v) => onChange(v)}
            className='flex flex-wrap gap-x-4 gap-y-1.5 rounded-md border border-gray-200 bg-white px-3 py-2'
          >
            {def.options.map((o) => (
              <label key={o} className='flex items-center gap-1.5 text-sm'>
                <RadioGroupItem value={o} aria-label={o} />
                {o}
              </label>
            ))}
          </RadioGroup>
        )
      case 'multi-select': {
        const selected = Array.isArray(value) ? value : []
        return (
          <div className='flex flex-wrap gap-x-4 gap-y-1.5 rounded-md border border-gray-200 bg-white px-3 py-2'>
            {def.options.map((o) => (
              <label key={o} className='flex items-center gap-1.5 text-sm'>
                <Checkbox
                  variant='blue'
                  checked={selected.includes(o)}
                  disabled={readOnly}
                  onCheckedChange={(checked) =>
                    onChange(
                      checked
                        ? [...selected, o]
                        : selected.filter((s) => s !== o)
                    )
                  }
                />
                {o}
              </label>
            ))}
          </div>
        )
      }
      case 'lookup':
        return (
          <Select
            value={text || undefined}
            disabled={readOnly}
            onValueChange={(v) => onChange(v)}
          >
            <SelectTrigger variant='secondary' className='w-full'>
              <SelectValue
                placeholder={`Select a ${def.lookupEntity ?? ''} record`}
              />
            </SelectTrigger>
            <SelectContent>
              {lookupOptions.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case 'file':
        return (
          <div className='flex items-center gap-2'>
            {text ? (
              <>
                <Badge variant='open'>
                  <Paperclip className='size-3' />
                  {text}
                </Badge>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => toast.info(`Downloading ${text}…`)}
                >
                  View
                </Button>
                {!readOnly && (
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => onChange(null)}
                  >
                    Remove
                  </Button>
                )}
              </>
            ) : (
              <Input
                type='file'
                disabled={readOnly}
                onChange={(e) => {
                  const name = e.target.files?.[0]?.name
                  if (name) onChange(name)
                }}
              />
            )}
          </div>
        )
      case 'date':
        return (
          <Input
            type='date'
            value={text}
            disabled={readOnly}
            onChange={(e) => onChange(e.target.value)}
          />
        )
      case 'date-time':
        return (
          <Input
            type='datetime-local'
            value={text}
            disabled={readOnly}
            onChange={(e) => onChange(e.target.value)}
          />
        )
      case 'currency':
      case 'percentage':
      case 'number':
      case 'decimal':
        return (
          <div className='flex items-center gap-1.5'>
            {def.type === 'currency' && (
              <span className='text-neutral-1000 text-sm'>$</span>
            )}
            <Input
              inputMode='decimal'
              value={text}
              disabled={readOnly}
              onChange={(e) => onChange(e.target.value)}
            />
            {def.type === 'percentage' && (
              <span className='text-neutral-1000 text-sm'>%</span>
            )}
          </div>
        )
      default:
        // single-line-text, email, phone, url — mask shapes input live.
        return (
          <Input
            type='text'
            value={text}
            disabled={readOnly}
            placeholder={def.mask || undefined}
            onChange={(e) => onChange(applyMask(def.mask, e.target.value))}
          />
        )
    }
  })()

  return (
    <div className='space-y-1'>
      <div className='flex items-center gap-2'>
        <Label className='text-sm font-medium'>
          {def.name}
          {def.required && <span className='text-destructive'>*</span>}
        </Label>
        {readOnly && <Badge variant='badge_inactive'>Read only</Badge>}
      </div>
      {control}
      {error ? (
        <p className='text-destructive text-paragraph-sm'>{error}</p>
      ) : (
        def.description && (
          <p className='text-paragraph-sm text-neutral-1000'>
            {def.description}
          </p>
        )
      )}
    </div>
  )
}
