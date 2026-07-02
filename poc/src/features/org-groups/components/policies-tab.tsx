import { useMemo, useState } from 'react'
import { Play } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRole } from '@/context/role-context'
import { type PolicyDef } from '../data/groups'
import { type OrgGroupsStore } from '../hooks/use-org-groups'
import { actorFor } from '../utils/permissions'
import { resolveApplicability, todayIso } from '../utils/resolve'
import { KindBadge, ScopeBadge } from './group-badges'

interface PoliciesTabProps {
  store: OrgGroupsStore
}

/**
 * Groups as policy applicability criteria (GRP-07/12) plus a rules-engine
 * resolution preview (GRP-16): pick a target group and an as-of date and see
 * the n-level, effective-dated, deduplicated applicable population.
 */
export function PoliciesTab({ store }: PoliciesTabProps) {
  const { role } = useRole()
  const actor = actorFor(role)
  const canEditCriteria =
    role === 'Company Admin' ||
    role === 'Group Company Admin' ||
    role === 'Platform Admin'

  const [editing, setEditing] = useState<PolicyDef | null>(null)
  const [draftIds, setDraftIds] = useState<string[]>([])
  const [targetGroupId, setTargetGroupId] = useState('')
  const [asOf, setAsOf] = useState(todayIso())

  const groupById = new Map(store.groups.map((g) => [g.id, g]))
  const memberById = new Map(store.members.map((m) => [m.id, m]))
  // Inactive groups are excluded from new policy selection (GRP-23).
  const selectableGroups = store.groups.filter((g) => g.status === 'active')

  const resolution = useMemo(() => {
    if (!targetGroupId) return null
    return resolveApplicability(
      store.groups,
      store.memberships,
      targetGroupId,
      asOf
    )
  }, [store.groups, store.memberships, targetGroupId, asOf])

  const openEditor = (policy: PolicyDef) => {
    setEditing(policy)
    setDraftIds(policy.groupIds)
  }

  const saveCriteria = () => {
    if (editing) store.updatePolicyGroups(editing.id, draftIds, actor)
    setEditing(null)
  }

  return (
    <div className='grid w-full gap-4 lg:grid-cols-2'>
      {/* Policy applicability criteria */}
      <div>
        <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
          Policies and their group applicability criteria
        </h3>
        <div className='space-y-2'>
          {store.policies.map((policy) => (
            <div
              key={policy.id}
              className='border-grey-200 flex flex-wrap items-center justify-between gap-2 rounded-[6px] border bg-white px-3 py-2'
            >
              <div className='flex min-w-0 flex-col'>
                <span className='text-neutral-1600 text-sm font-medium'>
                  {policy.name}
                </span>
                <span className='text-paragraph-sm text-neutral-1000'>
                  {policy.module} module
                </span>
              </div>
              <div className='flex flex-wrap items-center gap-1.5'>
                {policy.groupIds.map((id) => {
                  const g = groupById.get(id)
                  return g ? (
                    <Badge key={id} variant='open'>
                      {g.acronym || g.name}
                    </Badge>
                  ) : null
                })}
                {canEditCriteria && (
                  <Button
                    variant='outline'
                    className='h-7'
                    onClick={() => openEditor(policy)}
                  >
                    Edit criteria
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className='text-paragraph-sm text-neutral-1000 mt-2'>
          Only active groups within your authorized scope are selectable as
          criteria. A policy targeting a parent group resolves across its
          descendants per the configured inheritance rule.
        </p>
      </div>

      {/* Rules-engine resolution preview */}
      <div>
        <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
          Rules-engine applicability preview
        </h3>
        <div className='border-grey-200 rounded-[6px] border bg-white p-3'>
          <div className='mb-3 flex flex-wrap items-center gap-2'>
            <Select value={targetGroupId} onValueChange={setTargetGroupId}>
              <SelectTrigger variant='secondary' className='h-7 w-[220px]'>
                <SelectValue placeholder='Target group' />
              </SelectTrigger>
              <SelectContent>
                {store.groups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type='date'
              value={asOf}
              onChange={(e) => setAsOf(e.target.value || todayIso())}
              className='h-7 w-[150px]'
              aria-label='Evaluate as of date'
            />
            <span className='text-paragraph-sm text-neutral-1000 flex items-center gap-1'>
              <Play className='size-3.5' /> evaluates live
            </span>
          </div>

          {!resolution ? (
            <p className='text-paragraph-sm text-neutral-1000'>
              Choose a target group to expand its membership the way the rules
              engine does: n-level descendant traversal, effective-dated
              membership as of the chosen date, members deduplicated across
              overlapping groups.
            </p>
          ) : (
            <>
              <div className='mb-3 space-y-1'>
                {resolution.steps.map((step) => {
                  const stepGroup = groupById.get(step.groupId)
                  return (
                    <div
                      key={step.groupId}
                      className='text-paragraph-sm text-neutral-1900 flex items-center gap-2'
                      style={{ marginLeft: step.level * 16 }}
                    >
                      <span className='font-medium'>{step.groupName}</span>
                      <span className='text-neutral-1000'>
                        {step.rule === 'target'
                          ? 'target group'
                          : step.rule === 'inherit-downward'
                            ? 'included via inherit-downward'
                            : 'no-inheritance (descendants stop here)'}
                        {' · '}
                        {step.directCount} direct member
                        {step.directCount === 1 ? '' : 's'}
                      </span>
                      {stepGroup && <ScopeBadge scope={stepGroup.scope} />}
                    </div>
                  )
                })}
              </div>
              <h4 className='text-neutral-1600 mb-1 text-sm font-medium'>
                Applicable population as of {asOf} —{' '}
                {resolution.memberIds.length} unique member
                {resolution.memberIds.length === 1 ? '' : 's'} (no
                double-counting)
              </h4>
              {resolution.memberIds.length === 0 ? (
                <p className='text-paragraph-sm text-neutral-1000'>
                  No members are effective on this date.
                </p>
              ) : (
                <div className='flex flex-wrap gap-1.5'>
                  {resolution.memberIds.map((id) => {
                    const p = memberById.get(id)
                    return p ? (
                      <span
                        key={id}
                        className='border-grey-200 flex items-center gap-1.5 rounded-[6px] border px-2 py-1 text-sm'
                      >
                        {p.name}
                        <KindBadge kind={p.kind} />
                      </span>
                    ) : null
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Criteria editor */}
      <Dialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Applicability criteria — {editing?.name}</DialogTitle>
            <DialogDescription>
              The policy applies to all members (employees and associated
              users) of the selected groups. Inactive groups are excluded from
              selection.
            </DialogDescription>
          </DialogHeader>
          <div className='max-h-72 space-y-1 overflow-y-auto'>
            {selectableGroups.map((g) => (
              <label
                key={g.id}
                className='hover:bg-neutral-200 flex cursor-pointer items-center gap-2 rounded px-2 py-1.5'
              >
                <Checkbox
                  variant='blue'
                  checked={draftIds.includes(g.id)}
                  onCheckedChange={() =>
                    setDraftIds((prev) =>
                      prev.includes(g.id)
                        ? prev.filter((x) => x !== g.id)
                        : [...prev, g.id]
                    )
                  }
                  aria-label={`Target ${g.name}`}
                />
                <span className='text-neutral-1600 flex-1 truncate text-sm'>
                  {g.name}
                </span>
                <ScopeBadge scope={g.scope} />
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={saveCriteria}>Save criteria</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
