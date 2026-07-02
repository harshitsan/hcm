import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import {
  BASE_CURRENCIES,
  LANGUAGES,
  OPERATING_MODELS,
  REGISTRATION_TYPES,
  SUBSCRIPTION_TIERS,
  TIME_ZONES,
  findExactNameDuplicate,
  findRegistrationDuplicate,
  primaryJurisdiction,
  type Company,
} from '../../data/companies'
import { type CompaniesStore } from '../../hooks/use-companies'
import { WizardSelectField, WizardTextField } from '../wizard/fields'

/** COMP-FR-002/006 — field-level validation rules on company master data. */
const profileSchema = z
  .object({
    legalName: z
      .string()
      .min(3, 'Legal name is required and must be 3-100 characters')
      .max(100, 'Legal name is required and must be 3-100 characters'),
    tradeName: z.string(),
    website: z.union([z.literal(''), z.url('Please enter a valid URL')]),
    registrationType: z.enum(REGISTRATION_TYPES),
    registrationNumber: z.string().min(1, 'Registration number is required'),
    primaryEmail: z.email('Please enter a valid email address'),
    primaryPhone: z.string(),
    primaryAddress: z.string().min(1, 'Primary address is required'),
    billingAddress: z.string(),
    baseCurrency: z.string().min(1, 'Base currency is required (ISO 4217)'),
    timeZone: z.string().min(1, 'Time zone is required (IANA)'),
    language: z.string().min(1, 'Language is required (ISO 639-1)'),
    operatingModel: z.enum(OPERATING_MODELS),
    logoUrl: z.union([z.literal(''), z.url('Please enter a valid URL')]),
    primaryColor: z.union([
      z.literal(''),
      z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, 'Primary color must be a hex code (#RRGGBB)'),
    ]),
    employeeLimit: z
      .string()
      .refine(
        (v) => /^\d+$/.test(v) && Number(v) > 0,
        'Employee limit must be greater than 0'
      ),
    subscriptionTier: z.enum(SUBSCRIPTION_TIERS),
    effectiveDate: z.string().min(1, 'Effective date is required'),
    changeReason: z.string(),
  })
  .superRefine((vals, ctx) => {
    if (
      vals.registrationType === 'GST Number (India)' &&
      vals.registrationNumber.length !== 15
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['registrationNumber'],
        message: 'GST number must be 15 characters',
      })
    }
  })

type ProfileValues = z.infer<typeof profileSchema>

interface ProfileTabProps {
  company: Company
  store: CompaniesStore
  /** §7.1 — full (Platform/own Company Admin), limited (Group/Portfolio), none. */
  editLevel: 'full' | 'limited' | 'none'
}

const CONTACT_FIELDS: (keyof ProfileValues)[] = [
  'primaryEmail',
  'primaryPhone',
  'primaryAddress',
  'billingAddress',
]

