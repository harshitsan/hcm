import { useCallback, useMemo, useState } from 'react'
import { CaretDown, DownloadSimple } from 'phosphor-react'
import { toast } from 'sonner'
import { RoleGate, useRole } from '@/context/role-context'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SpecTable,
  TableToolbar,
  useColumnVisibility,
  type FilterValue,
} from '@/components/common/data-table'
import {
  STATUS_TRANSITIONS,
  defaultCompanyConfig,
  type Company,
  type CompanyStatus,
} from '../data/companies'
import { type SubscriptionPackage } from '../data/subscriptions'
import {
  scopeCompanies,
  type CompaniesStore,
  type CompanyDraft,
} from '../hooks/use-companies'
import { type SubscriptionsStore } from '../hooks/use-subscriptions'
import { CompaniesSummary } from './companies-summary'
import { companiesTableSpec } from './companies-table-spec'
import { CompanyDetailSheet } from './detail/company-detail-sheet'
import { CompanyWizard } from './company-wizard'
import { performLifecycleTransition } from './lifecycle-actions'
import { LifecycleDialog, type LifecycleRequest } from './lifecycle-dialog'
import { type WizardValues } from './wizard/schema'

const TIER_TO_PACKAGE: Record<string, string> = {
  Basic: 'pkg-basic',
  Standard: 'pkg-std',
  Enterprise: 'pkg-ent',
}

const transitionLabels: Partial<Record<CompanyStatus, string>> = {
  active: 'Activate / Reactivate',
  suspended: 'Suspend',
  inactive: 'Inactivate (close)',
  archived: 'Archive',
  cancelled: 'Cancel draft',
}

interface DirectoryTabProps {
  store: CompaniesStore
  subscriptions: SubscriptionsStore
  packages: SubscriptionPackage[]
}

