import { useMemo, useState } from 'react'
import { CaretDown, CaretRight, MagnifyingGlass } from 'phosphor-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRole } from '@/context/role-context'
import {
  INHERITANCE_RULES,
  type InheritanceRule,
  type OrgGroup,
} from '../data/groups'
import { type OrgGroupsStore } from '../hooks/use-org-groups'
import {
  ancestorIds,
  childrenOf,
  descendantIds,
  effectiveInheritanceRule,
  isScopeCompatible,
  wouldCreateCycle,
} from '../utils/hierarchy'
import { actorFor, canManageGroup } from '../utils/permissions'
import { memberCountOf, todayIso } from '../utils/resolve'
import { ScopeBadge, StatusBadge } from './group-badges'

const NONE = '__top__'
const INHERIT = '__inherit__'

interface HierarchyTabProps {
  store: OrgGroupsStore
}

/**
 * N-level group tree (GRP-03/04/09/17/37): expand/collapse, name search that
 * keeps ancestors visible, cycle/scope-safe reparenting and per-node
 * inheritance-rule configuration for the rules engine.
 */
export function HierarchyTab({ store }: HierarchyTabProps) {
  const { role } = useRole()
  const actor = actorFor(role)
  const canSetInheritance =
    role === 'Portfolio Admin' || role === 'Platform Admin'

  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const visibleIds = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return null
    const matches = store.groups.filter(
      (g) =>
        g.name.toLowerCase().includes(term) ||
        g.acronym.toLowerCase().includes(term)
    )
    const ids = new Set<string>()
    matches.forEach((g) => {
      ids.add(g.id)
      ancestorIds(store.groups, g.id).forEach((a) => ids.add(a))
    })
    return ids
  }, [store.groups, search])

  const toggleCollapse = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const moveOptions = (group: OrgGroup) => {
    const blocked = new Set([group.id, ...descendantIds(store.groups, group.id)])
    return store.groups.filter(
      (g) =>
        !blocked.has(g.id) &&
        g.status === 'active' &&
        isScopeCompatible(g.scope, group.scope) &&
        !wouldCreateCycle(store.groups, group.id, g.id)
    )
  }

  const renderNode = (group: OrgGroup, level: number): React.ReactNode => {
    if (visibleIds && !visibleIds.has(group.id)) return null
    const children = childrenOf(store.groups, group.id)
    const isCollapsed = !search && collapsed.has(group.id)
    const manageable = canManageGroup(role, group)
    const rule = effectiveInheritanceRule(store.groups, group.id)

    return (
      <div key={group.id}>
        <div
          className='border-gray-200 mb-1 flex flex-wrap items-center gap-2 rounded-[6px] border bg-white px-2 py-1.5'
          style={{ marginLeft: level * 24 }}
        >
          <Button
            variant='icon2'
            className='text-neutral-1900 h-6 w-6'
            aria-label={isCollapsed ? 'Expand' : 'Collapse'}
            disabled={children.length === 0}
            onClick={() => toggleCollapse(group.id)}
          >
            {isCollapsed ? (
              <CaretRight className='size-4' />
            ) : (
              <CaretDown className='size-4' />
            )}
          </Button>
          <div className='flex min-w-0 flex-1 flex-col'>
            <span className='text-neutral-1600 truncate text-sm font-medium'>
              {group.name}{' '}
              <span className='text-neutral-1000 font-normal'>
                ({group.acronym}) · L{level + 1}
              </span>
            </span>
            <span className='text-paragraph-sm text-neutral-1000'>
              {memberCountOf(store.memberships, group.id, todayIso())} members ·
              rule: {rule}
              {!group.inheritanceRule && ' (inherited)'}
            </span>
          </div>
          <ScopeBadge scope={group.scope} />
          {group.status === 'inactive' && <StatusBadge status={group.status} />}

          {manageable && (
            <Select
              value={group.parentId ?? NONE}
              onValueChange={(v) =>
                store.reparentGroup(group.id, v === NONE ? null : v, actor)
              }
            >
              <SelectTrigger
                variant='secondary'
                className='h-7 w-[190px]'
                aria-label={`Move ${group.name}`}
              >
                <SelectValue placeholder='Move under…' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Top level (no parent)</SelectItem>
                {moveOptions(group).map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    Under {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {canSetInheritance && (
            <Select
              value={group.inheritanceRule ?? INHERIT}
              onValueChange={(v) =>
                store.setInheritanceRule(
                  group.id,
                  v === INHERIT ? null : (v as InheritanceRule),
                  actor
                )
              }
            >
              <SelectTrigger
                variant='secondary'
                className='h-7 w-[180px]'
                aria-label={`Inheritance rule for ${group.name}`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={INHERIT}>Inherit from parent</SelectItem>
                {INHERITANCE_RULES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        {!isCollapsed && children.map((c) => renderNode(c, level + 1))}
      </div>
    )
  }

  const roots = childrenOf(store.groups, null)
  const anyVisible = visibleIds
    ? roots.some((r) => visibleIds.has(r.id))
    : roots.length > 0

  return (
    <div className='w-full'>
      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
        <div className='relative'>
          <MagnifyingGlass className='text-neutral-1000 absolute top-1/2 left-2 size-3.5 -translate-y-1/2' />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Search the tree — matches and their ancestors stay visible'
            className='h-7 w-[320px] pl-7'
          />
        </div>
        <p className='text-paragraph-sm text-neutral-1000'>
          N-level nesting is unlimited. Moves that would create a cycle or put a
          broader-scope group under a narrower one are blocked with an error.
          {canSetInheritance &&
            ' Inheritance changes are picked up by the rules engine at the next evaluation — no deployment.'}
        </p>
      </div>

      {anyVisible ? (
        roots.map((r) => renderNode(r, 0))
      ) : (
        <p className='text-paragraph-sm text-neutral-1000 border-gray-200 rounded-[6px] border bg-white px-3 py-6 text-center'>
          No group matches “{search}”.
        </p>
      )}
    </div>
  )
}
