import { useMemo, useState } from 'react'
import { PencilSimple, Plus } from 'phosphor-react'
import { toast } from 'sonner'
import { useRole } from '@/context/role-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/common/data-table/table'
import {
  activeMemberships,
  PERSONAS,
  seedPortfolios,
  type GroupCompany,
} from '../data/group-companies'
import { type GroupCompaniesStore } from '../hooks/use-group-companies'
import { ScenarioBadges } from './group-badges'
import { buildGroupColumns } from './groups-table-columns'
import { MembersPanel } from './members-panel'
import { NewGroupOverlay } from './new-group-overlay'

interface ConstructsTabProps {
  store: GroupCompaniesStore
}

/**
 * Metadata-driven construct management screen (GRP-01/15/16/22/26 + GRP-09
 * portfolio governance). Creation is Platform Admin-only; management is
 * limited to the owning Group Company Admin or a Platform Admin.
 */
export function ConstructsTab({ store }: ConstructsTabProps) {
  const { role } = useRole()
  const persona = PERSONAS[role]
  const isEmployee = role === 'Employee (User)' || role === 'Employee (Non-User)'

  const [selectedRows, setSelectedRows] = useState<GroupCompany[]>([])
  const [resetSelectionKey, setResetSelectionKey] = useState(0)
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<GroupCompany | null>(null)

  const columns = useMemo(() => buildGroupColumns(store.companies), [store.companies])
  const selected = selectedRows[0]
  const liveSelected = selected
    ? store.groups.find((g) => g.id === selected.id)
    : undefined

  const canManage = (group: GroupCompany) =>
    role === 'Platform Admin' ||
    (role === 'Group Company Admin' && group.administratorEmail === persona.email)

  const handleNew = () => {
    if (role !== 'Platform Admin') {
      toast.error('AUTH_001 — only a Platform Admin can create group-company structures (§7.1)')
      return
    }
    setEditingGroup(null)
    setOverlayOpen(true)
  }

  const handleEdit = () => {
    if (!liveSelected) return
    if (!canManage(liveSelected)) {
      toast.error(`AUTH_001 — ${liveSelected.code} can only be managed by its Group Company Admin (${liveSelected.administratorName}) or a Platform Admin`)
      return
    }
    setEditingGroup(liveSelected)
    setOverlayOpen(true)
  }

  const handleSubmit = (draft: Parameters<typeof store.createGroup>[0]) =>
    editingGroup ? store.updateGroup(editingGroup.id, draft) : store.createGroup(draft)

  return (
    <div className='w-full'>
      <div className='mb-3 flex items-center justify-between'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          Group-company constructs ({store.groups.length})
        </h2>
        {!isEmployee && (
          <div className='flex items-center gap-3'>
            <Button
              variant='icon2'
              onClick={handleEdit}
              className='text-neutral-1900 h-7 w-7'
              disabled={selectedRows.length !== 1}
              aria-label='Edit'
            >
              <PencilSimple size={16} weight='fill' />
            </Button>
            <Button
              variant='red'
              onClick={handleNew}
              className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
            >
              <Plus size={10} weight='bold' />
              New Group
            </Button>
          </div>
        )}
      </div>

      <DataTable
        columns={columns}
        data={store.groups}
        variant='no-status'
        resetSelectionKey={resetSelectionKey}
        onSelectionChange={(rows) => setSelectedRows(rows)}
      />

      {liveSelected ? (
        <MembersPanel
          group={liveSelected}
          store={store}
          canManage={canManage(liveSelected)}
        />
      ) : (
        <p className='text-paragraph-sm text-neutral-1000 mt-3'>
          Select a construct to view its effective-dated membership, history and
          as-of queries. Companies not added to any construct remain isolated.
        </p>
      )}

      {role === 'Portfolio Admin' && (
        <Card className='mt-4 gap-3 border-gray-200 py-4'>
          <CardHeader className='px-4'>
            <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
              Portfolio governance — {seedPortfolios.find((p) => p.id === persona.portfolioId)?.name}
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-3 px-4'>
            {store.groups.map((g) => {
              const members = activeMemberships(g)
              const inScope = members.filter(
                (m) =>
                  store.companies.find((c) => c.id === m.companyId)?.portfolioId ===
                  persona.portfolioId
              )
              return (
                <div
                  key={g.id}
                  className='flex flex-wrap items-center justify-between gap-2 rounded-md border border-gray-200 bg-white px-3 py-2'
                >
                  <div className='flex flex-col'>
                    <span className='text-sm font-medium'>
                      {g.code} — {g.name}
                    </span>
                    <span className='text-paragraph-sm text-neutral-1000'>
                      {inScope.length} of {members.length} member companies in
                      your portfolio scope
                      {inScope.length < members.length
                        ? ' — out-of-scope members are read-only'
                        : ''}
                    </span>
                  </div>
                  <ScenarioBadges group={g} />
                </div>
              )
            })}
            <p className='text-paragraph-sm text-neutral-1000'>
              Constructs are governed at the portfolio level: creation stays
              with Platform Admins (§7.1), while shared-scenario authorizations
              are managed as versioned configuration in the Sharing & Roles tab.
              Every construct change is auditable.
            </p>
          </CardContent>
        </Card>
      )}

      <NewGroupOverlay
        open={overlayOpen}
        onOpenChange={(open) => {
          setOverlayOpen(open)
          if (!open) {
            setEditingGroup(null)
            setSelectedRows([])
            setResetSelectionKey((k) => k + 1)
          }
        }}
        group={editingGroup}
        companies={store.companies}
        groupOfCompany={store.groupOfCompany}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
