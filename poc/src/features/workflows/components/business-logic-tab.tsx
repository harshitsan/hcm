import { useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { List, Plus } from 'phosphor-react'
import type { Role } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DataTable } from '@/components/common/data-table/table'
import { LongText } from '@/components/common/long-text'
import {
  PagerControls,
  usePager,
} from '@/features/leave/components/list-controls'
import {
  ARTIFACT_TYPES,
  ARTIFACT_TYPE_LABELS,
  blockingLevel,
  isEffectivelyActive,
  ROLE_SCOPE,
  SCOPE_LABELS,
  SCOPE_LEVELS,
  SCOPE_SHORT,
  TARGET_MODULES,
  type Artifact,
  type ArtifactType,
} from '../data/business-logic'
import type { BusinessLogicStore } from '../hooks/use-business-logic'
import { ArtifactBuilderSheet } from './artifact-builder-sheet'
import { ArtifactDetailSheet } from './artifact-detail-sheet'
import { HubCatalog } from './hub-catalog'
import { LayerBanner } from './layer-banner'
import { ModuleLink } from './module-link'
import { SummaryCards } from './summary-cards'
import { SectionToolbar, SortableHeader } from './table-helpers'
import { useWorkflowEditor } from './workflow-editor-context'
import { WorkflowChip } from './workflow-chip'

const TYPE_BADGE_VARIANT: Record<
  ArtifactType,
  'open' | 'pending' | 'completed' | 'live' | 'badge_inactive' | 'overdue' | 'badge_active'
> = {
  'approver-chain': 'open',
  'decision-rule': 'pending',
  'custom-form': 'completed',
  checklist: 'live',
  template: 'badge_inactive',
  alert: 'overdue',
  setting: 'badge_active',
  flow: 'open',
}

function TypeBadge({ type }: { type: ArtifactType }) {
  return (
    <Badge variant={TYPE_BADGE_VARIANT[type]}>
      {ARTIFACT_TYPE_LABELS[type]}
    </Badge>
  )
}

interface ArtifactRow extends Artifact {
  typeLabel: string
}

