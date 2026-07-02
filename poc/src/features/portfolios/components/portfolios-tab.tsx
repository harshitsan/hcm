import { useMemo, useState } from 'react'
import { Buildings, Code, Eye, PencilSimple, Plus } from 'phosphor-react'
import { RoleGate, useRole } from '@/context/role-context'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/common/data-table/table'
import {
  MANAGER_BY_ID,
  PERSONAS,
  companyName,
  type Portfolio,
} from '../data/portfolios'
import { type PortfoliosStore } from '../hooks/use-portfolios'
import { ApiReferenceDialog } from './api-reference-dialog'
import { ManageCompaniesOverlay } from './manage-companies-overlay'
import { PortfolioOverlay, type PortfolioFormValues } from './portfolio-overlay'
import {
  portfoliosTableColumns,
  type PortfolioRow,
} from './portfolios-table-columns'

interface PortfoliosTabProps {
  store: PortfoliosStore
}

/**
 * Portfolio list & administration (PORT-01…PORT-11, PORT-27). Create is
 * Platform-Admin-only per §7.1 RBAC; Manage Companies is additionally open
 * to the portfolio's own Portfolio Admin.
 */
export function PortfoliosTab({ store }: PortfoliosTabProps) {
  const { role } = useRole()
  const persona = PERSONAS[role]

  const [selectedRows, setSelectedRows] = useState<PortfolioRow[]>([])
  const [resetSelectionKey, setResetSelectionKey] = useState(0)
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [editing, setEditing] = useState<Portfolio | null>(null)
  const [managing, setManaging] = useState<Portfolio | null>(null)
  /** View Details opens the same sheet read-only (PORT-10). */
  const [viewOnly, setViewOnly] = useState(false)
  const [apiOpen, setApiOpen] = useState(false)

  const rows = useMemo<PortfolioRow[]>(
    () =>
      store.portfolios.map((p) => {
        const manager = MANAGER_BY_ID[p.managerId]
        return {
          portfolio: p,
          code: p.code,
          name: p.name,
          description: p.description,
          managerName: manager?.name ?? '—',
          managerEmail: manager?.email ?? '—',
          companyNames: p.companies.map((l) => companyName(l.companyId)),
          status: p.status,
          createdDate: p.createdDate,
        }
      }),
    [store.portfolios]
  )

  const clearSelection = () => {
    setSelectedRows([])
    setResetSelectionKey((prev) => prev + 1)
  }

  const selected = selectedRows.length === 1 ? selectedRows[0].portfolio : null

  const isOwnPortfolio = (p: Portfolio | null) =>
    p !== null && p.id === persona.managedPortfolioId

  const canEditSelected =
    selected !== null &&
    (role === 'Platform Admin' ||
      (role === 'Portfolio Admin' && isOwnPortfolio(selected)))

  const canManageSelected = canEditSelected

  const handleSubmit = (values: PortfolioFormValues): boolean => {
    if (editing) {
      return store.updatePortfolio(editing.id, {
        name: values.name,
        description: values.description,
        managerId: values.managerId,
        status: values.status,
      })
    }
    const ok = store.createPortfolio({
      name: values.name,
      description: values.description,
      managerId: values.managerId,
      companyIds: values.companyIds,
    })
    if (ok) clearSelection()
    return ok
  }

  return (
    <div className='w-full'>
      <div className='mb-3 flex items-center justify-between'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          Portfolios ({store.portfolios.length})
        </h2>
        <div className='flex items-center gap-3'>
          <Button
            variant='icon2'
            onClick={() => setApiOpen(true)}
            className='text-neutral-1900 h-7 w-7'
            aria-label='API reference'
          >
            <Code size={16} weight='bold' />
          </Button>
          <Button
            variant='icon2'
            onClick={() => {
              if (!selected) return
              setViewOnly(true)
              setManaging(selected)
            }}
            className='text-neutral-1900 h-7 w-7'
            disabled={!selected}
            aria-label='View details'
          >
            <Eye size={16} weight='bold' />
          </Button>
          <Button
            variant='icon2'
            onClick={() => {
              if (!selected) return
              setEditing(selected)
              setOverlayOpen(true)
            }}
            className='text-neutral-1900 h-7 w-7'
            disabled={!canEditSelected}
            aria-label='Edit'
          >
            <PencilSimple size={16} weight='fill' />
          </Button>
          <Button
            variant='outline'
            onClick={() => {
              if (!selected) return
              setViewOnly(false)
              setManaging(selected)
            }}
            className='h-7 gap-1 rounded-[6px] px-2'
            disabled={!canManageSelected}
          >
            <Buildings size={14} weight='bold' />
            Manage Companies
          </Button>
          {/* Create Portfolio is denied to every role except Platform Admin
              (PORT-01, PORT-10). */}
          <RoleGate roles={['Platform Admin']}>
            <Button
              variant='red'
              onClick={() => {
                setEditing(null)
                setOverlayOpen(true)
              }}
              className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
            >
              <Plus size={10} weight='bold' />
              Create Portfolio
            </Button>
          </RoleGate>
        </div>
      </div>

      <DataTable
        columns={portfoliosTableColumns}
        data={rows}
        variant='no-status'
        resetSelectionKey={resetSelectionKey}
        onSelectionChange={(r) => setSelectedRows(r)}
      />

      <PortfolioOverlay
        open={overlayOpen}
        onOpenChange={(open) => {
          setOverlayOpen(open)
          if (!open) setEditing(null)
        }}
        portfolio={editing}
        portfolios={store.portfolios}
        companyAssignment={store.companyAssignment}
        onSubmit={handleSubmit}
      />

      <ManageCompaniesOverlay
        open={managing !== null}
        onOpenChange={(open) => !open && setManaging(null)}
        portfolio={managing}
        store={store}
        canManage={
          !viewOnly &&
          (role === 'Platform Admin' ||
            (role === 'Portfolio Admin' && isOwnPortfolio(managing)))
        }
      />

      <ApiReferenceDialog open={apiOpen} onOpenChange={setApiOpen} />
    </div>
  )
}
