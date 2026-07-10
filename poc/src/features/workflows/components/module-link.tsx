/**
 * ModuleLink — the reverse of WorkflowChip: a compact link that jumps from a
 * workflow surface (editor sheet, catalog table, hub attachment pill) to the
 * module page + tab where that workflow is consumed (its EngineArtifactsPanel
 * or a specific submodule tab).
 *
 * Role gating: the destination admin/config tabs only exist for admin roles,
 * so non-admins get the plain label with no navigation affordance.
 */

import { ArrowUpRight } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { canAccess } from '@/config/module-access'
import { useRole } from '@/context/role-context'
import { cn } from '@/utils/helpers'
import type { TargetModule } from '../data/business-logic'
import { modulePanelPath, requestModuleTab } from '../data/module-nav'

interface ModuleLinkProps {
  module: TargetModule
  /** Optional submodule tab id — navigates to that tab instead of the panel tab. */
  submodule?: string
  /** Override the rendered text (defaults to "Module" or "Module / submodule"). */
  label?: string
  className?: string
  /**
   * Guard run before navigating (e.g. the editor sheet's dirty-confirm +
   * close). Return false to cancel the navigation.
   */
  beforeNavigate?: () => boolean
}

export function ModuleLink({
  module,
  submodule,
  label,
  className,
  beforeNavigate,
}: ModuleLinkProps) {
  const navigate = useNavigate()
  const { role, hasRole } = useRole()
  const path = modulePanelPath(module, submodule)
  const text = label ?? (submodule ? `${module} / ${submodule}` : module)

  const isAdmin = hasRole(
    'Platform Admin',
    'Portfolio Admin',
    'Group Company Admin',
    'Company Admin'
  )
  // The route's own AccessGuard would block roles outside its access list —
  // render plain text instead of a link that dead-ends on "Access restricted".
  const canOpen = path !== null && canAccess(role, path.route)

  if (!path || !isAdmin || !canOpen) {
    return <span className={className}>{text}</span>
  }

  return (
    <button
      type='button'
      title={`Open ${module} module settings`}
      aria-label={`Open ${text} module settings`}
      className={cn(
        'inline-flex items-center gap-0.5 text-start',
        'hover:text-blue-700 hover:underline underline-offset-2',
        'transition-colors cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 rounded-[4px]',
        className
      )}
      onClick={(e) => {
        e.stopPropagation()
        if (beforeNavigate && !beforeNavigate()) return
        if (path.tab) requestModuleTab(path.route, path.tab)
        navigate({ to: path.route })
      }}
    >
      <span>{text}</span>
      <ArrowUpRight className='size-3 shrink-0' />
    </button>
  )
}
