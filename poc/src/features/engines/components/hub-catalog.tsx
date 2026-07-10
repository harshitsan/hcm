import { useMemo, useState } from 'react'
import { Download, Paperclip, Search, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MODULE_REGISTRY } from '@/config/module-registry'
import {
  ARTIFACT_TYPE_LABELS,
  ARTIFACT_TYPES,
  ROLE_SCOPE,
  SCOPE_TOGGLE_ROLE,
  blockingLevel,
  isEffectivelyActive,
  type Artifact,
  type ArtifactAttachment,
  type ArtifactType,
  type TargetModule,
} from '@/features/workflows/data/business-logic'
import type { BusinessLogicStore } from '@/features/workflows/hooks/use-business-logic'
import { useRole } from '@/context/role-context'
import { AttachDialog } from './attach-dialog'

type BrowseMode = 'by-module' | 'by-type'

/** Registry modules that expose an engine surface (have targetModule). */
const MODULE_RAIL_ITEMS = MODULE_REGISTRY.filter(
  (m) => m.targetModule !== undefined
) as Array<(typeof MODULE_REGISTRY)[number] & { targetModule: TargetModule }>

interface HubCatalogProps {
  store: BusinessLogicStore
}

/**
 * Engines Hub catalog — two browse modes:
 *  "By module": left rail = registry modules with targetModule, count = attachments.
 *  "By type":   left rail = 8 artifact types.
 *
 * Rows reuse the engine-artifacts-panel visual pattern, extended with:
 *  – attachment pills (each with × to detach)
 *  – "Attach…" button (opens AttachDialog)
 *  – "Export" placeholder (disabled, wires in A4)
 */
