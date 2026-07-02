import { useState } from 'react'
import { Plus, Trash } from 'phosphor-react'
import { toast } from 'sonner'
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
import { Switch } from '@/components/ui/switch'
import { type QuestionField, type QuestionType } from '../data/config'
import { type AssetConfigStore } from '../hooks/use-asset-config'

const TYPE_LABELS: Record<QuestionType, string> = {
  text: 'Free text',
  rating: 'Condition rating',
  yesno: 'Yes / No',
}

interface ConfigQuestionnaireProps {
  config: AssetConfigStore
}

/**
 * Condition-assessment questionnaire as governed config (ASM-20, ASM-24):
 * define fields, types and required flags; publishing creates a new
 * effective-dated version while prior acknowledgements keep rendering
 * against the version used at capture time.
 */
export function ConfigQuestionnaire({ config }: ConfigQuestionnaireProps) {
  const current = config.currentQuestionnaire
  const [fields, setFields] = useState<QuestionField[]>(current.fields)
  const [newLabel, setNewLabel] = useState('')
  const [newType, setNewType] = useState<QuestionType>('text')
  const [newRequired, setNewRequired] = useState(false)

  const addField = () => {
    if (newLabel.trim().length < 3) {
      toast.error('Field label is required')
      return
    }
    setFields((prev) => [
      ...prev,
      {
        id: `q-${crypto.randomUUID().slice(0, 6)}`,
        label: newLabel.trim(),
        type: newType,
        required: newRequired,
      },
    ])
    setNewLabel('')
    setNewType('text')
    setNewRequired(false)
  }

  const publish = () => {
    if (fields.length === 0) {
      toast.error('The template needs at least one field')
      return
    }
    config.publishQuestionnaire(fields)
  }

  return (
    <div className='space-y-3'>
      <div className='flex flex-wrap items-center gap-2'>
        <Badge variant='open'>
          current v{current.version} · effective {current.effectiveFrom}
        </Badge>
        <span className='text-paragraph-sm text-neutral-1000'>
          The Forms engine renders exactly these fields on every receipt/return
          acknowledgement. Publishing creates v{config.questionnaireVersions.length + 1}.
        </span>
      </div>

      <div className='border-grey-200 space-y-2 rounded-[6px] border bg-white p-3'>
        {fields.map((field) => (
          <div
            key={field.id}
            className='border-grey-200 flex items-center justify-between rounded-[6px] border px-3 py-2'
          >
            <div className='flex items-center gap-2'>
              <span className='text-neutral-1600 text-sm font-medium'>{field.label}</span>
              <Badge variant='pending'>{TYPE_LABELS[field.type]}</Badge>
              {field.required && <Badge variant='overdue'>Required</Badge>}
            </div>
            <Button
              variant='icon2'
              className='text-neutral-1900 h-7 w-7'
              aria-label='Remove field'
              onClick={() => setFields((prev) => prev.filter((f) => f.id !== field.id))}
            >
              <Trash size={14} weight='bold' />
            </Button>
          </div>
        ))}

        <div className='flex flex-wrap items-end gap-3 pt-1'>
          <div className='flex flex-col gap-1'>
            <Label htmlFor='q-new-label' className='text-paragraph-sm'>
              New field label
            </Label>
            <Input
              id='q-new-label'
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder='e.g. Battery health'
              className='h-7 w-[220px]'
            />
          </div>
          <div className='flex flex-col gap-1'>
            <Label className='text-paragraph-sm'>Type</Label>
            <Select value={newType} onValueChange={(v) => setNewType(v as QuestionType)}>
              <SelectTrigger className='h-7! w-[160px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(TYPE_LABELS) as QuestionType[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='mb-1 flex items-center gap-2'>
            <Switch id='q-new-required' checked={newRequired} onCheckedChange={setNewRequired} />
            <Label htmlFor='q-new-required' className='text-paragraph-sm'>
              Required
            </Label>
          </div>
          <Button variant='outline' className='h-7 gap-1 rounded-[6px] px-2.5' onClick={addField}>
            <Plus size={12} weight='bold' />
            Add field
          </Button>
          <Button className='h-7 rounded-[6px] px-2.5' onClick={publish}>
            Publish new version
          </Button>
        </div>
      </div>

      <div>
        <h3 className='text-neutral-1600 text-sm font-medium'>Version history</h3>
        <ul className='text-paragraph-sm text-neutral-1000 mt-1 space-y-0.5'>
          {[...config.questionnaireVersions].reverse().map((v) => (
            <li key={v.version}>
              v{v.version} · effective {v.effectiveFrom} · {v.fields.length} field(s):{' '}
              {v.fields.map((f) => f.label).join(', ')}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
