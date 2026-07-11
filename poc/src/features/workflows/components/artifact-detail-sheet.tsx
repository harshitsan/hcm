import { useState } from 'react'
import { PencilSimple, Trash } from 'phosphor-react'
import type { Role } from '@/context/role-context'
import { WorkflowChip } from './workflow-chip'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  ARTIFACT_TYPE_LABELS,
  CALENDAR_TYPE_LABELS,
  blockingLevel,
  FIELD_TYPE_LABELS,
  isEffectivelyActive,
  SCOPE_LABELS,
  SCOPE_LEVELS,
  SCOPE_TOGGLE_ROLE,
  type Artifact,
  type ArtifactDefinition,
  type ScopeLevel,
} from '../data/business-logic'

/** Renders the type-specific payload the target module consumes (WFE-49). */
function DefinitionView({ definition }: { definition: ArtifactDefinition }) {
  switch (definition.kind) {
    case 'approver-chain':
      return (
        <div className='space-y-2'>
          {definition.steps.map((s) => (
            <div
              key={s.order}
              className='flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm'
            >
              <span className='text-neutral-1900'>
                {s.order}. {s.approverRole}
              </span>
              <span className='text-neutral-1000 text-xs'>
                SLA {s.slaHours} h
              </span>
            </div>
          ))}
        </div>
      )
    case 'decision-rule':
      return (
        <div className='space-y-2'>
          {definition.conditions.map((c, i) => (
            <div
              key={`${c.attribute}-${i}`}
              className='rounded-md border border-gray-200 bg-white px-3 py-2 text-sm'
            >
              <span className='text-neutral-1000 text-xs'>
                {i === 0 ? 'WHEN' : 'AND'}
              </span>{' '}
              <span className='text-neutral-1900 font-medium'>
                {c.attribute} {c.operator} {c.value}
              </span>
            </div>
          ))}
          <div className='flex items-center gap-2 text-sm'>
            <span className='text-neutral-1000'>Outcome:</span>
            <Badge variant='open'>{definition.outcome}</Badge>
          </div>
        </div>
      )
    case 'custom-form':
      return (
        <div className='space-y-2'>
          {definition.fields.map((f, i) => (
            <div
              key={`${f.label}-${i}`}
              className='rounded-md border border-gray-200 bg-white px-3 py-2'
            >
              <div className='flex items-center justify-between gap-2'>
                <span className='text-neutral-1900 text-sm'>{f.label}</span>
                <div className='flex items-center gap-1'>
                  <Badge variant='badge_inactive'>
                    {FIELD_TYPE_LABELS[f.fieldType]}
                  </Badge>
                  {f.required && <Badge variant='overdue'>Required</Badge>}
                </div>
              </div>
              {f.options && f.options.length > 0 && (
                <p className='text-neutral-1000 mt-1 text-xs'>
                  Options: {f.options.join(' · ')}
                </p>
              )}
            </div>
          ))}
        </div>
      )
    case 'checklist':
      return (
        <div className='space-y-2'>
          {definition.items.map((it, i) => (
            <div
              key={`${it.label}-${i}`}
              className='flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm'
            >
              <span className='text-neutral-1900'>
                {i + 1}. {it.label}
              </span>
              <Badge variant={it.mandatory ? 'overdue' : 'badge_inactive'}>
                {it.mandatory ? 'Mandatory' : 'Optional'}
              </Badge>
            </div>
          ))}
        </div>
      )
    case 'template':
      return (
        <div className='space-y-2'>
          {(definition.channel || definition.event || definition.templateKind) && (
            <div className='flex flex-wrap items-center gap-2 text-sm'>
              {definition.templateKind && (
                <Badge variant='badge_inactive'>
                  {definition.templateKind === 'letter' ? 'Letter' : 'Notification'}
                </Badge>
              )}
              {definition.channel && (
                <Badge variant='open'>{definition.channel}</Badge>
              )}
              {definition.event && (
                <span className='text-neutral-1000 text-xs'>
                  Event: <span className='font-mono'>{definition.event}</span>
                </span>
              )}
            </div>
          )}
          <pre className='text-neutral-1900 rounded-md border border-gray-200 bg-white px-3 py-2 font-mono text-xs whitespace-pre-wrap'>
            {definition.body}
          </pre>
        </div>
      )
    case 'alert':
      return (
        <div className='space-y-2 text-sm'>
          <div>
            <span className='text-neutral-1000'>Trigger: </span>
            <span className='text-neutral-1900 font-medium'>
              {definition.trigger}
            </span>
          </div>
          <div className='flex items-center gap-1'>
            <span className='text-neutral-1000'>Channels:</span>
            {definition.channels.map((c) => (
              <Badge key={c} variant='open'>
                {c}
              </Badge>
            ))}
          </div>
        </div>
      )
    case 'setting':
      return (
        <div className='flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm'>
          <span className='text-neutral-1900 font-mono'>{definition.key}</span>
          <span className='text-neutral-1900 font-medium'>
            {definition.value}
          </span>
        </div>
      )
    case 'category-list':
      return (
        <div className='space-y-2'>
          {definition.items.map((item) => (
            <div
              key={item.id}
              className='flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm'
            >
              <span className='text-neutral-1900'>{item.label}</span>
              <Badge variant={item.active ? 'badge_active' : 'badge_inactive'}>
                {item.active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          ))}
        </div>
      )
    case 'calendar':
      return (
        <div className='space-y-2'>
          <div className='flex items-center gap-2 text-sm'>
            <span className='text-neutral-1000'>Type:</span>
            <Badge variant='open'>{CALENDAR_TYPE_LABELS[definition.calendarType]}</Badge>
          </div>
          {definition.entries.map((entry, i) => (
            <div
              key={`${entry.label}-${i}`}
              className='rounded-md border border-gray-200 bg-white px-3 py-2 text-sm'
            >
              <div className='flex items-start justify-between gap-2'>
                <span className='text-neutral-1900 font-medium'>{entry.label}</span>
                {entry.date && (
                  <span className='text-neutral-1000 shrink-0 text-xs'>{entry.date}</span>
                )}
              </div>
              {(entry.startTime || entry.endTime) && (
                <p className='text-neutral-1000 mt-0.5 text-xs'>
                  {entry.startTime} – {entry.endTime}
                  {entry.days && entry.days.length > 0 && (
                    <> · {entry.days.join(', ')}</>
                  )}
                </p>
              )}
            </div>
          ))}
        </div>
      )
    case 'flow':
      return (
        <div className='space-y-2'>
          <div className='flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm'>
            <span className='text-neutral-1900'>
              Trigger:{' '}
              <span className='font-medium'>
                {String(
                  definition.doc.trigger.config.event ??
                    definition.doc.trigger.label
                )}
              </span>{' '}
              · {String(definition.doc.trigger.config.module ?? '—')}
            </span>
            <Badge
              variant={
                definition.doc.status === 'active' ? 'badge_active' : 'pending'
              }
            >
              {definition.doc.status === 'active' ? 'Active' : 'Draft'}
            </Badge>
          </div>
          <p className='text-neutral-1000 text-xs'>
            {definition.doc.body.length} top-level step(s) — authored on the
            Build canvas; open the Build tab to edit the flow.
          </p>
        </div>
      )
  }
}

/**
 * Artifact drill-down: the definition the module consumes, the scope matrix
 * (WFE-47 — each level toggled only by the admin who owns it), the version
 * plus enable/disable history timeline (WFE-48), and Edit / Delete actions.
 */
export function ArtifactDetailSheet({
  artifact,
  open,
  onOpenChange,
  role,
  canAuthor,
  onToggleScope,
  onEdit,
  onDelete,
}: {
  artifact: Artifact | null
  open: boolean
  onOpenChange: (open: boolean) => void
  role: Role
  /** True for the roles allowed to edit/delete artifacts. */
  canAuthor: boolean
  onToggleScope: (level: ScopeLevel) => void
  onEdit: () => void
  onDelete: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const history = artifact ? [...artifact.history].reverse() : []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[560px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            {artifact?.name ?? 'Workflow detail'}
          </SheetTitle>
        </SheetHeader>

        {artifact && (
          <>
            <div className='flex-1 space-y-5 overflow-y-auto px-5 py-5'>
              <div className='grid grid-cols-2 gap-x-4 gap-y-2 text-sm'>
                <div className='flex items-center gap-2'>
                  <span className='text-neutral-1000'>Type</span>
                  <Badge variant='badge_inactive'>
                    {ARTIFACT_TYPE_LABELS[artifact.type]}
                  </Badge>
                </div>
                <div className='flex items-center gap-2'>
                  <span className='text-neutral-1000'>Version</span>
                  <Badge variant='live'>v{artifact.version}</Badge>
                </div>
                <div>
                  <span className='text-neutral-1000'>Target module: </span>
                  <span className='text-neutral-1900 font-medium'>
                    {artifact.targetModule}
                  </span>
                </div>
                <div>
                  <span className='text-neutral-1000'>Updated: </span>
                  <span className='text-neutral-1900'>
                    {artifact.updatedAt} · {artifact.updatedBy}
                  </span>
                </div>
                <p className='text-neutral-1000 col-span-2 text-sm'>
                  {artifact.description}
                </p>
              </div>

              <Separator />

              <div>
                <h3 className='text-neutral-1600 mb-2 text-sm font-semibold'>
                  Definition — consumed by {artifact.targetModule}
                </h3>
                <DefinitionView definition={artifact.definition} />
              </div>

              <Separator />

              <div>
                <h3 className='text-neutral-1600 mb-1 text-sm font-semibold'>
                  Scope matrix
                </h3>
                <p className='text-neutral-1000 mb-2 text-xs'>
                  Hierarchy: Platform → Portfolio → Group company → Company. A
                  level is effectively active only when every level above it
                  is also enabled; each switch is owned by that level's admin.
                </p>
                <div className='space-y-2'>
                  {SCOPE_LEVELS.map((level) => {
                    const gate = SCOPE_TOGGLE_ROLE[level]
                    const allowed = role === gate
                    const enabled = artifact.scopes[level]
                    const effective = isEffectivelyActive(
                      artifact.scopes,
                      level
                    )
                    const blocker = blockingLevel(artifact.scopes, level)
                    const stateText = effective
                      ? 'Effectively active'
                      : enabled && blocker
                        ? `Enabled here — blocked at ${SCOPE_LABELS[blocker]}`
                        : 'Disabled'
                    const control = (
                      <Switch
                        checked={enabled}
                        disabled={!allowed}
                        onCheckedChange={() => onToggleScope(level)}
                        aria-label={`Toggle ${SCOPE_LABELS[level]} scope`}
                      />
                    )
                    return (
                      <div
                        key={level}
                        className='flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2'
                      >
                        <div className='flex flex-col'>
                          <span className='text-neutral-1900 text-sm'>
                            {SCOPE_LABELS[level]}
                          </span>
                          <span className='text-neutral-1000 text-xs'>
                            {stateText} · governed by {gate}
                          </span>
                        </div>
                        {allowed ? (
                          control
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span tabIndex={0}>{control}</span>
                            </TooltipTrigger>
                            <TooltipContent side='left'>
                              Only the {gate} can toggle the{' '}
                              {SCOPE_LABELS[level]} level
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className='text-neutral-1600 mb-2 text-sm font-semibold'>
                  History ({history.length})
                </h3>
                <div className='space-y-2'>
                  {history.map((h, i) => (
                    <div
                      key={`${h.at}-${i}`}
                      className='rounded-md border border-gray-200 bg-white p-3'
                    >
                      <div className='flex items-center justify-between'>
                        <span className='text-neutral-1600 text-sm font-medium'>
                          {h.event}
                        </span>
                        <span className='text-neutral-1000 text-xs'>{h.at}</span>
                      </div>
                      <p className='text-neutral-1000 mt-1 text-xs'>{h.actor}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className='border-gray-200 flex items-center justify-between gap-3 border-t px-5 py-4'>
              <WorkflowChip
                artifactId={artifact.id}
                label='Open in visual builder'
              />
              {canAuthor && (
                <div className='flex items-center gap-3'>
                  <Button
                    variant='outline'
                    className='gap-1.5'
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash size={14} weight='bold' /> Delete
                  </Button>
                  <Button className='gap-1.5' onClick={onEdit}>
                    <PencilSimple size={14} weight='fill' /> Edit
                  </Button>
                </div>
              )}
            </div>
          </>
        )}

        <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this workflow?</AlertDialogTitle>
              <AlertDialogDescription>
                {`"${artifact?.name}" (v${artifact?.version}) will be removed from the catalog and ${artifact?.targetModule} will stop consuming it at every scope level.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setConfirmDelete(false)
                  onDelete()
                }}
                className='bg-destructive hover:bg-destructive/90 text-white'
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </FloatingSheetContent>
    </Sheet>
  )
}
