import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { useRole } from '@/context/role-context'
import { type OrgGroup } from '../data/groups'
import { type OrgGroupsStore } from '../hooks/use-org-groups'
import { downloadCsv } from '../utils/export'
import { actorFor, canManageGroup, needsApproval } from '../utils/permissions'
import { isEffectiveOn, todayIso } from '../utils/resolve'
import { KindBadge, SourceBadge } from './group-badges'

interface MembersOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: OrgGroup | null
  store: OrgGroupsStore
}

/**
 * Membership grid for one group (GRP-05/06/10/13/17/25/26/36/38/39):
 * bulk add/remove employees and users, effective-dated history with an as-of
 * date, rule-derived vs manual source, file import and bulk transfer.
 */
export function MembersOverlay({
  open,
  onOpenChange,
  group,
  store,
}: MembersOverlayProps) {
  const { role } = useRole()
  const [asOf, setAsOf] = useState(todayIso())
  const [showHistory, setShowHistory] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [toAdd, setToAdd] = useState<string[]>([])
  const [transferTarget, setTransferTarget] = useState('')

  useEffect(() => {
    if (open) {
      setAsOf(todayIso())
      setShowHistory(false)
      setSelected([])
      setToAdd([])
      setTransferTarget('')
    }
  }, [open, group?.id])

  const rows = useMemo(() => {
    if (!group) return []
    return store.memberships
      .filter((m) => m.groupId === group.id)
      .filter((m) => showHistory || isEffectiveOn(m, asOf))
  }, [store.memberships, group, asOf, showHistory])

  const currentIds = useMemo(
    () =>
      new Set(
        store.memberships
          .filter((m) => group && m.groupId === group.id && isEffectiveOn(m, todayIso()))
          .map((m) => m.memberId)
      ),
    [store.memberships, group]
  )

  if (!group) return null

  const manageable = canManageGroup(role, group)
  const viaApproval = needsApproval(role, group)
  const actor = actorFor(role)
  const memberById = new Map(store.members.map((m) => [m.id, m]))
  const candidates = store.members.filter((m) => !currentIds.has(m.id))
  const transferTargets = store.groups.filter(
    (g) => g.id !== group.id && g.status === 'active' && canManageGroup(role, g)
  )

  const toggle = (id: string, list: string[], set: (v: string[]) => void) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id])

  const handleAdd = () => {
    store.addMembers(group.id, toAdd, actor, { viaApproval })
    setToAdd([])
  }

  const handleRemove = () => {
    store.removeMembers(group.id, selected, actor, viaApproval)
    setSelected([])
  }

  const handleTransfer = () => {
    if (!transferTarget) return
    store.transferMembers(group.id, transferTarget, selected, actor)
    setSelected([])
    setTransferTarget('')
  }

  const handleImport = () => {
    const result = store.importMemberships(group.id, actor)
    toast.success(
      `Import complete — ${result.added} added, ${result.skipped} duplicates skipped, ${result.errors} unmatched/out-of-scope rows rejected`
    )
  }

  const handleExport = () => {
    downloadCsv(
      `${group.acronym || group.id}-members-${asOf}.csv`,
      ['Code', 'Name', 'Kind', 'Source', 'Effective from', 'Effective to'],
      store.memberships
        .filter((m) => m.groupId === group.id && isEffectiveOn(m, asOf))
        .map((m) => {
          const p = memberById.get(m.memberId)
          return [
            p?.code ?? m.memberId,
            p?.name ?? 'Unknown',
            p?.kind ?? '-',
            m.source,
            m.effectiveFrom,
            m.effectiveTo ?? '',
          ]
        })
    )
    toast.success(`Membership exported as of ${asOf}`)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[560px]'>
        <SheetHeader className='border-grey-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            Members — {group.name} ({group.acronym})
          </SheetTitle>
          <p className='text-paragraph-sm text-neutral-1000'>
            {group.type === 'dynamic'
              ? `Dynamic cohort — rule “${group.eligibilityRule}”. Manual additions are preserved and flagged as exceptions.`
              : 'Static cohort — membership is maintained manually.'}
            {viaApproval &&
              ' Changes on this approval-controlled group are held pending until an approver acts.'}
          </p>
        </SheetHeader>

        <div className='flex-1 space-y-4 overflow-y-auto px-5 py-4'>
          {/* Effective-dated viewing controls (GRP-13) */}
          <div className='border-grey-200 flex flex-wrap items-center gap-3 rounded-[6px] border bg-white px-3 py-2'>
            <label className='text-paragraph-sm text-neutral-1000 flex items-center gap-2'>
              Membership as of
              <Input
                type='date'
                value={asOf}
                onChange={(e) => setAsOf(e.target.value || todayIso())}
                className='h-7 w-[150px]'
              />
            </label>
            <label className='text-paragraph-sm text-neutral-1000 flex items-center gap-2'>
              <Switch checked={showHistory} onCheckedChange={setShowHistory} />
              Show full history (ended memberships kept for point-in-time audit)
            </label>
          </div>

          {/* Bulk toolbar */}
          {manageable && (
            <div className='flex flex-wrap items-center gap-2'>
              <Button
                variant='outline'
                className='h-7'
                disabled={selected.length === 0}
                onClick={handleRemove}
              >
                Remove selected ({selected.length})
              </Button>
              <Select value={transferTarget} onValueChange={setTransferTarget}>
                <SelectTrigger variant='secondary' className='h-7 w-[200px]'>
                  <SelectValue placeholder='Transfer selected to…' />
                </SelectTrigger>
                <SelectContent>
                  {transferTargets.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant='outline'
                className='h-7'
                disabled={selected.length === 0 || !transferTarget}
                onClick={handleTransfer}
              >
                Transfer
              </Button>
              <Button variant='outline' className='h-7' onClick={handleImport}>
                Import file
              </Button>
              <Button variant='outline' className='h-7' onClick={handleExport}>
                Export CSV
              </Button>
              {group.type === 'dynamic' && (
                <>
                  <Button
                    variant='outline'
                    className='h-7'
                    onClick={() => store.runEligibilityEngine(group.id, actor)}
                  >
                    Re-evaluate eligibility
                  </Button>
                  <Button
                    variant='outline'
                    className='h-7'
                    onClick={() => store.switchGroupType(group.id, actor)}
                  >
                    Freeze to static
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Membership grid */}
          <div className='border-grey-200 overflow-hidden rounded-[6px] border bg-white'>
            <div className='text-paragraph-sm text-neutral-1000 border-grey-200 grid grid-cols-[28px_1fr_130px_100px_150px] items-center gap-2 border-b px-3 py-2 font-medium'>
              <span />
              <span>Member</span>
              <span>Kind</span>
              <span>Source</span>
              <span>Effective</span>
            </div>
            {rows.length === 0 ? (
              <p className='text-paragraph-sm text-neutral-1000 px-3 py-4'>
                No memberships effective on {asOf}.
              </p>
            ) : (
              rows.map((m) => {
                const person = memberById.get(m.memberId)
                if (!person) return null
                const ended = Boolean(m.effectiveTo)
                return (
                  <div
                    key={m.id}
                    className={`border-grey-200 grid grid-cols-[28px_1fr_130px_100px_150px] items-center gap-2 border-b px-3 py-2 last:border-b-0 ${ended ? 'opacity-60' : ''}`}
                  >
                    <Checkbox
                      variant='blue'
                      disabled={!manageable || ended}
                      checked={selected.includes(m.memberId)}
                      onCheckedChange={() =>
                        toggle(m.memberId, selected, setSelected)
                      }
                      aria-label={`Select ${person.name}`}
                    />
                    <div className='flex min-w-0 flex-col'>
                      <span className='text-neutral-1600 truncate text-sm font-medium'>
                        {person.name}
                      </span>
                      <span className='text-paragraph-sm text-neutral-1000'>
                        {person.code} · {person.department}
                      </span>
                    </div>
                    <KindBadge kind={person.kind} />
                    <SourceBadge source={m.source} />
                    <span className='text-neutral-1000 text-xs'>
                      {m.effectiveFrom} → {m.effectiveTo ?? 'present'}
                    </span>
                  </div>
                )
              })
            )}
          </div>

          {/* Bulk add (employees, non-user employees and users — GRP-05/06/10) */}
          {manageable && (
            <div>
              <div className='mb-2 flex items-center justify-between'>
                <h3 className='text-neutral-1600 text-sm font-medium'>
                  Add members — employees, non-user employees and users
                </h3>
                <Button
                  className='h-7'
                  disabled={toAdd.length === 0}
                  onClick={handleAdd}
                >
                  {viaApproval
                    ? `Request add (${toAdd.length})`
                    : `Add selected (${toAdd.length})`}
                </Button>
              </div>
              <div className='border-grey-200 max-h-56 space-y-1 overflow-y-auto rounded-[6px] border bg-white p-2'>
                {candidates.length === 0 ? (
                  <p className='text-paragraph-sm text-neutral-1000 px-1 py-2'>
                    Everyone is already a member — duplicates are prevented.
                  </p>
                ) : (
                  candidates.map((p) => (
                    <label
                      key={p.id}
                      className='hover:bg-neutral-200 flex cursor-pointer items-center gap-2 rounded px-2 py-1.5'
                    >
                      <Checkbox
                        variant='blue'
                        checked={toAdd.includes(p.id)}
                        onCheckedChange={() => toggle(p.id, toAdd, setToAdd)}
                        aria-label={`Add ${p.name}`}
                      />
                      <span className='text-neutral-1600 flex-1 truncate text-sm'>
                        {p.name}{' '}
                        <span className='text-neutral-1000'>({p.code})</span>
                      </span>
                      <KindBadge kind={p.kind} />
                    </label>
                  ))
                )}
              </div>
              <p className='text-paragraph-sm text-neutral-1000 mt-1'>
                Group membership never grants login capability — non-user
                employees are covered by policies without accounts.
              </p>
            </div>
          )}
        </div>
      </FloatingSheetContent>
    </Sheet>
  )
}
