/**
 * Add a company — Journey 1, the flagship guided journey (ux-research §4 J1).
 * Three stages in one page: pick a template → 7-step wizard with a phase rail →
 * the go-live moment with a green-light pre-flight checklist.
 */
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Check,
  FileText,
  ShieldCheck,
  UploadCloud,
  Users,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SETUP_PHASES, TEMPLATES } from '../data'
import { cn } from '../lib'
import { Btn, Card, Field, Input, Pill, Segmented, Select, Toggle } from '../ui'
import { useApp } from '../store'

const STEPS = SETUP_PHASES.flatMap((p) => p.steps.map((s) => ({ phase: p.title, title: s })))
const PHASE_OFFSETS = SETUP_PHASES.map((_, i) =>
  SETUP_PHASES.slice(0, i).reduce((n, p) => n + p.steps.length, 0),
)

const PLANS = ['Basic', 'Standard', 'Enterprise'] as const
const INDUSTRIES = ['Software & IT services', 'Food & beverage', 'Manufacturing', 'Retail & stores', 'Healthcare', 'Media & design']

const TIMEOFF_RULES = [
  { name: 'Casual & sick leave', how: 'runs instantly' },
  { name: 'Earned leave', how: 'Manager then HR' },
  { name: 'Festival calendar', how: '11 days' },
  { name: 'Comp-off', how: 'Manager approves' },
]

function PipeBox({ children, hollow }: { children: React.ReactNode; hollow?: boolean }) {
  return (
    <span
      className={cn(
        'rounded-xl px-3 py-1.5 text-[12.5px] font-semibold',
        hollow ? 'border border-dashed border-line text-muted' : 'border border-line bg-card',
      )}
    >
      {children}
    </span>
  )
}

