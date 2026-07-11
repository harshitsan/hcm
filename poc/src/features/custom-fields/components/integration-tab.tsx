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
import {
  UploadModal,
  type UploadErrorDetail,
  type UploadResult,
} from '@/components/common/upload-modal'
import { RoleGate, useRole } from '@/context/role-context'
import {
  SUPPORTED_ENTITIES,
  type FieldDefinition,
  type SupportedEntity,
} from '../data/custom-fields'
import {
  applyMask,
  formatFieldValue,
  resolveFieldAccess,
  validateFieldValue,
} from '../data/field-engine'
import { type EntityRecord, type FieldValue } from '../data/records'
import { type EntityRecordsStore } from '../hooks/use-entity-records'
import { type WorkflowConditionsStore } from '../hooks/use-workflow-conditions'
import { WorkflowConditionsPanel } from './workflow-conditions-panel'

interface IntegrationTabProps {
  fields: FieldDefinition[]
  recordsStore: EntityRecordsStore
  conditionsStore: WorkflowConditionsStore
}

const todayIso = () => new Date().toISOString().slice(0, 10)

/** A plausible, type-correct raw value for a staged import cell. */
function sampleImportValue(def: FieldDefinition): FieldValue {
  switch (def.type) {
    case 'number':
      return '7'
    case 'decimal':
      return '12.5'
    case 'currency':
      return '2600'
    case 'percentage':
      return '18'
    case 'boolean':
    case 'checkbox':
      return true
    case 'date':
    case 'date-time':
      return todayIso()
    case 'single-select':
    case 'radio':
    case 'lookup':
      return def.options[0] ?? 'Assembly'
    case 'multi-select':
      return def.options.slice(0, 2)
    case 'email':
      return 'import.batch@example.com'
    case 'phone':
      return '+91 98220 55667'
    case 'url':
      return 'https://example.com/imported'
    case 'file':
      return 'imported-attachment.pdf'
    default:
      return 'Imported via CSV'
  }
}

/**
 * A deliberately bad raw value for the staged batch so the dry-run has
 * something to reject; null when the type has no invalid representation.
 */
function invalidImportValue(def: FieldDefinition): FieldValue | null {
  switch (def.type) {
    case 'number':
      return 'twelve'
    case 'decimal':
    case 'currency':
      return '12,000'
    case 'percentage':
      return '140'
    case 'email':
      return 'not-an-email'
    case 'phone':
      return 'call me'
    case 'url':
      return 'example dot com'
    case 'date':
    case 'date-time':
      return 'not-a-date'
    case 'single-select':
    case 'radio':
      return 'Not a configured option'
    case 'multi-select':
      return ['Not a configured option']
    case 'checkbox':
      return def.required ? false : null
    default:
      return def.regex ? '!!' : def.required ? '' : null
  }
}

/**
 * Custom data as first-class data: metadata-driven grids and search filters,
 * import/export, workflow conditions, and API access.
 */
