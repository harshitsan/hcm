import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { COMPANIES, IMPORT_FUNCTIONS } from '../data/catalog'
import { type DataConfigStore } from '../hooks/use-data-config'

const NO_TENANT = '__none__'

interface ConfigCatalogProps {
  store: DataConfigStore
}

/**
 * Import routing catalog governance: which modules/functions are
 * import-enabled, their exposed fields, and per-tenant hides (DM-32).
 */
export function ConfigCatalog({ store }: ConfigCatalogProps) {
  const { functionToggles, toggleFunction, setFunctionHiddenForTenant } = store

  return (
    <Card className='gap-3 border-gray-200 py-4'>
      <CardHeader className='px-4'>
        <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
          Import module / function catalog
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-1.5 px-4'>
        <p className='text-paragraph-sm text-neutral-1000 mb-2'>
          Disabled functions disappear from “Select function” for every tenant;
          tenant hides remove them for that tenant only while defaults govern
          the rest.
        </p>
        {IMPORT_FUNCTIONS.map((fn) => {
          const toggle = functionToggles.find((t) => t.functionId === fn.id)
          const enabled = toggle?.enabled ?? true
          const hidden = toggle?.hiddenForCompanyIds ?? []
          const fieldCount =
            fn.requiredFields.length + fn.fields.length + fn.customFields.length
          return (
            <div
              key={fn.id}
              className='flex flex-wrap items-center justify-between gap-2 rounded-[6px] border border-gray-200 px-3 py-2'
            >
              <div className='min-w-0'>
                <div className='flex items-center gap-2'>
                  <span className='text-neutral-1600 text-sm font-medium'>
                    {fn.name}
                  </span>
                  <span className='text-paragraph-sm text-neutral-1000'>
                    {fn.module}
                  </span>
                  {!enabled && <Badge variant='badge_inactive'>Disabled</Badge>}
                </div>
                <p className='text-paragraph-sm text-neutral-1000'>
                  {fieldCount} mappable fields
                  {fn.customFields.length > 0 &&
                    ` (${fn.customFields.length} custom)`}
                  {fn.numberSeriesField &&
                    ` · number series: ${fn.numberSeriesField}`}
                  {hidden.length > 0 &&
                    ` · hidden for ${hidden
                      .map(
                        (id) => COMPANIES.find((c) => c.id === id)?.name ?? id
                      )
                      .join(', ')}`}
                </p>
              </div>
              <div className='flex items-center gap-3'>
                <Select
                  value={NO_TENANT}
                  onValueChange={(companyId) => {
                    if (companyId === NO_TENANT) return
                    setFunctionHiddenForTenant(
                      fn.id,
                      companyId,
                      !hidden.includes(companyId)
                    )
                  }}
                >
                  <SelectTrigger variant='secondary' className='h-8 w-[190px]'>
                    <SelectValue placeholder='Toggle tenant hide…' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_TENANT}>
                      Toggle tenant hide…
                    </SelectItem>
                    {COMPANIES.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {hidden.includes(c.id) ? 'Unhide for ' : 'Hide for '}
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Switch
                  checked={enabled}
                  onCheckedChange={(v) => toggleFunction(fn.id, v)}
                  aria-label={`Enable ${fn.name} for import`}
                />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