export default function AddCompany() {
  const { companies, addCompany, setCompanyId, rules, toast } = useApp()
  const navigate = useNavigate()

  const [stage, setStage] = useState<'pick' | 'wizard' | 'live'>('pick')
  const [step, setStep] = useState(0)
  const [tplName, setTplName] = useState<string | null>(null)

  // step 1 — profile
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [industry, setIndustry] = useState(INDUSTRIES[0])
  const [plan, setPlan] = useState<(typeof PLANS)[number]>('Standard')

  // step 2 — locations
  const [locations, setLocations] = useState<{ name: string; city: string }[]>([{ name: 'Head office', city: '' }])
  const [locName, setLocName] = useState('')
  const [locCity, setLocCity] = useState('')

  // step 3 — teams
  const [teams, setTeams] = useState(['Engineering', 'Design', 'Sales', 'People', 'Finance'])
  const [teamInput, setTeamInput] = useState('')

  // step 4 — time off
  const [ruleOn, setRuleOn] = useState([true, true, true, true])

  // step 5 — approval flows (the expenses gap seeds the go-live warning)
  const [expFixed, setExpFixed] = useState(false)
  const [expSkipped, setExpSkipped] = useState(false)

  // step 6 — people test run
  const [tested, setTested] = useState(false)

  const [newId, setNewId] = useState('')

  const finalName = name.trim() || 'Northwind Foods'
  const rulesOnCount = ruleOn.filter(Boolean).length

  const startWizard = (template: string | null) => {
    setTplName(template)
    setStep(0)
    setStage('wizard')
    toast(template ? `${template} loaded — review and adjust, don't rebuild` : "Blank start — we'll walk it together")
  }

  const goLive = () => {
    const id = 'c' + (companies.length + 1)
    addCompany({
      id,
      name: finalName,
      short: finalName.charAt(0).toUpperCase(),
      city: city.trim() || 'Pune',
      employees: 24,
      status: 'Live',
      accent: '#C98A4B',
      since: 'Jun 2026',
      plan,
      inPortfolio: false,
    })
    setNewId(id)
    setStage('live')
    toast(`${finalName} is live — 24 invites are on their way`)
  }

  /* ────────────────────────────────────── stage: pick a template */
  if (stage === 'pick') {
    return (
      <div className="mx-auto max-w-6xl animate-fade-in">
        <Card glow className="mb-5 p-7">
          <div className="mb-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">Add a company</div>
          <h1 className="font-display text-[32px] font-medium leading-tight tracking-tight">How do you want to start?</h1>
          <p className="mt-1.5 max-w-xl text-[13.5px] text-muted">
            Start from something that already works — adjust instead of building from scratch.
          </p>
        </Card>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {TEMPLATES.map((t) => (
            <Card key={t.id} className="p-6" onClick={() => startWizard(t.name)}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-[17px] font-bold tracking-tight">{t.name}</h3>
                <div className="flex gap-1.5">
                  {t.tags.map((tag) => (
                    <Pill key={tag} tone="amber">{tag}</Pill>
                  ))}
                </div>
              </div>
              <p className="mt-1 text-[13px] text-muted">{t.desc}</p>
              <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3">
                {t.prefills.map((p) => (
                  <div key={p.label}>
                    <div className="font-display text-[22px] font-bold leading-none tracking-tight">{p.count}</div>
                    <div className="mt-1 text-[11px] text-muted">{p.label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-1.5 border-t border-line/70 pt-3 text-[12px] font-semibold text-green">
                <Check className="h-4 w-4" /> ≈ 2 hours of setup, prefilled
              </div>
            </Card>
          ))}
        </div>

        <button
          onClick={() => startWizard(null)}
          className="mt-5 w-full rounded-3xl border border-dashed border-line bg-card2/40 px-6 py-5 text-[13.5px] font-semibold text-muted transition-colors hover:bg-card2 hover:text-ink"
        >
          Start completely blank — the long road
        </button>
      </div>
    )
  }

  /* ────────────────────────────────────── stage: live (success teaches the next action) */
  if (stage === 'live') {
    const next = [
      { icon: <Users className="h-4 w-4" />, text: 'People sign in and meet their day-one checklist' },
      { icon: <FileText className="h-4 w-4" />, text: 'Policies go out for acknowledgment automatically' },
      { icon: <ShieldCheck className="h-4 w-4" />, text: 'Platform rules were enforced the moment it went live — see them under Rules & flows' },
      { icon: <BarChart3 className="h-4 w-4" />, text: 'You watch it all from Reports' },
    ]
    return (
      <div className="mx-auto max-w-6xl animate-fade-in">
        <Card glow className="mx-auto mt-8 max-w-xl p-10 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green text-card">
            <Check className="h-8 w-8" />
          </div>
          <h1 className="mt-5 font-display text-[32px] font-medium leading-tight tracking-tight">{finalName} is live</h1>
          <p className="mt-1.5 text-[13.5px] text-muted">24 invites just went out. Here's what happens next:</p>
          <ul className="mx-auto mt-6 max-w-sm space-y-3 text-left">
            {next.map((n) => (
              <li key={n.text} className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-card2 text-muted">{n.icon}</span>
                <span className="text-[13px] font-semibold">{n.text}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex items-center justify-center gap-2">
            <Btn
              variant="dark"
              onClick={() => {
                setCompanyId(newId)
                navigate('/')
                toast(`You're now working in ${finalName}`)
              }}
            >
              Open {finalName}
            </Btn>
            <Btn variant="ghost" onClick={() => navigate('/companies')}>
              Back to companies
            </Btn>
          </div>
        </Card>
      </div>
    )
  }

  /* ────────────────────────────────────── stage: wizard */
  const current = STEPS[step]

  const stepBody = () => {
    switch (step) {
      case 0:
        return (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company name">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Northwind Foods" />
            </Field>
            <Field label="City">
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Pune" />
            </Field>
            <Field label="What do they do">
              <Select value={industry} onChange={(e) => setIndustry(e.target.value)}>
                {INDUSTRIES.map((i) => (
                  <option key={i}>{i}</option>
                ))}
              </Select>
            </Field>
            <Field label="Plan">
              <Segmented options={PLANS} value={plan} onChange={setPlan} />
            </Field>
          </div>
        )
      case 1:
        return (
          <div>
            <div className="flex flex-wrap gap-2">
              {locations.map((l, i) => (
                <span
                  key={`${l.name}-${i}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-card2 py-1.5 pl-3.5 pr-1.5 text-[12.5px] font-semibold"
                >
                  {l.name}
                  {l.city && <span className="font-medium text-muted">· {l.city}</span>}
                  <button
                    onClick={() => setLocations(locations.filter((_, x) => x !== i))}
                    className="rounded-full p-1 text-muted hover:bg-line/60 hover:text-ink"
                    aria-label={`Remove ${l.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
            {tplName && <p className="mt-3 text-[12px] text-muted">Head office came from the template — add the rest.</p>}
            <div className="mt-5 flex flex-wrap items-end gap-3">
              <div className="min-w-[160px] flex-1">
                <Field label="Office name">
                  <Input value={locName} onChange={(e) => setLocName(e.target.value)} placeholder="e.g. Warehouse" />
                </Field>
              </div>
              <div className="min-w-[160px] flex-1">
                <Field label="City">
                  <Input value={locCity} onChange={(e) => setLocCity(e.target.value)} placeholder="e.g. Nagpur" />
                </Field>
              </div>
              <Btn
                variant="outline"
                size="sm"
                className="mb-1"
                onClick={() => {
                  if (!locName.trim()) return
                  setLocations([...locations, { name: locName.trim(), city: locCity.trim() }])
                  setLocName('')
                  setLocCity('')
                }}
              >
                Add
              </Btn>
            </div>
          </div>
        )
      case 2:
        return (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <p className="text-[12.5px] text-muted">
                {tplName ? 'From the template — keep what fits.' : 'Add the teams you need.'}
              </p>
              {tplName && <Pill tone="amber">from template</Pill>}
            </div>
            <div className="flex flex-wrap gap-2">
              {teams.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 rounded-full bg-card2 py-1.5 pl-3.5 pr-1.5 text-[12.5px] font-semibold"
                >
                  {t}
                  <button
                    onClick={() => setTeams(teams.filter((x) => x !== t))}
                    className="rounded-full p-1 text-muted hover:bg-line/60 hover:text-ink"
                    aria-label={`Remove ${t}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-5 flex items-end gap-3">
              <div className="max-w-xs flex-1">
                <Field label="Add a team">
                  <Input value={teamInput} onChange={(e) => setTeamInput(e.target.value)} placeholder="e.g. Operations" />
                </Field>
              </div>
              <Btn
                variant="outline"
                size="sm"
                className="mb-1"
                onClick={() => {
                  if (!teamInput.trim() || teams.includes(teamInput.trim())) return
                  setTeams([...teams, teamInput.trim()])
                  setTeamInput('')
                }}
              >
                Add
              </Btn>
            </div>
          </div>
        )
      case 3:
        return (
          <ul className="space-y-3">
            {TIMEOFF_RULES.map((r, i) => (
              <li
                key={r.name}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line/80 bg-card2/40 px-4 py-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-bold">{r.name}</span>
                  <span className="text-[12.5px] text-muted">· {r.how}</span>
                  <Pill tone="amber">from template</Pill>
                </div>
                <Toggle on={ruleOn[i]} onChange={(v) => setRuleOn(ruleOn.map((x, j) => (j === i ? v : x)))} />
              </li>
            ))}
          </ul>
        )
      case 4:
        return (
          <div className="space-y-3">
            <div className="rounded-2xl border border-line/80 bg-card2/40 p-4">
              <div className="mb-2.5 text-[13px] font-bold">Time off</div>
              <div className="flex flex-wrap items-center gap-2">
                <PipeBox>Person asks</PipeBox>
                <ArrowRight className="h-3.5 w-3.5 text-muted" />
                <PipeBox>Manager</PipeBox>
                <ArrowRight className="h-3.5 w-3.5 text-muted" />
                <PipeBox>Done ✓</PipeBox>
              </div>
            </div>
            <div className="rounded-2xl border border-line/80 bg-card2/40 p-4">
              <div className="mb-2.5 flex flex-wrap items-center gap-2">
                <span className="text-[13px] font-bold">Expenses</span>
                {!expFixed && <Pill tone="amber" dot>No approver yet</Pill>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <PipeBox>Person asks</PipeBox>
                <ArrowRight className="h-3.5 w-3.5 text-muted" />
                {expFixed ? (
                  <>
                    <PipeBox>Manager</PipeBox>
                    <ArrowRight className="h-3.5 w-3.5 text-muted" />
                    <PipeBox>Done ✓</PipeBox>
                  </>
                ) : (
                  <>
                    <PipeBox hollow>(no approver yet)</PipeBox>
                    <Btn
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setExpFixed(true)
                        toast('Expenses now go to the manager — all clear for go-live')
                      }}
                    >
                      Add Manager as approver
                    </Btn>
                  </>
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-line/80 bg-card2/40 p-4">
              <div className="mb-2.5 text-[13px] font-bold">Letters</div>
              <div className="flex flex-wrap items-center gap-2">
                <PipeBox>HR</PipeBox>
                <ArrowRight className="h-3.5 w-3.5 text-muted" />
                <PipeBox>Done ✓</PipeBox>
              </div>
            </div>
          </div>
        )
      case 5:
        return (
          <div>
            <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-line bg-card2/40 px-6 py-10 text-center">
              <UploadCloud className="mb-3 h-7 w-7 text-muted" />
              <p className="max-w-sm text-[13.5px] font-semibold">Drop a spreadsheet here — we run a test first.</p>
              <p className="mt-1 text-[12.5px] text-muted">Nothing saves until you say so.</p>
              <Btn
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setTested(true)
                  toast('Test finished — nothing was saved')
                }}
              >
                Run a test
              </Btn>
            </div>
            {tested && (
              <div className="mt-4 flex items-center gap-2.5 rounded-2xl bg-green-soft px-4 py-3 text-[13px] font-semibold text-green">
                <Check className="h-4 w-4" /> Test run: 24 people ready · 0 need fixes
              </div>
            )}
            <p className="mt-3 text-[12px] text-muted">Or invite a few by email to start.</p>
          </div>
        )
      case 6: {
        // born compliant: parent rules land the moment it exists — nothing to set up
        const inherited = rules.filter((r) => r.level !== 'Company' && r.status === 'Running').length
        const checks = [
          'Company profile',
          `${locations.length} location${locations.length === 1 ? '' : 's'}`,
          `${teams.length} teams`,
          `${rulesOnCount} time-off rules`,
          '24 people ready to invite',
          `${inherited} platform rules apply automatically — nothing to set up`,
        ]
        return (
          <div>
            <ul className="space-y-2.5">
              {checks.map((c) => (
                <li key={c} className="flex items-center gap-3 rounded-2xl bg-card2/50 px-4 py-3">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-green text-card">
                    <Check className="h-3 w-3" />
                  </span>
                  <span className="text-[13px] font-semibold">{c}</span>
                </li>
              ))}
              {expFixed ? (
                <li className="flex items-center gap-3 rounded-2xl bg-card2/50 px-4 py-3">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-green text-card">
                    <Check className="h-3 w-3" />
                  </span>
                  <span className="text-[13px] font-semibold">Expenses go to the manager</span>
                </li>
              ) : expSkipped ? (
                <li className="flex items-center gap-3 rounded-2xl bg-card2/50 px-4 py-3">
                  <span className="h-5 w-5 shrink-0 rounded-full border-2 border-line bg-card" />
                  <span className="text-[13px] font-medium text-muted">Expenses approver — skipped, add it anytime later</span>
                </li>
              ) : (
                <li className="flex flex-wrap items-center gap-3 rounded-2xl bg-accent-soft px-4 py-3">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-accent-ink" />
                  <span className="flex-1 text-[13px] font-semibold text-accent-ink">
                    Expenses has no approver — fix it now, or add it later
                  </span>
                  <Btn variant="ghost" size="sm" onClick={() => setStep(4)}>
                    Fix now
                  </Btn>
                  <Btn variant="ghost" size="sm" onClick={() => setExpSkipped(true)}>
                    Skip for now
                  </Btn>
                </li>
              )}
            </ul>
            <div className="mt-7 text-center">
              <Btn variant="amber" size="lg" onClick={goLive}>
                Bring {finalName} online
              </Btn>
              <p className="mt-2.5 text-[12px] text-muted">24 invites go out the moment you do.</p>
            </div>
          </div>
        )
      }
      default:
        return null
    }
  }

  return (
    <div className="mx-auto max-w-6xl animate-fade-in">
      <div className="flex flex-col gap-6 md:flex-row">
        {/* left rail — phases & steps */}
        <div className="w-64 shrink-0 pt-2">
          {SETUP_PHASES.map((ph, pi) => (
            <div key={ph.title} className="mb-5">
              <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{ph.title}</div>
              <ul className="space-y-0.5">
                {ph.steps.map((s, si) => {
                  const i = PHASE_OFFSETS[pi] + si
                  const state = i < step ? 'done' : i === step ? 'current' : 'next'
                  return (
                    <li key={s}>
                      <button
                        onClick={() => setStep(i)}
                        className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-card2"
                      >
                        {state === 'done' ? (
                          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-green text-card">
                            <Check className="h-3 w-3" />
                          </span>
                        ) : state === 'current' ? (
                          <span className="h-5 w-5 shrink-0 rounded-full border-[3px] border-accent bg-card" />
                        ) : (
                          <span className="h-5 w-5 shrink-0 rounded-full border-2 border-line bg-card" />
                        )}
                        <span
                          className={cn(
                            'text-[13px]',
                            state === 'current'
                              ? 'font-bold text-ink'
                              : state === 'done'
                                ? 'font-medium text-ink-soft'
                                : 'font-medium text-muted',
                          )}
                        >
                          {s}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
          <p className="mt-6 px-2 text-[11.5px] text-muted">Draft saves itself ✓</p>
        </div>

        {/* right — the current step */}
        <div className="min-w-0 flex-1">
          <Card className="p-7">
            <div className="mb-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">{current.phase}</div>
            <h2 className="font-display text-[24px] font-medium leading-tight tracking-tight">{current.title}</h2>
            <div className="mt-6">{stepBody()}</div>
            <div className="mt-8 flex items-center justify-between border-t border-line/70 pt-5">
              <Btn variant="ghost" onClick={() => (step === 0 ? setStage('pick') : setStep(step - 1))}>
                Back
              </Btn>
              {step < STEPS.length - 1 && (
                <Btn variant="dark" onClick={() => setStep(step + 1)}>
                  Next
                </Btn>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
