/**
 * The shared pipeline visual — used by flow cards, rule cards, and both
 * composers' live previews. Renders the full sophistication of a step:
 * parallel role groups with quorums ("any 2 of 3"), deadlines with reminder
 * nudges, multi-rung escalation ladders, and conditional tiers ("only when
 * the claim is above ₹2,00,000").
 */
import { Fragment } from 'react'
import { ArrowRight } from 'lucide-react'
import type { FlowStep } from '../data'

export function NodeChip({ children, done }: { children: string; done?: boolean }) {
  return (
    <span
      className={
        done
          ? 'whitespace-nowrap rounded-full bg-green-soft px-2.5 py-1 text-[11.5px] font-bold leading-none text-green'
          : 'whitespace-nowrap rounded-full bg-card2 px-2.5 py-1 text-[11.5px] font-bold leading-none'
      }
    >
      {children}
    </span>
  )
}

function modeLabel(s: FlowStep): string {
  if (s.roles.length <= 1) return ''
  if (s.quorum && s.quorum < s.roles.length) return `any ${s.quorum} of ${s.roles.length}`
  return s.mode === 'all' ? 'all of them' : 'any one of them'
}

function ladderText(s: FlowStep): string | null {
  if (s.escalations && s.escalations.length > 0)
    return 'quiet? → ' + s.escalations.map((e) => `${e.to} after ${e.after}`).join(', then ')
  if (s.escalateTo) return `quiet? → ${s.escalateTo}`
  return null
}

export function Pipeline({ steps, start = 'Request comes in' }: { steps: FlowStep[]; start?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <NodeChip>{start}</NodeChip>
      {steps.map((s) => {
        const ladder = ladderText(s)
        return (
          <Fragment key={s.id}>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted" />
            <div className="flex max-w-[230px] flex-col items-center gap-1">
              {s.roles.length > 1 ? (
                <div className="rounded-2xl border border-line p-2">
                  <div className="mb-1.5 text-center text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
                    {modeLabel(s)}
                  </div>
                  <div className="flex flex-col items-stretch gap-1">
                    {s.roles.map((r) => (
                      <span
                        key={r}
                        className="rounded-full bg-card2 px-2.5 py-1 text-center text-[11.5px] font-bold leading-none"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <NodeChip>{s.roles[0] ?? '—'}</NodeChip>
              )}
              <div className="text-center text-[11px] leading-snug text-muted">
                <div>
                  ⏱ {s.sla}
                  {s.remind && <span> · nudges at 50/75%</span>}
                </div>
                {ladder && <div>{ladder}</div>}
                {s.onlyWhen && <div className="font-semibold text-accent-ink">only when {s.onlyWhen}</div>}
              </div>
            </div>
          </Fragment>
        )
      })}
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted" />
      <NodeChip done>Done ✓</NodeChip>
    </div>
  )
}
