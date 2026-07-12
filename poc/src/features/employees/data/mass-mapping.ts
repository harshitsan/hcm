/**
 * Mass update (W10) — data mapping for bulk operations.
 *
 * A bulk file never arrives with column names that match the employee record,
 * so the import flow adds a mapping step: pick a mock source file, map each
 * source column onto an employee target field (with auto-match suggestions),
 * preview the mapped rows with per-cell validation, then apply.
 *
 * Everything here is mock data + pure helpers; saved mapping templates live
 * in a module-level store so they survive across dialog opens (reset on
 * reload — no backend in the POC).
 */
import {
  DEPARTMENTS,
  getStatutory,
  LOCATIONS,
  POSITION_LEVELS,
  type Employee,
} from './employees'

/* ------------------------------------------------------------------ */
/* Mock source files                                                    */
/* ------------------------------------------------------------------ */

export interface MockSourceFile {
  id: string
  /** Display name, e.g. 'e.g. hr_upload_june.csv'. */
  name: string
  description: string
  columns: string[]
  /** Raw cell values, one array per row, aligned with `columns`. */
  rows: string[][]
}

export const MOCK_SOURCE_FILES: MockSourceFile[] = [
  {
    id: 'src-hr-june',
    name: 'e.g. hr_upload_june.csv',
    description: 'Monthly HR master upload — 6 columns, 6 rows',
    columns: ['EMP_CODE', 'FULL_NAME', 'DEPT', 'GRADE', 'PF_FLAG', 'CTC_ANNUAL'],
    rows: [
      ['AUR-0101', 'Ananya Krishnan', 'Human Resources', 'L4 — Manager', 'Y', '₹24,00,000'],
      ['AUR-0144', 'Vikram Shetty', 'Operations', 'L5 — Director', 'Y', '₹42,50,000'],
      ['AUR-0210', 'Rohit Menon', 'Engineering', 'L3 — Lead', 'Y', '₹19,20,000'],
      ['AUR-0318', 'Grace D’Souza', 'Human Resorces', 'L1 — Associate', 'N', '₹3,60,000'],
      ['AUR-0301', 'Tarun Bhalla', 'Sales', 'L2 — Senior', 'N', '₹11,00,000'],
      ['AUR-9999', 'Priya Nair', 'Finance', 'L2 — Senior', 'Y', '₹8,00,000'],
    ],
  },
  {
    id: 'src-transfers-q2',
    name: 'e.g. location_transfers_q2.xlsx',
    description: 'Quarterly location transfer sheet — 5 columns, 5 rows',
    columns: ['EMPLOYEE_ID', 'EMP_NAME', 'NEW_LOCATION', 'EFFECTIVE_DATE', 'REMARKS'],
    rows: [
      ['AUR-0101', 'Ananya Krishnan', 'Bengaluru HQ', '2026-08-01', 'Returning from rotation'],
      ['AUR-0210', 'Rohit Menon', 'Hyderabad Hub', '2026-08-01', 'Project move'],
      ['AUR-0144', 'Vikram Shetty', 'Mumbai Office', '01-08-2026', 'Quarterly rotation'],
      ['AUR-0318', 'Grace D’Souza', 'Pune Plant', '2026-08-15', 'Training stint'],
      ['AUR-0301', 'Tarun Bhalla', 'Chennai Office', '2026-08-01', ''],
    ],
  },
]

/* ------------------------------------------------------------------ */
/* Target fields                                                        */
/* ------------------------------------------------------------------ */

export type MappingTargetId =
  | 'code'
  | 'name'
  | 'department'
  | 'positionLevel'
  | 'location'
  | 'pfEligible'
  | 'effectiveDate'
  | 'notes'
  | 'annualCtc'
  | 'fixedPay'
  | 'lastRevisedOn'

export interface MappingTarget {
  id: MappingTargetId
  label: string
  /** Type/format awareness — drives the per-cell validation in the preview. */
  kind: 'text' | 'option' | 'flag' | 'date'
  options?: readonly string[]
  /** The row key — identifies which employee record each row updates. */
  isRowKey?: boolean
  /** Comp-dark — only Company Admin / Platform Admin may map onto these. */
  compensation?: boolean
  hint: string
}

export const MAPPING_TARGETS: MappingTarget[] = [
  {
    id: 'code',
    label: 'Employee code (row key)',
    kind: 'text',
    isRowKey: true,
    hint: 'Must match an existing employee code in your scope',
  },
  { id: 'name', label: 'Name', kind: 'text', hint: 'Free text' },
  {
    id: 'department',
    label: 'Department',
    kind: 'option',
    options: DEPARTMENTS,
    hint: 'Must match a department from the catalog',
  },
  {
    id: 'positionLevel',
    label: 'Grade / position level',
    kind: 'option',
    options: POSITION_LEVELS,
    hint: 'Must match a position level from the catalog',
  },
  {
    id: 'location',
    label: 'Location',
    kind: 'option',
    options: LOCATIONS,
    hint: 'Must match a location from the catalog',
  },
  {
    id: 'pfEligible',
    label: 'PF eligible (flag)',
    kind: 'flag',
    hint: 'Y / N (also accepts Yes / No)',
  },
  {
    id: 'effectiveDate',
    label: 'Effective date',
    kind: 'date',
    hint: 'Date in YYYY-MM-DD format',
  },
  { id: 'notes', label: 'Notes / remarks', kind: 'text', hint: 'Free text' },
  {
    id: 'annualCtc',
    label: 'Annual CTC',
    kind: 'text',
    compensation: true,
    hint: 'Captured for reference only — never computed',
  },
  {
    id: 'fixedPay',
    label: 'Fixed pay',
    kind: 'text',
    compensation: true,
    hint: 'Captured for reference only — never computed',
  },
  {
    id: 'lastRevisedOn',
    label: 'Compensation last revised on',
    kind: 'date',
    compensation: true,
    hint: 'Date in YYYY-MM-DD format',
  },
]

