import { useMemo, useRef, useState } from 'react'
import { Download, Paperclip, Pencil, Plus, Search, Trash2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
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
import { parseBundle, serializeBundle } from '@/features/workflows/data/artifact-io'
import type { BusinessLogicStore } from '@/features/workflows/hooks/use-business-logic'
import {
  effectiveFolderId,
  useWorkflowFolders,
  type WorkflowFolder,
} from '@/features/workflows/hooks/use-workflow-folders'
import { useRole } from '@/context/role-context'
import { cn } from '@/utils/helpers'
import { WorkflowChip } from '@/features/workflows/components/workflow-chip'
import { AttachDialog } from './attach-dialog'

/** Blob + URL.createObjectURL + anchor download — same pattern as downloadSampleXml. */
function downloadBundle(artifacts: Artifact[], filename: string) {
  const blob = new Blob([serializeBundle(artifacts)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

type BrowseMode = 'by-module' | 'by-type' | 'folders'

/** "All workflows" sentinel — not a folder id, just a UI selection value. */
const FOLDER_ALL = '__all__'
/** "Ungrouped" sentinel — maps to folderId === null. */
const FOLDER_UNGROUPED = '__ungrouped__'

/** Registry modules that expose an engine surface (have targetModule). */
const MODULE_RAIL_ITEMS = MODULE_REGISTRY.filter(
  (m) => m.targetModule !== undefined
) as Array<(typeof MODULE_REGISTRY)[number] & { targetModule: TargetModule }>

interface HubCatalogProps {
  store: BusinessLogicStore
}

/**
 * Engines Hub catalog — three browse modes:
 *  "By module": left rail = registry modules with targetModule, count = attachments.
 *  "By type":   left rail = 8 artifact types.
 *  "Folders":   left rail = folder file-manager with CRUD + drag-and-drop.
 *
 * Rows reuse the engine-artifacts-panel visual pattern, extended with:
 *  – attachment pills (each with × to detach)
 *  – "Attach…" button (opens AttachDialog)
 *  – "Export" placeholder (disabled, wires in A4)
 *  – "Move to…" Select (a11y fallback for drag-and-drop)
 */
export function HubCatalog({ store }: HubCatalogProps) {
  const { role } = useRole()
  const myScope = ROLE_SCOPE[role]
  const folderStore = useWorkflowFolders()

  const [browseMode, setBrowseMode] = useState<BrowseMode>('by-module')
  const [selectedModule, setSelectedModule] = useState<TargetModule | null>(
    MODULE_RAIL_ITEMS[0]?.targetModule ?? null
  )
  const [selectedType, setSelectedType] = useState<ArtifactType>(ARTIFACT_TYPES[0])
  const [query, setQuery] = useState('')
  const [attachTarget, setAttachTarget] = useState<Artifact | null>(null)
  const importFileRef = useRef<HTMLInputElement>(null)

  // Folder mode state
  const [selectedFolderItem, setSelectedFolderItem] = useState<string>(FOLDER_ALL)
  const [newFolderName, setNewFolderName] = useState('')
  const [showNewFolderInput, setShowNewFolderInput] = useState(false)
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null)
  const [renamingFolderName, setRenamingFolderName] = useState('')

  // Drag-and-drop state
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null)
  const dragEnterCounters = useRef<Map<string, number>>(new Map())

  /** Count artifacts attached to a module (any submodule counts). */
  function moduleCount(target: TargetModule) {
    return store.artifacts.filter((a) =>
      a.attachments.some((x) => x.module === target)
    ).length
  }

  /** Count artifacts in a given folder (by effectiveFolderId). */
  function folderCount(folderId: string) {
    return store.artifacts.filter((a) => effectiveFolderId(a) === folderId).length
  }

  /** Count explicitly ungrouped artifacts (folderId === null). */
  const ungroupedCount = useMemo(
    () => store.artifacts.filter((a) => a.folderId === null).length,
    [store.artifacts]
  )

  const filteredArtifacts = useMemo(() => {
    let list = store.artifacts

    if (browseMode === 'by-module' && selectedModule) {
      list = list.filter((a) =>
        a.attachments.some((x) => x.module === selectedModule)
      )
    } else if (browseMode === 'by-type') {
      list = list.filter((a) => a.type === selectedType)
    } else if (browseMode === 'folders') {
      if (selectedFolderItem === FOLDER_UNGROUPED) {
        list = list.filter((a) => a.folderId === null)
      } else if (selectedFolderItem !== FOLDER_ALL) {
        list = list.filter((a) => effectiveFolderId(a) === selectedFolderItem)
      }
      // FOLDER_ALL → no filter, show all workflows
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
  }, [store.artifacts, browseMode, selectedModule, selectedType, selectedFolderItem, query])

  function handleDetach(artifact: Artifact, attachment: ArtifactAttachment) {
    store.detach(artifact.id, attachment)
  }

  function handleAttach(attachment: ArtifactAttachment) {
    if (!attachTarget) return
    store.attach(attachTarget.id, attachment)
  }

  /** Export the current filtered view as a bundle. */
  function handleToolbarExport() {
    if (filteredArtifacts.length === 0) {
      toast.error('No workflows to export — adjust the filter first.')
      return
    }
    let label: string
    if (browseMode === 'by-module') {
      label = (selectedModule ?? 'all').toString().replace(/\s+/g, '-').toLowerCase()
    } else if (browseMode === 'by-type') {
      label = selectedType
    } else {
      label = 'folders'
    }
    downloadBundle(filteredArtifacts, `workflows-${label}.json`)
    toast.success(`Exported ${filteredArtifacts.length} workflow${filteredArtifacts.length !== 1 ? 's' : ''}`)
  }

  /** Export a single row artifact as a bundle. */
  function handleRowExport(artifact: Artifact) {
    downloadBundle(
      [artifact],
      `workflow-${artifact.name.replace(/\s+/g, '-').toLowerCase()}.json`
    )
    toast.success(`"${artifact.name}" exported`)
  }

  /** Read the selected .json file and import it. */
  function handleImportFile(file: File | undefined) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result
      if (typeof text !== 'string') return
      const result = parseBundle(text)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      const { imported, renamed } = store.importArtifacts(result.artifacts)
      const suffix = renamed > 0 ? ` (${renamed} renamed)` : ''
      toast.success(`Imported ${imported} workflow${imported !== 1 ? 's' : ''}${suffix}`)
    }
    reader.readAsText(file)
    // Reset so the same file can be re-imported if needed
    if (importFileRef.current) importFileRef.current.value = ''
  }

  // ── Folder CRUD handlers ──────────────────────────────────────────────────

  function handleCreateFolder() {
    const name = newFolderName.trim()
    if (!name) return
    folderStore.createFolder(name)
    setNewFolderName('')
    setShowNewFolderInput(false)
    toast.success(`Folder "${name}" created`)
  }

  function handleStartRename(folder: WorkflowFolder) {
    setRenamingFolderId(folder.id)
    setRenamingFolderName(folder.name)
  }

  function handleConfirmRename(id: string) {
    const name = renamingFolderName.trim()
    if (name) {
      folderStore.renameFolder(id, name)
    }
    setRenamingFolderId(null)
    setRenamingFolderName('')
  }

  function handleDeleteFolder(folder: WorkflowFolder) {
    if (
      !window.confirm(
        `Delete folder "${folder.name}"? All workflows inside will be moved to Ungrouped.`
      )
    )
      return
    // Move members to root before deleting (per plan spec)
    store.artifacts
      .filter((a) => effectiveFolderId(a) === folder.id)
      .forEach((a) => store.moveToFolder(a.id, null))
    folderStore.deleteFolder(folder.id)
    // If the deleted folder was selected, fall back to "All workflows"
    if (selectedFolderItem === folder.id) {
      setSelectedFolderItem(FOLDER_ALL)
    }
    toast.success(`Folder "${folder.name}" deleted — workflows moved to Ungrouped`)
  }

  // ── Drag-and-drop handlers ────────────────────────────────────────────────

  function handleDragStart(e: React.DragEvent<HTMLDivElement>, artifactId: string) {
    e.dataTransfer.setData('text/plain', artifactId)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e: React.DragEvent, targetId: string) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverFolderId(targetId)
  }

  function handleDragEnter(e: React.DragEvent, targetId: string) {
    e.preventDefault()
    const count = (dragEnterCounters.current.get(targetId) ?? 0) + 1
    dragEnterCounters.current.set(targetId, count)
    setDragOverFolderId(targetId)
  }

  function handleDragLeave(_e: React.DragEvent, targetId: string) {
    const count = (dragEnterCounters.current.get(targetId) ?? 1) - 1
    dragEnterCounters.current.set(targetId, count)
    if (count <= 0) {
      dragEnterCounters.current.delete(targetId)
      // Only clear the highlight if this target still owns it — when the
      // cursor slides A→B, A's trailing dragleave must not clear B's highlight.
      setDragOverFolderId((cur) => (cur === targetId ? null : cur))
    }
  }

  /** Reset all drag-over state when a drag ends without a registered drop
   *  (cancelled via Escape, or dropped outside any folder target). */
  function handleDragEnd() {
    dragEnterCounters.current.clear()
    setDragOverFolderId(null)
  }

  function handleDrop(e: React.DragEvent, folderId: string | null) {
    e.preventDefault()
    const artifactId = e.dataTransfer.getData('text/plain')
    if (!artifactId) return
    store.moveToFolder(artifactId, folderId)
    // Clear all drag-over state
    dragEnterCounters.current.clear()
    setDragOverFolderId(null)
  }

  // ── Derived folder sections ───────────────────────────────────────────────

  const derivedFolders = folderStore.folders.filter((f) => f.derived)
  const userFolders = folderStore.folders.filter((f) => !f.derived)

  // Sentinel key for "Ungrouped" drop zone in dnd
  const UNGROUPED_DROP_KEY = '__ungrouped_drop__'

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
            <TabsTrigger value='by-module' className='flex-1 text-xs'>
              By module
            </TabsTrigger>
            <TabsTrigger value='by-type' className='flex-1 text-xs'>
              By type
            </TabsTrigger>
            <TabsTrigger value='folders' className='flex-1 text-xs'>
              Folders
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

          {browseMode === 'folders' && (
            <div className='py-1'>
              {/* All workflows */}
              <button
                onClick={() => setSelectedFolderItem(FOLDER_ALL)}
                className={cn(
                  'flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors rounded-t-[8px]',
                  selectedFolderItem === FOLDER_ALL
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-neutral-1400 hover:bg-gray-50'
                )}
              >
                <span>All workflows</span>
                <span
                  className={cn(
                    'ml-1 shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                    selectedFolderItem === FOLDER_ALL
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-neutral-1000'
                  )}
                >
                  {store.artifacts.length}
                </span>
              </button>

              {/* Ungrouped — drop zone */}
              <div
                onDragOver={(e) => handleDragOver(e, UNGROUPED_DROP_KEY)}
                onDragEnter={(e) => handleDragEnter(e, UNGROUPED_DROP_KEY)}
                onDragLeave={(e) => handleDragLeave(e, UNGROUPED_DROP_KEY)}
                onDrop={(e) => handleDrop(e, null)}
                onClick={() => setSelectedFolderItem(FOLDER_UNGROUPED)}
                className={cn(
                  'flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-xs transition-colors',
                  selectedFolderItem === FOLDER_UNGROUPED
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-neutral-1400 hover:bg-gray-50',
                  dragOverFolderId === UNGROUPED_DROP_KEY &&
                    'bg-amber-50 ring-1 ring-inset ring-amber-300'
                )}
              >
                <span>Ungrouped</span>
                {ungroupedCount > 0 && (
                  <span
                    className={cn(
                      'ml-1 shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                      selectedFolderItem === FOLDER_UNGROUPED
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-neutral-1000'
                    )}
                  >
                    {ungroupedCount}
                  </span>
                )}
              </div>

              {/* Modules section (derived folders) */}
              {derivedFolders.length > 0 && (
                <>
                  <div className='px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-600'>
                    Modules
                  </div>
                  {derivedFolders.map((folder) => {
                    const count = folderCount(folder.id)
                    const isActive = selectedFolderItem === folder.id
                    const isDragTarget = dragOverFolderId === folder.id
                    return (
                      <div
                        key={folder.id}
                        onDragOver={(e) => handleDragOver(e, folder.id)}
                        onDragEnter={(e) => handleDragEnter(e, folder.id)}
                        onDragLeave={(e) => handleDragLeave(e, folder.id)}
                        onDrop={(e) => handleDrop(e, folder.id)}
                        onClick={() => setSelectedFolderItem(folder.id)}
                        className={cn(
                          'flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-xs transition-colors',
                          isActive
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-neutral-1400 hover:bg-gray-50',
                          isDragTarget && 'bg-blue-50 ring-1 ring-inset ring-blue-300'
                        )}
                      >
                        <span className='truncate'>{folder.name}</span>
                        {count > 0 && (
                          <span
                            className={cn(
                              'ml-1 shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                              isActive
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-neutral-1000'
                            )}
                          >
                            {count}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </>
              )}

              {/* My folders section (user folders) */}
              <>
                <div className='px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-600'>
                  My folders
                </div>
                {userFolders.length === 0 && (
                  <p className='px-3 pb-2 text-[10px] text-neutral-500 italic'>
                    No folders yet
                  </p>
                )}
                {userFolders.map((folder) => {
                  const count = folderCount(folder.id)
                  const isActive = selectedFolderItem === folder.id
                  const isDragTarget = dragOverFolderId === folder.id
                  const isRenaming = renamingFolderId === folder.id

                  return (
                    <div
                      key={folder.id}
                      onDragOver={(e) => handleDragOver(e, folder.id)}
                      onDragEnter={(e) => handleDragEnter(e, folder.id)}
                      onDragLeave={(e) => handleDragLeave(e, folder.id)}
                      onDrop={(e) => handleDrop(e, folder.id)}
                      onClick={() => {
                        if (!isRenaming) setSelectedFolderItem(folder.id)
                      }}
                      className={cn(
                        'group flex w-full cursor-pointer items-center gap-1 px-3 py-2 text-xs transition-colors',
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-neutral-1400 hover:bg-gray-50',
                        isDragTarget && 'bg-blue-50 ring-1 ring-inset ring-blue-300'
                      )}
                    >
                      {isRenaming ? (
                        <input
                          autoFocus
                          value={renamingFolderName}
                          onChange={(e) => setRenamingFolderName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleConfirmRename(folder.id)
                            if (e.key === 'Escape') {
                              setRenamingFolderId(null)
                              setRenamingFolderName('')
                            }
                          }}
                          onBlur={() => handleConfirmRename(folder.id)}
                          onClick={(e) => e.stopPropagation()}
                          className='min-w-0 flex-1 rounded border border-blue-300 bg-white px-1 py-0.5 text-xs text-neutral-1600 outline-none focus:ring-1 focus:ring-blue-400'
                        />
                      ) : (
                        <>
                          <span className='min-w-0 flex-1 truncate'>{folder.name}</span>
                          {count > 0 && (
                            <span
                              className={cn(
                                'shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                                isActive
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-neutral-1000'
                              )}
                            >
                              {count}
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStartRename(folder)
                            }}
                            className='ml-0.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 text-neutral-600 hover:text-blue-600'
                            aria-label={`Rename folder ${folder.name}`}
                          >
                            <Pencil className='size-3' />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteFolder(folder)
                            }}
                            className='shrink-0 opacity-0 transition-opacity group-hover:opacity-100 text-neutral-600 hover:text-red-600'
                            aria-label={`Delete folder ${folder.name}`}
                          >
                            <Trash2 className='size-3' />
                          </button>
                        </>
                      )}
                    </div>
                  )
                })}

                {/* + New folder */}
                {showNewFolderInput ? (
                  <div className='flex items-center gap-1 px-3 py-2'>
                    <input
                      autoFocus
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateFolder()
                        if (e.key === 'Escape') {
                          setShowNewFolderInput(false)
                          setNewFolderName('')
                        }
                      }}
                      onBlur={handleCreateFolder}
                      placeholder='Folder name…'
                      className='min-w-0 flex-1 rounded border border-blue-300 bg-white px-1.5 py-0.5 text-xs text-neutral-1600 outline-none focus:ring-1 focus:ring-blue-400'
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => setShowNewFolderInput(true)}
                    className='flex w-full items-center gap-1.5 px-3 py-2 text-xs text-blue-600 hover:text-blue-700 rounded-b-[8px] hover:bg-blue-50 transition-colors'
                  >
                    <Plus className='size-3' />
                    New folder
                  </button>
                )}
              </>
            </div>
          )}
        </div>
      </div>

      {/* ── Main list ── */}
      <div className='min-w-0 flex-1'>
        {/* Toolbar */}
        <div className='mb-3 flex items-center gap-2'>
          {/* Search */}
          <div className='relative flex-1'>
            <Search className='text-neutral-800 absolute top-2 left-2.5 size-3.5' />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Search by name or description…'
              className='h-8 pl-8 text-xs'
            />
          </div>

          {/* Export filtered view */}
          <Button
            variant='outline'
            size='sm'
            className='h-8 gap-1.5 px-3 text-xs'
            onClick={handleToolbarExport}
            disabled={filteredArtifacts.length === 0}
            title='Export current view as a bundle (.json)'
          >
            <Download className='size-3.5' />
            Export
          </Button>

          {/* Import bundle */}
          <Button
            variant='outline'
            size='sm'
            className='h-8 gap-1.5 px-3 text-xs'
            onClick={() => importFileRef.current?.click()}
            title='Import a workflow bundle (.json)'
          >
            <Upload className='size-3.5' />
            Import
          </Button>
          <input
            ref={importFileRef}
            type='file'
            accept='.json'
            hidden
            onChange={(e) => handleImportFile(e.target.files?.[0])}
          />
        </div>

        {/* Rows */}
        <div className='rounded-[8px] border border-gray-200 bg-white'>
          {filteredArtifacts.length === 0 && (
            <p className='text-neutral-1000 py-10 text-center text-sm'>
              No workflows match this filter.
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
                draggable
                onDragStart={(e) => handleDragStart(e, a.id)}
                onDragEnd={handleDragEnd}
                className={cn(
                  'flex flex-wrap items-start gap-3 px-4 py-3 cursor-grab active:cursor-grabbing',
                  idx < filteredArtifacts.length - 1
                    ? 'border-b border-gray-100'
                    : ''
                )}
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
                    <WorkflowChip artifactId={a.id} />
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

                  {/* Move to… fallback Select (a11y + non-drag path) */}
                  <Select
                    value={effectiveFolderId(a) ?? FOLDER_UNGROUPED}
                    onValueChange={(val) => {
                      store.moveToFolder(a.id, val === FOLDER_UNGROUPED ? null : val)
                    }}
                  >
                    <SelectTrigger
                      variant='secondary'
                      size='xs'
                      className='h-7 min-w-[80px] text-[11px]'
                      title='Move this workflow to a folder'
                    >
                      <SelectValue placeholder='Move to…' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={FOLDER_UNGROUPED}>Ungrouped</SelectItem>
                      {folderStore.folders.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

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

                  {/* Row export — single-artifact bundle */}
                  <Button
                    variant='outline'
                    size='sm'
                    className='h-7 gap-1 px-2 text-[11px]'
                    onClick={() => handleRowExport(a)}
                    title='Export this workflow as a bundle (.json)'
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