const BASE_COLUMNS: ColumnDef<ArtifactRow>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <SortableHeader column={column} label='Workflow' />,
    cell: ({ row }) => (
      <div className='flex min-w-0 flex-col'>
        <div className='flex items-center gap-1.5'>
          <LongText className='text-neutral-1600 font-medium'>
            {row.original.name}
          </LongText>
          <WorkflowChip artifactId={row.original.id} />
        </div>
        <span className='text-paragraph-sm text-neutral-1000 truncate'>
          {row.original.description}
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'typeLabel',
    header: ({ column }) => <SortableHeader column={column} label='Type' />,
    cell: ({ row }) => <TypeBadge type={row.original.type} />,
  },
  {
    accessorKey: 'targetModule',
    header: ({ column }) => (
      <SortableHeader column={column} label='Target module' />
    ),
    cell: ({ row }) => (
      <ModuleLink
        module={row.original.targetModule}
        className='text-neutral-1900 text-sm'
      />
    ),
  },
  {
    accessorKey: 'version',
    header: ({ column }) => <SortableHeader column={column} label='Version' />,
    cell: ({ row }) => <Badge variant='live'>v{row.original.version}</Badge>,
  },
  {
    id: 'scopes',
    header: () => (
      <span className='text-paragraph-sm font-medium'>Effective scopes</span>
    ),
    // Layered governance made visible (WFE-47): green = effectively active,
    // grey pill with dot = enabled at this level but blocked upstream.
    // Each letter badge carries a hover tooltip spelling out its level.
    cell: ({ row }) => (
      <div className='flex gap-1 p-1'>
        {SCOPE_LEVELS.map((level) => {
          const enabled = row.original.scopes[level]
          const effective = isEffectivelyActive(row.original.scopes, level)
          const blocker = blockingLevel(row.original.scopes, level)
          const explanation =
            enabled && !effective && blocker
              ? `Turned on at ${SCOPE_LABELS[level]}, but not active because ${SCOPE_LABELS[blocker]} has it turned off`
              : effective
                ? 'Active at this level'
                : 'Turned off at this level'
          return (
            <Tooltip key={level}>
              <TooltipTrigger asChild>
                <span>
                  <Badge
                    variant={
                      effective
                        ? 'badge_active'
                        : enabled
                          ? 'pending'
                          : 'badge_inactive'
                    }
                  >
                    {SCOPE_SHORT[level]}
                  </Badge>
                </span>
              </TooltipTrigger>
              <TooltipContent side='top'>
                <span className='font-medium'>{SCOPE_LABELS[level]}</span> —{' '}
                {explanation}
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    ),
  },
  {
    accessorKey: 'updatedAt',
    header: ({ column }) => <SortableHeader column={column} label='Updated' />,
    cell: ({ row }) => (
      <div className='flex min-w-0 flex-col'>
        <span className='text-neutral-1900 text-sm'>
          {row.original.updatedAt}
        </span>
        <span className='text-paragraph-sm text-neutral-1000'>
          {row.original.updatedBy}
        </span>
      </div>
    ),
  },
]

/**
 * Business-logic artifact catalog (WFE-43 … WFE-49): every configuration
 * screen — approver chains, rules, forms, checklists, templates, alerts,
 * settings — is one engine's artifact, attached to a target module and
 * enabled/disabled per scope level. Kensium's 190 Configuration screens
 * generalize to rows in this catalog.
 */
export function BusinessLogicTab({
  store,
  role,
  search,
  onSearchChange,
}: {
  store: BusinessLogicStore
  role: Role
  /** Lifted so the module-wide "Find any setting…" search can pre-filter. */
  search: string
  onSearchChange: (value: string) => void
}) {
  const { artifacts, createArtifact, updateArtifact, toggleScope, deleteArtifact } =
    store

  const { openEditor } = useWorkflowEditor()

  const [moduleFilter, setModuleFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [builderOpen, setBuilderOpen] = useState(false)
  const [editing, setEditing] = useState<Artifact | null>(null)

  // Browse (rail + folders + attach, absorbed from the Engines Hub) vs the
  // governance table (scope matrix, sortable columns).
  const [view, setView] = useState<'browse' | 'table'>('browse')

  // "Find any setting…" jumps target a specific workflow by name — land those
  // on the table, where the lifted search prop drives the filter.
  useEffect(() => {
    if (search.trim() !== '') setView('table')
  }, [search])

  // Build columns inside the component so the Details action can close over setDetailId.
  const columns = useMemo<ColumnDef<ArtifactRow>[]>(() => [
    ...BASE_COLUMNS,
    {
      id: 'actions',
      header: () => null,
      cell: ({ row }) => (
        <Button
          variant='ghost'
          size='icon'
          className='h-6 w-6 shrink-0 text-neutral-700 hover:text-neutral-1600'
          title='Details (scopes, history, delete)'
          onClick={(e) => {
            e.stopPropagation()
            setDetailId(row.original.id)
          }}
        >
          <List size={14} />
        </Button>
      ),
    },
  ], [])

  /** Authoring new artifacts is reserved for Company and Platform Admins (WFE-44). */
  const canAuthor = role === 'Company Admin' || role === 'Platform Admin'
  /** Governance (edit/delete existing artifacts) extends to Portfolio Admins. */
  const canGovern =
    canAuthor || role === 'Portfolio Admin'
  const myScope = ROLE_SCOPE[role]

  const rows = useMemo<ArtifactRow[]>(() => {
    const q = search.trim().toLowerCase()
    return artifacts
      .filter((a) => moduleFilter === 'all' || a.targetModule === moduleFilter)
      .filter((a) => typeFilter === 'all' || a.type === typeFilter)
      .filter(
        (a) =>
          q === '' ||
          a.name.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.targetModule.toLowerCase().includes(q)
      )
      .map((a) => ({ ...a, typeLabel: ARTIFACT_TYPE_LABELS[a.type] }))
  }, [artifacts, moduleFilter, typeFilter, search])

  const summary = useMemo(
    () => [
      { label: 'Workflows', value: artifacts.length },
      {
        label: myScope ? 'Active at your scope' : 'Enabled anywhere',
        value: artifacts.filter((a) =>
          myScope
            ? isEffectivelyActive(a.scopes, myScope)
            : SCOPE_LEVELS.some((l) => a.scopes[l])
        ).length,
      },
      {
        label: 'Modules covered',
        value: new Set(artifacts.map((a) => a.targetModule)).size,
      },
      {
        label: 'Workflow kinds in use',
        value: new Set(artifacts.map((a) => a.type)).size,
      },
    ],
    [artifacts, myScope]
  )

  // The governance table pages through the catalog instead of rendering all
  // 200+ rows at once; "Showing X of Y" keeps the header count honest.
  const pager = usePager(rows, 25)

  const detail = artifacts.find((a) => a.id === detailId) ?? null

  const openBuilder = () => {
    setEditing(null)
    setBuilderOpen(true)
  }

  return (
    <div className='w-full'>
      <SummaryCards title='One engine — every configuration screen' items={summary} />

      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
        <p className='text-neutral-1000 text-sm'>
          Every workflow is created once here, then turned on or off at each
          level — Platform, Portfolio, Group company and Company — by the admin
          who owns that level. The module it targets picks it up automatically;
          a module&apos;s Admin view is simply this catalog filtered to that
          module.
        </p>
        <Tabs value={view} onValueChange={(v) => setView(v as 'browse' | 'table')}>
          <TabsList>
            <TabsTrigger value='browse' className='text-xs'>
              Browse
            </TabsTrigger>
            <TabsTrigger value='table' className='text-xs'>
              Governance table
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {view === 'browse' ? (
        <HubCatalog
          store={store}
          onNew={canAuthor ? openBuilder : undefined}
          onDetails={setDetailId}
        />
      ) : (
        <>
          {/* Filtering to one module IS the consume layer — that module's config view. */}
          <LayerBanner active={moduleFilter === 'all' ? 'govern' : 'consume'} />

          <SectionToolbar title={`Workflow catalog (${rows.length})`}>
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder='Search workflows'
              className='h-7 w-[180px]'
            />
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger variant='secondary' className='h-7 w-[200px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All modules</SelectItem>
                {TARGET_MODULES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger variant='secondary' className='h-7 w-[170px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All types</SelectItem>
                {ARTIFACT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {ARTIFACT_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {canAuthor && (
              <Button
                variant='red'
                onClick={openBuilder}
                className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
              >
                <Plus size={10} weight='bold' />
                New workflow
              </Button>
            )}
          </SectionToolbar>

          <div className='mb-2 flex flex-wrap items-center justify-between gap-2'>
            <span className='text-neutral-1000 text-xs'>
              Showing {pager.pageItems.length} of {pager.total} workflow
              {pager.total === 1 ? '' : 's'}
            </span>
            <span className='text-neutral-1000 text-xs'>
              Scope levels: P = Platform · PF = Portfolio · G = Group company ·
              C = Company. Green = active there; grey pill = turned on there
              but blocked by a level above; muted = turned off.
            </span>
          </div>

          <DataTable
            columns={columns}
            data={pager.pageItems}
            variant='no-status'
            onRowClick={(row) => openEditor(row.id)}
          />

          <PagerControls
            page={pager.page}
            pageCount={pager.pageCount}
            total={pager.total}
            onPrev={pager.prev}
            onNext={pager.next}
          />
        </>
      )}

      <ArtifactDetailSheet
        artifact={detail}
        open={detail !== null}
        onOpenChange={(open) => {
          if (!open) setDetailId(null)
        }}
        role={role}
        canAuthor={canGovern}
        onToggleScope={(level) => {
          if (detail) toggleScope(detail.id, level)
        }}
        onEdit={() => {
          if (!detail) return
          setDetailId(null)
          openEditor(detail.id)
        }}
        onDelete={() => {
          if (detail) deleteArtifact(detail.id)
          setDetailId(null)
        }}
      />

      <ArtifactBuilderSheet
        open={builderOpen}
        onOpenChange={(open) => {
          setBuilderOpen(open)
          if (!open) setEditing(null)
        }}
        artifact={editing}
        onSave={(draft) => {
          if (editing) updateArtifact(editing.id, draft)
          else createArtifact(draft)
        }}
      />
    </div>
  )
}
