import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { DataTable } from '@/components/common/data-table/table'
import { useRole } from '@/context/role-context'
import { type OrgGroup } from '../data/groups'
import { type GroupDraft, type OrgGroupsStore } from '../hooks/use-org-groups'
import { downloadCsv } from '../utils/export'
import { actorFor, canManageGroup, creatableScopes } from '../utils/permissions'
import { memberCountOf, todayIso } from '../utils/resolve'
import { GroupDetailOverlay } from './group-detail-overlay'
import { GroupFormOverlay } from './group-form-overlay'
import { DeleteGroupsDialog, MergeGroupDialog } from './groups-list-dialogs'
import { GroupsPager, OrgSetupStrip } from './groups-list-footer'
import { GroupsListToolbar, type StatusFilter } from './groups-list-toolbar'
import { buildGroupsColumns } from './groups-table-columns'
import { MembersOverlay } from './members-overlay'

const PAGE_SIZE = 8

interface GroupsListTabProps {
  store: OrgGroupsStore
}

/**
 * Main group register: paginated, searchable, status-filterable list with
 * scope-gated CRUD, clone, merge, activate/deactivate, export and the guided
 * org-setup footer (Kensium Group screen counterpart).
 */
export function GroupsListTab({ store }: GroupsListTabProps) {
  const { role } = useRole()
  const actor = actorFor(role)
  const allowedScopes = creatableScopes(role)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [page, setPage] = useState(0)
  const [selectedRows, setSelectedRows] = useState<OrgGroup[]>([])
  const [resetSelectionKey, setResetSelectionKey] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<OrgGroup | null>(null)
  const [cloneSource, setCloneSource] = useState<OrgGroup | null>(null)
  const [viewing, setViewing] = useState<OrgGroup | null>(null)
  const [membersGroup, setMembersGroup] = useState<OrgGroup | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [mergeOpen, setMergeOpen] = useState(false)

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return store.groups
      .filter((g) => statusFilter === 'all' || g.status === statusFilter)
      .filter(
        (g) =>
          !term ||
          g.name.toLowerCase().includes(term) ||
          g.acronym.toLowerCase().includes(term)
      )
  }, [store.groups, search, statusFilter])

  // Pager falls back to a valid page when the total shrinks (GRP-21).
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const pageRows = filtered.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE
  )
  const from = filtered.length === 0 ? 0 : safePage * PAGE_SIZE + 1
  const to = Math.min(filtered.length, (safePage + 1) * PAGE_SIZE)

  const clearSelection = () => {
    setSelectedRows([])
    setResetSelectionKey((k) => k + 1)
  }

  const columns = useMemo(
    () =>
      buildGroupsColumns({
        parentName: (g) =>
          store.groups.find((p) => p.id === g.parentId)?.name ?? '',
        memberCount: (id) => memberCountOf(store.memberships, id, todayIso()),
        canManage: (g) => canManageGroup(role, g),
        onView: (g) => setViewing(g),
        onEdit: (g) => {
          setEditing(g)
          setCloneSource(null)
          setFormOpen(true)
        },
        onMembers: (g) => setMembersGroup(g),
      }),
    [store.groups, store.memberships, role]
  )

  const handleSubmit = (draft: GroupDraft): boolean =>
    editing
      ? store.updateGroup(editing.id, draft, actor)
      : store.addGroup(draft, actor)

  const single = selectedRows.length === 1 ? selectedRows[0] : null

  const handleClone = () => {
    if (!single) return
    if (!canManageGroup(role, single)) {
      toast.error(
        'Clone denied — the source group is outside your authorized scope'
      )
      return
    }
    setEditing(null)
    setCloneSource(single)
    setFormOpen(true)
  }

  const handleToggleStatus = () => {
    if (!single) return
    if (!canManageGroup(role, single)) {
      toast.error('Action denied — outside your authorized scope')
      return
    }
    store.setGroupStatus(
      single.id,
      single.status === 'active' ? 'inactive' : 'active',
      actor
    )
    clearSelection()
  }

  const handleDelete = () => {
    selectedRows.forEach((g) => {
      if (!canManageGroup(role, g)) {
        toast.error(
          `Delete denied for “${g.name}” — outside your authorized scope`
        )
        return
      }
      store.deleteGroup(g.id, actor)
    })
    setConfirmDelete(false)
    clearSelection()
  }

  const handleMerge = (targetId: string) => {
    if (!single || !targetId) return
    store.mergeGroups(single.id, targetId, actor)
    setMergeOpen(false)
    clearSelection()
  }

  const handleExportList = () => {
    downloadCsv(
      `groups-${todayIso()}.csv`,
      [
        'Name',
        'Acronym',
        'Description',
        'Scope',
        'Status',
        'Applicability',
        'Members',
      ],
      filtered.map((g) => [
        g.name,
        g.acronym,
        g.description,
        g.scope,
        g.status,
        g.applicability,
        memberCountOf(store.memberships, g.id, todayIso()),
      ])
    )
    toast.success('Group list exported (tenant-scoped rows only)')
  }

  return (
    <div className='w-full'>
      <GroupsListToolbar
        search={search}
        onSearchChange={(v) => {
          setSearch(v)
          setPage(0)
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={(v) => {
          setStatusFilter(v)
          setPage(0)
        }}
        hasSingleSelection={Boolean(single)}
        canMergeSelection={Boolean(single && canManageGroup(role, single))}
        hasSelection={selectedRows.length > 0}
        canCreate={allowedScopes.length > 0}
        onRefresh={() => {
          clearSelection()
          setPage(0)
          toast.success('Group list refreshed — showing the current set')
        }}
        onExport={handleExportList}
        onClone={handleClone}
        onToggleStatus={handleToggleStatus}
        onMerge={() => setMergeOpen(true)}
        onDelete={() => setConfirmDelete(true)}
        onNew={() => {
          setEditing(null)
          setCloneSource(null)
          setFormOpen(true)
        }}
      />

      <DataTable
        columns={columns}
        data={pageRows}
        variant='no-status'
        resetSelectionKey={resetSelectionKey}
        onSelectionChange={setSelectedRows}
      />

      <GroupsPager
        from={from}
        to={to}
        total={filtered.length}
        page={safePage}
        pageCount={pageCount}
        onPageChange={setPage}
      />

      <OrgSetupStrip />

      <GroupFormOverlay
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o)
          if (!o) {
            setEditing(null)
            setCloneSource(null)
          }
        }}
        group={editing}
        cloneSource={cloneSource}
        allowedScopes={allowedScopes}
        groups={store.groups}
        onSubmit={handleSubmit}
      />

      <GroupDetailOverlay
        open={Boolean(viewing)}
        onOpenChange={(o) => !o && setViewing(null)}
        group={viewing}
        store={store}
      />

      <MembersOverlay
        open={Boolean(membersGroup)}
        onOpenChange={(o) => !o && setMembersGroup(null)}
        group={membersGroup}
        store={store}
      />

      <DeleteGroupsDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        count={selectedRows.length}
        onConfirm={handleDelete}
      />

      <MergeGroupDialog
        open={mergeOpen}
        onOpenChange={setMergeOpen}
        source={single}
        targets={store.groups.filter(
          (g) =>
            g.id !== single?.id &&
            g.status === 'active' &&
            canManageGroup(role, g)
        )}
        sourcePolicies={single ? store.policiesUsing(single.id) : []}
        onConfirm={handleMerge}
      />
    </div>
  )
}
