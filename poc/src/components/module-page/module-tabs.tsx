import { useState } from 'react'
import { useRole, type Role } from '@/context/role-context'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { takeRequestedTab } from '@/features/workflows/data/module-nav'
import { cn } from '@/utils/helpers'

export interface TabDef {
  value: string
  label: string
  /** Roles that see this tab; omit for "everyone". */
  roles?: Role[]
}

/**
 * Canonical segmented pill tab strip (scaffold kit §3): TabDef[] filtered via
 * useRole, keyed by role so a role switch resets to a valid tab, initial tab
 * honouring a one-shot engine deep-link via takeRequestedTab(route).
 */
export function ModuleTabs({
  route,
  tabs,
  className,
  listClassName,
  children,
}: {
  /** Module route used to consume takeRequestedTab deep-links, e.g. '/leave'. */
  route: string
  tabs: TabDef[]
  className?: string
  listClassName?: string
  children: React.ReactNode
}) {
  const { role } = useRole()
  const visible = tabs.filter((t) => !t.roles || t.roles.includes(role))
  // One-shot deep-link consumption — read once on mount, never on re-render.
  const [requested] = useState(() => takeRequestedTab(route))
  const initial =
    requested && visible.some((t) => t.value === requested)
      ? requested
      : visible[0]?.value

  if (visible.length === 0) return null

  return (
    <Tabs key={role} defaultValue={initial} className={cn('w-full', className)}>
      <TabsList className={cn('mb-2 flex-wrap', listClassName)}>
        {visible.map((t) => (
          <TabsTrigger key={t.value} value={t.value}>
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  )
}
