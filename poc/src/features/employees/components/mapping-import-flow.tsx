import { useMemo, useState, useSyncExternalStore } from 'react'
import { ArrowRight, CheckCircle, WarningCircle } from 'phosphor-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
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
import { cn } from '@/utils/helpers'
import type { Employee } from '../data/employees'
import {
  buildMappedPreview,
  describeMapping,
  getMappingTemplates,
  IMPORT_STEP_TITLES,
  MAPPING_TARGETS,
  mappingTarget,
  MOCK_SOURCE_FILES,
  saveMappingTemplate,
  subscribeMappingTemplates,
  suggestedMapping,
  suggestTarget,
  type ColumnMapping,
  type ImportStep,
  type MappedImportInput,
  type MappedImportRow,
  type MappingTargetId,
} from '../data/mass-mapping'

const NOT_MAPPED = 'none'

interface DoneRow {
  rowKey: string
  employeeName: string | null
  applied: boolean
  note: string
}

interface MappingImportFlowProps {
  employees: Employee[]
  onApply: (input: MappedImportInput) => void
  /** Back from step 1 — returns to the mode chooser. */
  onBack: () => void
  onClose: () => void
  onStepChange?: (title: string) => void
}

/**
 * W10 — bulk import with a data-mapping step: pick a mock source file (or a
 * saved mapping template), map source columns onto employee target fields
 * (auto-match suggestions, comp-dark gating), preview the mapped rows with
 * per-cell validation flags, then apply the valid rows to the store.
 */
