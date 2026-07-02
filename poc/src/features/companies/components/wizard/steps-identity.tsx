import { type Control } from 'react-hook-form'
import { Badge } from '@/components/ui/badge'
import { REGISTRATION_TYPES } from '../../data/companies'
import { WizardSelectField, WizardTextField } from './fields'
import { type WizardValues } from './schema'

/** Step 1 — Basic Information, with the COMP-{YYYY}-{NNNN} code preview. */
export function StepBasicInfo({
  control,
  codePreview,
}: {
  control: Control<WizardValues>
  codePreview: string
}) {
  return (
    <div className='space-y-4'>
      <div className='bg-blue-150 flex items-center justify-between rounded-[6px] px-3 py-2'>
        <span className='text-paragraph-sm text-neutral-1600'>
          Company Code (auto-generated, non-editable)
        </span>
        <Badge variant='open'>{codePreview}</Badge>
      </div>
      <WizardTextField
        control={control}
        name='legalName'
        label='Legal name *'
        placeholder='Acme Industries Private Limited'
        hint='3-100 characters; must be unique across the platform (COMP_001 on duplicate).'
      />
      <WizardTextField
        control={control}
        name='tradeName'
        label='Trade name'
        placeholder='Acme'
      />
      <WizardTextField
        control={control}
        name='website'
        label='Website'
        placeholder='https://acme.example'
      />
    </div>
  )
}

/** Step 2 — Legal Details (COMP-FR-003 registration identifier types). */
export function StepLegalDetails({
  control,
}: {
  control: Control<WizardValues>
}) {
  return (
    <div className='space-y-4'>
      <WizardSelectField
        control={control}
        name='registrationType'
        label='Registration identifier type *'
        options={REGISTRATION_TYPES}
      />
      <WizardTextField
        control={control}
        name='registrationNumber'
        label='Registration number *'
        placeholder='29AABCM9012D1Z4'
        hint='GST numbers must be exactly 15 characters. Duplicates within a jurisdiction are rejected with COMP_006.'
      />
      <WizardTextField
        control={control}
        name='incorporationDate'
        label='Incorporation date'
        type='date'
      />
    </div>
  )
}

/** Step 3 — Contact Information. */
export function StepContactInfo({
  control,
}: {
  control: Control<WizardValues>
}) {
  return (
    <div className='space-y-4'>
      <WizardTextField
        control={control}
        name='primaryEmail'
        label='Primary contact email *'
        type='email'
        placeholder='ops@acme.example'
      />
      <WizardTextField
        control={control}
        name='primaryPhone'
        label='Primary phone'
        placeholder='+91 80 0000 0000'
      />
      <WizardTextField
        control={control}
        name='primaryAddress'
        label='Primary address *'
        placeholder='Registered office address'
      />
      <WizardTextField
        control={control}
        name='billingAddress'
        label='Billing address'
        placeholder='Defaults to primary address if left blank'
      />
    </div>
  )
}
