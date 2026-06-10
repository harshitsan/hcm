/**
 * Hiring — openings, candidates, interviews, offers (BRD §6.13) as a warm,
 * simple four-column board. Moving someone past Offer converts them into a
 * person in People — the record, the day-one checklist, the lot.
 */
import { Briefcase, Plus, Send, Users } from 'lucide-react'
import { APPLIED_OVERFLOW, CANDIDATE_STAGES, type CandidateStage } from '../data'
import { useApp } from '../store'
import { Avatar, Btn, Card, Pill, Stat } from '../ui'

/** one muted word on what each column means */
const STAGE_HINTS: Record<CandidateStage, string> = {
  Applied: 'the pile',
  Interviewing: 'being seen',
  Offer: 'out the door',
  Joining: 'almost in',
}

/** what the ghost button says — by the stage the candidate is leaving */
const MOVE_LABEL: Record<Exclude<CandidateStage, 'Joining'>, string> = {
  Applied: 'Interview',
  Interviewing: 'Make an offer',
  Offer: 'Mark joined ✓',
}

/** the toast, worded for where they're headed */
function moveToast(from: Exclude<CandidateStage, 'Joining'>, first: string): string {
  if (from === 'Applied') return `${first} moves to interviews`
  if (from === 'Interviewing') return `Offer drafted for ${first} — approval lands in the Inbox`
  return `${first} is in — employee record created, onboarding starts`
}

export default function Hiring() {
  const { candidates, advanceCandidate, toast, company } = useApp()

  // hiring is always per company — the global view shows Acme as the example
  const scopeId = company.id === 'all' ? 'acme' : company.id
  const visible = candidates.filter((c) => c.companyId === scopeId)
  const offersOut = visible.filter((c) => c.stage === 'Offer').length

  return (
    <div className="mx-auto max-w-6xl animate-fade-in">
      {/* hero */}
      <Card glow className="mb-5 p-7">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="mb-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">Hiring</div>
            <h1 className="font-display text-[32px] font-medium leading-tight tracking-tight">Four roles, moving</h1>
            <p className="mt-1.5 max-w-md text-[13.5px] text-muted">
              Every candidate, where they stand, and what's next — no one falls between stages.
            </p>
          </div>
          <div className="flex items-center gap-6 pb-1">
            <Stat icon={<Briefcase />} value={4} label="Open roles" />
            <Stat icon={<Users />} value={visible.length + APPLIED_OVERFLOW} label="Candidates" />
            <Stat icon={<Send />} value={offersOut} label="Offers out" />
            <Btn variant="dark" onClick={() => toast('Opening drafted — the hiring flow routes its approvals')}>
              <Plus className="h-4 w-4" /> New opening
            </Btn>
          </div>
        </div>
      </Card>

      {company.id === 'all' && (
        <p className="mb-4 text-[12px] text-muted">Showing Acme Tech — hiring is per company.</p>
      )}

      {/* the board */}
      <div className="grid gap-4 lg:grid-cols-4">
        {CANDIDATE_STAGES.map((stage) => {
          const inStage = visible.filter((c) => c.stage === stage)
          return (
            <div key={stage}>
              <div className="flex items-center gap-2">
                <h2 className="text-[13px] font-bold tracking-tight">{stage}</h2>
                <Pill tone="neutral">{inStage.length}</Pill>
              </div>
              <p className="mb-3 mt-0.5 text-[11px] text-muted">{STAGE_HINTS[stage]}</p>

              <div className="space-y-3">
                {inStage.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-[12px] text-muted">
                    no one here right now
                  </div>
                )}

                {inStage.map((c) => (
                  <Card key={c.id} className="p-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={c.name} hue={c.hue} size="sm" />
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-bold tracking-tight">{c.name}</div>
                        <div className="truncate text-[11.5px] text-muted">{c.role}</div>
                      </div>
                    </div>
                    <p className="mt-2.5 text-[12px] leading-snug text-muted">{c.meta}</p>
                    {c.score !== undefined && (
                      <Pill tone="amber" className="mt-2.5">★ {c.score} panel</Pill>
                    )}
                    <div className="mt-3">
                      {stage === 'Joining' ? (
                        <Pill tone="green">Employee record ready</Pill>
                      ) : (
                        <Btn
                          variant="ghost"
                          size="sm"
                          className="-ml-1.5"
                          onClick={() => {
                            advanceCandidate(c.id)
                            toast(moveToast(stage, c.name.split(' ')[0]))
                          }}
                        >
                          {MOVE_LABEL[stage]}
                        </Btn>
                      )}
                    </div>
                  </Card>
                ))}

                {stage === 'Applied' && (
                  <div className="rounded-2xl bg-card2/60 px-4 py-3 text-[12px] text-muted">
                    + {APPLIED_OVERFLOW} more in the pile — the screening rule trims it daily
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* the conversion note */}
      <p className="mt-5 text-[12px] text-muted">
        Mark joined and the candidate becomes a person in People — record, day-one checklist, the lot. Nothing re-typed.
      </p>
    </div>
  )
}
