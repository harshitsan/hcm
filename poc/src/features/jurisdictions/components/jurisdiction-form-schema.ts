import { z } from 'zod'
import {
  JURISDICTION_STATUSES,
  JURISDICTION_TYPES,
  TAX_FEE_KINDS,
} from '../data/jurisdictions'

const taxFeeSchema = z.object({
  id: z.string(),
  name: z.string().min(2, 'Name the tax or fee'),
  kind: z.enum(TAX_FEE_KINDS),
  rate: z.string().min(1, 'Rate / amount is required'),
  appliesTo: z.string().min(1, 'Select what it applies to'),
})

export const jurisdictionFormSchema = z.object({
  name: z.string().min(2, 'Jurisdiction name is required'),
  code: z
    .string()
    .min(2, 'Code is required')
    .max(10, 'Keep codes short (≤10 chars)'),
  type: z.enum(JURISDICTION_TYPES),
  status: z.enum(JURISDICTION_STATUSES),
  effectiveFrom: z.string().min(1, 'Effective date is required'),
  taxFees: z.array(taxFeeSchema),
})

export type JurisdictionFormValues = z.infer<typeof jurisdictionFormSchema>

export const emptyJurisdictionDraft: JurisdictionFormValues = {
  name: '',
  code: '',
  type: 'Country',
  status: 'active',
  effectiveFrom: new Date().toISOString().slice(0, 10),
  taxFees: [],
}
