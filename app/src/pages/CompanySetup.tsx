import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2, ArrowLeft, ArrowRight, Save, CheckCircle2, Sparkles, Lock,
  Check, RotateCcw, Rocket,
} from 'lucide-react'
import { useApp } from '../app/store'
import {
  Badge, Button, Card, CardBody, CardHeader, CardTitle, EmptyState,
  PageHeader, ProgressBar, useToast,
} from '../components/ui'
import { cn } from '../lib/cn'
import { blankState, nextCompanyCode, type SetupState } from './company-setup/model'
import { TEMPLATES, CLONE_SOURCES, blankTemplate, type SetupTemplate } from './company-setup/templates'
import { STEPS, PHASES } from './company-setup/steps'

export default function CompanySetup() {
  const { role } = useApp()
  const { push } = useToast()
  const navigate = useNavigate()

  const [template, setTemplate] = useState<SetupTemplate | null>(null)
  const [state, setState] = useState<SetupState>(blankState)
  const [step, setStep] = useState(0)
  const [maxReached, setMaxReached] = useState(0)
  const [created, setCreated] = useState(false)

  const update = (patch: Partial<SetupState>) => setState((s) => ({ ...s, ...patch }))

  const companyCode = useMemo(() => nextCompanyCode(), [])

  const pick = (t: SetupTemplate) => {
    setState(t.build())
    setTemplate(t)
    setStep(0)
    setMaxReached(0)
  }

  const restart = () => {
    setTemplate(null)
    setState(blankState)
    setStep(0)
    setMaxReached(0)
    setCreated(false)
  }

  const canNext = step === 0 ? state.legalName.trim().length > 0 : true
  const isLast = step === STEPS.length - 1
  const goTo = (i: number) => { if (i <= maxReached) setStep(i) }
  const next = () => {
    const n = Math.min(step + 1, STEPS.length - 1)
    setStep(n)
    setMaxReached((m) => Math.max(m, n))
  }
  const back = () => setStep((s) => Math.max(0, s - 1))

  const createCompany = () => {
    setCreated(true)
    push({ title: `${state.legalName || 'Company'} is live`, tone: 'success' })
  }

  /* ---- RBAC: company provisioning is a platform/provider function ---- */
  if (role && role !== 'provider_admin' && role !== 'portfolio_manager') {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Add a company" subtitle="Provision a new company on SatelliteHR." icon={<Building2 className="h-5 w-5" />} />
        <EmptyState
          icon={<Lock className="h-5 w-5" />}
          title="Restricted to platform administrators"
          description="Creating companies is handled by the provider team. Reach out to your platform admin to onboard a new entity."
        />
      </div>
    )
  }

  /* ---- success ---- */
  if (created) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Add a company" subtitle="Provision a new company on SatelliteHR." icon={<Building2 className="h-5 w-5" />} />
        <Card className="max-w-3xl">
          <CardBody className="flex flex-col items-center gap-4 py-12 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/12 text-success">
              <CheckCircle2 className="h-8 w-8" />
            </span>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">{state.legalName || 'The company'} is live</h2>
              <p className="mt-1 text-sm text-muted-fg">
                Company code <span className="tnum font-semibold text-fg">{companyCode}</span> · {state.adminName || 'an admin'} was invited as the first Company HR Admin.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Badge tone="success" dot>Active</Badge>
              <Badge tone="primary">{state.locations.length} location{state.locations.length === 1 ? '' : 's'}</Badge>
              <Badge tone="info">{state.people.length} {state.people.length === 1 ? 'person' : 'people'}</Badge>
              <Badge tone="accent">{state.workflows.length} workflow{state.workflows.length === 1 ? '' : 's'}</Badge>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Button onClick={() => navigate('/')}>Go to dashboard <ArrowRight className="h-4 w-4" /></Button>
              <Button variant="outline" onClick={restart}>Add another</Button>
            </div>
          </CardBody>
        </Card>
      </div>
    )
  }

  /* ---- template / clone gallery ---- */
  if (!template) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title="Add a company"
          subtitle="Start from a template or clone an existing company — policies, workflows and structure come pre-filled. Or start blank."
          icon={<Building2 className="h-5 w-5" />}
          actions={<Badge tone="primary"><Sparkles className="h-3 w-3" /> Guided</Badge>}
        />
        <div className="space-y-8">
          <Section title="Prebuilt templates" hint="Pick the shape closest to this company — you'll adjust the details next.">
            <Gallery items={TEMPLATES} onPick={pick} />
          </Section>
          {CLONE_SOURCES.length > 0 && (
            <Section title="Clone an existing company" hint="Copy structure, policies and workflows from a company you already run.">
              <Gallery items={CLONE_SOURCES} onPick={pick} />
            </Section>
          )}
          <Section title="From scratch">
            <Gallery items={[blankTemplate]} onPick={pick} />
          </Section>
        </div>
      </div>
    )
  }

  /* ---- the wizard ---- */
  const Current = STEPS[step]
  const StepIcon = Current.icon

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Add a company"
        subtitle={<>Setting up from <span className="font-semibold text-fg">{template.name}</span>. Change only what you need.</>}
        icon={<Building2 className="h-5 w-5" />}
        actions={
          <Button variant="ghost" size="sm" onClick={restart}>
            <RotateCcw className="h-4 w-4" /> Change template
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[256px_minmax(0,1fr)]">
        {/* vertical phase rail */}
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <Card>
            <CardBody className="space-y-4 p-4">
              <ProgressBar value={((step + 1) / STEPS.length) * 100} />
              <p className="text-2xs font-semibold uppercase tracking-wide text-muted-fg">Step {step + 1} of {STEPS.length}</p>
              {PHASES.map((phase) => (
                <div key={phase}>
                  <p className="mb-1.5 text-2xs font-bold uppercase tracking-wide text-muted-fg/70">{phase}</p>
                  <ul className="space-y-0.5">
                    {STEPS.map((s, i) =>
                      s.phase !== phase ? null : (
                        <li key={s.key}>
                          <RailItem
                            index={i}
                            label={s.label}
                            done={i < step}
                            active={i === step}
                            reachable={i <= maxReached}
                            onClick={() => goTo(i)}
                          />
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              ))}
            </CardBody>
          </Card>
        </aside>

        {/* step body */}
        <div className="min-w-0 space-y-5">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <StepIcon className="h-4 w-4" />
                </span>
                <CardTitle>{Current.label}</CardTitle>
              </div>
              <span className="hidden text-2xs font-semibold uppercase tracking-wide text-muted-fg sm:inline">{Current.phase}</span>
            </CardHeader>
            <CardBody className="space-y-5">
              <p className="text-[13px] text-muted-fg">{Current.hint}</p>
              <Current.Component state={state} update={update} />
            </CardBody>
          </Card>

          {/* footer nav */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="ghost" onClick={() => push({ title: 'Draft saved', tone: 'neutral' })}>
              <Save className="h-4 w-4" /> Save as draft
            </Button>
            <div className="flex items-center gap-2">
              {step > 0 && (
                <Button variant="outline" onClick={back}><ArrowLeft className="h-4 w-4" /> Back</Button>
              )}
              {isLast ? (
                <Button size="lg" onClick={createCompany}>
                  <Rocket className="h-4 w-4" /> Bring company online
                </Button>
              ) : (
                <Button onClick={next} disabled={!canNext}>
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- gallery */
function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="text-sm font-bold tracking-tight text-fg">{title}</h2>
        {hint && <p className="mt-0.5 text-[13px] text-muted-fg">{hint}</p>}
      </div>
      {children}
    </section>
  )
}

function Gallery({ items, onPick }: { items: SetupTemplate[]; onPick: (t: SetupTemplate) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((t) => {
        const Icon = t.icon
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onPick(t)}
            className="group flex flex-col items-start rounded-2xl border border-border bg-surface p-5 text-left shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-pop cursor-pointer"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-fg">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="mt-3 text-sm font-bold tracking-tight">{t.name}</h3>
            <p className="mt-1 flex-1 text-[13px] leading-snug text-muted-fg">{t.tagline}</p>
            <span className="mt-3 text-2xs font-semibold uppercase tracking-wide text-muted-fg/80">{t.meta}</span>
            <span className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
              Start setup <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </button>
        )
      })}
    </div>
  )
}

/* ----------------------------------------------------------------- rail item */
function RailItem({
  index, label, done, active, reachable, onClick,
}: {
  index: number; label: string; done: boolean; active: boolean; reachable: boolean; onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!reachable}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[13px] font-semibold transition-colors',
        active ? 'bg-primary/10 text-primary' : reachable ? 'text-fg hover:bg-muted cursor-pointer' : 'text-muted-fg/60 cursor-not-allowed',
      )}
    >
      <span
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-2xs font-bold',
          done && 'bg-primary text-primary-fg',
          active && 'bg-primary/15 text-primary ring-2 ring-primary',
          !done && !active && 'bg-muted text-muted-fg',
        )}
      >
        {done ? <Check className="h-3 w-3" /> : index + 1}
      </span>
      <span className="truncate">{label}</span>
    </button>
  )
}
