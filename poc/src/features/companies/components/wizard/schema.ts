import { z } from 'zod'
import {
  REGISTRATION_TYPES,
  SUBSCRIPTION_TIERS,
} from '../../data/companies'

/**
 * COMP-FR-002/003/006 — wizard validation. Mandatory: Legal Name, Primary
 * Jurisdiction, Base Currency, Time Zone, Primary Contact Email.
 */
export const wizardSchema = z
  .object({
    // Step 1 — Basic Information
    legalName: z
      .string()
      .min(3, 'Legal name is required and must be 3-100 characters')
      .max(100, 'Legal name is required and must be 3-100 characters'),
    tradeName: z.string(),
    website: z.union([z.literal(''), z.url('Please enter a valid URL')]),
    // Step 2 — Legal Details
    registrationType: z.enum(REGISTRATION_TYPES),
    registrationNumber: z.string().min(1, 'Registration number is required'),
    incorporationDate: z.string(),
    // Step 3 — Contact Information
    primaryEmail: z.email('Please enter a valid email address'),
    primaryPhone: z.string(),
    primaryAddress: z.string().min(1, 'Primary address is required'),
    billingAddress: z.string(),
    // Step 4 — Operational Configuration
    primaryJurisdiction: z.string().min(1, 'Primary Jurisdiction is required'),
    secondaryJurisdiction: z.string(),
    baseCurrency: z.string().min(1, 'Base Currency is required'),
    timeZone: z.string().min(1, 'Time Zone is required'),
    subscriptionTier: z.enum(SUBSCRIPTION_TIERS),
    employeeLimit: z
      .string()
      .refine(
        (v) => /^\d+$/.test(v) && Number(v) > 0,
        'Employee limit must be greater than 0'
      ),
    // Step 5 — Administrative Setup
    adminEmail: z.union([
      z.literal(''),
      z.email('Please enter a valid email address'),
    ]),
  })
  .superRefine((vals, ctx) => {
    if (
      vals.registrationType === 'GST Number (India)' &&
      vals.registrationNumber.length > 0 &&
      vals.registrationNumber.length !== 15
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['registrationNumber'],
        message: 'GST number must be 15 characters',
      })
    }
  })

export type WizardValues = z.infer<typeof wizardSchema>

export const emptyWizardValues: WizardValues = {
  legalName: '',
  tradeName: '',
  website: '',
  registrationType: 'GST Number (India)',
  registrationNumber: '',
  incorporationDate: '',
  primaryEmail: '',
  primaryPhone: '',
  primaryAddress: '',
  billingAddress: '',
  primaryJurisdiction: '',
  secondaryJurisdiction: '',
  baseCurrency: '',
  timeZone: '',
  subscriptionTier: 'Basic',
  employeeLimit: '100',
  adminEmail: '',
}

export const WIZARD_STEPS = [
  'Basic Information',
  'Legal Details',
  'Contact Information',
  'Operational Configuration',
  'Administrative Setup',
  'Review & Confirm',
] as const

/** Fields validated when leaving each step (1-indexed by position). */
export const STEP_FIELDS: (keyof WizardValues)[][] = [
  ['legalName', 'tradeName', 'website'],
  ['registrationType', 'registrationNumber', 'incorporationDate'],
  ['primaryEmail', 'primaryPhone', 'primaryAddress', 'billingAddress'],
  [
    'primaryJurisdiction',
    'secondaryJurisdiction',
    'baseCurrency',
    'timeZone',
    'subscriptionTier',
    'employeeLimit',
  ],
  ['adminEmail'],
  [],
]
