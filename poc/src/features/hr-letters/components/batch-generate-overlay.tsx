import { useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { DataTable } from '@/components/common/data-table/table'
import { LongText } from '@/components/common/long-text'
import {
  EMPLOYEES,
  categoryOfDocType,
  type Employee,
  type LetterTemplate,
} from '../data/hr-letters'
import { resolveMergeFields } from '../data/merge-engine'

interface BatchRow {
  employee: Employee
  gaps: string[]
}

const batchColumns: ColumnDef<BatchRow>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllRowsSelected()}
        onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
        aria-label='Select all'
        variant='blue'
        onClick={(e) => e.stopPropagation()}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
        variant='blue'
        onClick={(e) => e.stopPropagation()}
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 50,
  },
  {
    id: 'employee',
    header: () => <span className='text-sm font-medium'>Employee</span>,
    cell: ({ row }) => (
      <div className='flex min-w-0 flex-col'>
        <LongText className='text-neutral-1600 font-medium'>
          {row.original.employee.name}
        </LongText>
        <span className='text-paragraph-sm text-neutral-1000 truncate'>
          {row.original.employee.department}
          {!row.original.employee.hasAppAccess ? ' · no app access' : ''}
        </span>
      </div>
    ),
    enableSorting: false,
  },
  {
    id: 'validation',
    header: () => <span className='text-sm font-medium'>Validation</span>,
    cell: ({ row }) => {
      const gaps = row.original.gaps
      if (gaps.length === 0) return <Badge variant='badge_active'>Ready</Badge>
      return (
        <div className='flex flex-col gap-1 py-1'>
          <Badge variant='dropped'>
            {gaps.length} gap{gaps.length > 1 ? 's' : ''}
          </Badge>
          <span className='text-neutral-1000 text-xs'>{gaps[0]}</span>
        </div>
      )
    },
    enableSorting: false,
  },
]

interface BatchGenerateOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templates: LetterTemplate[]
  onGenerate: (template: LetterTemplate, employeeIds: string[]) => void
}

/**
 * Batch generation (HLC-05): pick a template, multi-select employees, and
 * check the per-employee validation column — the merge engine marks each
 * person Ready or lists their gaps. Generate creates letters for everyone
 * Ready and skips the rest, summarised in one toast
 * ("8 generated, 2 skipped for missing data").
 */
export function BatchGenerateOverlay({
  open,
  onOpenChange,
  templates,
  onGenerate,
}: BatchGenerateOverlayProps) {
  const [templateId, setTemplateId] = useState('')
  const [selectedRows, setSelectedRows] = useState<BatchRow[]>([])
  const [resetSelectionKey, setResetSelectionKey] = useState(0)

  useEffect(() => {
    if (open) {
      setTemplateId('')
      setSelectedRows([])
      setResetSelectionKey((k) => k + 1)
    }
  }, [open])

  const template = templates.find((t) => t.id === templateId)

  const rows: BatchRow[] = useMemo(
    () =>
      EMPLOYEES.map((employee) => ({
        employee,
        gaps: template
          ? resolveMergeFields(template.body, employee.id).gaps
          : [],
      })),
    [template]
  )

  const readySelected = selectedRows.filter((r) => r.gaps.length === 0)
  const skippedSelected = selectedRows.filter((r) => r.gaps.length > 0)

  const handleTemplateChange = (id: string) => {
    setTemplateId(id)
    setSelectedRows([])
    setResetSelectionKey((k) => k + 1)
  }

  const handleGenerate = () => {
    if (!template) {
      toast.info('Pick a template first')
      return
    }
    if (selectedRows.length === 0) {
      toast.info('Select at least one employee')
      return
    }
    onGenerate(
      template,
      selectedRows.map((r) => r.employee.id)
    )
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[640px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            Batch generate letters
          </SheetTitle>
        </SheetHeader>

        <div className='flex-1 space-y-4 overflow-y-auto px-5 py-5'>
          <div className='space-y-1.5'>
            <p className='text-sm font-medium'>Template</p>
            <Select value={templateId} onValueChange={handleTemplateChange}>
              <SelectTrigger variant='secondary' className='w-full'>
                <SelectValue placeholder='e.g. Offer of Employment' />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {categoryOfDocType(t.docType)} · {t.docType} — {t.name} (v
                    {t.currentVersion})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {template ? (
            <>
              <div className='flex flex-wrap items-center gap-2'>
                <Badge variant='badge_active'>
                  {rows.filter((r) => r.gaps.length === 0).length} ready
                </Badge>
                <Badge variant='dropped'>
                  {rows.filter((r) => r.gaps.length > 0).length} with missing
                  data
                </Badge>
                <span className='text-neutral-1000 text-xs'>
                  Employees with gaps are skipped — their letters are never
                  generated with blank spaces.
                </span>
              </div>
              <DataTable
                columns={batchColumns}
                data={rows}
                variant='no-status'
                resetSelectionKey={resetSelectionKey}
                onSelectionChange={(selected) => setSelectedRows(selected)}
              />
            </>
          ) : (
            <p className='text-neutral-1000 text-sm'>
              Pick a template to check which employees are ready.
            </p>
          )}
        </div>

        <div className='border-gray-200 flex items-center justify-between gap-3 border-t px-5 py-4'>
          <p className='text-neutral-1000 text-xs'>
            {selectedRows.length > 0
              ? `${readySelected.length} will be generated${
                  skippedSelected.length > 0
                    ? `, ${skippedSelected.length} will be skipped for missing data`
                    : ''
                }`
              : 'Select employees to generate for'}
          </p>
          <div className='flex gap-2'>
            <Button variant='outline' onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              disabled={!template || selectedRows.length === 0}
              onClick={handleGenerate}
            >
              Generate {selectedRows.length > 0 ? `(${selectedRows.length})` : ''}
            </Button>
          </div>
        </div>
      </FloatingSheetContent>
    </Sheet>
  )
}