export function MappingImportFlow({
  employees,
  onApply,
  onBack,
  onClose,
  onStepChange,
}: MappingImportFlowProps) {
  const { hasRole } = useRole()
  // Comp-dark: compensation targets exist only for HR administrators.
  const canMapCompensation = hasRole('Company Admin', 'Platform Admin')

  const [step, setStepState] = useState<ImportStep>('source')
  const [sourceId, setSourceId] = useState('')
  const [templateId, setTemplateId] = useState(NOT_MAPPED)
  const [mapping, setMapping] = useState<ColumnMapping>({})
  const [templateName, setTemplateName] = useState('')
  const [doneRows, setDoneRows] = useState<DoneRow[]>([])

  const setStep = (next: ImportStep) => {
    setStepState(next)
    onStepChange?.(IMPORT_STEP_TITLES[next])
  }

  const templates = useSyncExternalStore(
    subscribeMappingTemplates,
    getMappingTemplates
  )

  const source = MOCK_SOURCE_FILES.find((s) => s.id === sourceId)
  const sourceTemplates = templates.filter((t) => t.sourceId === sourceId)

  const visibleTargets = MAPPING_TARGETS.filter(
    (t) => !t.compensation || canMapCompensation
  )

  const rowKeyMapped = Object.values(mapping).includes('code')

  const preview = useMemo(
    () => (source ? buildMappedPreview(source, mapping, employees) : []),
    [source, mapping, employees]
  )
  const validRows = preview.filter((r) => r.valid)

  /** Entering the mapping step — prefill from the template or auto-match. */
  const startMapping = () => {
    if (!source) return
    const template = sourceTemplates.find((t) => t.id === templateId)
    if (template) {
      // Comp-dark: a template saved by an HR admin may map compensation
      // targets — strip those for roles that cannot see them.
      const next: ColumnMapping = {}
      for (const column of source.columns) {
        const targetId = template.mapping[column] ?? ''
        next[column] =
          targetId && !canMapCompensation && mappingTarget(targetId).compensation
            ? ''
            : targetId
      }
      setMapping(next)
    } else {
      setMapping(suggestedMapping(source, canMapCompensation))
    }
    setStep('map')
  }

  const saveTemplate = () => {
    if (!source || !templateName.trim()) return
    const saved = saveMappingTemplate({
      name: templateName.trim(),
      sourceId: source.id,
      mapping,
    })
    setTemplateName('')
    toast.success(
      `Mapping template “${saved.name}” saved — pick it the next time you import this file`
    )
  }

  const apply = () => {
    if (!source) return
    const rows: MappedImportRow[] = preview.map((r) => ({
      rowKey: r.rowKey,
      employeeId: r.employeeId,
      valid: r.valid,
      issues: r.issues,
      assignments: r.valid
        ? r.cells
            .filter(
              (c) => c.targetId && c.targetId !== 'code' && c.value.trim()
            )
            .map((c) => ({
              targetId: c.targetId as MappingTargetId,
              value: c.value,
            }))
        : [],
    }))
    onApply({
      sourceName: source.name,
      mappingPairs: describeMapping(source, mapping),
      rows,
    })
    setDoneRows(
      preview.map((r) => ({
        rowKey: r.rowKey || '(blank)',
        employeeName: r.employeeName,
        applied: r.valid,
        note: r.valid
          ? `${r.cells.filter((c) => c.targetId && c.targetId !== 'code' && c.value.trim()).length} field(s) updated`
          : r.issues.join('; ') || 'Row skipped',
      }))
    )
    setStep('done')
  }

  /* ------------------------------------------------------------------ */

  if (step === 'source') {
    return (
      <>
        <div className='space-y-4'>
          <p className='text-paragraph-sm text-neutral-1000'>
            Bulk files rarely use the same column names as the employee record.
            Pick the source file, then map its columns onto employee fields
            before anything is applied.
          </p>
          <div className='space-y-1'>
            <Label>Source file (mock upload)</Label>
            <Select
              value={sourceId || undefined}
              onValueChange={(v) => {
                setSourceId(v)
                setTemplateId(NOT_MAPPED)
              }}
            >
              <SelectTrigger variant='secondary' className='w-full'>
                <SelectValue placeholder='Select a source file' />
              </SelectTrigger>
              <SelectContent>
                {MOCK_SOURCE_FILES.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} — {s.columns.length} columns
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {source && (
            <div className='space-y-2 rounded-md border border-gray-200 px-3 py-2.5'>
              <p className='text-paragraph-sm text-neutral-1000'>
                {source.description}
              </p>
              <div className='flex flex-wrap gap-1.5'>
                {source.columns.map((c) => (
                  <span
                    key={c}
                    className='text-neutral-1600 rounded border border-gray-200 bg-neutral-100 px-1.5 py-0.5 font-mono text-xs'
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {source && (
            <div className='space-y-1'>
              <Label>Saved mapping template</Label>
              {sourceTemplates.length > 0 ? (
                <Select value={templateId} onValueChange={setTemplateId}>
                  <SelectTrigger variant='secondary' className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NOT_MAPPED}>
                      Start fresh — use auto-match suggestions
                    </SelectItem>
                    {sourceTemplates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} (saved {t.savedOn})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className='text-paragraph-sm text-neutral-1000'>
                  No saved templates for this source yet — the mapping starts
                  from auto-match suggestions, and you can save it as a
                  template on the next step.
                </p>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={onBack}>
            Back
          </Button>
          <Button onClick={startMapping} disabled={!source}>
            Next — map columns
          </Button>
        </DialogFooter>
      </>
    )
  }

  if (step === 'map' && source) {
    return (
      <>
        <div className='space-y-4'>
          <p className='text-paragraph-sm text-neutral-1000'>
            Map each source column onto an employee target field. Obvious
            matches are pre-selected and marked Suggested; columns left
            unmapped are ignored.
          </p>
          <div className='space-y-2'>
            {source.columns.map((column) => {
              const value = mapping[column] ?? ''
              const suggestion = suggestTarget(column)
              const isSuggested = value !== '' && value === suggestion
              const target = value ? mappingTarget(value) : null
              return (
                <div
                  key={column}
                  className='rounded-md border border-gray-200 px-3 py-2'
                >
                  <div className='grid grid-cols-[1fr_auto_1.4fr] items-center gap-2'>
                    <span className='text-neutral-1600 font-mono text-xs font-medium'>
                      {column}
                    </span>
                    <ArrowRight size={14} className='text-neutral-1000' />
                    <Select
                      value={value || NOT_MAPPED}
                      onValueChange={(v) =>
                        setMapping((prev) => ({
                          ...prev,
                          [column]:
                            v === NOT_MAPPED ? '' : (v as MappingTargetId),
                        }))
                      }
                    >
                      <SelectTrigger
                        variant='secondary'
                        className='w-full'
                        aria-label={`Target field for ${column}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NOT_MAPPED}>
                          Not mapped (ignore this column)
                        </SelectItem>
                        {visibleTargets.map((t) => {
                          const takenBy = source.columns.find(
                            (c) => c !== column && mapping[c] === t.id
                          )
                          return (
                            <SelectItem
                              key={t.id}
                              value={t.id}
                              disabled={Boolean(takenBy)}
                            >
                              {t.label}
                              {t.compensation ? ' (restricted)' : ''}
                              {takenBy ? ` — already mapped to ${takenBy}` : ''}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='mt-1 flex flex-wrap items-center gap-1.5'>
                    {isSuggested && <Badge variant='open'>Suggested</Badge>}
                    {target?.compensation && (
                      <Badge variant='overdue'>Restricted — HR admin only</Badge>
                    )}
                    {value === '' ? (
                      <span className='text-paragraph-sm text-neutral-1000'>
                        Not mapped — this column will be ignored
                      </span>
                    ) : (
                      <span className='text-paragraph-sm text-neutral-1000'>
                        {target?.hint}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {!rowKeyMapped && (
            <p className='text-red-1400 flex items-center gap-1.5 text-sm font-medium'>
              <WarningCircle size={16} weight='fill' />
              Map a source column to Employee code (row key) — it identifies
              which employee record each row updates.
            </p>
          )}

          <div className='space-y-1.5 rounded-md border border-gray-200 px-3 py-2.5'>
            <Label htmlFor='mapping-template-name'>
              Save this mapping as a template
            </Label>
            <div className='flex items-center gap-2'>
              <Input
                id='mapping-template-name'
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder='e.g. Monthly HR upload'
                className='h-8'
              />
              <Button
                variant='outline'
                size='sm'
                onClick={saveTemplate}
                disabled={!templateName.trim() || !rowKeyMapped}
              >
                Save template
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => setStep('source')}>
            Back
          </Button>
          <Button onClick={() => setStep('preview')} disabled={!rowKeyMapped}>
            Next — preview {source.rows.length} rows
          </Button>
        </DialogFooter>
      </>
    )
  }

  if (step === 'preview' && source) {
    const issueRows = preview.length - validRows.length
    return (
      <>
        <div className='space-y-3'>
          <div
            className={cn(
              'flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium',
              issueRows === 0
                ? 'border-green-200 bg-green-200 text-green-1300'
                : 'border-vanilla-400 bg-vanilla-400 text-vanilla-500'
            )}
          >
            {issueRows === 0 ? (
              <CheckCircle size={16} weight='fill' />
            ) : (
              <WarningCircle size={16} weight='fill' />
            )}
            {validRows.length} of {preview.length} rows valid
            {issueRows > 0 ? ` — ${issueRows} row(s) have issues` : ''}
          </div>
          <p className='text-paragraph-sm text-neutral-1000'>
            This is the file after mapping. Only valid rows are applied — rows
            with issues are skipped and listed in the completion summary.
          </p>
          <div className='max-h-80 overflow-auto rounded-md border border-gray-200'>
            <table className='w-full text-left text-sm'>
              <thead className='sticky top-0 bg-neutral-100'>
                <tr>
                  <th className='text-paragraph-sm text-neutral-1000 px-2 py-1.5 font-medium'>
                    Row
                  </th>
                  {source.columns.map((column) => {
                    const targetId = mapping[column]
                    return (
                      <th
                        key={column}
                        className='text-paragraph-sm text-neutral-1000 px-2 py-1.5 font-medium'
                      >
                        <span className='font-mono text-xs'>{column}</span>
                        <br />
                        <span
                          className={
                            targetId ? 'text-blue-1400' : 'text-neutral-1000'
                          }
                        >
                          {targetId
                            ? `→ ${mappingTarget(targetId).label}`
                            : 'ignored'}
                        </span>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {preview.map((row) => (
                  <tr key={row.index} className='border-t border-gray-100'>
                    <td className='px-2 py-1.5 align-top'>
                      <Badge variant={row.valid ? 'completed' : 'dropped'}>
                        {row.valid ? 'Valid' : 'Issue'}
                      </Badge>
                    </td>
                    {row.cells.map((cell) => (
                      <td
                        key={cell.column}
                        className={cn(
                          'px-2 py-1.5 align-top',
                          cell.targetId === '' && 'text-neutral-1000',
                          cell.issue && 'bg-red-1300'
                        )}
                      >
                        {cell.value || '—'}
                        {cell.issue && (
                          <p className='text-red-1400 mt-0.5 text-xs font-medium'>
                            {cell.issue}
                          </p>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => setStep('map')}>
            Back
          </Button>
          <Button onClick={apply} disabled={validRows.length === 0}>
            Apply to {validRows.length} valid row(s)
          </Button>
        </DialogFooter>
      </>
    )
  }

  if (step === 'done') {
    const applied = doneRows.filter((r) => r.applied).length
    return (
      <>
        <div className='space-y-3'>
          <div className='flex items-center gap-2 rounded-md border border-green-200 bg-green-200 px-3 py-2'>
            <CheckCircle size={16} weight='fill' className='text-green-1300' />
            <p className='text-green-1300 text-sm font-medium'>
              Mass update completed — {applied} row(s) applied,{' '}
              {doneRows.length - applied} skipped
            </p>
          </div>
          <div className='max-h-72 space-y-1.5 overflow-y-auto'>
            {doneRows.map((row, i) => (
              <div
                key={i}
                className='flex items-start justify-between gap-3 rounded-md border border-gray-200 px-3 py-2'
              >
                <div>
                  <p className='text-neutral-1600 text-sm font-medium'>
                    {row.rowKey}
                    {row.employeeName ? ` — ${row.employeeName}` : ''}
                  </p>
                  <p className='text-paragraph-sm text-neutral-1000'>
                    {row.note}
                  </p>
                </div>
                <Badge variant={row.applied ? 'completed' : 'dropped'}>
                  {row.applied ? 'Applied' : 'Skipped'}
                </Badge>
              </div>
            ))}
          </div>
          <p className='text-paragraph-sm text-neutral-1000'>
            The mapping (source → target pairs) and the applied/skipped counts
            were recorded on the audit trail.
          </p>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </>
    )
  }

  return null
}
