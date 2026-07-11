import { useMemo, useState } from 'react'
import { Pause, PencilSimple, Play, Plus } from 'phosphor-react'
import { RoleGate } from '@/context/role-context'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable } from '@/components/common/data-table/table'
import { SUSPENSION_APPROVERS, type Tenant } from '../data/tenants'
import {
  type TenantsStore,
  type TenantDraft,
  type TenantEditDraft,
} from '../hooks/use-tenants'
import { buildTenantColumns } from './tenant-columns'
import { SubscriptionCard } from './subscription-card'
import { TenantOverlay } from './tenant-overlay'
import { TenantWizard } from './tenant-wizard'

/**
 * Tenants & companies tab (SYS-01, 08, 09, 13, 48) — provisioning wizard,
 * tenant table with the governed suspension flow (mandatory reason +
 * approval, US-PA-07) and the per-tenant subscription card (US-PA-42..44).
 * Jurisdictions/portfolios/groups live on the Portfolios & groups tab.
 */
export function TenantsTab({ store }: { store: TenantsStore }) {
  const [selectedRows, setSelectedRows] = useState<Tenant[]>([])
  const [resetSelectionKey, setResetSelectionKey] = useState(0)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)

  // Governed suspension flow — reason + approver are mandatory (US-PA-07)
  const [suspendTarget, setSuspendTarget] = useState<Tenant | null>(null)
  const [suspendReason, setSuspendReason] = useState('')
  const [suspendApprover, setSuspendApprover] = useState('')

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

  const handleCreate = (draft: TenantDraft) => {
    store.addTenant(draft)
    clearSelection()
  }

  const handleEdit = (draft: TenantEditDraft) => {
    if (editingTenant) store.updateTenant(editingTenant.id, draft)
    clearSelection()
  }

  const openSuspend = (tenant: Tenant) => {
    setSuspendReason('')
    setSuspendApprover('')
    setSuspendTarget(tenant)
  }

  const single = selectedRows.length === 1 ? selectedRows[0] : null

  return (
    <div className='w-full'>
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
                openSuspend(single)
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
                store.reactivateTenant(single.id)
                clearSelection()
              }}
              className='text-neutral-1900 h-7 w-7'
              disabled={!single || single.status !== 'suspended'}
              aria-label='Reactivate'
            >
              <Play size={16} weight='bold' />
            </Button>
            <Button
              variant='red'
              onClick={() => setWizardOpen(true)}
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

      {/* Commercial subscription per tenant (US-PA-42..44) */}
      <SubscriptionCard store={store} />

      {/* 6-step provisioning wizard with duplicate detection (US-PA-01/03) */}
      <TenantWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        store={store}
        onSubmit={handleCreate}
      />

      <TenantOverlay
        open={overlayOpen}
        onOpenChange={(open) => {
          setOverlayOpen(open)
          if (!open) setEditingTenant(null)
        }}
        tenant={editingTenant}
        store={store}
        onSubmit={handleEdit}
      />

      {/* Suspension requires a mandatory reason + approval (US-PA-07) */}
      <ConfirmDialog
        open={suspendTarget !== null}
        onOpenChange={(open) => {
          if (!open) setSuspendTarget(null)
        }}
        destructive
        title={`Suspend ${suspendTarget?.name ?? 'company'}?`}
        desc={
          <>
            Suspending <b>{suspendTarget?.name}</b> ({suspendTarget?.code})
            immediately blocks logins for its{' '}
            {suspendTarget?.employees.toLocaleString('en-US')} employees and
            pauses all HR operations. Data is retained and the tenant can be
            reactivated later. A reason and second-admin approval are
            mandatory and are recorded in the platform log.
          </>
        }
        confirmText='Suspend tenant'
        disabled={suspendReason.trim().length < 5 || suspendApprover === ''}
        handleConfirm={() => {
          if (!suspendTarget) return
          store.suspendTenant(
            suspendTarget.id,
            suspendReason.trim(),
            suspendApprover
          )
          setSuspendTarget(null)
          clearSelection()
        }}
      >
        <div className='space-y-3'>
          <div className='flex flex-col gap-1.5'>
            <Label>Suspension reason (mandatory)</Label>
            <Textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder='e.g. Invoice overdue 60+ days — billing hold pending payment plan'
              rows={3}
            />
          </div>
          <div className='flex flex-col gap-1.5'>
            <Label>Approved by (second administrator)</Label>
            <Select value={suspendApprover} onValueChange={setSuspendApprover}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Select approver' />
              </SelectTrigger>
              <SelectContent>
                {SUSPENSION_APPROVERS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </ConfirmDialog>
    </div>
  )
}
