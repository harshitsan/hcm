import { useMemo, useState } from 'react'
import { Copy, DownloadSimple, UploadSimple } from 'phosphor-react'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { RoleGate, useRole } from '@/context/role-context'
import {
  SUPPORTED_ENTITIES,
  type FieldDefinition,
  type SupportedEntity,
} from '../data/custom-fields'
import {
  formatFieldValue,
  resolveFieldAccess,
  validateFieldValue,
} from '../data/field-engine'
import { type EntityRecord } from '../data/records'
import { type WorkflowConditionsStore } from '../hooks/use-workflow-conditions'
import { WorkflowConditionsPanel } from './workflow-conditions-panel'

interface IntegrationTabProps {
  fields: FieldDefinition[]
  records: EntityRecord[]
  conditionsStore: WorkflowConditionsStore
}

/**
 * Custom data as first-class data: metadata-driven grids and search filters,
 * import/export, workflow conditions, and API access.
 */
export function IntegrationTab({
  fields,
  records,
  conditionsStore,
}: IntegrationTabProps) {
  const { role } = useRole()
  const [entity, setEntity] = useState<SupportedEntity>('Employees')
  const [filterFieldId, setFilterFieldId] = useState<string>('all')
  const [filterText, setFilterText] = useState('')
  const [apiRecordId, setApiRecordId] = useState('rec-self')

  // Column visibility follows the permission matrix for the active role.
  const gridFields = useMemo(
    () =>
      fields
        .filter((f) => f.entity === entity)
        .filter((f) => {
          if (role === 'Employee (User)')
            return f.permissions.employeeView || f.permissions.managerView
          if (role === 'Employee (Non-User)') return f.permissions.employeeView
          return true
        })
        .sort((a, b) => a.order - b.order),
    [fields, entity, role]
  )

  const entityRecords = useMemo(
    () => records.filter((r) => r.entity === entity),
    [records, entity]
  )

  const filterField = gridFields.find((f) => f.id === filterFieldId)
  const filteredRecords = useMemo(() => {
    if (!filterField || !filterText.trim()) return entityRecords
    const needle = filterText.trim().toLowerCase()
    return entityRecords.filter((r) =>
      formatFieldValue(filterField, r.values[filterField.id] ?? null)
        .toLowerCase()
        .includes(needle)
    )
  }, [entityRecords, filterField, filterText])

  const handleExport = () => {
    const header = ['Record', ...gridFields.map((f) => f.name)]
    const lines = filteredRecords.map((r) =>
      [
        r.name,
        ...gridFields.map((f) =>
          formatFieldValue(f, r.values[f.id] ?? null).replaceAll(',', ';')
        ),
      ].join(',')
    )
    const csv = [header.join(','), ...lines].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${entity.toLowerCase()}-custom-fields.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(
      `Exported ${filteredRecords.length} records including ${gridFields.length} custom columns`
    )
  }

  const apiRecord = records.find((r) => r.id === apiRecordId) ?? null
  const apiPayload = useMemo(() => {
    if (!apiRecord) return '{}'
    const custom: Record<string, string> = {}
    for (const f of fields.filter((x) => x.entity === apiRecord.entity)) {
      custom[f.name] = formatFieldValue(f, apiRecord.values[f.id] ?? null)
    }
    return JSON.stringify(
      { id: apiRecord.id, name: apiRecord.name, customFields: custom },
      null,
      2
    )
  }, [apiRecord, fields])

  const simulateBadWrite = () => {
    const emailField = fields.find((f) => f.type === 'email')
    if (!emailField || !apiRecord) return
    const err = validateFieldValue(emailField, 'not-an-email')
    toast.error(`API write rejected (422): ${err ?? 'validation failed'}`)
  }

  return (
    <div className='space-y-4'>
      <Card className='gap-3 py-4'>
        <CardHeader className='flex flex-row flex-wrap items-center justify-between gap-2'>
          <CardTitle className='text-paragraph-md'>
            Search, grid & reporting — custom fields as metadata-driven columns
          </CardTitle>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              className='gap-1'
              onClick={() =>
                toast.info(
                  'Import accepts custom columns — type, required, mask, and regex rules are enforced on load'
                )
              }
            >
              <UploadSimple size={14} weight='bold' />
              Import
            </Button>
            <Button
              variant='outline'
              size='sm'
              className='gap-1'
              onClick={handleExport}
            >
              <DownloadSimple size={14} weight='bold' />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className='space-y-3'>
          <div className='flex flex-wrap items-center gap-2'>
            <Select
              value={entity}
              onValueChange={(v) => {
                setEntity(v as SupportedEntity)
                setFilterFieldId('all')
                setFilterText('')
              }}
            >
              <SelectTrigger variant='secondary' className='w-[170px]'>
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
            <Select value={filterFieldId} onValueChange={setFilterFieldId}>
              <SelectTrigger variant='secondary' className='w-[220px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Filter by custom field…</SelectItem>
                {gridFields.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filterField && (
              <Input
                placeholder={`Value in ${filterField.name}`}
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className='w-[200px]'
              />
            )}
            <Badge variant='pending'>
              {filteredRecords.length} of {entityRecords.length} records
            </Badge>
          </div>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Record</TableHead>
                  {gridFields.map((f) => (
                    <TableHead key={f.id}>{f.name}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className='font-medium'>{r.name}</TableCell>
                    {gridFields.map((f) => (
                      <TableCell key={f.id} className='text-sm'>
                        {resolveFieldAccess(f, role, r) === 'hidden'
                          ? '···'
                          : formatFieldValue(f, r.values[f.id] ?? null)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className='text-paragraph-sm text-neutral-1000'>
            The same fields are available as report columns/dimensions; new
            definitions appear here without a UI redeploy.
          </p>
        </CardContent>
      </Card>

      <RoleGate
        roles={['Company Admin', 'Group Company Admin', 'Platform Admin']}
      >
        <WorkflowConditionsPanel
          fields={fields}
          record={apiRecord}
          store={conditionsStore}
        />

        <Card className='gap-3 py-4'>
          <CardHeader className='flex flex-row items-center justify-between'>
            <CardTitle className='text-paragraph-md'>
              API access — custom fields readable & writable with validations
            </CardTitle>
            <div className='flex items-center gap-2'>
              <Select value={apiRecordId} onValueChange={setApiRecordId}>
                <SelectTrigger variant='secondary' className='w-[190px]'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {records
                    .filter((r) => r.entity === 'Employees')
                    .map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                variant='outline'
                size='sm'
                className='gap-1'
                onClick={() => {
                  navigator.clipboard.writeText(apiPayload)
                  toast.success('GET payload copied')
                }}
              >
                <Copy size={14} weight='bold' />
                Copy
              </Button>
              <Button variant='outline' size='sm' onClick={simulateBadWrite}>
                Simulate invalid write
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className='max-h-[280px] overflow-auto rounded-md border border-gray-200 bg-white p-3 text-xs'>
              {apiPayload}
            </pre>
          </CardContent>
        </Card>
      </RoleGate>
    </div>
  )
}
