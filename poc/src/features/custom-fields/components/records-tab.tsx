import { useEffect, useMemo, useState } from 'react'
import { Info, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRole } from '@/context/role-context'
import {
  SUPPORTED_ENTITIES,
  type FieldDefinition,
  type SupportedEntity,
} from '../data/custom-fields'
import {
  resolveFieldAccess,
  validateFieldValue,
} from '../data/field-engine'
import { type FieldValue } from '../data/records'
import { type EntityRecordsStore } from '../hooks/use-entity-records'
import { DynamicFieldControl } from './dynamic-field-control'

interface RecordsTabProps {
  fields: FieldDefinition[]
  store: EntityRecordsStore
}

const today = () => new Date().toISOString().slice(0, 10)

/**
 * Record form rendered generically by the Dynamic-Fields engine: custom
 * fields appear alongside standard fields per their configured order,
 * default flag, permission matrix, and validations.
 */
export function RecordsTab({ fields, store }: RecordsTabProps) {
  const { role } = useRole()
  const { records, saveRecordValues } = store

  const [entity, setEntity] = useState<SupportedEntity>('Employees')
  const [recordId, setRecordId] = useState('rec-self')
  const [draft, setDraft] = useState<Record<string, FieldValue>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [enabledExtras, setEnabledExtras] = useState<string[]>([])
  const [effectiveDate, setEffectiveDate] = useState(today())

  const isNonUser = role === 'Employee (Non-User)'

  const visibleRecords = useMemo(() => {
    const inEntity = records.filter((r) => r.entity === entity)
    if (role === 'Employee (User)')
      return inEntity.filter((r) => r.relationship !== 'org')
    if (isNonUser) return inEntity.filter((r) => r.id === 'rec-vikram')
    return inEntity
  }, [records, entity, role, isNonUser])

  const record = visibleRecords.find((r) => r.id === recordId) ?? null

  useEffect(() => {
    if (!record && visibleRecords.length) setRecordId(visibleRecords[0].id)
  }, [record, visibleRecords])

  useEffect(() => {
    setDraft(record ? { ...record.values } : {})
    setErrors({})
  }, [record])

  const entityFields = useMemo(
    () =>
      fields
        .filter((f) => f.entity === entity)
        .sort((a, b) => a.order - b.order),
    [fields, entity]
  )

  // Non-default fields stay off the form until explicitly enabled.
  const formFields = entityFields.filter(
    (f) => f.isDefault || enabledExtras.includes(f.id)
  )
  const hiddenExtras = entityFields.filter(
    (f) => !f.isDefault && !enabledExtras.includes(f.id)
  )

  const accessOf = (def: FieldDefinition) =>
    record ? resolveFieldAccess(def, role, record) : 'hidden'

  const renderedFields = formFields.filter((f) => accessOf(f) !== 'hidden')

  const lookupOptionsFor = (def: FieldDefinition) =>
    def.lookupEntity
      ? records.filter((r) => r.entity === def.lookupEntity).map((r) => r.name)
      : []

  const handleSave = () => {
    if (!record) return
    const nextErrors: Record<string, string> = {}
    for (const def of renderedFields) {
      if (accessOf(def) !== 'edit') continue
      const err = validateFieldValue(def, draft[def.id] ?? null)
      if (err) nextErrors[def.id] = err
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      toast.error(
        `Save blocked — fix ${Object.keys(nextErrors).length} validation issue${
          Object.keys(nextErrors).length === 1 ? '' : 's'
        }`
      )
      return
    }
    saveRecordValues(record.id, draft, fields, role, effectiveDate)
  }

  const canEditAny =
    !isNonUser && renderedFields.some((f) => accessOf(f) === 'edit')

  return (
    <div className='grid gap-4 lg:grid-cols-[280px_1fr]'>
      <Card className='h-fit gap-3 py-4'>
        <CardHeader>
          <CardTitle className='text-paragraph-md'>Open a record</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          <div className='space-y-1'>
            <Label className='text-sm'>Entity</Label>
            <Select
              value={entity}
              onValueChange={(v) => setEntity(v as SupportedEntity)}
            >
              <SelectTrigger variant='secondary' className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_ENTITIES.map((e) => (
                  <SelectItem key={e} value={e}>
                    {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-1'>
            <Label className='text-sm'>Record</Label>
            <Select value={record?.id ?? ''} onValueChange={setRecordId}>
              <SelectTrigger variant='secondary' className='w-full'>
                <SelectValue placeholder='Choose a record' />
              </SelectTrigger>
              <SelectContent>
                {visibleRecords.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                    {r.relationship === 'self' && ' (me)'}
                    {!r.isUser && r.entity === 'Employees' && ' · non-user'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {record && (
            <div className='text-paragraph-sm text-neutral-1000 space-y-1'>
              <p>{record.subtitle}</p>
              <div className='flex flex-wrap gap-1'>
                <Badge variant='pending'>{record.tenant}</Badge>
                {record.relationship === 'direct-report' && (
                  <Badge variant='open'>Direct report</Badge>
                )}
                {!record.isUser && record.entity === 'Employees' && (
                  <Badge variant='badge_inactive'>No login</Badge>
                )}
              </div>
            </div>
          )}
          <div className='text-paragraph-sm text-neutral-1000 flex items-start gap-1.5 rounded-md border border-gray-200 bg-white p-2'>
            <Info className='mt-0.5 size-3.5 shrink-0' />
            Controls, options, and validations below are rendered by the
            Dynamic-Fields engine from field metadata alone — definition
            changes appear on next render, no redeploy.
          </div>
        </CardContent>
      </Card>

      <Card className='gap-3 py-4'>
        <CardHeader className='flex flex-row items-center justify-between'>
          <CardTitle className='text-paragraph-md'>
            {record ? `${record.name} — custom fields` : 'Custom fields'}
          </CardTitle>
          {hiddenExtras.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' size='sm' className='gap-1'>
                  <Plus className='size-3.5' />
                  Enable field on form ({hiddenExtras.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='min-w-[220px]'>
                {hiddenExtras.map((f) => (
                  <DropdownMenuItem
                    key={f.id}
                    onClick={() => {
                      setEnabledExtras((prev) => [...prev, f.id])
                      toast.success(`"${f.name}" enabled on this form`)
                    }}
                  >
                    {f.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </CardHeader>
        <CardContent className='space-y-4'>
          {isNonUser && (
            <div className='text-paragraph-sm rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-900'>
              Employee (Non-User) accounts never log in — this record is
              maintained by HR or the reporting manager through the permission
              matrix. Shown read-only for demonstration.
            </div>
          )}
          {renderedFields.length === 0 && (
            <p className='text-neutral-1000 py-8 text-center text-sm'>
              No custom fields are visible to your role on this record.
            </p>
          )}
          <div className='grid gap-4 md:grid-cols-2'>
            {renderedFields.map((def) => (
              <DynamicFieldControl
                key={def.id}
                def={def}
                value={draft[def.id] ?? null}
                readOnly={isNonUser || accessOf(def) !== 'edit'}
                error={errors[def.id]}
                lookupOptions={lookupOptionsFor(def)}
                onChange={(v) =>
                  setDraft((prev) => ({ ...prev, [def.id]: v }))
                }
              />
            ))}
          </div>
          {canEditAny && record && (
            <div className='flex items-end justify-end gap-3 border-t border-gray-200 pt-4'>
              <div className='space-y-1'>
                <Label className='text-sm'>Change effective date</Label>
                <Input
                  type='date'
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className='w-[170px]'
                />
              </div>
              <Button onClick={handleSave}>Save record</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
