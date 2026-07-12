import { z } from 'zod'
import {
  DUPLICATE_HANDLING,
  FILE_FORMATS,
  FILE_TYPES,
  HEADER_FORMATS,
  PROCESS_TYPES,
  type FileFormat,
} from '../../data/catalog'
import { type ConfigVersion } from '../../data/config'

const EXT_BY_FORMAT: Record<FileFormat, string[]> = {
  CSV: ['.csv', '.txt'],
  XLS: ['.xls'],
  XLSX: ['.xlsx'],
  JSON: ['.json'],
}

const baseWizardSchema = z.object({
  entityId: z.string().min(1, 'Select what you want to import'),
  module: z.string().min(1, 'Select a function to set the module'),
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

export type WizardValues = z.infer<typeof baseWizardSchema>

/**
 * The wizard enforces whatever the latest published config version governs:
 * allowed formats and file-size/batch limits change the moment a new
 * version is published from the Admin tab — no code release (DM-17).
 */
export function buildWizardSchema(config: ConfigVersion) {
  return baseWizardSchema.superRefine((v, ctx) => {
    if (v.fileType !== 'Xml' && !config.formats.includes(v.format)) {
      ctx.addIssue({
        code: 'custom',
        path: ['format'],
        message: `${v.format} is not allowed by config v${config.version} — governed formats: ${config.formats.join(', ')}`,
      })
    }

    const size = Number(v.fileSizeMb)
    if (!Number.isFinite(size) || size <= 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['fileSizeMb'],
        message: 'Enter a valid file size in MB',
      })
    } else if (size > config.maxFileSizeMb) {
      ctx.addIssue({
        code: 'custom',
        path: ['fileSizeMb'],
        message: `Rejected: config v${config.version} caps file size at ${config.maxFileSizeMb} MB`,
      })
    }

    const records = Number(v.totalRecords)
    if (!Number.isInteger(records) || records <= 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['totalRecords'],
        message: 'Enter a valid whole-number record count',
      })
    } else if (records > config.maxBatchRecords) {
      ctx.addIssue({
        code: 'custom',
        path: ['totalRecords'],
        message: `Rejected: config v${config.version} caps batches at ${config.maxBatchRecords.toLocaleString()} records — split into multiple batches`,
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
        message: `Unsupported file for ${v.fileType === 'Xml' ? 'Xml' : v.format}. Governed formats (config v${config.version}): ${config.formats.join(', ')} (Xml file type expects .xml)`,
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
}

export const wizardDefaults: WizardValues = {
  entityId: '',
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
  [
    'entityId',
    'module',
    'functionId',
    'companyId',
    'mappingMode',
    'savedMappingId',
  ],
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
