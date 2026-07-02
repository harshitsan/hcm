/**
 * Organization (Head Office) + Localization settings — types, option lists
 * and seed data (Kensium: Organization > Head Office / Localization Settings).
 */

export const ORG_TYPES = [
  'Private Limited',
  'Public Limited',
  'LLP',
  'Partnership',
  'Sole Proprietorship',
] as const

export const INDUSTRY_TYPES = [
  'Retail & E-commerce',
  'Information Technology',
  'Manufacturing',
  'Logistics & Supply Chain',
  'Financial Services',
  'Healthcare',
] as const

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

export const PAYROLL_PERIODS = [
  'Monthly',
  'Semi-Monthly',
  'Bi-Weekly',
  'Weekly',
] as const

export const PAYROLL_OCCURRENCES = [
  'Last working day of the period',
  '1st of the following month',
  '7th of the following month',
  '25th of the month',
] as const

export interface HeadOfficeProfile {
  name: string
  orgType: (typeof ORG_TYPES)[number]
  industryType: (typeof INDUSTRY_TYPES)[number]
  incorporationDate: string
  prefix: string
  primaryLocationId: string
}

export interface PayrollSettings {
  fyStartMonth: (typeof MONTHS)[number]
  payrollPeriod: (typeof PAYROLL_PERIODS)[number]
  payrollOccurrence: (typeof PAYROLL_OCCURRENCES)[number]
  /** Shift the payroll date when it lands on a holiday or weekoff. */
  shiftOnHoliday: boolean
}

export interface RegisteredContact {
  address1: string
  address2: string
  city: string
  country: string
  state: string
  pinCode: string
  phone1: string
  phone2: string
  fax: string
  email: string
}

export interface Branding {
  /** Stored file name of the uploaded 220x40 login logo. */
  loginLogo: string | null
  /** Stored file name of the uploaded 151x47 home logo. */
  homeLogo: string | null
}

export const DOCUMENT_TYPES = [
  'PAN',
  'TAN',
  'ESI',
  'VAT',
  'PF Registration',
  'Incorporation Certificate',
] as const

export interface OrgDocument {
  id: string
  type: (typeof DOCUMENT_TYPES)[number]
  number: string
  effectiveFrom: string
  effectiveTill: string
}

export const seedHeadOffice: {
  profile: HeadOfficeProfile
  payroll: PayrollSettings
  contact: RegisteredContact
  branding: Branding
} = {
  profile: {
    name: 'Orion Retail India Pvt Ltd',
    orgType: 'Private Limited',
    industryType: 'Retail & E-commerce',
    incorporationDate: '2012-04-16',
    prefix: 'ORI',
    primaryLocationId: 'LOC-1001',
  },
  payroll: {
    fyStartMonth: 'April',
    payrollPeriod: 'Monthly',
    payrollOccurrence: 'Last working day of the period',
    shiftOnHoliday: true,
  },
  contact: {
    address1: '4th Floor, Prestige Tech Park',
    address2: 'Outer Ring Road, Kadubeesanahalli',
    city: 'Bengaluru',
    country: 'India',
    state: 'Karnataka',
    pinCode: '560103',
    phone1: '+91 80 4123 5500',
    phone2: '+91 80 4123 5510',
    fax: '',
    email: 'corporate@orionretail.in',
  },
  branding: {
    loginLogo: 'orion-login-220x40.png',
    homeLogo: null,
  },
}

export const seedDocuments: OrgDocument[] = [
  {
    id: 'DOC-01',
    type: 'PAN',
    number: 'AAECO4821F',
    effectiveFrom: '2012-04-16',
    effectiveTill: '2099-12-31',
  },
  {
    id: 'DOC-02',
    type: 'TAN',
    number: 'BLRO08814B',
    effectiveFrom: '2012-05-02',
    effectiveTill: '2099-12-31',
  },
  {
    id: 'DOC-03',
    type: 'ESI',
    number: '49-00-118844-000-1008',
    effectiveFrom: '2013-01-01',
    effectiveTill: '2026-03-31',
  },
  {
    id: 'DOC-04',
    type: 'VAT',
    number: '29841109226',
    effectiveFrom: '2013-06-01',
    effectiveTill: '2027-05-31',
  },
  {
    id: 'DOC-05',
    type: 'Incorporation Certificate',
    number: 'U52100KA2012PTC063412',
    effectiveFrom: '2012-04-16',
    effectiveTill: '2099-12-31',
  },
]