export function IntegrationTab({
  fields,
  recordsStore,
  conditionsStore,
}: IntegrationTabProps) {
  const { role } = useRole()
  const records = recordsStore.records
  const [entity, setEntity] = useState<SupportedEntity>('Employees')
  const [filterFieldId, setFilterFieldId] = useState<string>('all')
  const [filterText, setFilterText] = useState('')
  const [apiRecordId, setApiRecordId] = useState('rec-self')
  const [importOpen, setImportOpen] = useState(false)

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

  /**
   * Import framework flow (staging → validate → dry-run → commit): rows are
   * staged out of the uploaded file (deterministic mock batch — no backend),
   * every cell is validated with the SAME field-engine rules the forms use
   * (type, required, options, mask, regex), and only rows that pass the
   * dry-run commit — each change versioned into the bitemporal history.
   */
  const handleImport = async (file: File): Promise<UploadResult> => {
    const entityFields = fields
      .filter((f) => f.entity === entity)
      .sort((a, b) => a.order - b.order)
    const targets = records.filter((r) => r.entity === entity)

    if (!entityFields.length || !targets.length) {
      return {
        state: 'failed',
        successCount: 0,
        failedCount: 1,
        errors: [
          {
            row: 2,
            fieldName: 'File',
            reason: !entityFields.length
              ? `No custom fields are configured for ${entity} — add definitions before importing`
              : `No ${entity} records exist to import values into`,
          },
        ],
      }
    }

    // Staging: parse the batch — up to 3 columns (field defs) per row.
    const columns = entityFields.slice(0, 3)
    const goodValue = (def: FieldDefinition): FieldValue | null => {
      // Prefer a value already valid on another record; else a typed sample.
      const donor = targets.find((r) => {
        const v = r.values[def.id]
        return v !== undefined && v !== null && v !== ''
      })
      const raw = donor?.values[def.id] ?? sampleImportValue(def)
      const shaped =
        typeof raw === 'string' && def.mask ? applyMask(def.mask, raw) : raw
      return validateFieldValue(def, shaped) === null ? shaped : null
    }
    const cellsFor = (bad: FieldDefinition | null) =>
      columns.flatMap((def) => {
        if (bad && def.id === bad.id) {
          const raw = invalidImportValue(def)
          return raw === null ? [] : [{ def, raw }]
        }
        const raw = goodValue(def)
        return raw === null ? [] : [{ def, raw }]
      })
    // One column carries a bad value in row 3 so the dry-run rejects it.
    const badColumn =
      columns.find((def) => {
        const raw = invalidImportValue(def)
        return raw !== null && validateFieldValue(def, raw) !== null
      }) ?? null

    const staged: {
      row: number
      record: EntityRecord | null
      recordName: string
      cells: { def: FieldDefinition; raw: FieldValue }[]
    }[] = [
      { row: 2, record: targets[0], recordName: targets[0].name, cells: cellsFor(null) },
      {
        row: 3,
        record: targets[1] ?? targets[0],
        recordName: (targets[1] ?? targets[0]).name,
        cells: cellsFor(badColumn),
      },
      { row: 4, record: null, recordName: 'Priya Nair', cells: [] },
      {
        row: 5,
        record: targets[2] ?? targets[0],
        recordName: (targets[2] ?? targets[0]).name,
        cells: cellsFor(null),
      },
    ]

    // Validate + dry-run: simulate the round-trip before committing.
    await new Promise((resolve) => setTimeout(resolve, 900))
    const errors: UploadErrorDetail[] = []
    const commits: { recordId: string; updates: Record<string, FieldValue> }[] = []
    for (const row of staged) {
      if (!row.record) {
        errors.push({
          row: row.row,
          fieldName: 'Record',
          reason: `Unknown ${entity} record "${row.recordName}" — no matching host record`,
        })
        continue
      }
      const rowErrors: UploadErrorDetail[] = []
      const updates: Record<string, FieldValue> = {}
      for (const { def, raw } of row.cells) {
        const shaped =
          typeof raw === 'string' && def.mask ? applyMask(def.mask, raw) : raw
        const err = validateFieldValue(def, shaped)
        if (err) rowErrors.push({ row: row.row, fieldName: def.name, reason: err })
        else updates[def.id] = shaped
      }
      if (rowErrors.length) errors.push(...rowErrors)
      else commits.push({ recordId: row.record.id, updates })
    }

    // Commit: only rows that passed the dry-run land, versioned as changes.
    const versioned = recordsStore.importRecordValues(
      commits,
      entityFields,
      role
    )
    const failedRows = new Set(errors.map((e) => e.row)).size
    toast.success(
      `${file.name}: ${staged.length} rows staged — dry-run passed ${commits.length}, rejected ${failedRows}; ${versioned} value change${versioned === 1 ? '' : 's'} versioned`
    )
    return {
      state: errors.length ? (commits.length ? 'partial' : 'failed') : 'success',
      successCount: commits.length,
      failedCount: failedRows,
      errors,
    }
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
              onClick={() => setImportOpen(true)}
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

      <UploadModal
        open={importOpen}
        onOpenChange={setImportOpen}
        title={`Import ${entity} custom field values (CSV / XLS)`}
        onUpload={handleImport}
      />
    </div>
  )
}
