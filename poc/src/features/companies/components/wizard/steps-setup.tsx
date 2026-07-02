import { type Control } from 'react-hook-form'
import { CheckCircle } from 'phosphor-react'
import {
  BASE_CURRENCIES,
  SUBSCRIPTION_TIERS,
  SUPPORTED_JURISDICTIONS,
  TIME_ZONES,
  UNSUPPORTED_JURISDICTIONS,
} from '../../data/companies'
import { WizardSelectField, WizardTextField } from './fields'
import { type WizardValues } from './schema'

const NONE = 'None'

/**
 * Step 4 — Operational Configuration. The jurisdiction list deliberately
 * includes unsupported entries to demo the COMP_002 rejection.
 */
export function StepOperationalConfig({
  control,
}: {
  control: Control<WizardValues>
}) {
  return (
    <div className='space-y-4'>
      <WizardSelectField
        control={control}
        name='primaryJurisdiction'
        label='Primary jurisdiction *'
        options={[...SUPPORTED_JURISDICTIONS, ...UNSUPPORTED_JURISDICTIONS]}
        placeholder='Select jurisdiction'
      />
      <WizardSelectField
        control={control}
        name='secondaryJurisdiction'
        label='Secondary jurisdiction (optional)'
        options={[NONE, ...SUPPORTED_JURISDICTIONS]}
        placeholder='None'
      />
      <div className='grid grid-cols-2 gap-4'>
        <WizardSelectField
          control={control}
          name='baseCurrency'
          label='Base currency (ISO 4217) *'
          options={BASE_CURRENCIES}
          placeholder='Select currency'
        />
        <WizardSelectField
          control={control}
          name='timeZone'
          label='Time zone (IANA) *'
          options={TIME_ZONES}
          placeholder='Select time zone'
        />
      </div>
      <div className='grid grid-cols-2 gap-4'>
        <WizardSelectField
          control={control}
          name='subscriptionTier'
          label='Subscription tier *'
          options={SUBSCRIPTION_TIERS}
        />
        <WizardTextField
          control={control}
          name='employeeLimit'
          label='Employee limit *'
          placeholder='100'
          hint='Must be greater than 0.'
        />
      </div>
    </div>
  )
}

/** Step 5 — Administrative Setup (initial company administrator). */
export function StepAdminSetup({
  control,
}: {
  control: Control<WizardValues>
}) {
  return (
    <div className='space-y-4'>
      <WizardTextField
        control={control}
        name='adminEmail'
        label='Initial company administrator email'
        type='email'
        placeholder='admin@acme.example'
        hint='If provided, a default Company Administrator user is created and a welcome email is sent. If left blank, the tenant is still provisioned with default policies.'
      />
    </div>
  )
}

const provisioningActions = [
  'Create the tenant database schema (isolated data space)',
  'Initialize default security policies',
  'Create the default company administrator + send welcome email (when provided)',
  'Log COMPANY_CREATED in the audit trail with creator and company data',
]

/** Step 6 — Review & Confirm, incl. the COMP-FR-004 provisioning checklist. */
export function StepReview({
  values,
  codePreview,
}: {
  values: WizardValues
  codePreview: string
}) {
  const rows: [string, string][] = [
    ['Company code', codePreview],
    ['Legal name', values.legalName || '—'],
    ['Trade name', values.tradeName || '—'],
    ['Website', values.website || '—'],
    ['Registration', `${values.registrationType}: ${values.registrationNumber || '—'}`],
    ['Incorporated', values.incorporationDate || '—'],
    ['Primary email', values.primaryEmail || '—'],
    ['Primary address', values.primaryAddress || '—'],
    [
      'Jurisdictions',
      [values.primaryJurisdiction, values.secondaryJurisdiction]
        .filter((j) => j && j !== NONE)
        .join(', ') || '—',
    ],
    ['Base currency / TZ', `${values.baseCurrency || '—'} · ${values.timeZone || '—'}`],
    [
      'Package',
      `${values.subscriptionTier} · up to ${values.employeeLimit} employees`,
    ],
    ['Initial administrator', values.adminEmail || 'Not set'],
  ]

  return (
    <div className='space-y-4'>
      <div className='rounded-[6px] border border-gray-200 bg-white'>
        {rows.map(([label, value]) => (
          <div
            key={label}
            className='flex items-start justify-between gap-4 border-b border-gray-100 px-3 py-2 text-sm last:border-b-0'
          >
            <span className='text-neutral-1000 shrink-0'>{label}</span>
            <span className='text-neutral-1600 text-right font-medium'>
              {value}
            </span>
          </div>
        ))}
      </div>
      <div className='bg-green-200 rounded-[6px] p-3'>
        <p className='text-paragraph-sm text-neutral-1600 mb-2 font-medium'>
          On confirm, provisioning runs automatically:
        </p>
        <ul className='space-y-1'>
          {provisioningActions.map((action) => (
            <li
              key={action}
              className='text-paragraph-sm text-neutral-1600 flex items-start gap-2'
            >
              <CheckCircle
                size={16}
                weight='fill'
                className='text-green-1300 mt-0.5 shrink-0'
              />
              {action}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
