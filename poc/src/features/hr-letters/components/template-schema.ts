import { z } from 'zod'
import { ALL_DOC_KINDS, TEMPLATE_LAYOUTS } from '../data/hr-letters'

/**
 * Template editor validation (HLC-01/02/18): body must carry at least one
 * merge field so content is populated from source data, and every save needs
 * an effective date + change summary for configuration history.
 */
export const templateSchema = z.object({
  name: z.string().min(3, 'Template name is required'),
  docType: z.enum(ALL_DOC_KINDS),
  layout: z.enum(TEMPLATE_LAYOUTS),
  letterhead: z.boolean(),
  body: z
    .string()
    .min(20, 'Body text is required (min 20 characters)')
    .refine((val) => val.includes('{{'), {
      message:
        'Add at least one merge field so content is populated from source data',
    }),
  requiresApproval: z.boolean(),
  requiresAcknowledgment: z.boolean(),
  signingAuthority: z.string().min(1, 'Select a signing authority'),
  missingValueBehavior: z.enum(['blank', 'flagged']),
  effectiveFrom: z.string().min(1, 'Set the effective date'),
  changeSummary: z.string().min(3, 'Describe the change for configuration history'),
})

export type TemplateValues = z.infer<typeof templateSchema>