/* ------------------------------------------------------------------ */
/* Localization settings                                               */
/* ------------------------------------------------------------------ */

export const LOCALIZATION_COUNTRIES = [
  'India',
  'United States',
  'United Kingdom',
  'United Arab Emirates',
  'Australia',
] as const

export const DATE_FORMATS = [
  'DD MMM YYYY',
  'DD/MM/YYYY',
  'MM/DD/YYYY',
  'YYYY-MM-DD',
] as const
export type DateFormat = (typeof DATE_FORMATS)[number]

export interface CurrencyOption {
  id: string
  label: string
  symbol: string
  /** Sample rendering of 123456.5 in this currency's grouping. */
  sampleNumber: string
  /** Sample of the same amount in words. */
  sampleWords: string
}

export const CURRENCIES: CurrencyOption[] = [
  {
    id: 'inr',
    label: 'India — ₹ (INR)',
    symbol: '₹',
    sampleNumber: '₹1,23,456.50',
    sampleWords: 'Rupees one lakh twenty-three thousand four hundred fifty-six and fifty paise',
  },
  {
    id: 'usd',
    label: 'United States — $ (USD)',
    symbol: '$',
    sampleNumber: '$123,456.50',
    sampleWords: 'One hundred twenty-three thousand four hundred fifty-six dollars and fifty cents',
  },
  {
    id: 'gbp',
    label: 'United Kingdom — £ (GBP)',
    symbol: '£',
    sampleNumber: '£123,456.50',
    sampleWords: 'One hundred twenty-three thousand four hundred fifty-six pounds and fifty pence',
  },
  {
    id: 'aed',
    label: 'UAE — د.إ (AED)',
    symbol: 'د.إ',
    sampleNumber: 'د.إ123,456.50',
    sampleWords: 'One hundred twenty-three thousand four hundred fifty-six dirhams and fifty fils',
  },
]

export const DISTANCE_UNITS = ['Kilometres', 'Miles'] as const

export interface PinCodeFormat {
  id: string
  label: string
  /** Regex source the pin code must fully match. */
  pattern: string
  hint: string
}

export const PIN_CODE_FORMATS: PinCodeFormat[] = [
  { id: 'in-6', label: '6 digits (India)', pattern: '^\\d{6}$', hint: 'e.g. 560103' },
  { id: 'us-5', label: '5 digits (US ZIP)', pattern: '^\\d{5}$', hint: 'e.g. 73301' },
  { id: 'us-9', label: 'ZIP+4 (US)', pattern: '^\\d{5}-\\d{4}$', hint: 'e.g. 73301-0001' },
  {
    id: 'uk',
    label: 'UK postcode',
    pattern: '^[A-Za-z]{1,2}\\d[A-Za-z\\d]? ?\\d[A-Za-z]{2}$',
    hint: 'e.g. EC2R 8EJ',
  },
  { id: 'any', label: 'Free text (3–10 characters)', pattern: '^.{3,10}$', hint: 'Any 3–10 characters' },
]

export interface LocalizationSettings {
  country: (typeof LOCALIZATION_COUNTRIES)[number]
  dateFormat: DateFormat
  currencyId: string
  distanceUnit: (typeof DISTANCE_UNITS)[number]
  pinCodeFormatId: string
}

export const seedLocalization: LocalizationSettings = {
  country: 'India',
  dateFormat: 'DD MMM YYYY',
  currencyId: 'inr',
  distanceUnit: 'Kilometres',
  pinCodeFormatId: 'in-6',
}