export function mappingTarget(id: MappingTargetId): MappingTarget {
  return MAPPING_TARGETS.find((t) => t.id === id)!
}

/** A column-to-target choice per source column; '' means "not mapped". */
export type ColumnMapping = Record<string, MappingTargetId | ''>

/* ------------------------------------------------------------------ */
/* Auto-match suggestions                                               */
/* ------------------------------------------------------------------ */

const SUGGESTIONS: Record<string, MappingTargetId> = {
  EMPCODE: 'code',
  EMPLOYEEID: 'code',
  EMPID: 'code',
  FULLNAME: 'name',
  EMPNAME: 'name',
  NAME: 'name',
  DEPT: 'department',
  DEPARTMENT: 'department',
  GRADE: 'positionLevel',
  LEVEL: 'positionLevel',
  NEWLOCATION: 'location',
  LOCATION: 'location',
  PFFLAG: 'pfEligible',
  CTCANNUAL: 'annualCtc',
  ANNUALCTC: 'annualCtc',
  FIXEDPAY: 'fixedPay',
  EFFECTIVEDATE: 'effectiveDate',
  REMARKS: 'notes',
  NOTES: 'notes',
}

/**
 * Obvious source-column → target auto-match (EMP_CODE → Employee code,
 * FULL_NAME → Name, …), shown with a "Suggested" chip. Returns '' when the
 * column has no obvious counterpart.
 */
export function suggestTarget(column: string): MappingTargetId | '' {
  return SUGGESTIONS[column.replace(/[^A-Za-z0-9]/g, '').toUpperCase()] ?? ''
}

/** Default mapping for a source: every column set to its suggestion. */
export function suggestedMapping(
  source: MockSourceFile,
  includeCompensation: boolean
): ColumnMapping {
  const mapping: ColumnMapping = {}
  for (const column of source.columns) {
    const suggestion = suggestTarget(column)
    mapping[column] =
      suggestion && !includeCompensation && mappingTarget(suggestion).compensation
        ? ''
        : suggestion
  }
  return mapping
}

/* ------------------------------------------------------------------ */
/* Validation + mapped preview                                          */
/* ------------------------------------------------------------------ */

const FLAG_VALUES = ['Y', 'N', 'YES', 'NO', 'TRUE', 'FALSE']
const TRUTHY_FLAGS = ['Y', 'YES', 'TRUE']

/** Per-cell type/format validation; null when the value is acceptable. */
export function validateMappedValue(
  target: MappingTarget,
  value: string,
  employees: Employee[]
): string | null {
  const trimmed = value.trim()
  if (target.isRowKey) {
    if (!trimmed) return 'Employee code is blank'
    return employees.some((e) => e.code === trimmed)
      ? null
      : `No employee record with code “${trimmed}” in your scope`
  }
  if (!trimmed) return null // blank cells are simply skipped
  switch (target.kind) {
    case 'option':
      return target.options?.includes(trimmed)
        ? null
        : `Unknown ${target.label.toLowerCase()} — not in the catalog`
    case 'date':
      return /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
        ? null
        : 'Invalid date — expected YYYY-MM-DD'
    case 'flag':
      return FLAG_VALUES.includes(trimmed.toUpperCase())
        ? null
        : 'Invalid flag — expected Y or N'
    default:
      return null
  }
}

export interface MappedCell {
  column: string
  targetId: MappingTargetId | ''
  value: string
  issue: string | null
}

export interface MappedPreviewRow {
  index: number
  /** Value of the row-key column (the employee code from the file). */
  rowKey: string
  employeeId: string | null
  employeeName: string | null
  cells: MappedCell[]
  issues: string[]
  valid: boolean
}

/**
 * The source rows AFTER mapping — one cell per source column with its target
 * and validation flag. A row is valid only when its row key resolves to a
 * record and every mapped cell passes validation.
 */