export function ProfileTab({ company, store, editLevel }: ProfileTabProps) {
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: toValues(company),
  })

  useEffect(() => {
    form.reset(toValues(company))
  }, [company, form])

  const frozen =
    company.status === 'suspended' ||
    company.status === 'inactive' ||
    company.status === 'archived'

  const canEdit = (field: keyof ProfileValues): boolean => {
    if (frozen || editLevel === 'none') return false
    if (editLevel === 'limited') return CONTACT_FIELDS.includes(field)
    if (field === 'baseCurrency') return !company.baseCurrencyLocked
    return true
  }

  const onSave = (values: ProfileValues) => {
    const dupName = findExactNameDuplicate(
      store.companies,
      values.legalName,
      company.id
    )
    if (dupName) {
      form.setError('legalName', {
        message: `COMP_001 (409 Conflict) — legal name already used by ${dupName.code}`,
      })
      return
    }
    const dupReg = findRegistrationDuplicate(
      store.companies,
      values.registrationNumber,
      primaryJurisdiction(company),
      company.id
    )
    if (dupReg) {
      form.setError('registrationNumber', {
        message: `COMP_006 (409 Conflict) — registration number already used by ${dupReg.code}`,
      })
      return
    }
    const result = store.updateCompany(
      company.id,
      {
        legalName: values.legalName,
        tradeName: values.tradeName,
        website: values.website,
        registrationType: values.registrationType,
        registrationNumber: values.registrationNumber,
        primaryEmail: values.primaryEmail,
        primaryPhone: values.primaryPhone,
        primaryAddress: values.primaryAddress,
        billingAddress: values.billingAddress,
        baseCurrency: values.baseCurrency,
        timeZone: values.timeZone,
        language: values.language,
        operatingModel: values.operatingModel,
        logoUrl: values.logoUrl || null,
        primaryColor: values.primaryColor || null,
        employeeLimit: Number(values.employeeLimit),
        subscriptionTier: values.subscriptionTier,
      },
      {
        effectiveDate: values.effectiveDate,
        reason: values.changeReason || undefined,
      }
    )
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success(
      `Profile saved — changes effective ${values.effectiveDate}; prior values retained in history`
    )
  }

  const control = form.control

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className='space-y-4'>
        {frozen && (
          <div className='bg-red-1300 text-red-1400 rounded-[6px] px-3 py-2 text-sm'>
            {company.status === 'suspended'
              ? 'COMP_004 (403 Forbidden) — this company is suspended; modifications are blocked.'
              : 'COMP_005 (409 Conflict) — this company is inactive/archived; modifications are blocked. Retained data stays available for retention purposes.'}
          </div>
        )}
        {editLevel === 'limited' && !frozen && (
          <div className='bg-blue-150 text-neutral-1600 rounded-[6px] px-3 py-2 text-sm'>
            Limited edit — your role can maintain contact information only;
            other fields are read-only per RBAC.
          </div>
        )}
        {editLevel === 'none' && !frozen && (
          <div className='bg-neutral-100 text-neutral-1600 rounded-[6px] px-3 py-2 text-sm'>
            Read-only — your role is not permitted to edit this company.
          </div>
        )}

        <div className='bg-blue-150 flex items-center justify-between rounded-[6px] px-3 py-2'>
          <span className='text-paragraph-sm text-neutral-1600'>
            Company Code (system-generated, non-editable)
          </span>
          <Badge variant='open'>{company.code}</Badge>
        </div>

        <p className='text-paragraph-sm text-neutral-1000 font-medium'>
          Business & legal
        </p>
        <div className='grid grid-cols-2 gap-4'>
          <WizardTextField control={control} name='legalName' label='Legal name *' disabled={!canEdit('legalName')} />
          <WizardTextField control={control} name='tradeName' label='Trade name' disabled={!canEdit('tradeName')} />
          <WizardTextField control={control} name='website' label='Website' disabled={!canEdit('website')} />
          <WizardSelectField control={control} name='operatingModel' label='Operating model' options={OPERATING_MODELS} disabled={!canEdit('operatingModel')} />
          <WizardSelectField control={control} name='registrationType' label='Registration type' options={REGISTRATION_TYPES} disabled={!canEdit('registrationType')} />
          <WizardTextField control={control} name='registrationNumber' label='Registration number (GSTN / EIN / CRN)' disabled={!canEdit('registrationNumber')} />
        </div>

        <p className='text-paragraph-sm text-neutral-1000 font-medium'>
          Contact information
        </p>
        <div className='grid grid-cols-2 gap-4'>
          <WizardTextField control={control} name='primaryEmail' label='Primary email *' type='email' disabled={!canEdit('primaryEmail')} />
          <WizardTextField control={control} name='primaryPhone' label='Primary phone' disabled={!canEdit('primaryPhone')} />
          <WizardTextField control={control} name='primaryAddress' label='Primary address *' disabled={!canEdit('primaryAddress')} />
          <WizardTextField control={control} name='billingAddress' label='Billing address' disabled={!canEdit('billingAddress')} />
        </div>

        <p className='text-paragraph-sm text-neutral-1000 font-medium'>
          Localization, branding & subscription
        </p>
        <div className='grid grid-cols-2 gap-4'>
          <WizardSelectField
            control={control}
            name='baseCurrency'
            label={
              company.baseCurrencyLocked
                ? 'Base currency (locked after first transaction)'
                : 'Base currency (ISO 4217) *'
            }
            options={BASE_CURRENCIES}
            disabled={!canEdit('baseCurrency')}
          />
          <WizardSelectField control={control} name='timeZone' label='Time zone (IANA) *' options={TIME_ZONES} disabled={!canEdit('timeZone')} />
          <WizardSelectField control={control} name='language' label='Language (ISO 639-1)' options={LANGUAGES} disabled={!canEdit('language')} />
          <WizardTextField control={control} name='primaryColor' label='Primary color (#RRGGBB)' placeholder='#1D4ED8' disabled={!canEdit('primaryColor')} />
          <WizardTextField control={control} name='logoUrl' label='Logo URL (optional)' placeholder='https://…/logo.png' disabled={!canEdit('logoUrl')} />
          <WizardSelectField control={control} name='subscriptionTier' label='Subscription tier' options={SUBSCRIPTION_TIERS} disabled={!canEdit('subscriptionTier')} />
          <WizardTextField control={control} name='employeeLimit' label='Employee limit (> 0)' disabled={!canEdit('employeeLimit')} />
        </div>

        <p className='text-paragraph-sm text-neutral-1000 font-medium'>
          Effective dating (bitemporal history)
        </p>
        <div className='grid grid-cols-2 gap-4'>
          <WizardTextField control={control} name='effectiveDate' label='Effective date *' type='date' disabled={frozen || editLevel === 'none'} />
          <WizardTextField control={control} name='changeReason' label='Change reason (audited)' placeholder='Why is this changing?' disabled={frozen || editLevel === 'none'} />
        </div>

        <div className='flex justify-end'>
          <Button type='submit' disabled={frozen || editLevel === 'none'}>
            Save changes
          </Button>
        </div>
      </form>
    </Form>
  )
}

function toValues(company: Company): ProfileValues {
  return {
    legalName: company.legalName,
    tradeName: company.tradeName,
    website: company.website,
    registrationType: company.registrationType,
    registrationNumber: company.registrationNumber,
    primaryEmail: company.primaryEmail,
    primaryPhone: company.primaryPhone,
    primaryAddress: company.primaryAddress,
    billingAddress: company.billingAddress,
    baseCurrency: company.baseCurrency,
    timeZone: company.timeZone,
    language: company.language,
    operatingModel: company.operatingModel,
    logoUrl: company.logoUrl ?? '',
    primaryColor: company.primaryColor ?? '',
    employeeLimit: String(company.employeeLimit),
    subscriptionTier: company.subscriptionTier,
    effectiveDate: new Date().toISOString().slice(0, 10),
    changeReason: '',
  }
}
