import { useState, useMemo, useCallback, useRef } from 'react'
import { MagnifyingGlass, CaretLeft } from 'phosphor-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useRole } from '@/context/role-context'
import { cn } from '@/utils/helpers'
import type { SettingGroup, SettingsWorkspaceProps } from './types'
import { SettingsGroupCard } from './settings-group-card'
import { ScopeChip } from './scope-chip'

// ─── Search ranking ──────────────────────────────────────────────────────────

function rankGroup(group: SettingGroup, query: string): number {
  const q = query.toLowerCase().trim()
  if (!q) return 0
  const title = group.title.toLowerCase()
  const desc = group.description.toLowerCase()
  const kw = (group.keywords ?? []).join(' ').toLowerCase()
  if (title.startsWith(q)) return 3
  if (title.includes(q)) return 2
  if (desc.includes(q) || kw.includes(q)) return 1
  return -1
}

// ─── SettingsWorkspace ───────────────────────────────────────────────────────

export function SettingsWorkspace({
  groups,
  title = 'Settings',
  defaultGroupId,
  onGroupChange,
}: SettingsWorkspaceProps) {
  const { hasRole } = useRole()

  // Active group drill-in (uncontrolled)
  const [activeId, setActiveId] = useState<string | null>(defaultGroupId ?? null)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Filter by role access
  const accessible = useMemo(
    () =>
      groups.filter((g) => {
        if (!g.roles || g.roles.length === 0) return true
        return hasRole(...g.roles)
      }),
    [groups, hasRole],
  )

  // Filtered + sorted launcher list
  const filtered = useMemo(() => {
    const q = query.trim()
    let list = accessible

    if (q) {
      list = list
        .map((g) => ({ g, rank: rankGroup(g, q) }))
        .filter(({ rank }) => rank >= 0)
        .sort((a, b) => b.rank - a.rank)
        .map(({ g }) => g)
    } else {
      // Platform-scoped groups sort last
      list = [...list].sort((a, b) => {
        const aLast = a.scope === 'platform' ? 1 : 0
        const bLast = b.scope === 'platform' ? 1 : 0
        return aLast - bLast
      })
    }

    return list
  }, [accessible, query])

  const topMatch = filtered[0] ?? null

  const drillInto = useCallback(
    (id: string) => {
      setActiveId(id)
      setQuery('')
      onGroupChange?.(id)
    },
    [onGroupChange],
  )

  const goBack = useCallback(() => {
    setActiveId(null)
    onGroupChange?.(null)
  }, [onGroupChange])

  // While drilled-in: any typing pops back to filtered launcher
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    if (activeId && val.length > 0) {
      setActiveId(null)
      onGroupChange?.(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && topMatch && !activeId) {
      drillInto(topMatch.id)
    }
  }

  const activeGroup = activeId ? accessible.find((g) => g.id === activeId) : null

  return (
    <div className='flex flex-col gap-4'>
      {/* Header row */}
      <div className='flex items-center justify-between gap-4'>
        {/* Left: back + breadcrumb OR just title */}
        {activeGroup ? (
          <div className='flex items-center gap-2 min-w-0'>
            <button
              type='button'
              onClick={goBack}
              className='flex items-center gap-1 text-neutral-1000 hover:text-neutral-1400 transition-colors shrink-0'
              aria-label='Back to settings'
            >
              <CaretLeft size={16} weight='bold' />
            </button>
            <span className='text-paragraph-sm text-neutral-1000 shrink-0'>{title}</span>
            <span className='text-paragraph-sm text-neutral-1000 shrink-0'>/</span>
            <span className='text-paragraph-md font-semibold text-neutral-1400 truncate'>
              {activeGroup.title}
            </span>
            {activeGroup.scope && activeGroup.scope !== 'company' && (
              <ScopeChip scope={activeGroup.scope} />
            )}
            {activeGroup.roles && activeGroup.roles.length > 0 && (
              <div className='flex gap-1'>
                {activeGroup.roles.map((r) => (
                  <Badge
                    key={r}
                    variant='outline'
                    className='rounded-[6px] text-xs bg-neutral-100 text-neutral-700 border-neutral-200'
                  >
                    {r}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        ) : (
          <h2 className='text-paragraph-md font-semibold text-neutral-1400'>{title}</h2>
        )}

        {/* Right: persistent search */}
        <div className='relative w-[240px] shrink-0'>
          <MagnifyingGlass
            size={16}
            className='absolute left-3 top-1/2 -translate-y-1/2 text-neutral-1000 pointer-events-none'
          />
          <Input
            ref={inputRef}
            value={query}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
            placeholder='Search settings…'
            className='pl-8 text-sm'
            aria-label='Search settings'
          />
        </div>
      </div>

      {/* Body */}
      {activeGroup ? (
        /* Drill-in: render the group body */
        <div className='rounded-[8px] border border-gray-200 bg-white p-6'>
          {activeGroup.render()}
        </div>
      ) : (
        /* Launcher grid */
        <div
          className={cn(
            'grid gap-3',
            'sm:grid-cols-2 xl:grid-cols-3',
          )}
        >
          {filtered.length === 0 ? (
            <p className='col-span-full text-paragraph-sm text-neutral-1000 py-6 text-center'>
              No settings match &ldquo;{query}&rdquo;
            </p>
          ) : (
            filtered.map((group) => (
              <SettingsGroupCard
                key={group.id}
                group={group}
                onClick={() => drillInto(group.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
