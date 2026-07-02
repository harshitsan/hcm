import { z } from 'zod'
import {
  DUPLICATE_HANDLING,
  FILE_FORMATS,
  FILE_TYPES,
  HEADER_FORMATS,
  MAX_BATCH_RECORDS,
  MAX_FILE_SIZE_MB,
  PROCESS_TYPES,
  type FileFormat,
} from '../../data/catalog'

const EXT_BY_FORMAT: Record<FileFormat, string[]> = {
  CSV: ['.csv', '.txt'],
  XLS: ['.xls'],
  XLSX: ['.xlsx'],
  JSON: ['.json'],
}

export const wizardSchema = z
  .object({
    module: z.string().min(1, 'Select a module'),
    functionId: z.string().min(1, 'Select a function'),
    companyId: z.string().min(1, 'Select the company context'),
    mappingMode: z.enum(['new', 'saved']),
    savedMappingId: z.string(),
    fileType: z.enum(FILE_TYPES),
    format: z.enum(FILE_FORMATS),
    fileName: z.string().min(1, 'Choose the data file to import'),
    fileSizeMb: z.string().min(1, 'Enter the file size in MB'),
    totalRecords: z.string().min(1, 'Enter the record count'),
    delimiter: z.string(),
    textQualifier: z.string(),
    headerFormat: z.enum(HEADER_FORMATS),
    documentsZip: z.string(),
    duplicateHandling: z.enum(DUPLICATE_HANDLING),
    processType: z.enum(PROCESS_TYPES),
    staging: z.boolean(),
    preserveEffectiveDates: z.boolean(),
    numberSeriesMode: z.enum(['auto', 'mapped']),
    saveMapping: z.boolean(),
    mappingName: z.string(),
  })
  .superRefine((v, ctx) => {
    const size = Number(v.fileSizeMb)
    if (!Number.isFinite(size) || size <= 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['fileSizeMb'],
        message: 'Enter a valid file size in MB',
      })
    } else if (size > MAX_FILE_SIZE_MB) {
      ctx.addIssue({
        code: 'custom',
        path: ['fileSizeMb'],
        message: `Rejected: maximum file size is ${MAX_FILE_SIZE_MB} MB`,
      })
    }

    const records = Number(v.totalRecords)
    if (!Number.isInteger(records) || records <= 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['totalRecords'],
        message: 'Enter a valid whole-number record count',
      })
    } else if (records > MAX_BATCH_RECORDS) {
      ctx.addIssue({
        code: 'custom',
        path: ['totalRecords'],
        message: `Rejected: maximum ${MAX_BATCH_RECORDS.toLocaleString()} records per batch — split into multiple batches`,
      })
    }

    const allowedExts =
      v.fileType === 'Xml' ? ['.xml'] : EXT_BY_FORMAT[v.format]
    if (
      v.fileName &&
      !allowedExts.some((ext) => v.fileName.toLowerCase().endsWith(ext))
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['fileName'],
        message: `Unsupported file for ${v.fileType === 'Xml' ? 'Xml' : v.format}. Supported formats: CSV, XLS, XLSX, JSON (Xml file type expects .xml)`,
      })
    }

    if (v.documentsZip && !v.documentsZip.toLowerCase().endsWith('.zip')) {
      ctx.addIssue({
        code: 'custom',
        path: ['documentsZip'],
        message: 'Supporting documents must be a .zip archive',
      })
    }

    if (v.saveMapping && v.mappingName.trim().length < 3) {
      ctx.addIssue({
        code: 'custom',
        path: ['mappingName'],
        message: 'Name the mapping so it can be reused (min 3 characters)',
      })
    }

    if (v.mappingMode === 'saved' && !v.savedMappingId) {
      ctx.addIssue({
        code: 'custom',
        path: ['savedMappingId'],
        message: 'Pick a saved mapping to reuse',
      })
    }
  })

export type WizardValues = z.infer<typeof wizardSchema>

export const wizardDefaults: WizardValues = {
  module: '',
  functionId: '',
  companyId: '',
  mappingMode: 'new',
  savedMappingId: '',
  fileType: 'Flat file',
  format: 'CSV',
  fileName: '',
  fileSizeMb: '',
  totalRecords: '',
  delimiter: 'Comma (,)',
  textQualifier: 'Double quote (")',
  headerFormat: 'First row',
  documentsZip: '',
  duplicateHandling: 'Ignore duplicates',
  processType: 'All valid records',
  staging: true,
  preserveEffectiveDates: true,
  numberSeriesMode: 'auto',
  saveMapping: false,
  mappingName: '',
}

export const WIZARD_STEPS = [
  'Routing',
  'File',
  'Options',
  'Mapping',
  'Review & Validate',
] as const

/** Fields validated when leaving each step. */
export const STEP_FIELDS: (keyof WizardValues)[][] = [
  ['module', 'functionId', 'companyId', 'mappingMode', 'savedMappingId'],
  [
    'fileType',
    'format',
    'fileName',
    'fileSizeMb',
    'totalRecords',
    'delimiter',
    'textQualifier',
    'headerFormat',
    'documentsZip',
  ],
  ['duplicateHandling', 'processType', 'staging', 'preserveEffectiveDates'],
  ['saveMapping', 'mappingName'],
  [],
]

export function toSourceColumn(field: string): string {
  return field.toLowerCase().replace(/[^a-z0-9]+/g, '_')
}
