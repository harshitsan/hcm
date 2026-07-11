import { useCallback, useMemo, useState } from 'react'
import { CaretDown, DownloadSimple, Plus } from 'phosphor-react'
import { toast } from 'sonner'
import { RoleGate, useRole } from '@/context/role-context'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@/components/common/data-table/table'
import {
  COMPANY_STATUSES,
  STATUS_TRANSITIONS,
  SUPPORTED_JURISDICTIONS,
  defaultCompanyConfig,
  statusLabel,
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
import { buildCompaniesColumns } from './companies-table-columns'
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
  const { role } = useRole()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [jurisdictionFilter, setJurisdictionFilter] = useState('all')
  const [selectedRows, setSelectedRows] = useState<Company[]>([])
  const [resetSelectionKey, setResetSelectionKey] = useState(0)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [lifecycleRequest, setLifecycleRequest] =
    useState<LifecycleRequest | null>(null)

  const scoped = useMemo(
    () => scopeCompanies(store.companies, role),
    [store.companies, role]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return scoped.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false
      if (
        jurisdictionFilter !== 'all' &&
        !c.jurisdictions.some((j) => j.jurisdiction === jurisdictionFilter)
      )
        return false
      if (
        q &&
        !c.legalName.toLowerCase().includes(q) &&
        !c.tradeName.toLowerCase().includes(q) &&
        !c.code.toLowerCase().includes(q)
      )
        return false
      return true
    })
  }, [scoped, search, statusFilter, jurisdictionFilter])

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

  const columns = useMemo(() => buildCompaniesColumns(openDetail), [openDetail])

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

      <div className='mb-3 flex flex-wrap items-center justify-between gap-3'>
        <div className='flex items-center gap-2'>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Search name or code…'
            className='h-8 w-[220px]'
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger variant='secondary' className='h-8 w-[150px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All statuses</SelectItem>
              {COMPANY_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {statusLabel(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={jurisdictionFilter}
            onValueChange={setJurisdictionFilter}
          >
            <SelectTrigger variant='secondary' className='h-8 w-[180px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All jurisdictions</SelectItem>
              {SUPPORTED_JURISDICTIONS.map((j) => (
                <SelectItem key={j} value={j}>
                  {j}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='flex items-center gap-3'>
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
            <Button
              variant='red'
              onClick={() => setWizardOpen(true)}
              className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
            >
              <Plus size={10} weight='bold' />
              New Company
            </Button>
          </RoleGate>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        variant='no-status'
        resetSelectionKey={resetSelectionKey}
        onSelectionChange={(rows) => setSelectedRows(rows)}
        onRowClick={(row) => openDetail(row)}
      />
      <p className='text-paragraph-sm text-neutral-1000 mt-2'>
        Showing {filtered.length} of {scoped.length} companies scoped to your
        access · page size 20 (max 100). Click a code or row to open the
        company detail screen.
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
