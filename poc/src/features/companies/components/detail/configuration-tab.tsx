import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  MODULES,
  PLATFORM_DEFAULTS,
  type Company,
  type CompanyConfig,
  type ModuleName,
} from '../../data/companies'
import { type CompaniesStore } from '../../hooks/use-companies'
import { InheritanceBadge } from '../company-badges'

interface ConfigurationTabProps {
  company: Company
  store: CompaniesStore
  canEdit: boolean
  /** Modules included in the company's subscription package. */
  packageModules: ModuleName[]
}

type SelectableKey =
  | 'passwordPolicy'
  | 'sessionTimeoutMins'
  | 'dateFormat'
  | 'numberFormat'
  | 'currencyDisplay'
  | 'emailTemplate'
  | 'senderEmail'
  | 'approvalHierarchy'
  | 'slaHours'

interface SettingDef {
  key: SelectableKey
  label: string
  section: string
  options: string[]
}

const SETTINGS: SettingDef[] = [
  {
    key: 'passwordPolicy',
    label: 'Password policy',
    section: 'Security',
    options: [
      'Min 8 chars, 1 uppercase, 1 number',
      'Min 12 chars, 1 uppercase, 1 number, 1 symbol',
      'Min 16 chars, passphrase',
    ],
  },
  {
    key: 'sessionTimeoutMins',
    label: 'Session timeout (minutes)',
    section: 'Security',
    options: ['15', '30', '60', '120'],
  },
  {
    key: 'dateFormat',
    label: 'Date format',
    section: 'Localization',
    options: ['DD MMM YYYY', 'DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'],
  },
  {
    key: 'numberFormat',
    label: 'Number format',
    section: 'Localization',
    options: ['1,234,567.89', '12,34,567.89', '1.234.567,89'],
  },
  {
    key: 'currencyDisplay',
    label: 'Currency display',
    section: 'Localization',
    options: ['Symbol (₹, $, £)', 'Code (INR, USD, GBP)'],
  },
  {
    key: 'emailTemplate',
    label: 'Default email template',
    section: 'Notifications',
    options: ['SatelliteHR Standard', 'Company Branded', 'Plain Text'],
  },
  {
    key: 'senderEmail',
    label: 'Sender configuration',
    section: 'Notifications',
    options: [
      'no-reply@satellitehr.com',
      'hr@company-domain',
      'notifications@company-domain',
    ],
  },
  {
    key: 'approvalHierarchy',
    label: 'Default approval hierarchy',
    section: 'Workflow defaults',
    options: [
      'Manager → HR → Admin',
      'Manager → Admin',
      'HR → Admin',
      'Direct to Admin',
    ],
  },
  {
    key: 'slaHours',
    label: 'Approval SLA (hours)',
    section: 'Workflow defaults',
    options: ['24', '48', '72'],
  },
]

const AUTH_KEYS = ['saml', 'ad', 'o365', 'google', 'local'] as const
const AUTH_LABELS: Record<(typeof AUTH_KEYS)[number], string> = {
  saml: 'SAML',
  ad: 'Active Directory',
  o365: 'Office 365',
  google: 'Google',
  local: 'Local accounts',
}

/**
 * COMP-FR-014/015/016 — company-scoped governed configuration with
 * platform-default inheritance and per-company overrides.
 */
