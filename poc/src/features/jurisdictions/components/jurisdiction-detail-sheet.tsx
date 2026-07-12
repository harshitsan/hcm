import { useMemo, useState } from 'react'
import { Plus } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DetailSheet, type DetailSection } from '@/components/module-page'
import { useRole } from '@/context/role-context'
import {
  STATUTORY_APPLICABILITY_OPTIONS,
  type Jurisdiction,
  type StatutoryApplicability,
} from '../data/jurisdictions'
import {
  type CompanyRecord,
  type JurisdictionPolicy,
} from '../data/assignments'
import {
  directoryCompanyLabel,
  employeesInJurisdiction,
  officesInJurisdiction,
} from '../data/cross-references'
import { type JurisdictionsStore } from '../hooks/use-jurisdictions'
import {
  NewEntryBadge,
  StatusBadge,
  StatutoryApplicabilityBadge,
  TypeBadge,
} from './jurisdiction-badges'

interface JurisdictionDetailSheetProps {
  jurisdiction: Jurisdiction | null
  onClose: () => void
  store: JurisdictionsStore
  companies: CompanyRecord[]
  policies: JurisdictionPolicy[]
}

/**
 * Row-click detail for a catalog entry (O1): flat catalog framing, the
 * statutory profile referenced by payroll defaults, tax/fee lines, policy
 * criteria usage, operating companies, offices and employees inside the
 * jurisdiction — display and reference only, no payroll computation.
 */
