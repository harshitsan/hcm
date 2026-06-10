/**
 * Hiring — openings, candidates, interviews, offers (BRD §6.13) as a warm,
 * simple four-column board. Moving someone past Offer converts them into a
 * person in People — the record, the day-one checklist, the lot.
 *
 * Two surfaces on top of the board: the openings strip (each opening owned
 * twice — a recruiter runs it, a hiring manager decides) and a candidate
 * drawer with the interviews, references, and the offer.
 */
import { Briefcase, CalendarDays, FileText, Plus, Search, Send, Users } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { APPLIED_OVERFLOW, CANDIDATE_STAGES, type CandidateStage } from '../data'
import { useApp } from '../store'
import { Avatar, Btn, Card, Drawer, Field, Input, Pill, Progress, SectionTitle, Select, Stat, statusTone } from '../ui'

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

const TEAM_CHOICES = ['Engineering', 'Design', 'Sales', 'People', 'Finance', 'Operations']
const RECRUITER_CHOICES = ['Sara Iyer', 'Tara Menon']
const HIRING_MANAGER_CHOICES = ['Arjun Mehta', 'Ananya Rao', 'Vikram Shah', 'Isha Reddy']

/** a labelled block inside the candidate drawer */
function DrawerSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-5">
      <div className="mb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">{title}</div>
      {children}
    </div>
  )
}

