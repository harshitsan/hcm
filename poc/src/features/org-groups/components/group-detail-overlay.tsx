import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { type Member, type OrgGroup } from '../data/groups'
import { type OrgGroupsStore } from '../hooks/use-org-groups'
import { effectiveInheritanceRule, hierarchyPath } from '../utils/hierarchy'
import { membershipsOf, todayIso } from '../utils/resolve'
import {
  CategoryBadge,
  KindBadge,
  ScopeBadge,
  SourceBadge,
  StatusBadge,
  TypeBadge,
} from './group-badges'

interface GroupDetailOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: OrgGroup | null
  store: OrgGroupsStore
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className='flex items-start justify-between gap-4 py-1.5'>
      <span className='text-paragraph-sm text-neutral-1000 shrink-0'>
        {label}
      </span>
      <span className='text-neutral-1600 text-right text-sm'>{value}</span>
    </div>
  )
}

/**
 * Read-only group inspection (GRP-32): full definition, hierarchy position and
 * current membership — no field here is editable; use Edit for changes.
 */
export function GroupDetailOverlay({
  open,
  onOpenChange,
  group,
  store,
}: GroupDetailOverlayProps) {
  if (!group) return null

  const today = todayIso()
  const current = membershipsOf(store.memberships, group.id, today)
  const memberById = new Map<string, Member>(
    store.members.map((m) => [m.id, m])
  )
  const usedBy = store.policiesUsing(group.id)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[480px]'>
        <SheetHeader className='border-grey-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            View group — {group.name}
          </SheetTitle>
          <p className='text-paragraph-sm text-neutral-1000'>
            Read-only detail. Nothing on this panel can be changed; close it and
            use Edit to make changes.
          </p>
        </SheetHeader>

        <div className='flex-1 space-y-4 overflow-y-auto px-5 py-4'>
          <div className='flex flex-wrap items-center gap-2'>
            <ScopeBadge scope={group.scope} />
            <CategoryBadge category={group.category} />
            <TypeBadge type={group.type} />
            <StatusBadge status={group.status} />
          </div>

          <div>
            <Row label='Acronym' value={group.acronym || '—'} />
            <Row label='Applicability' value={group.applicability} />
            <Row label='Owner / steward' value={group.owner ?? 'Unassigned'} />
            <Row
              label='Hierarchy position'
              value={hierarchyPath(store.groups, group.id)}
            />
            <Row
              label='Inheritance rule (effective)'
              value={effectiveInheritanceRule(store.groups, group.id)}
            />
            <Row
              label='Approval-controlled'
              value={group.requiresApproval ? 'Yes' : 'No'}
            />
            {group.classType && (
              <Row label='Class type' value={group.classType} />
            )}
            {group.payrollFrequency && (
              <Row label='Payroll frequency' value={group.payrollFrequency} />
            )}
            {group.wageType && <Row label='Wage type' value={group.wageType} />}
            {group.eligibilityRule && (
              <Row label='Membership rule' value={group.eligibilityRule} />
            )}
            <Row
              label='Config version'
              value={`v${group.version} · effective ${group.effectiveFrom}`}
            />
            <Row label='Last updated by' value={group.updatedBy} />
          </div>

          <Separator />

          <div>
            <h3 className='text-neutral-1600 mb-1 text-sm font-medium'>
              Description / eligibility note
            </h3>
            <p className='text-neutral-1900 text-sm whitespace-pre-wrap'>
              {group.description || 'No description recorded.'}
            </p>
          </div>

          <Separator />

          <div>
            <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
              Members effective today ({current.length})
            </h3>
            {current.length === 0 ? (
              <p className='text-paragraph-sm text-neutral-1000'>
                This group has 0 members as of {today}.
              </p>
            ) : (
              <ul className='space-y-2'>
                {current.map((m) => {
                  const person = memberById.get(m.memberId)
                  if (!person) return null
                  return (
                    <li
                      key={m.id}
                      className='border-grey-200 flex items-center justify-between rounded-[6px] border bg-white px-3 py-2'
                    >
                      <div className='flex min-w-0 flex-col'>
                        <span className='text-neutral-1600 truncate text-sm font-medium'>
                          {person.name}
                        </span>
                        <span className='text-paragraph-sm text-neutral-1000'>
                          {person.code} · effective {m.effectiveFrom}
                        </span>
                      </div>
                      <div className='flex shrink-0 items-center gap-1.5'>
                        <KindBadge kind={person.kind} />
                        <SourceBadge source={m.source} />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <Separator />

          <div>
            <h3 className='text-neutral-1600 mb-1 text-sm font-medium'>
              Used as applicability criteria by
            </h3>
            {usedBy.length === 0 ? (
              <p className='text-paragraph-sm text-neutral-1000'>
                No active policy currently targets this group.
              </p>
            ) : (
              <ul className='text-neutral-1900 list-inside list-disc text-sm'>
                {usedBy.map((p) => (
                  <li key={p.id}>
                    {p.name} <span className='text-neutral-1000'>({p.module})</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </FloatingSheetContent>
    </Sheet>
  )
}
