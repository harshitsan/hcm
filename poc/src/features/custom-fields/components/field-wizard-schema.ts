import { z } from 'zod'
import { type Role } from '@/context/role-context'
import {
  FIELD_SCOPES,
  FIELD_TYPES,
  SUPPORTED_ENTITIES,
  type FieldScope,
  type FieldType,
  type SupportedEntity,
} from '../data/custom-fields'

export const isSelectType = (type: FieldType) =>
  type === 'single-select' || type === 'multi-select'

export const parseOptions = (text: string) =>
  text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)

export const fieldWizardSchema = z
  .object({
    name: z.string().min(2, 'Field name is required'),
    entity: z.enum(SUPPORTED_ENTITIES),
    scope: z.enum(FIELD_SCOPES),
    description: z.string(),
    type: z.enum(FIELD_TYPES),
    /** One option per line for single-/multi-select lists. */
    optionsText: z.string(),
    lookupEntity: z.string(),
    required: z.boolean(),
    isDefault: z.boolean(),
    mask: z.string(),
    regex: z.string(),
    effectiveDate: z.string().min(1, 'Effective date is required'),
    permissions: z.object({
      hrView: z.boolean(),
      hrEdit: z.boolean(),
      managerView: z.boolean(),
      managerEdit: z.boolean(),
      employeeView: z.boolean(),
      employeeEdit: z.boolean(),
    }),
  })
  .superRefine((v, ctx) => {
    if (isSelectType(v.type) && parseOptions(v.optionsText).length < 2) {
      ctx.addIssue({
        code: 'custom',
        path: ['optionsText'],
        message: 'Define at least two options (one per line)',
      })
    }
    if (
      v.type === 'lookup' &&
      !SUPPORTED_ENTITIES.includes(v.lookupEntity as SupportedEntity)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['lookupEntity'],
        message: 'Choose the target entity this field references',
      })
    }
    if (v.regex) {
      try {
        new RegExp(v.regex)
      } catch {
        ctx.addIssue({
          code: 'custom',
          path: ['regex'],
          message: 'Invalid regular expression',
        })
      }
    }
  })

export type FieldWizardValues = z.infer<typeof fieldWizardSchema>

/** Which scope levels each admin role may create fields at. */
export function allowedScopesForRole(role: Role): FieldScope[] {
  switch (role) {
    case 'Platform Admin':
      return ['Platform']
    case 'Group Company Admin':
      return ['Group', 'Company']
    default:
      return ['Company']
  }
}

export const WIZARD_STEPS = [
  { title: 'Basics', fields: ['name', 'entity', 'scope', 'description'] },
  { title: 'Data type', fields: ['type', 'optionsText', 'lookupEntity'] },
  {
    title: 'Behaviors',
    fields: ['required', 'isDefault', 'mask', 'regex', 'effectiveDate'],
  },
  { title: 'Permissions', fields: ['permissions'] },
] as const
