import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Database, LinkSimple, ShieldCheck } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { COMPANIES, GROUP_NAME } from '../data/locations'
import type { LocationsStore } from '../hooks/use-locations'

interface GovernanceTabProps {
  store: LocationsStore
}

type QueryResult =
  | { kind: 'owned'; detail: string }
  | { kind: 'shared'; detail: string }
  | { kind: 'denied'; detail: string }

const ENFORCEMENT_RULES = [
  'Every location row carries the owning company’s tenant scope; row-level security is keyed to that company and cannot be bypassed by the application or API.',
  'Queries return only owned locations plus locations explicitly shared through a group-company relationship in force on the effective date.',
  'Companies without a configured group-company relationship can never reference or browse each other’s locations.',
  'If a group-company relationship is removed, existing cross-company references stop resolving.',
  'A shared location remains a single owned record; referencing companies hold foreign-key references, never copies.',
]

/**
 * Platform Admin data-layer oversight (LOC-07/11/12): a row-level-security
 * query simulator, the single-owned-record reference model, and the platform
 * enforcement rules.
 */
export function GovernanceTab({ store }: GovernanceTabProps) {
  const [requestingCompany, setRequestingCompany] = useState(COMPANIES[0].id)
  const [queriedLocation, setQueriedLocation] = useState(store.locations[0]?.id ?? '')
  const [result, setResult] = useState<QueryResult | null>(null)
  const [inspected, setInspected] = useState(
    store.shares.find((s) => store.shareStatus(s) === 'active')?.locationId ?? ''
  )

  const runQuery = () => {
    const location = store.locationById.get(queriedLocation)
    if (!location) return
    if (location.companyId === requestingCompany) {
      setResult({
        kind: 'owned',
        detail: `1 row returned — ${location.id} is owned by the requesting tenant (${store.companyName(requestingCompany)}).`,
      })
    } else if (store.activeTargetsOf(location.id).includes(requestingCompany)) {
      setResult({
        kind: 'shared',
        detail: `1 row returned — ${location.id} resolves through an active governed share within ${GROUP_NAME}. Ownership stays with ${store.companyName(location.companyId)}.`,
      })
    } else {
      setResult({
        kind: 'denied',
        detail: `0 rows returned — row-level security: ${store.companyName(requestingCompany)} has no ownership of ${location.id} and no explicitly configured share. The data layer returns no row regardless of application logic.`,
      })
    }
  }

  const inspectedLocation = store.locationById.get(inspected)
  const inspectedShare = useMemo(
    () => store.shares.find((s) => s.locationId === inspected),
    [store.shares, inspected]
  )

  return (
    <div className='grid w-full gap-4 lg:grid-cols-2'>
      {/* Row-level security simulator (LOC-11 / LOC-07) */}
      <Card className='gap-2 border-none bg-white py-3'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 flex items-center gap-2 font-medium'>
            <Database size={16} weight='bold' />
            Tenant isolation — query simulator
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 px-4'>
          <p className='text-paragraph-sm text-neutral-1000'>
            Simulate a data-layer read: pick a requesting tenant and a location
            id to see what row-level security returns.
          </p>
          <div className='grid grid-cols-2 gap-3'>
            <div>
              <p className='text-paragraph-sm text-neutral-1600 mb-1 font-medium'>
                Requesting company
              </p>
              <Select value={requestingCompany} onValueChange={setRequestingCompany}>
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMPANIES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                      {c.groupId ? '' : ' (no group)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className='text-paragraph-sm text-neutral-1600 mb-1 font-medium'>
                Location record
              </p>
              <Select value={queriedLocation} onValueChange={setQueriedLocation}>
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {store.locations.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.id} — {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={runQuery} className='h-7'>
            Run query
          </Button>
          {result && (
            <div
              className={`rounded-[6px] border p-3 text-sm ${
                result.kind === 'denied'
                  ? 'border-red-1300 bg-red-1300/20 text-red-1400'
                  : 'border-green-1200 bg-green-1200/30 text-green-1300'
              }`}
            >
              <Badge
                variant={result.kind === 'denied' ? 'dropped' : 'badge_active'}
                className='mb-1'
              >
                {result.kind === 'owned'
                  ? 'Owned row'
                  : result.kind === 'shared'
                    ? 'Shared row'
                    : 'Access blocked'}
              </Badge>
              <p>{result.detail}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Referential integrity (LOC-12) */}
      <Card className='gap-2 border-none bg-white py-3'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 flex items-center gap-2 font-medium'>
            <LinkSimple size={16} weight='bold' />
            Referential integrity — single owned record
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 px-4'>
          <Select value={inspected} onValueChange={setInspected}>
            <SelectTrigger variant='secondary' className='w-full'>
              <SelectValue placeholder='Pick a location to inspect' />
            </SelectTrigger>
            <SelectContent>
              {store.locations.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.id} — {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {inspectedLocation && (
            <div className='space-y-2'>
              <div className='rounded-[6px] border border-gray-200 p-3'>
                <p className='text-paragraph-sm text-neutral-1000'>Owned record (1)</p>
                <p className='text-neutral-1600 text-sm font-medium'>
                  {inspectedLocation.id} · {inspectedLocation.name}
                </p>
                <p className='text-paragraph-sm text-neutral-1000'>
                  Owner tenant: {store.companyName(inspectedLocation.companyId)} ·
                  Duplicated records: 0
                </p>
              </div>
              {store.activeTargetsOf(inspectedLocation.id).length > 0 ? (
                store.activeTargetsOf(inspectedLocation.id).map((companyId) => (
                  <div
                    key={companyId}
                    className='ml-4 rounded-[6px] border border-dashed border-gray-300 p-2'
                  >
                    <p className='text-sm'>
                      <span className='text-neutral-1600 font-medium'>
                        {store.companyName(companyId)}
                      </span>{' '}
                      <span className='text-neutral-1000'>
                        → FK reference → resolves to {inspectedLocation.id}
                        {inspectedShare ? ` (share v${inspectedShare.version})` : ''}
                      </span>
                    </p>
                  </div>
                ))
              ) : (
                <p className='text-paragraph-sm text-neutral-1000 ml-4'>
                  No active reference links — the record is visible to its owner only.
                </p>
              )}
              <Button
                variant='outline'
                className='h-7'
                onClick={() =>
                  toast.error(
                    `Integrity constraint rejected: no governed share exists between Nimbus Foods and ${inspectedLocation.id}, so the reference cannot be written.`
                  )
                }
              >
                Attempt unshared reference (Nimbus Foods)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enforcement rules (LOC-07 / LOC-11) */}
      <Card className='gap-2 border-none bg-white py-3 lg:col-span-2'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 flex items-center gap-2 font-medium'>
            <ShieldCheck size={16} weight='bold' />
            Platform enforcement rules
          </CardTitle>
        </CardHeader>
        <CardContent className='px-4'>
          <ul className='space-y-2'>
            {ENFORCEMENT_RULES.map((rule) => (
              <li key={rule} className='flex items-start gap-2 text-sm'>
                <ShieldCheck size={16} weight='fill' className='text-green-1300 mt-0.5 shrink-0' />
                <span className='text-neutral-1900'>{rule}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