export default function Hiring() {
  const { candidates, advanceCandidate, toast, company, persona, openings, addOpening, approveOpening } = useApp()

  // hiring is always per company — the global view shows Acme as the example
  const scopeId = company.id === 'all' ? 'acme' : company.id
  const visible = candidates.filter((c) => c.companyId === scopeId)
  const myOpenings = openings.filter((o) => o.companyId === scopeId)
  const offersOut = visible.filter((c) => c.stage === 'Offer').length
  const canApprove = persona.id === 'hradmin' || persona.id === 'operator' || persona.id === 'portfolio'

  // the opening composer
  const [composerOpen, setComposerOpen] = useState(false)
  const [draftRole, setDraftRole] = useState('')
  const [draftTeam, setDraftTeam] = useState('Engineering')
  const [draftRecruiter, setDraftRecruiter] = useState('Sara Iyer')
  const [draftManager, setDraftManager] = useState('Arjun Mehta')

  const draftOpening = () => {
    addOpening({
      id: 'op' + (openings.length + 1),
      role: draftRole.trim() || 'New role',
      team: draftTeam,
      recruiter: draftRecruiter,
      hiringManager: draftManager,
      status: 'Waiting for approval',
      candidates: 0,
      opened: 'just now',
      companyId: scopeId,
    })
    toast('Drafted — it routes through the hiring flow for approval')
    setComposerOpen(false)
    setDraftRole('')
  }

  // the candidate drawer
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const sel = selectedId ? candidates.find((c) => c.id === selectedId) : undefined

  let candidateFooter: ReactNode = null
  if (sel) {
    if (sel.stage === 'Joining') {
      candidateFooter = (
        <div className="flex items-center justify-between gap-3">
          <Pill tone="green">Employee record ready</Pill>
          <span className="text-[12px] text-muted">Converted — see them in People.</span>
        </div>
      )
    } else {
      const stage = sel.stage
      const id = sel.id
      const first = sel.name.split(' ')[0]
      candidateFooter = (
        <Btn
          variant="dark"
          className="w-full"
          onClick={() => {
            advanceCandidate(id)
            toast(moveToast(stage, first))
            setSelectedId(null)
          }}
        >
          {MOVE_LABEL[stage]}
        </Btn>
      )
    }
  }

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
            <Btn variant="dark" onClick={() => setComposerOpen(true)}>
              <Plus className="h-4 w-4" /> New opening
            </Btn>
          </div>
        </div>
      </Card>

      {company.id === 'all' && (
        <p className="mb-4 text-[12px] text-muted">Showing Acme Tech — hiring is per company.</p>
      )}

      {/* the openings strip */}
      <div className="mb-6">
        <SectionTitle hint="Each one is owned twice: a recruiter runs it, a hiring manager decides.">
          The openings
        </SectionTitle>
        <div className="grid gap-4 lg:grid-cols-4">
          {myOpenings.map((o) => (
            <Card key={o.id} className="p-4">
              <div className="text-[14px] font-bold tracking-tight">{o.role}</div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Pill tone="outline">{o.team}</Pill>
                <Pill tone={statusTone(o.status)} dot>
                  {o.status}
                </Pill>
              </div>
              <div className="mt-3 space-y-1.5 text-[12px] text-ink-soft">
                <div className="flex items-center gap-1.5">
                  <Search className="h-4 w-4 text-muted" />
                  <span>
                    <span className="font-semibold">{o.recruiter}</span> recruits
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-muted" />
                  <span>
                    <span className="font-semibold">{o.hiringManager}</span> hires
                  </span>
                </div>
              </div>
              <p className="mt-2.5 text-[11.5px] text-muted">
                {o.candidates} candidates · opened {o.opened}
              </p>
              {o.status === 'Waiting for approval' && (
                <div className="mt-3">
                  <div className="rounded-2xl bg-accent-soft p-3 text-[12px] font-medium text-accent-ink">
                    Routes through the hiring flow
                  </div>
                  {canApprove && (
                    <Btn
                      variant="dark"
                      size="sm"
                      className="mt-2 w-full"
                      onClick={() => {
                        approveOpening(o.id)
                        toast('Open — sourcing starts now')
                      }}
                    >
                      Approve & open
                    </Btn>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

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
                  <Card key={c.id} className="p-4" onClick={() => setSelectedId(c.id)}>
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
                    <div className="mt-3" onClick={(e) => e.stopPropagation()}>
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

      {/* the opening composer */}
      <Drawer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        title="New opening"
        footer={
          <Btn variant="dark" className="w-full" onClick={draftOpening}>
            Draft the opening
          </Btn>
        }
      >
        <div className="space-y-4">
          <Field label="Role">
            <Input
              placeholder="e.g. Senior QA"
              value={draftRole}
              onChange={(e) => setDraftRole(e.target.value)}
            />
          </Field>
          <Field label="Team">
            <Select value={draftTeam} onChange={(e) => setDraftTeam(e.target.value)}>
              {TEAM_CHOICES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </Field>
          <Field label="Recruiter" hint="Runs the search day to day.">
            <Select value={draftRecruiter} onChange={(e) => setDraftRecruiter(e.target.value)}>
              {RECRUITER_CHOICES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </Select>
          </Field>
          <Field label="Hiring manager" hint="Decides who gets the offer.">
            <Select value={draftManager} onChange={(e) => setDraftManager(e.target.value)}>
              {HIRING_MANAGER_CHOICES.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </Select>
          </Field>
        </div>
      </Drawer>

      {/* the candidate drawer */}
      {sel && (
        <Drawer open onClose={() => setSelectedId(null)} title={sel.name} footer={candidateFooter}>
          {/* who they are */}
          <div className="flex items-center gap-3">
            <Avatar name={sel.name} hue={sel.hue} size="lg" />
            <div>
              <div className="text-[13.5px] font-semibold">{sel.role}</div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <Pill tone="neutral">{sel.stage}</Pill>
                {sel.score !== undefined && <Pill tone="amber">★ {sel.score} panel</Pill>}
              </div>
            </div>
          </div>

          {(sel.source || sel.resume) && (
            <DrawerSection title="Where they came from">
              {sel.source && <p className="text-[12.5px] text-ink-soft">{sel.source}</p>}
              {sel.resume && (
                <button
                  type="button"
                  onClick={() => toast('Opens the CV — in the real thing')}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-card2 px-2.5 py-1 text-[11.5px] font-bold"
                >
                  <FileText className="h-4 w-4" /> {sel.resume}
                </button>
              )}
            </DrawerSection>
          )}

          {(sel.panel || sel.nextStep || sel.scorecard) && (
            <DrawerSection title="The interviews">
              {sel.panel && (
                <div className="flex flex-wrap items-center gap-3">
                  {sel.panel.map((name, i) => (
                    <span key={name} className="flex items-center gap-1.5">
                      <Avatar name={name} hue={i} size="xs" />
                      <span className="text-[11.5px] font-semibold">{name}</span>
                    </span>
                  ))}
                </div>
              )}
              {sel.nextStep && (
                <div className="mt-3 flex items-start gap-2 rounded-2xl bg-accent-soft p-3 text-[12.5px] font-medium text-accent-ink">
                  <CalendarDays className="mt-0.5 h-4 w-4 shrink-0" />
                  {sel.nextStep}
                </div>
              )}
              {sel.scorecard && (
                <div className="mt-3 space-y-2">
                  {sel.scorecard.map((s) => (
                    <div key={s.area} className="flex items-center gap-3">
                      <span className="w-28 shrink-0 text-[12px] font-medium text-ink-soft">{s.area}</span>
                      <Progress value={s.score * 20} tone={s.score >= 4 ? 'green' : 'amber'} className="flex-1" />
                      <span className="text-[12.5px] font-bold">{s.score}</span>
                    </div>
                  ))}
                  <p className="pt-1 text-[11.5px] text-muted">
                    Scorecards are structured — same criteria for every candidate on this opening.
                  </p>
                </div>
              )}
            </DrawerSection>
          )}

          {sel.references && (
            <DrawerSection title="References">
              <div className="space-y-2">
                {sel.references.map((r) => (
                  <div key={r.who} className="flex items-start justify-between gap-3 rounded-2xl bg-card2 p-3">
                    <div>
                      <div className="text-[12px] font-bold">{r.who}</div>
                      <div className="mt-0.5 text-[12.5px] italic text-muted">{r.note}</div>
                    </div>
                    {r.done && <Pill tone="green">verified</Pill>}
                  </div>
                ))}
              </div>
            </DrawerSection>
          )}

          {sel.offer && (
            <DrawerSection title="The offer">
              <p className="text-[12.5px] font-semibold">{sel.offer.template}</p>
              <p className="mt-1 text-[12.5px] text-ink-soft">{sel.offer.status}</p>
              <p className="mt-2 text-[11.5px] text-muted">
                Letters come from the template library — approval routes through the Job offers flow.
              </p>
            </DrawerSection>
          )}
        </Drawer>
      )}
    </div>
  )
}