export function JurisdictionDetailSheet({
  jurisdiction,
  onClose,
  store,
  companies,
  policies,
}: JurisdictionDetailSheetProps) {
  const { hasRole } = useRole()
  const canManage = hasRole('Platform Admin')

  const operatingCompanies = useMemo(
    () =>
      jurisdiction
        ? companies.filter((c) => c.jurisdictionIds.includes(jurisdiction.id))
        : [],
    [companies, jurisdiction]
  )
  const referencingPolicies = useMemo(
    () =>
      jurisdiction
        ? policies.filter((p) => p.jurisdictionIds.includes(jurisdiction.id))
        : [],
    [policies, jurisdiction]
  )
  const offices = useMemo(
    () => (jurisdiction ? officesInJurisdiction(jurisdiction.id) : []),
    [jurisdiction]
  )
  const directoryEmployees = useMemo(
    () => (jurisdiction ? employeesInJurisdiction(jurisdiction.id) : []),
    [jurisdiction]
  )

  const sections: DetailSection[] = jurisdiction
    ? [
        {
          title: 'Catalog entry',
          fields: [
            { label: 'Code', value: jurisdiction.code },
            { label: 'Type', value: <TypeBadge type={jurisdiction.type} /> },
            {
              label: 'Region / country label',
              value: jurisdiction.region ?? '—',
            },
            { label: 'Effective from', value: jurisdiction.effectiveFrom },
            {
              label: 'Effective to',
              value: jurisdiction.effectiveTo ?? 'Open-ended',
            },
          ],
          content: (
            <div className='mt-3 space-y-2'>
              {jurisdiction.description && (
                <p className='text-neutral-1600 text-sm'>
                  {jurisdiction.description}
                </p>
              )}
              <p className='text-paragraph-sm text-neutral-1000'>
                One entry in the flat, platform-managed catalog of operational
                regions — not part of a mandatory country/state/city tree.
              </p>
              {jurisdiction.recentlyAdded && (
                <p className='text-paragraph-sm rounded-md border border-gray-200 bg-white px-3 py-2'>
                  Added to the catalog mid-life: new policy and statutory
                  options became available from its effective date. No existing
                  employee, company or policy record was changed by the
                  addition.
                </p>
              )}
            </div>
          ),
        },
        {
          title: 'Statutory profile',
          content: (
            <StatutoryProfileSection
              jurisdiction={jurisdiction}
              store={store}
              canManage={canManage}
            />
          ),
        },
        {
          title: 'Taxes & fees',
          fields:
            jurisdiction.taxFees.length > 0
              ? jurisdiction.taxFees.map((t) => ({
                  label: `${t.name} (${t.kind} · ${t.appliesTo})`,
                  value: t.rate,
                }))
              : [{ label: 'Configuration', value: 'Not configured' }],
        },
        {
          title: 'Used as policy criteria',
          content:
            referencingPolicies.length === 0 ? (
              <p className='text-paragraph-sm text-neutral-1000'>
                No policy currently uses this jurisdiction as an applicability
                criterion.
              </p>
            ) : (
              <ul className='space-y-1.5'>
                {referencingPolicies.map((p) => (
                  <li
                    key={p.id}
                    className='flex items-center gap-2 text-sm'
                  >
                    <span className='text-neutral-1600'>{p.name}</span>
                    <Badge variant='pending'>{p.module}</Badge>
                    {p.status === 'draft' && <Badge variant='open'>Draft</Badge>}
                  </li>
                ))}
              </ul>
            ),
        },
        {
          title: 'Companies operating here',
          content: (
            <div className='space-y-2'>
              {operatingCompanies.length === 0 ? (
                <p className='text-paragraph-sm text-neutral-1000'>
                  No company operates in this jurisdiction yet.
                </p>
              ) : (
                <ul className='space-y-1.5'>
                  {operatingCompanies.map((c) => (
                    <li key={c.id} className='flex items-center gap-2 text-sm'>
                      <span className='text-neutral-1600'>{c.name}</span>
                      {c.primaryJurisdictionId === jurisdiction.id && (
                        <Badge variant='badge_active'>Primary</Badge>
                      )}
                      <span className='text-neutral-1000 text-paragraph-sm'>
                        {c.employeesByJurisdiction[jurisdiction.id] ?? 0}{' '}
                        employees here
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <p className='text-paragraph-sm text-neutral-1000'>
                A company can operate in one or more jurisdictions — and run
                multiple offices at different locations within the same one.
              </p>
            </div>
          ),
        },
        {
          title: 'Offices in this jurisdiction',
          content:
            offices.length === 0 ? (
              <p className='text-paragraph-sm text-neutral-1000'>
                No office records are mapped to this region yet. Offices can be
                added at any time without changing the catalog entry.
              </p>
            ) : (
              <ul className='space-y-1.5'>
                {offices.map((loc) => (
                  <li key={loc.id} className='text-sm'>
                    <span className='text-neutral-1600'>{loc.name}</span>{' '}
                    <span className='text-neutral-1000 text-paragraph-sm'>
                      {loc.city} · {loc.acronym}
                    </span>
                  </li>
                ))}
              </ul>
            ),
        },
        {
          title: `Employees in this jurisdiction (${directoryEmployees.length})`,
          content: (
            <div className='space-y-2'>
              {directoryEmployees.length === 0 ? (
                <p className='text-paragraph-sm text-neutral-1000'>
                  No employee records are assigned to this jurisdiction.
                </p>
              ) : (
                <ul className='space-y-1.5'>
                  {directoryEmployees.map((e) => (
                    <li key={e.id} className='text-sm'>
                      <span className='text-neutral-1600'>{e.name}</span>{' '}
                      <span className='text-neutral-1000 text-paragraph-sm'>
                        {e.position} · {directoryCompanyLabel(e)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <p className='text-paragraph-sm text-neutral-1000'>
                Every employee belongs to exactly one jurisdiction, even when
                their company runs several offices within it.
              </p>
            </div>
          ),
        },
      ]
    : []

  return (
    <DetailSheet
      open={jurisdiction !== null}
      onOpenChange={(o) => !o && onClose()}
      title={jurisdiction?.name ?? ''}
      description={
        jurisdiction
          ? `${jurisdiction.code}${jurisdiction.region ? ` · ${jurisdiction.region}` : ''}`
          : undefined
      }
      badges={
        jurisdiction && (
          <>
            <StatusBadge status={jurisdiction.status} />
            {jurisdiction.recentlyAdded && <NewEntryBadge />}
          </>
        )
      }
      sections={sections}
    />
  )
}

/**
 * Statutory profile display + Platform Admin controls (O1): applicability
 * per item can be switched and new items added mid-life; every change is
 * versioned and audited.
 */
function StatutoryProfileSection({
  jurisdiction,
  store,
  canManage,
}: {
  jurisdiction: Jurisdiction
  store: JurisdictionsStore
  canManage: boolean
}) {
  const profile = jurisdiction.statutoryProfile
  const [regime, setRegime] = useState('')
  const [filing, setFiling] = useState('')
  const [newItemName, setNewItemName] = useState('')
  const [newItemNote, setNewItemNote] = useState('')
  const [newItemApplicability, setNewItemApplicability] =
    useState<StatutoryApplicability>('Applicable')

  const addItem = () => {
    if (newItemName.trim().length < 2) return
    store.addStatutoryItem(jurisdiction.id, {
      name: newItemName.trim(),
      applicability: newItemApplicability,
      note: newItemNote.trim(),
    })
    setNewItemName('')
    setNewItemNote('')
    setNewItemApplicability('Applicable')
  }

  return (
    <div className='space-y-3'>
      {!profile ? (
        <div className='space-y-2'>
          <p className='text-paragraph-sm text-neutral-1000'>
            No statutory profile has been set up yet. It can be configured at
            any time without disrupting existing records.
          </p>
          {canManage && (
            <div className='space-y-2 rounded-md border border-gray-200 p-3'>
              <Input
                placeholder='e.g. PAYE, India Income Tax'
                value={regime}
                onChange={(e) => setRegime(e.target.value)}
                aria-label='Tax regime'
              />
              <Input
                placeholder='e.g. Monthly returns; annual reconciliation'
                value={filing}
                onChange={(e) => setFiling(e.target.value)}
                aria-label='Filing calendar note'
              />
              <Button
                size='sm'
                disabled={regime.trim().length < 2}
                onClick={() =>
                  store.updateStatutoryDetails(
                    jurisdiction.id,
                    regime.trim(),
                    filing.trim()
                  )
                }
              >
                Set up statutory profile
              </Button>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className='grid grid-cols-2 gap-x-4 gap-y-3'>
            <div className='flex flex-col gap-0.5'>
              <span className='text-neutral-1000 text-xs font-medium'>
                Tax regime
              </span>
              <span className='text-neutral-1600 text-sm'>
                {profile.taxRegime || '—'}
              </span>
            </div>
            <div className='flex flex-col gap-0.5'>
              <span className='text-neutral-1000 text-xs font-medium'>
                Filing calendar
              </span>
              <span className='text-neutral-1600 text-sm'>
                {profile.filingCalendar || '—'}
              </span>
            </div>
          </div>

          {profile.items.length === 0 ? (
            <p className='text-paragraph-sm text-neutral-1000'>
              No statutory items listed yet.
            </p>
          ) : (
            <ul className='space-y-2'>
              {profile.items.map((item) => (
                <li
                  key={item.id}
                  className='flex items-start justify-between gap-2 rounded-md border border-gray-200 px-3 py-2'
                >
                  <div className='min-w-0'>
                    <p className='text-neutral-1600 text-sm font-medium'>
                      {item.name}
                    </p>
                    {item.note && (
                      <p className='text-paragraph-sm text-neutral-1000'>
                        {item.note}
                      </p>
                    )}
                  </div>
                  {canManage ? (
                    <Select
                      value={item.applicability}
                      onValueChange={(v) =>
                        store.setStatutoryApplicability(
                          jurisdiction.id,
                          item.id,
                          v as StatutoryApplicability
                        )
                      }
                    >
                      <SelectTrigger
                        variant='secondary'
                        className='h-7 w-[150px] shrink-0'
                        aria-label={`Applicability of ${item.name}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUTORY_APPLICABILITY_OPTIONS.map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <StatutoryApplicabilityBadge
                      applicability={item.applicability}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {canManage && profile && (
        <div className='space-y-2 rounded-md border border-dashed border-gray-200 p-3'>
          <p className='text-neutral-1600 text-sm font-medium'>
            Add a statutory item
          </p>
          <div className='grid grid-cols-2 gap-2'>
            <Input
              placeholder='e.g. Statutory bonus'
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              aria-label='Statutory item name'
            />
            <Select
              value={newItemApplicability}
              onValueChange={(v) =>
                setNewItemApplicability(v as StatutoryApplicability)
              }
            >
              <SelectTrigger className='w-full' aria-label='Applicability'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUTORY_APPLICABILITY_OPTIONS.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input
            placeholder='e.g. 8.33% for eligible wage bands'
            value={newItemNote}
            onChange={(e) => setNewItemNote(e.target.value)}
            aria-label='Rate or note'
          />
          <Button
            size='sm'
            variant='outline'
            disabled={newItemName.trim().length < 2}
            onClick={addItem}
          >
            <Plus size={12} weight='bold' /> Add item
          </Button>
          <p className='text-paragraph-sm text-neutral-1000'>
            New items become available going forward — existing records are
            never changed.
          </p>
        </div>
      )}

      <p className='text-paragraph-sm text-neutral-1000'>
        Referenced by payroll computation defaults (D6) — computation itself is
        out of scope for this POC.
      </p>
    </div>
  )
}
