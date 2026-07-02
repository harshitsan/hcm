import { useMemo, useState } from 'react'
import { Pause, PencilSimple, Play, Plus } from 'phosphor-react'
import { RoleGate, useRole } from '@/context/role-context'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@/components/common/data-table/table'
import { type Tenant } from '../data/tenants'
import { type TenantsStore, type TenantDraft } from '../hooks/use-tenants'
import { buildTenantColumns } from './tenant-columns'
import {
  GroupsCard,
  JurisdictionsCard,
  PlatformLogCard,
  PortfoliosCard,
} from './tenant-panels'
import { TenantOverlay } from './tenant-overlay'
import { SectionCard } from './shared'

/**
 * Tenants & companies tab (SYS-01, 03, 04, 05, 08, 09, 13, 15, 16, 40, 48,
 * 49) — provisioning table, single-login context switcher and the
 * catalog/portfolio/group governance panels.
 */
export function TenantsTab({ store }: { store: TenantsStore }) {
  const { hasRole } = useRole()
  const [selectedRows, setSelectedRows] = useState<Tenant[]>([])
  const [resetSelectionKey, setResetSelectionKey] = useState(0)
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)

  const columns = useMemo(
    () =>
      buildTenantColumns({
        jurisdictionCode: (id) =>
          store.jurisdictions.find((j) => j.id === id)?.code ?? id,
        portfolioName: (id) =>
          id ? (store.portfolios.find((p) => p.id === id)?.name ?? null) : null,
        groupName: (id) =>
          id ? (store.groups.find((g) => g.id === id)?.name ?? null) : null,
      }),
    [store.jurisdictions, store.portfolios, store.groups]
  )

  const clearSelection = () => {
    setSelectedRows([])
    setResetSelectionKey((prev) => prev + 1)
  }

  const handleSubmit = (draft: TenantDraft) => {
    if (editingTenant) store.updateTenant(editingTenant.id, draft)
    else store.addTenant(draft)
    clearSelection()
  }

  const single = selectedRows.length === 1 ? selectedRows[0] : null
  const activeCompany = store.tenants.find(
    (t) => t.id === store.activeCompanyId
  )

  return (
    <div className='w-full'>
      {/* Single-login company context switcher (SYS-04, 40) */}
      <SectionCard
        title='Active company context'
        description='One login — switch between authorized companies without re-authentication. Unauthorized companies are denied.'
      >
        <div className='flex flex-wrap items-center gap-3'>
          <Select
            value={store.activeCompanyId}
            onValueChange={store.switchCompany}
          >
            <SelectTrigger className='w-[300px] bg-white'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {store.tenants.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name} {t.authorized ? '' : '· not authorized'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className='text-paragraph-sm text-neutral-1000'>
            Working in <b>{activeCompany?.code}</b> — only this company&apos;s
            data and your roles here apply.
          </span>
        </div>
      </SectionCard>

      {/* Toolbar + tenant table (SYS-01, 09) */}
      <div className='mb-3 flex items-center justify-between'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          Companies ({store.tenants.length})
        </h2>
        <RoleGate roles={['Platform Admin']}>
          <div className='flex items-center gap-3'>
            <Button
              variant='icon2'
              onClick={() => {
                if (!single) return
                setEditingTenant(single)
                setOverlayOpen(true)
              }}
              className='text-neutral-1900 h-7 w-7'
              disabled={!single}
              aria-label='Edit'
            >
              <PencilSimple size={16} weight='fill' />
            </Button>
            <Button
              variant='icon2'
              onClick={() => {
                if (!single) return
                store.setTenantStatus(single.id, 'suspended')
                clearSelection()
              }}
              className='text-neutral-1900 h-7 w-7'
              disabled={!single || single.status === 'suspended'}
              aria-label='Suspend'
            >
              <Pause size={16} weight='bold' />
            </Button>
            <Button
              variant='icon2'
              onClick={() => {
                if (!single) return
                store.setTenantStatus(single.id, 'active')
                clearSelection()
              }}
              className='text-neutral-1900 h-7 w-7'
              disabled={!single || single.status === 'active'}
              aria-label='Reactivate'
            >
              <Play size={16} weight='bold' />
            </Button>
            <Button
              variant='red'
              onClick={() => {
                setEditingTenant(null)
                setOverlayOpen(true)
              }}
              className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
            >
              <Plus size={10} weight='bold' />
              New Company
            </Button>
          </div>
        </RoleGate>
      </div>

      <div className='mb-4'>
        <DataTable
          columns={columns}
          data={store.tenants}
          variant='no-status'
          resetSelectionKey={resetSelectionKey}
          onSelectionChange={(rows) => setSelectedRows(rows)}
        />
      </div>

      {hasRole('Platform Admin') && <JurisdictionsCard store={store} />}
      <PortfoliosCard store={store} />
      <GroupsCard store={store} />
      <PlatformLogCard store={store} />

      <TenantOverlay
        open={overlayOpen}
        onOpenChange={(open) => {
          setOverlayOpen(open)
          if (!open) setEditingTenant(null)
        }}
        tenant={editingTenant}
        store={store}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