export function ConfigurationTab({
  company,
  store,
  canEdit,
  packageModules,
}: ConfigurationTabProps) {
  const config = company.config

  const resolved = (key: SelectableKey): string =>
    String(config[key] ?? PLATFORM_DEFAULTS[key])

  const setSetting = (def: SettingDef, value: string) => {
    const parsed: string | number =
      def.key === 'sessionTimeoutMins' || def.key === 'slaHours'
        ? Number(value)
        : value
    store.updateConfig(
      company.id,
      { [def.key]: parsed } as Partial<CompanyConfig>,
      `${def.label} overridden to "${value}"`
    )
  }

  const resetSetting = (def: SettingDef) => {
    store.updateConfig(
      company.id,
      { [def.key]: null } as Partial<CompanyConfig>,
      `${def.label} reset to inherited platform default`
    )
  }

  const authValues = config.authMethods ?? PLATFORM_DEFAULTS.authMethods
  const mfaValue = config.mfaRequired ?? PLATFORM_DEFAULTS.mfaRequired

  const sections = [...new Set(SETTINGS.map((s) => s.section))]

  return (
    <div className='space-y-4'>
      <div className='bg-blue-150 text-neutral-1600 rounded-[6px] px-3 py-2 text-sm'>
        Config v{config.version} · Changes are audit-logged, effective
        immediately (no future-dating in Phase I) and apply to new transactions
        only — past transactions keep the configuration in effect when they
        occurred. Departments inherit these values and may override where
        applicable. Everything here is scoped to {company.code} only.
      </div>

      {/* Authentication */}
      <p className='text-paragraph-sm text-neutral-1000 font-medium'>
        Authentication{' '}
        <InheritanceBadge overridden={config.authMethods !== null} />
      </p>
      <div className='grid grid-cols-2 gap-2 rounded-[6px] border border-gray-200 bg-white p-3 lg:grid-cols-3'>
        {AUTH_KEYS.map((k) => (
          <div key={k} className='flex items-center justify-between gap-2'>
            <span className='text-sm'>{AUTH_LABELS[k]}</span>
            <Switch
              checked={authValues[k]}
              disabled={!canEdit}
              onCheckedChange={(on) => {
                const next: NonNullable<CompanyConfig['authMethods']> = {
                  ...authValues,
                  [k]: on,
                }
                store.updateConfig(
                  company.id,
                  { authMethods: next },
                  `Auth method ${AUTH_LABELS[k]} ${on ? 'enabled' : 'disabled'}`
                )
              }}
            />
          </div>
        ))}
        <div className='flex items-center justify-between gap-2'>
          <span className='text-sm'>Require MFA</span>
          <Switch
            checked={mfaValue}
            disabled={!canEdit}
            onCheckedChange={(on) =>
              store.updateConfig(
                company.id,
                { mfaRequired: on },
                `MFA requirement overridden to ${on ? 'On' : 'Off'}`
              )
            }
          />
        </div>
      </div>

      {/* Overridable settings by section */}
      {sections.map((section) => (
        <div key={section} className='space-y-2'>
          <p className='text-paragraph-sm text-neutral-1000 font-medium'>
            {section}
          </p>
          <div className='rounded-[6px] border border-gray-200 bg-white'>
            {SETTINGS.filter((s) => s.section === section).map((def) => (
              <div
                key={def.key}
                className='flex items-center justify-between gap-3 border-b border-gray-100 px-3 py-2 last:border-b-0'
              >
                <div className='flex items-center gap-2'>
                  <span className='text-sm'>{def.label}</span>
                  <InheritanceBadge overridden={config[def.key] !== null} />
                </div>
                <div className='flex items-center gap-2'>
                  <Select
                    value={resolved(def.key)}
                    onValueChange={(v) => setSetting(def, v)}
                    disabled={!canEdit}
                  >
                    <SelectTrigger variant='secondary' className='w-[240px]'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {def.options.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {config[def.key] !== null && canEdit && (
                    <Button
                      type='button'
                      variant='outline'
                      className='h-7 px-2 text-xs'
                      onClick={() => resetSetting(def)}
                    >
                      Reset
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Subscribed modules — versioned per-tenant config */}
      <p className='text-paragraph-sm text-neutral-1000 font-medium'>
        Subscribed modules{' '}
        <Badge variant='open'>
          v{config.modulesVersion} · effective {config.modulesEffectiveDate}
        </Badge>
      </p>
      <div className='grid grid-cols-2 gap-2 rounded-[6px] border border-gray-200 bg-white p-3 lg:grid-cols-4'>
        {MODULES.map((module) => {
          const inPackage = packageModules.includes(module)
          return (
            <div
              key={module}
              className='flex items-center justify-between gap-2'
            >
              <div className='flex min-w-0 flex-col'>
                <span className='truncate text-sm'>{module}</span>
                {!inPackage && (
                  <span className='text-neutral-1000 text-xs'>
                    Not in package
                  </span>
                )}
              </div>
              <Switch
                checked={config.modules[module] && inPackage}
                disabled={!canEdit || !inPackage}
                onCheckedChange={() => store.toggleModule(company.id, module)}
              />
            </div>
          )
        })}
      </div>
      <p className='text-paragraph-sm text-neutral-1000'>
        Module toggles are stored as versioned, effective-dated per-tenant
        configuration — changes apply at runtime without a code deployment, and
        prior versions are retained.
      </p>
    </div>
  )
}
