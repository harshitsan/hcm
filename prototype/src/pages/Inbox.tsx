/**
 * Inbox — Journey 4: "clear my queue in 5 minutes".
 * One unified list, decide from the card, bulk-approve the routine ones.
 */
import { useState } from 'react'
import { CheckCheck, Plane } from 'lucide-react'
import {
  Avatar,
  Btn,
  Card,
  Drawer,
  EmptyState,
  Pill,
  SectionTitle,
  Segmented,
  Timeline,
  Toggle,
} from '../ui'
import { useApp } from '../store'
import type { InboxItem } from '../data'

const FILTERS = ['All', 'Time off', 'Hiring', 'Other'] as const
type Filter = (typeof FILTERS)[number]

function matchesFilter(item: InboxItem, filter: Filter): boolean {
  if (filter === 'All') return true
  if (filter === 'Time off') return item.kind === 'Time off'
  if (filter === 'Hiring') return item.kind === 'Job offer'
  return item.kind === 'Attendance fix' || item.kind === 'Onboarding' || item.kind === 'Probation'
}

export default function Inbox() {
  const { inbox, decideInbox, bulkApproveSafe, toast } = useApp()
  const [filter, setFilter] = useState<Filter>('All')
  const [openId, setOpenId] = useState<string | null>(null)
  const [routeAway, setRouteAway] = useState(false)

  const waiting = inbox.filter((i) => i.status === 'waiting')
  const decided = inbox.filter((i) => i.status !== 'waiting')
  const safeCount = waiting.filter((i) => i.safe).length
  const visible = waiting.filter((i) => matchesFilter(i, filter))
  const drawerItem = inbox.find((i) => i.id === openId) ?? null

  const approve = (item: InboxItem) => {
    decideInbox(item.id, 'approved')
    toast(`Approved — ${item.who.split(' ')[0]} gets the good news right away`)
  }
  const decline = (item: InboxItem) => {
    decideInbox(item.id, 'declined')
    toast("Declined — they'll see your decision right away")
  }
  const bulkApprove = () => {
    const c = bulkApproveSafe()
    toast(`Approved ${c} routine ${c === 1 ? 'request' : 'requests'} — everyone's been told`)
  }

  return (
    <div className="mx-auto max-w-6xl animate-fade-in">
      {/* hero */}
      <Card glow className="mb-5 p-7">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="mb-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">Inbox</div>
            <h1 className="font-display text-[32px] font-medium leading-tight tracking-tight">
              {waiting.length > 0
                ? `${waiting.length} ${waiting.length === 1 ? 'person is' : 'people are'} waiting on you`
                : "You're all caught up"}
            </h1>
            <p className="mt-1.5 max-w-md text-[13.5px] text-muted">
              {waiting.length > 0
                ? 'About 5 minutes to clear — start with the red ones.'
                : 'Nothing needs a decision right now.'}
            </p>
          </div>
          {safeCount > 0 && (
            <div className="rounded-2xl border border-line/70 bg-card p-4">
              <div className="max-w-[260px] text-[12.5px] font-semibold text-ink-soft">
                {safeCount} of these are routine — within balance, no conflicts
              </div>
              <Btn variant="amber" size="sm" className="mt-3" onClick={bulkApprove}>
                <CheckCheck className="h-4 w-4" /> Approve all {safeCount} safe
              </Btn>
            </div>
          )}
        </div>
      </Card>

      {/* filter row */}
      <div className="mb-4">
        <Segmented options={FILTERS} value={filter} onChange={setFilter} />
      </div>

      {/* waiting list */}
      {visible.length > 0 ? (
        <div className="space-y-3">
          {visible.map((i) => (
            <Card key={i.id} className="p-5">
              <div className="flex flex-wrap items-start gap-4">
                <Avatar name={i.who} hue={i.whoHue} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-[14px] font-bold tracking-tight">{i.who}</span>
                    <span className="text-[12px] text-muted">{i.whoRole}</span>
                  </div>
                  <div className="mt-0.5 text-[15px] font-semibold tracking-tight">{i.title}</div>
                  <div className="mt-1 text-[12.5px] text-muted">{i.facts.join(' · ')}</div>
                  {i.source && (
                    <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-accent-soft/70 px-2.5 py-1 text-[11px] font-semibold text-accent-ink">
                      ⚡ Auto-created by the rule “{i.source}” — your yes is the approval step
                    </div>
                  )}
                  <div className="mt-3.5 flex items-center gap-2">
                    <Btn size="sm" onClick={() => approve(i)}>
                      Approve
                    </Btn>
                    <Btn size="sm" variant="ghost" onClick={() => decline(i)}>
                      Decline
                    </Btn>
                    <Btn size="sm" variant="ghost" onClick={() => setOpenId(i.id)}>
                      Details
                    </Btn>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <Pill tone={i.dueTone}>{i.due}</Pill>
                  <Pill tone="outline">{i.kind}</Pill>
                  {i.safe && (
                    <Pill tone="green" dot>
                      Safe to approve
                    </Pill>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : waiting.length === 0 ? (
        <EmptyState
          title="Queue zero — nice."
          body="Nothing is waiting on you. New requests land here the moment they're sent."
        />
      ) : (
        <EmptyState
          title="Nothing in this view"
          body="Switch the filter above to see what's still waiting on you."
        />
      )}

      {/* done today */}
      {decided.length > 0 && (
        <div className="mt-8">
          <SectionTitle hint="Decisions you've already made">Done today</SectionTitle>
          <Card className="overflow-hidden">
            {decided.map((i) => (
              <div
                key={i.id}
                className="flex items-center gap-3 border-b border-line/60 px-5 py-3 opacity-80 last:border-0"
              >
                <Avatar name={i.who} hue={i.whoHue} size="sm" />
                <span className="shrink-0 text-[13px] font-bold tracking-tight">{i.who}</span>
                <span className="min-w-0 flex-1 truncate text-[12.5px] text-muted">{i.title}</span>
                <Pill tone={i.status === 'approved' ? 'green' : 'red'}>
                  {i.status === 'approved' ? 'Approved' : 'Declined'}
                </Pill>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* delegation = one toggle */}
      <Card className="mt-8 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-card2 text-muted">
              <Plane className="h-4 w-4" />
            </span>
            <div>
              <div className="text-[14px] font-bold tracking-tight">Going on leave?</div>
              <div className="text-[12.5px] text-muted">Route my approvals to Sara until I'm back</div>
            </div>
          </div>
          <Toggle
            on={routeAway}
            onChange={(v) => {
              setRouteAway(v)
              toast(v ? 'Done — Sara picks up anything new from tomorrow' : 'Routing off — approvals come to you again')
            }}
          />
        </div>
      </Card>

      {/* details drawer */}
      <Drawer
        open={!!drawerItem}
        onClose={() => setOpenId(null)}
        title={drawerItem?.title ?? ''}
        footer={
          drawerItem && drawerItem.status === 'waiting' ? (
            <div className="flex justify-end gap-2">
              <Btn
                variant="ghost"
                onClick={() => {
                  decline(drawerItem)
                  setOpenId(null)
                }}
              >
                Decline
              </Btn>
              <Btn
                onClick={() => {
                  approve(drawerItem)
                  setOpenId(null)
                }}
              >
                Approve
              </Btn>
            </div>
          ) : undefined
        }
      >
        {drawerItem && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 rounded-2xl bg-card2 p-4">
              <Avatar name={drawerItem.who} hue={drawerItem.whoHue} size="lg" />
              <div className="min-w-0">
                <div className="text-[14px] font-bold tracking-tight">{drawerItem.who}</div>
                <div className="text-[12.5px] text-muted">{drawerItem.whoRole}</div>
              </div>
              <div className="ml-auto">
                <Pill tone={drawerItem.dueTone}>{drawerItem.due}</Pill>
              </div>
            </div>

            <div>
              <div className="mb-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">
                What you need to know
              </div>
              <ul className="space-y-2.5">
                {drawerItem.facts.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[13px] leading-snug">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="mb-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">
                Where it is
              </div>
              <Timeline
                steps={[
                  { label: 'Requested', at: `by ${drawerItem.who.split(' ')[0]}`, done: true },
                  { label: 'With you', at: 'now', done: false },
                  { label: 'Decision', done: false },
                ]}
              />
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
