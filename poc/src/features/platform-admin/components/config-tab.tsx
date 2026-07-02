import { useState } from 'react'
import { toast } from 'sonner'
import { RoleGate, useRole } from '@/context/role-context'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  UDF_ENTITIES,
  UDF_TYPES,
  type UdfEntity,
  type UdfType,
} from '../data/config'
import { type GovernedConfigStore } from '../hooks/use-governed-config'
import { IntegrationsCards } from './integrations-cards'
import { MiniTable, SectionCard, ToneBadge } from './shared'

/**
 * Governed configuration tab (SYS-28, 33, 34, 35, 36, 74, 76, 77) —
 * versioned/effective-dated config registry, per-tenant custom fields,
 * locale formats, webhooks, the approval engine and the API-first posture.
 */
export function ConfigTab({ store }: { store: GovernedConfigStore }) {
  const { hasRole } = useRole()
  const [udfOpen, setUdfOpen] = useState(false)
  const [udfName, setUdfName] = useState('')
  const [udfType, setUdfType] = useState<UdfType>('Text')
  const [udfEntity, setUdfEntity] = useState<UdfEntity>('Employee')
  const [locale, setLocale] = useState(store.locale)

  const canPublish = (tenantId: string | null) =>
    tenantId === null
      ? hasRole('Platform Admin')
      : hasRole('Company Admin', 'Platform Admin')

  return (
    <div className='w-full'>
      {/* Versioned governed configuration (SYS-35, 33) */}
      <SectionCard
        title={`Governed configuration registry (${store.configEntries.length})`}
        description='Roles, permission sets, jurisdiction rule-packs, locale formats, security policies and UDF schemas — versioned and effective-dated; changes apply without code deployment.'
        actions={
          <RoleGate roles={['Company Admin', 'Platform Admin']}>
            <Button variant='outline' className='h-8' onClick={() => setUdfOpen(true)}>
              New custom field
            </Button>
          </RoleGate>
        }
      >
        <MiniTable
          headers={['Configuration', 'Kind', 'Version', 'Effective from', 'Scope', 'Status', '']}
          rows={store.configEntries.map((e) => [
            <span key='n' className='font-medium'>{e.name}</span>,
            e.kind,
            `v${e.version}`,
            e.effectiveFrom,
            e.tenantId ? 'Tenant override' : 'Platform',
            <ToneBadge
              key='s'
              tone={
                e.status === 'effective'
                  ? 'green'
                  : e.status === 'draft'
                    ? 'blue'
                    : 'grey'
              }
            >
              {e.status}
            </ToneBadge>,
            <div key='a' className='flex justify-end'>
              {e.status === 'effective' && canPublish(e.tenantId) && (
                <Button
                  variant='outline'
                  className='h-7 px-2 text-xs'
                  onClick={() => store.publishVersion(e.id)}
                >
                  Publish new version
                </Button>
              )}
            </div>,
          ])}
        />
        <p className='text-paragraph-sm text-neutral-1000 mt-2'>
          Prior versions stay reconstructable; engines interpret the currently
          effective version. Tenant overrides remain isolated to their company.
        </p>
      </SectionCard>

      {/* Locale formats (SYS-74) */}
      <SectionCard
        title='Language & locale formats'
        description='English-only UI in Phase 1. Date, number, currency and address formats are configurable at company or jurisdiction level.'
      >
        <div className='grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3'>
          <div className='flex flex-col gap-1.5'>
            <Label>Configuration level</Label>
            <Select
              value={locale.level}
              onValueChange={(v) =>
                setLocale({ ...locale, level: v as typeof locale.level })
              }
            >
              <SelectTrigger className='w-full bg-white'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='Company'>Company</SelectItem>
                <SelectItem value='Jurisdiction'>Jurisdiction</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='flex flex-col gap-1.5'>
            <Label>Date format</Label>
            <Select
              value={locale.dateFormat}
              onValueChange={(v) => setLocale({ ...locale, dateFormat: v })}
            >
              <SelectTrigger className='w-full bg-white'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['DD MMM YYYY', 'DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'].map(
                  (f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
          <div className='flex flex-col gap-1.5'>
            <Label>Number format</Label>
            <Select
              value={locale.numberFormat}
              onValueChange={(v) => setLocale({ ...locale, numberFormat: v })}
            >
              <SelectTrigger className='w-full bg-white'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='1,23,456.78 (Indian grouping)'>
                  1,23,456.78 (Indian grouping)
                </SelectItem>
                <SelectItem value='123,456.78'>123,456.78</SelectItem>
                <SelectItem value='123.456,78'>123.456,78</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='flex flex-col gap-1.5'>
            <Label>Currency</Label>
            <Select
              value={locale.currency}
              onValueChange={(v) => setLocale({ ...locale, currency: v })}
            >
              <SelectTrigger className='w-full bg-white'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['INR ₹', 'USD $', 'GBP £', 'SGD $'].map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='flex flex-col gap-1.5'>
            <Label>Address format</Label>
            <Select
              value={locale.addressFormat}
              onValueChange={(v) => setLocale({ ...locale, addressFormat: v })}
            >
              <SelectTrigger className='w-full bg-white'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='Street / City / State / PIN'>
                  Street / City / State / PIN
                </SelectItem>
                <SelectItem value='Street / City / ZIP / State'>
                  Street / City / ZIP / State
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='flex items-end'>
            <Button
              className='h-9'
              disabled={!hasRole('Company Admin', 'Platform Admin')}
              onClick={() => store.updateLocale(locale)}
            >
              Save locale formats
            </Button>
          </div>
        </div>
      </SectionCard>

      <IntegrationsCards store={store} />

      {/* API-first posture (SYS-76) */}
      <SectionCard
        title='API-first architecture'
        description='React frontend · .NET Core backend · PostgreSQL — every UI capability is exposed via RESTful APIs.'
        actions={
          <Button
            variant='outline'
            className='h-8'
            onClick={() =>
              toast.info('OpenAPI / Swagger documentation opens in the API portal')
            }
          >
            View OpenAPI spec
          </Button>
        }
      >
        <ul className='text-neutral-1900 list-disc space-y-1 ps-5 text-sm'>
          <li>REST endpoints secured with OAuth 2.0 / JWT authentication</li>
          <li>OpenAPI / Swagger documentation published for every endpoint</li>
          <li>Phase 1 external integrations: authentication providers only</li>
        </ul>
      </SectionCard>

      {/* New custom field (SYS-33) */}
      <Dialog open={udfOpen} onOpenChange={setUdfOpen}>
        <DialogContent className='sm:max-w-[420px]'>
          <DialogHeader>
            <DialogTitle>New custom field (UDF)</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='flex flex-col gap-1.5'>
              <Label>Field name</Label>
              <Input
                value={udfName}
                onChange={(e) => setUdfName(e.target.value)}
                placeholder='e.g. ESI number'
              />
            </div>
            <div className='flex flex-col gap-1.5'>
              <Label>Data type</Label>
              <Select value={udfType} onValueChange={(v) => setUdfType(v as UdfType)}>
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UDF_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='flex flex-col gap-1.5'>
              <Label>Applies to</Label>
              <Select
                value={udfEntity}
                onValueChange={(v) => setUdfEntity(v as UdfEntity)}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UDF_ENTITIES.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className='text-paragraph-sm text-neutral-1000'>
              Saved as per-tenant governed config — no code change. The field
              renders on forms and is included in global search.
            </p>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setUdfOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={udfName.trim().length < 2}
              onClick={() => {
                store.addCustomField(udfName.trim(), udfType, udfEntity)
                setUdfName('')
                setUdfOpen(false)
              }}
            >
              Add field
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
