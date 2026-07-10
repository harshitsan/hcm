import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowUpRight, Search, Workflow } from 'lucide-react'
import {
  ARTIFACT_TYPE_LABELS,
  ROLE_SCOPE,
  SCOPE_TOGGLE_ROLE,
  blockingLevel,
  isEffectivelyActive,
  type TargetModule,
} from '@/features/workflows/data/business-logic'
import { useBusinessLogic } from '@/features/workflows/hooks/use-business-logic'
import { useRole } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { WorkflowChip } from './workflow-chip'

interface EngineArtifactsPanelProps {
  /** The consuming module — the catalog is filtered to artifacts targeting it. */
  module: TargetModule
  /** Optional submodule tab id — narrows the filter to attachments for that tab. */
  submodule?: string
  /** Optional intro line override. */
  intro?: string
}

/**
 * Layer 3 — Consume (WFE-49). A module's configuration is not owned by the
 * module: it is the Workflow Engine catalog filtered to artifacts targeting
 * this module. Kensium HR features are enabled here as engine artifacts.
 * Admins toggle their own scope level inline; authoring happens in the engine.
 */
export function EngineArtifactsPanel({ module, submodule, intro }: EngineArtifactsPanelProps) {
  const { role } = useRole()
  const store = useBusinessLogic({ actor: role })
  const [query, setQuery] = useState('')

  const myScope = ROLE_SCOPE[role]

  const artifacts = useMemo(
    () =>
      store.artifacts
        .filter((a) => a.attachments.some(x => x.module === module && (!submodule || !x.submodule || x.submodule === submodule)))
        .filter(
          (a) =>
            !query ||
            a.name.toLowerCase().includes(query.toLowerCase()) ||
            a.description.toLowerCase().includes(query.toLowerCase())
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [store.artifacts, module, submodule, query]
  )

  const activeCount = artifacts.filter(
    (a) => myScope && isEffectivelyActive(a.scopes, myScope)
  ).length

  return (
    <Card className='flex flex-col gap-3 border-gray-200 p-4'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='flex items-center gap-2'>
          <Workflow className='text-blue-1200 size-4' />
          <h3 className='text-paragraph-md text-neutral-1600 font-medium'>
            Engine features for this module
          </h3>
          <Badge variant='secondary'>
            {myScope ? `${activeCount} of ${artifacts.length} active` : `${artifacts.length}`}
          </Badge>
        </div>
        <Button asChild variant='outline' className='h-7 gap-1 px-2 text-xs'>
          <Link to='/workflows'>
            Open in Workflow Engine
            <ArrowUpRight className='size-3' />
          </Link>
        </Button>
      </div>
      <p className='text-paragraph-sm text-neutral-1000'>
        {intro ??
          'These Kensium HR capabilities are governed workflows — authored once in the Workflow Engine, enabled per scope, consumed here.'}
      </p>
      {artifacts.length > 6 && (
        <div className='relative'>
          <Search className='text-neutral-800 absolute top-2 left-2 size-3.5' />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Search features…'
            className='h-8 pl-7 text-xs'
          />
        </div>
      )}
      <div className='flex max-h-[420px] flex-col gap-1 overflow-y-auto pr-1'>
        {artifacts.length === 0 && (
          <p className='text-neutral-1000 py-4 text-center text-sm'>
            No workflows are attached to this module yet.
          </p>
        )}
        {artifacts.map((a) => {
          const effective = myScope
            ? isEffectivelyActive(a.scopes, myScope)
            : isEffectivelyActive(a.scopes, 'company')
          const blocker = myScope ? blockingLevel(a.scopes, myScope) : null
          const canToggle = myScope && SCOPE_TOGGLE_ROLE[myScope] === role
          return (
            <div
              key={a.id}
              className='flex items-center gap-3 rounded-md border border-gray-100 bg-white px-3 py-2'
            >
              <div className='min-w-0 flex-1'>
                <div className='flex items-center gap-2'>
                  <span className='text-neutral-1600 truncate text-sm font-medium'>
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
                <p className='text-neutral-1000 truncate text-xs'>
                  {a.description}
                </p>
              </div>
              <div className='flex shrink-0 items-center gap-2'>
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
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