export function HubCatalog({ store }: HubCatalogProps) {
  const { role } = useRole()
  const myScope = ROLE_SCOPE[role]

  const [browseMode, setBrowseMode] = useState<BrowseMode>('by-module')
  const [selectedModule, setSelectedModule] = useState<TargetModule | null>(
    MODULE_RAIL_ITEMS[0]?.targetModule ?? null
  )
  const [selectedType, setSelectedType] = useState<ArtifactType>(ARTIFACT_TYPES[0])
  const [query, setQuery] = useState('')
  const [attachTarget, setAttachTarget] = useState<Artifact | null>(null)

  /** Count artifacts attached to a module (any submodule counts). */
  function moduleCount(target: TargetModule) {
    return store.artifacts.filter((a) =>
      a.attachments.some((x) => x.module === target)
    ).length
  }

  const filteredArtifacts = useMemo(() => {
    let list = store.artifacts

    if (browseMode === 'by-module' && selectedModule) {
      list = list.filter((a) =>
        a.attachments.some((x) => x.module === selectedModule)
      )
    } else if (browseMode === 'by-type') {
      list = list.filter((a) => a.type === selectedType)
    }

    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q)
      )
    }

    return [...list].sort((a, b) => a.name.localeCompare(b.name))
  }, [store.artifacts, browseMode, selectedModule, selectedType, query])

  function handleDetach(artifact: Artifact, attachment: ArtifactAttachment) {
    store.detach(artifact.id, attachment)
  }

  function handleAttach(attachment: ArtifactAttachment) {
    if (!attachTarget) return
    store.attach(attachTarget.id, attachment)
  }

  return (
    <div className='flex gap-4'>
      {/* ── Left rail ── */}
      <div className='w-52 shrink-0'>
        {/* Browse mode toggle */}
        <Tabs
          value={browseMode}
          onValueChange={(v) => {
            setBrowseMode(v as BrowseMode)
            setQuery('')
          }}
          className='mb-3'
        >
          <TabsList className='w-full'>
            <TabsTrigger value='by-module' className='flex-1'>
              By module
            </TabsTrigger>
            <TabsTrigger value='by-type' className='flex-1'>
              By type
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Rail items */}
        <div className='rounded-[8px] border border-gray-200 bg-white'>
          {browseMode === 'by-module' &&
            MODULE_RAIL_ITEMS.map((m) => {
              const count = moduleCount(m.targetModule)
              const isActive = selectedModule === m.targetModule
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedModule(m.targetModule)}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors first:rounded-t-[8px] last:rounded-b-[8px] ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-neutral-1400 hover:bg-gray-50'
                  }`}
                >
                  <span className='truncate'>{m.name}</span>
                  {count > 0 && (
                    <span
                      className={`ml-1 shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-neutral-1000'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              )
            })}

          {browseMode === 'by-type' &&
            ARTIFACT_TYPES.map((t) => {
              const count = store.artifacts.filter((a) => a.type === t).length
              const isActive = selectedType === t
              return (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors first:rounded-t-[8px] last:rounded-b-[8px] ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-neutral-1400 hover:bg-gray-50'
                  }`}
                >
                  <span className='truncate'>{ARTIFACT_TYPE_LABELS[t]}</span>
                  {count > 0 && (
                    <span
                      className={`ml-1 shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-neutral-1000'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
        </div>
      </div>

      {/* ── Main list ── */}
      <div className='min-w-0 flex-1'>
        {/* Search */}
        <div className='relative mb-3'>
          <Search className='text-neutral-800 absolute top-2 left-2.5 size-3.5' />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Search by name or description…'
            className='h-8 pl-8 text-xs'
          />
        </div>

        {/* Rows */}
        <div className='rounded-[8px] border border-gray-200 bg-white'>
          {filteredArtifacts.length === 0 && (
            <p className='text-neutral-1000 py-10 text-center text-sm'>
              No engine artifacts match this filter.
            </p>
          )}
          {filteredArtifacts.map((a, idx) => {
            const effective = myScope
              ? isEffectivelyActive(a.scopes, myScope)
              : isEffectivelyActive(a.scopes, 'company')
            const blocker = myScope ? blockingLevel(a.scopes, myScope) : null
            const canToggle = myScope && SCOPE_TOGGLE_ROLE[myScope] === role

            return (
              <div
                key={a.id}
                className={`flex flex-wrap items-start gap-3 px-4 py-3 ${
                  idx < filteredArtifacts.length - 1
                    ? 'border-b border-gray-100'
                    : ''
                }`}
              >
                {/* Main info */}
                <div className='min-w-0 flex-1'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <span className='text-neutral-1600 text-sm font-medium'>
                      {a.name}
                    </span>
                    <Badge variant='outline' className='shrink-0 text-[10px]'>
                      {ARTIFACT_TYPE_LABELS[a.type]}
                    </Badge>
                    <Badge variant='secondary' className='shrink-0 text-[10px]'>
                      v{a.version}
                    </Badge>
                  </div>
                  <p className='text-neutral-1000 mt-0.5 text-xs'>
                    {a.description}
                  </p>

                  {/* Attachment pills */}
                  <div className='mt-1.5 flex flex-wrap gap-1'>
                    {a.attachments.map((att, i) => {
                      const pillLabel = att.submodule
                        ? `${att.module} / ${att.submodule}`
                        : att.module
                      return (
                        <span
                          key={i}
                          className='inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] text-neutral-1200'
                        >
                          {pillLabel}
                          <button
                            onClick={() => handleDetach(a, att)}
                            className='text-neutral-800 hover:text-red-600 ml-0.5'
                            aria-label={`Detach from ${pillLabel}`}
                          >
                            <X className='size-2.5' />
                          </button>
                        </span>
                      )
                    })}
                  </div>
                </div>

                {/* Right-side controls */}
                <div className='flex shrink-0 flex-wrap items-center gap-2'>
                  {/* Scope / active status */}
                  <span
                    className={`text-[11px] font-medium ${
                      effective
                        ? 'text-green-700'
                        : blocker && myScope && a.scopes[myScope]
                          ? 'text-amber-600'
                          : 'text-neutral-800'
                    }`}
                  >
                    {effective
                      ? 'Active'
                      : blocker && myScope && a.scopes[myScope]
                        ? `Blocked at ${blocker}`
                        : 'Off'}
                  </span>
                  {myScope && (
                    <Switch
                      checked={a.scopes[myScope]}
                      disabled={!canToggle}
                      onCheckedChange={() => store.toggleScope(a.id, myScope)}
                      aria-label={`Toggle ${a.name} at your scope`}
                    />
                  )}

                  {/* Attach button */}
                  <Button
                    variant='outline'
                    size='sm'
                    className='h-7 gap-1 px-2 text-[11px]'
                    onClick={() => setAttachTarget(a)}
                  >
                    <Paperclip className='size-3' />
                    Attach…
                  </Button>

                  {/* Export placeholder — wires in A4 */}
                  <Button
                    variant='outline'
                    size='sm'
                    className='h-7 gap-1 px-2 text-[11px]'
                    disabled
                    title='Available soon'
                  >
                    <Download className='size-3' />
                    Export
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Attach dialog */}
      {attachTarget && (
        <AttachDialog
          artifact={attachTarget}
          open={!!attachTarget}
          onOpenChange={(open) => {
            if (!open) setAttachTarget(null)
          }}
          onAttach={handleAttach}
        />
      )}
    </div>
  )
}
