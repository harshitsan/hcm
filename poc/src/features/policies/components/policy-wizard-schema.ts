import { z } from 'zod'
import {
  OWNER_LEVELS,
  POLICY_CATEGORIES,
  POLICY_TYPES,
  WORKER_KIND_SCOPES,
  type PolicyScope,
} from '../data/policies'

/**
 * Full wizard schema. Steps validate their own field subset via
 * `form.trigger(WIZARD_STEP_FIELDS[step])` so Next is blocked until the
 * current step is complete (POL-26), and the effective window is validated
 * as a range (POL-24).
 */
export const wizardSchema = z
  .object({
    name: z.string().min(3, 'Policy name is required (min 3 characters)'),
    editionName: z
      .string()
      .min(3, 'Edition / version name is required, e.g. "Employee Manual 2026"'),
    type: z.enum(POLICY_TYPES),
    category: z.enum(POLICY_CATEGORIES, 'Select a category'),
    ownerLevel: z.enum(OWNER_LEVELS),
    ownerName: z.string().min(1, 'Select the owning company, group or portfolio'),
    content: z
      .string()
      .min(30, 'Policy content is required (min 30 characters)'),
    linkedModules: z.array(z.string()),
    workerKinds: z.enum(WORKER_KIND_SCOPES),
    companies: z.array(z.string()),
    groups: z.array(z.string()),
    jurisdictions: z.array(z.string()),
    locations: z.array(z.string()),
    departments: z.array(z.string()),
    employmentTypes: z.array(z.string()),
    positionLevels: z.array(z.string()),
    excludedPositionLevels: z.array(z.string()),
    effectiveFrom: z.string().min(1, 'Effective-from date is required'),
    effectiveTill: z.string(),
    changeNote: z.string().min(3, 'A change note is required for the version history'),
  })
  .superRefine((values, ctx) => {
    if (values.effectiveTill && values.effectiveTill < values.effectiveFrom) {
      ctx.addIssue({
        code: 'custom',
        path: ['effectiveTill'],
        message: 'Effective-till cannot be earlier than effective-from',
      })
    }
  })

export type WizardValues = z.infer<typeof wizardSchema>

export const WIZARD_STEPS = [
  'Policy details',
  'Applicability',
  'Exclusions',
  'Effective dating & document',
  'Review & save',
] as const

export const WIZARD_STEP_FIELDS: (keyof WizardValues)[][] = [
  ['name', 'editionName', 'type', 'category', 'ownerLevel', 'ownerName', 'content'],
  [
    'workerKinds',
    'companies',
    'groups',
    'jurisdictions',
    'locations',
    'departments',
    'employmentTypes',
    'positionLevels',
  ],
  ['excludedPositionLevels'],
  ['effectiveFrom', 'effectiveTill', 'changeNote'],
  [],
]

export function toScope(values: WizardValues): PolicyScope {
  return {
    companies: values.companies,
    groups: values.groups,
    jurisdictions: values.jurisdictions,
    locations: values.locations,
    departments: values.departments,
    employmentTypes: values.employmentTypes,
    workerKinds: values.workerKinds,
    positionLevels: values.positionLevels,
    excludedPositionLevels: values.excludedPositionLevels,
  }
}

const ACCEPTED_EXTENSIONS = ['pdf', 'docx', 'doc', 'txt']
const MAX_SIZE_KB = 5 * 1024

/** Reject unsupported or oversized policy document files (POL-25). */
export function validateFile(file: File): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!ACCEPTED_EXTENSIONS.includes(ext))
    return `Unsupported file type ".${ext}" — upload PDF, DOCX, DOC or TXT.`
  if (file.size > MAX_SIZE_KB * 1024)
    return 'File is larger than 5 MB — upload a smaller document.'
  return null
}

export const emptyWizardValues: WizardValues = {
  name: '',
  editionName: '',
  type: 'HR',
  category: 'Code of Conduct',
  ownerLevel: 'Company',
  ownerName: '',
  content: '',
  linkedModules: [],
  workerKinds: 'both',
  companies: [],
  groups: [],
  jurisdictions: [],
  locations: [],
  departments: [],
  employmentTypes: [],
  positionLevels: [],
  excludedPositionLevels: [],
  effectiveFrom: '',
  effectiveTill: '',
  changeNote: '',
}