/** §5.1 + CMP-21 — role-scoped company directory with search/filter/actions. */
export function DirectoryTab({
  store,
  subscriptions,
  packages,
}: DirectoryTabProps) {
  const { role, hasRole } = useRole()
  const [selectedRows, setSelectedRows] = useState<Company[]>([])
  const [resetSelectionKey, setResetSelectionKey] = useState(0)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [lifecycleRequest, setLifecycleRequest] =
    useState<LifecycleRequest | null>(null)
  const [filters, setFilters] = useState<Record<string, FilterValue>>({})
  const [searchQuery, setSearchQuery] = useState('')

  const scoped = useMemo(
    () => scopeCompanies(store.companies, role),
    [store.companies, role]
  )

  const clearSelection = () => {
    setSelectedRows([])
    setResetSelectionKey((prev) => prev + 1)
  }

  const { recordAccess } = store
  const openDetail = useCallback(
    (company: Company) => {
      recordAccess(company)
      setDetailId(company.id)
    },
    [recordAccess]
  )

  // New Company is gated to the same role as the old bespoke button.
  const canCreate = hasRole('Platform Admin')
  const spec = useMemo(
    () =>
      companiesTableSpec({ onAdd: () => setWizardOpen(true), canCreate }),
    [canCreate]
  )
  const { visibility, setVisibility } = useColumnVisibility(spec)

  const selected = selectedRows.length === 1 ? selectedRows[0] : null

  const handleWizardSubmit = (values: WizardValues, asDraft: boolean) => {
    const draft: CompanyDraft = {
      legalName: values.legalName.trim(),
      tradeName: values.tradeName.trim(),
      website: values.website,
      registrationType: values.registrationType,
      registrationNumber: values.registrationNumber.trim(),
      incorporationDate: values.incorporationDate || null,
      primaryEmail: values.primaryEmail,
      primaryPhone: values.primaryPhone,
      primaryAddress: values.primaryAddress,
      billingAddress: values.billingAddress || values.primaryAddress,
      jurisdictions: [
        values.primaryJurisdiction,
        values.secondaryJurisdiction !== 'None'
          ? values.secondaryJurisdiction
          : '',
      ]
        .filter(Boolean)
        .map((j, i) => ({
          id: `j-${crypto.randomUUID().slice(0, 6)}`,
          jurisdiction: j,
          isPrimary: i === 0,
          effectiveDate: new Date().toISOString().slice(0, 10),
          expiryDate: null,
          employeeCount: 0,
        })),
      baseCurrency: values.baseCurrency,
      baseCurrencyLocked: false,
      timeZone: values.timeZone,
      language: 'en',
      logoUrl: null,
      primaryColor: null,
      operatingModel: 'Standalone',
      groupId: null,
      portfolioId: null,
      status: 'draft',
      employeeCount: 0,
      employeeLimit: Number(values.employeeLimit) || 100,
      subscriptionTier: values.subscriptionTier,
      packageId: TIER_TO_PACKAGE[values.subscriptionTier],
      adminEmail: values.adminEmail || null,
      config: defaultCompanyConfig(['Core HR']),
    }

    if (!asDraft) {
      // FR 6.2.5 — the Rules engine evaluates the company limit from config.
      const probe = {
        ...draft,
        id: 'probe',
        code: 'PROBE',
        createdAt: '',
        retentionEndsOn: null,
        archivalFeeMonthly: null,
      }
      const decision = subscriptions.evaluateEntitlement(
        'create-company',
        probe,
        store.companies
      )
      if (decision.decision === 'DENY') {
        toast.error(
          `Rules engine denied creation — ${decision.reason} (${decision.rule})`
        )
        return false
      }
      if (decision.decision === 'FLAG') {
        toast.warning(`Flagged by the rules engine — ${decision.reason}`)
      }
    }

    const company = store.createCompany(draft, asDraft)
    if (asDraft) {
      toast.success(
        `${company.code} saved as Draft — resume setup later from the directory`
      )
    } else {
      toast.success(`${company.legalName} created as ${company.code}`)
      toast.info(
        `Provisioning complete: isolated tenant schema created, default security policies initialized${
          company.adminEmail
            ? `, welcome email sent to ${company.adminEmail}`
            : ''
        }.`
      )
    }
    return true
  }

  const handleLifecycleConfirm = (
    request: LifecycleRequest,
    reason: string
  ) => {
    if (performLifecycleTransition(store, request, reason)) clearSelection()
  }

  const handleExport = (company: Company) => {
    const checksum = store.exportCompany(
      company,
      'Full company data export for handover'
    )
    toast.success(
      `Export generated for ${company.code} — full dataset scoped to this tenant only. Checksum ${checksum}`
    )
    clearSelection()
  }

  if (scoped.length === 0 && role.startsWith('Employee')) {
    return (
      <div className='rounded-[6px] border border-gray-200 bg-white p-6 text-center'>
        <p className='text-neutral-1600 font-medium'>
          Company administration is not available for your role
        </p>
        <p className='text-paragraph-sm text-neutral-1000 mt-1'>
          Directory results are scoped to your access — companies you are not
          entitled to see never appear here.
        </p>
      </div>
    )
  }

  return (
    <div className='w-full'>
      <CompaniesSummary companies={scoped} />

      <div className='mb-3 flex flex-wrap items-center justify-end gap-3'>
        <RoleGate roles={['Platform Admin', 'Company Admin']}>
          <Button
            variant='icon2'
            className='text-neutral-1900 h-7 gap-1 px-2'
            disabled={!selected}
            onClick={() => selected && handleExport(selected)}
          >
            <DownloadSimple size={16} weight='bold' />
            Export data
          </Button>
        </RoleGate>
        <RoleGate roles={['Platform Admin']}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='icon2'
                className='text-neutral-1900 h-7 gap-1 px-2'
                disabled={
                  !selected ||
                  STATUS_TRANSITIONS[selected.status].length === 0
                }
              >
                Lifecycle
                <CaretDown size={12} weight='bold' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='min-w-[200px]'>
              {selected &&
                STATUS_TRANSITIONS[selected.status].map((target) => (
                  <DropdownMenuItem
                    key={target}
                    onClick={() =>
                      setLifecycleRequest({ company: selected, target })
                    }
                  >
                    {transitionLabels[target] ?? target}
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </RoleGate>
      </div>

      <TableToolbar
        spec={spec}
        data={scoped}
        filters={filters}
        onFiltersChange={setFilters}
        visibility={visibility}
        onVisibilityChange={setVisibility}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <SpecTable
        spec={spec}
        data={scoped}
        filters={filters}
        visibility={visibility}
        onVisibilityChange={setVisibility}
        onRowClick={openDetail}
        onSelectionChange={setSelectedRows}
        resetSelectionKey={resetSelectionKey}
        searchQuery={searchQuery}
      />
      <p className='text-paragraph-sm text-neutral-1000 mt-2'>
        Showing {scoped.length} companies scoped to your access — companies
        you are not entitled to see never appear here. Click a row to open
        the company detail screen.
      </p>

      <CompanyWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        companies={store.companies}
        onSubmit={handleWizardSubmit}
      />
      <LifecycleDialog
        request={lifecycleRequest}
        onOpenChange={(open) => {
          if (!open) setLifecycleRequest(null)
        }}
        onConfirm={handleLifecycleConfirm}
      />
      <CompanyDetailSheet
        companyId={detailId}
        onOpenChange={(open) => {
          if (!open) setDetailId(null)
        }}
        store={store}
        packages={packages}
      />
    </div>
  )
}