export function buildMappedPreview(
  source: MockSourceFile,
  mapping: ColumnMapping,
  employees: Employee[]
): MappedPreviewRow[] {
  return source.rows.map((raw, index) => {
    let rowKey = ''
    const cells: MappedCell[] = source.columns.map((column, c) => {
      const targetId = mapping[column] ?? ''
      const value = raw[c] ?? ''
      if (!targetId) return { column, targetId, value, issue: null }
      const target = mappingTarget(targetId)
      if (target.isRowKey) rowKey = value.trim()
      return {
        column,
        targetId,
        value,
        issue: validateMappedValue(target, value, employees),
      }
    })
    const match = employees.find((e) => e.code === rowKey)
    const issues = cells.flatMap((cell) => (cell.issue ? [cell.issue] : []))
    return {
      index,
      rowKey,
      employeeId: match?.id ?? null,
      employeeName: match?.name ?? null,
      cells,
      issues,
      valid: issues.length === 0 && match !== undefined,
    }
  })
}

/**
 * Applies one mapped value onto an employee record (pure). Fields without a
 * dedicated column land on `bulkFieldValues`, mirroring the guided mass
 * update; compensation values stay inside the comp-dark block.
 */
export function applyMappedValue(
  employee: Employee,
  targetId: MappingTargetId,
  value: string
): Employee {
  const trimmed = value.trim()
  if (!trimmed) return employee
  switch (targetId) {
    case 'code':
      return employee // row key — identifies the record, never written
    case 'name':
      return { ...employee, name: trimmed }
    case 'department':
      return { ...employee, departments: [trimmed] }
    case 'positionLevel':
      return { ...employee, positionLevel: trimmed }
    case 'location':
      return {
        ...employee,
        functionalLocation: trimmed,
        locations: [...new Set([...employee.locations, trimmed])],
      }
    case 'pfEligible':
      return {
        ...employee,
        statutory: {
          ...getStatutory(employee),
          pfEligible: TRUTHY_FLAGS.includes(trimmed.toUpperCase()),
        },
      }
    case 'effectiveDate':
      return {
        ...employee,
        bulkFieldValues: {
          ...(employee.bulkFieldValues ?? {}),
          'Effective date': trimmed,
        },
      }
    case 'notes':
      return {
        ...employee,
        bulkFieldValues: {
          ...(employee.bulkFieldValues ?? {}),
          'Import remarks': trimmed,
        },
      }
    case 'annualCtc':
      return {
        ...employee,
        compensation: { ...employee.compensation, annualCtc: trimmed },
      }
    case 'fixedPay':
      return {
        ...employee,
        compensation: { ...employee.compensation, fixedPay: trimmed },
      }
    case 'lastRevisedOn':
      return {
        ...employee,
        compensation: { ...employee.compensation, lastRevisedOn: trimmed },
      }
  }
}

/** 'EMP_CODE → Employee code (row key), FULL_NAME → Name, …' */
export function describeMapping(
  source: MockSourceFile,
  mapping: ColumnMapping
): Array<{ from: string; to: string }> {
  return source.columns
    .filter((column) => mapping[column])
    .map((column) => ({
      from: column,
      to: mappingTarget(mapping[column] as MappingTargetId).label,
    }))
}

/** Import-flow step titles, surfaced in the mass-update dialog header. */
export const IMPORT_STEP_TITLES = {
  source: 'Step 1: Pick source file',
  map: 'Step 2: Data mapping',
  preview: 'Step 3: Preview & validate',
  done: 'Completed',
} as const
export type ImportStep = keyof typeof IMPORT_STEP_TITLES

/* ------------------------------------------------------------------ */
/* Apply input (consumed by useEmployees().applyMappedImport)           */
/* ------------------------------------------------------------------ */

export interface MappedImportRow {
  rowKey: string
  employeeId: string | null
  valid: boolean
  issues: string[]
  /** Mapped, non-blank values of a valid row; empty for skipped rows. */
  assignments: Array<{ targetId: MappingTargetId; value: string }>
}

export interface MappedImportInput {
  sourceName: string
  mappingPairs: Array<{ from: string; to: string }>
  rows: MappedImportRow[]
}

/* ------------------------------------------------------------------ */
/* Saved mapping templates — module-level store                         */
/* ------------------------------------------------------------------ */

export interface MappingTemplate {
  id: string
  name: string
  sourceId: string
  mapping: ColumnMapping
  savedOn: string
}

let templates: MappingTemplate[] = [
  {
    id: 'mt-1',
    name: 'e.g. Monthly HR upload',
    sourceId: 'src-hr-june',
    mapping: {
      EMP_CODE: 'code',
      FULL_NAME: 'name',
      DEPT: 'department',
      GRADE: 'positionLevel',
      PF_FLAG: 'pfEligible',
      CTC_ANNUAL: 'annualCtc',
    },
    savedOn: '2026-06-30',
  },
]
const templateListeners = new Set<() => void>()

export function getMappingTemplates(): MappingTemplate[] {
  return templates
}

export function subscribeMappingTemplates(listener: () => void): () => void {
  templateListeners.add(listener)
  return () => templateListeners.delete(listener)
}

export function saveMappingTemplate(
  input: Omit<MappingTemplate, 'id' | 'savedOn'>
): MappingTemplate {
  const template: MappingTemplate = {
    ...input,
    id: `mt-${crypto.randomUUID().slice(0, 6)}`,
    savedOn: new Date().toISOString().slice(0, 10),
  }
  templates = [template, ...templates]
  templateListeners.forEach((l) => l())
  return template
}
