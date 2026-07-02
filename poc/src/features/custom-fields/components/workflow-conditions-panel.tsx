import { useState } from 'react'
import { Play, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { type FieldDefinition } from '../data/custom-fields'
import { evaluateCondition, operatorsForType } from '../data/field-engine'
import {
  OPERATOR_LABELS,
  type ConditionOperator,
  type EntityRecord,
} from '../data/records'
import { type WorkflowConditionsStore } from '../hooks/use-workflow-conditions'

interface WorkflowConditionsPanelProps {
  fields: FieldDefinition[]
  record: EntityRecord | null
  store: WorkflowConditionsStore
}

/**
 * Rules/Workflow engine surface: conditions read custom field values as
 * first-class runtime inputs; removed fields are handled safely.
 */
export function WorkflowConditionsPanel({
  fields,
  record,
  store,
}: WorkflowConditionsPanelProps) {
  const { conditions, addCondition, toggleCondition, removeCondition } = store
  const [results, setResults] = useState<Record<string, boolean | null>>({})

  const [name, setName] = useState('')
  const [fieldId, setFieldId] = useState('')
  const [operator, setOperator] = useState<ConditionOperator>('equals')
  const [value, setValue] = useState('')
  const [action, setAction] = useState('')

  const selectedField = fields.find((f) => f.id === fieldId)
  const operators = selectedField
    ? operatorsForType(selectedField.type)
    : (['equals'] as ConditionOperator[])
  const needsValue = operator !== 'is-true' && operator !== 'is-false'

  const handleAdd = () => {
    if (!name.trim() || !selectedField || !action.trim()) {
      toast.error('Name, custom field, and action are required')
      return
    }
    if (needsValue && !value.trim()) {
      toast.error('Enter a comparison value')
      return
    }
    addCondition({ name, fieldId, operator, value, action })
    setName('')
    setFieldId('')
    setValue('')
    setAction('')
  }

  const evaluate = (id: string) => {
    const cond = conditions.find((c) => c.id === id)
    if (!cond || !record) return
    const def = fields.find((f) => f.id === cond.fieldId)
    const result = evaluateCondition(def, cond, record)
    setResults((prev) => ({ ...prev, [id]: result }))
    if (result === null)
      toast.warning(
        'Referenced field no longer exists — condition skipped safely'
      )
  }

  return (
    <Card className='gap-3 py-4'>
      <CardHeader>
        <CardTitle className='text-paragraph-md'>
          Workflow & rules conditions on custom fields
          {record && (
            <span className='text-neutral-1000 ml-2 text-sm font-normal'>
              evaluating against: {record.name}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-3'>
        <div className='flex flex-wrap items-end gap-2 rounded-md border border-gray-200 bg-white p-3'>
          <Input
            placeholder='Condition name'
            value={name}
            onChange={(e) => setName(e.target.value)}
            className='w-[180px]'
          />
          <Select
            value={fieldId || undefined}
            onValueChange={(v) => {
              setFieldId(v)
              const f = fields.find((x) => x.id === v)
              if (f) setOperator(operatorsForType(f.type)[0])
            }}
          >
            <SelectTrigger variant='secondary' className='w-[200px]'>
              <SelectValue placeholder='Custom field' />
            </SelectTrigger>
            <SelectContent>
              {fields.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name} ({f.entity})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={operator}
            onValueChange={(v) => setOperator(v as ConditionOperator)}
          >
            <SelectTrigger variant='secondary' className='w-[160px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {operators.map((op) => (
                <SelectItem key={op} value={op}>
                  {OPERATOR_LABELS[op]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {needsValue && (
            <Input
              placeholder='Value'
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className='w-[130px]'
            />
          )}
          <Input
            placeholder='Then… (action)'
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className='w-[220px]'
          />
          <Button size='sm' onClick={handleAdd}>
            Add condition
          </Button>
        </div>

        <div className='space-y-2'>
          {conditions.map((c) => {
            const def = fields.find((f) => f.id === c.fieldId)
            const result = results[c.id]
            return (
              <div
                key={c.id}
                className='flex flex-wrap items-center justify-between gap-2 rounded-md border border-gray-200 bg-white px-3 py-2'
              >
                <div className='flex min-w-0 flex-col'>
                  <span className='text-sm font-medium'>{c.name}</span>
                  <span className='text-paragraph-sm text-neutral-1000'>
                    When{' '}
                    {def ? (
                      <span className='font-medium'>{def.name}</span>
                    ) : (
                      <Badge variant='dropped'>field removed</Badge>
                    )}{' '}
                    {OPERATOR_LABELS[c.operator]}
                    {c.value ? ` ${c.value}` : ''} → {c.action}
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  {result !== undefined && (
                    <Badge
                      variant={
                        result === null
                          ? 'badge_inactive'
                          : result
                            ? 'badge_active'
                            : 'pending'
                      }
                    >
                      {result === null
                        ? 'Skipped (field missing)'
                        : result
                          ? 'Routed'
                          : 'Not triggered'}
                    </Badge>
                  )}
                  <Button
                    variant='outline'
                    size='sm'
                    className='gap-1'
                    disabled={!c.enabled || !record}
                    onClick={() => evaluate(c.id)}
                  >
                    <Play className='size-3.5' />
                    Evaluate
                  </Button>
                  <Switch
                    checked={c.enabled}
                    onCheckedChange={() => toggleCondition(c.id)}
                    aria-label={`Enable ${c.name}`}
                  />
                  <Button
                    variant='icon2'
                    className='h-7 w-7'
                    onClick={() => removeCondition(c.id)}
                    aria-label={`Remove ${c.name}`}
                  >
                    <Trash2 className='size-3.5' />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
