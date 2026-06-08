import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2, ArrowLeft, ArrowRight, Save, ChevronDown, CheckCircle2, Sparkles,
  ShieldCheck, MapPin, Settings2, UserCog, ClipboardCheck, Hash, Lock, Pencil,
} from 'lucide-react'
import { useApp } from '../app/store'
import { setupSteps, companies } from '../data/mock'
import {
  Badge, Button, Card, CardBody, CardHeader, CardTitle, EmptyState, Field, Input,
  PageHeader, ProgressBar, Select, Stepper, Table, Td, Th, Tr, useToast,
} from '../components/ui'
import { cn } from '../lib/cn'

const indianStates = ['Maharashtra', 'Karnataka', 'Delhi', 'Tamil Nadu', 'Telangana', 'Gujarat']
const currencies = ['INR — Indian Rupee', 'USD — US Dollar', 'EUR — Euro', 'GBP — Pound Sterling']
const timeZones = ['Asia/Kolkata (GMT+5:30)', 'Asia/Dubai (GMT+4)', 'Europe/London (GMT+0)', 'America/New_York (GMT-5)']
const languages = ['English', 'हिन्दी (Hindi)', 'Français', 'Español']
const regTypes = ['GSTN', 'EIN', 'CRN', 'Custom']

type Form = {
  legalName: string; tradeName: string; website: string
  regType: string; regNumber: string; incorpDate: string
  address: string; city: string; state: string; postal: string
  contactName: string; contactEmail: string; contactPhone: string
  jurisdictions: string[]; currency: string; timeZone: string; language: string
  adminName: string; adminEmail: string
}

const defaults: Form = {
  legalName: '', tradeName: '', website: '',
  regType: 'GSTN', regNumber: '', incorpDate: '',
  address: '', city: '', state: 'Maharashtra', postal: '',
  contactName: '', contactEmail: '', contactPhone: '',
  jurisdictions: ['Maharashtra'], currency: currencies[0], timeZone: timeZones[0], language: 'English',
  adminName: '', adminEmail: '',
}

const stepIcons = [Building2, ShieldCheck, MapPin, Settings2, UserCog, ClipboardCheck]
const stepHints = [
  'Tell us who this company is. Just the essentials — you can refine later.',
  'Registration details for compliance and statutory filings.',
  'Where to reach this company and its registered address.',
  'Operating jurisdictions and regional defaults.',
  'Invite the first person who will run HR for this company.',
  'Confirm everything, then bring the company online.',
]

export default function CompanySetup() {
  const { role } = useApp()
  const { push } = useToast()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [maxReached, setMaxReached] = useState(0)
  const [form, setForm] = useState<Form>(defaults)
  const [advanced, setAdvanced] = useState(false)
  const [created, setCreated] = useState(false)

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const companyCode = useMemo(() => {
    // Derive the next code from the highest existing sequence, not the array length,
    // so a new company always sorts after the existing ones (e.g. 0061 -> 0062).
    const maxSeq = companies.reduce((max, c) => {
      const seq = Number(c.code.split('-').pop())
      return Number.isFinite(seq) && seq > max ? seq : max
    }, 0)
    return `COMP-2026-${String(maxSeq + 1).padStart(4, '0')}`
  }, [])

  const toggleJurisdiction = (s: string) =>
    set('jurisdictions', form.jurisdictions.includes(s)
      ? form.jurisdictions.filter((x) => x !== s)
      : [...form.jurisdictions, s])

  const canNext = step === 0 ? form.legalName.trim().length > 0 : true
  const StepIcon = stepIcons[step]

  const goTo = (i: number) => { if (i <= maxReached) setStep(i) }
  const next = () => {
    const n = Math.min(step + 1, setupSteps.length - 1)
    setStep(n); setMaxReached((m) => Math.max(m, n))
  }
  const back = () => setStep((s) => Math.max(0, s - 1))

  const createCompany = () => {
    setCreated(true)
    push({ title: `${form.legalName || 'Company'} created`, tone: 'success' })
  }

  if (role && role !== 'provider_admin' && role !== 'portfolio_manager') {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Company setup" subtitle="Provision a new company on SatelliteHR." icon={<Building2 className="h-5 w-5" />} />
        <EmptyState
          icon={<Lock className="h-5 w-5" />}
          title="Restricted to platform administrators"
          description="Creating companies is handled by the provider team. Reach out to your platform admin to onboard a new entity."
        />
      </div>
    )
  }

  if (created) {
    return (
      <div className="animate-fade-in mx-auto max-w-2xl">
        <PageHeader title="Company setup" subtitle="Provision a new company on SatelliteHR." icon={<Building2 className="h-5 w-5" />} />
        <Card>
          <CardBody className="flex flex-col items-center gap-4 py-12 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/12 text-success">
              <CheckCircle2 className="h-8 w-8" />
            </span>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">{form.legalName} is live</h2>
              <p className="mt-1 text-sm text-muted-fg">
                Company code <span className="tnum font-semibold text-fg">{companyCode}</span> · {form.adminName || 'an admin'} was invited as the first Company HR Admin.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Badge tone="success" dot>Active</Badge>
              <Badge tone="primary">{form.jurisdictions.length} jurisdiction{form.jurisdictions.length === 1 ? '' : 's'}</Badge>
              <Badge tone="info">{form.currency.split(' ')[0]}</Badge>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Button onClick={() => navigate('/')}>Go to dashboard <ArrowRight className="h-4 w-4" /></Button>
              <Button variant="outline" onClick={() => { setForm(defaults); setStep(0); setMaxReached(0); setCreated(false) }}>
                Set up another
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Company setup"
        subtitle="A guided, six-step wizard. Sensible defaults are pre-filled — change only what you need."
        icon={<Building2 className="h-5 w-5" />}
        actions={<Badge tone="primary"><Sparkles className="h-3 w-3" /> Guided</Badge>}
      />

      <Card className="mb-6">
        <CardBody className="space-y-3">
          <Stepper steps={setupSteps} current={step} onStepClick={goTo} />
          <ProgressBar value={((step + 1) / setupSteps.length) * 100} />
          <p className="text-xs text-muted-fg">Step {step + 1} of {setupSteps.length} · {stepHints[step]}</p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <StepIcon className="h-4 w-4" />
            </span>
            <CardTitle>{setupSteps[step]}</CardTitle>
          </div>
          <span className="text-2xs font-semibold uppercase tracking-wide text-muted-fg">Only what's required</span>
        </CardHeader>
        <CardBody className="space-y-5">
          {step === 0 && (
            <>
              <Field label="Legal name" required hint="The registered legal entity name.">
                <Input value={form.legalName} onChange={(e) => set('legalName', e.target.value)} placeholder="e.g. Northwind Foods Pvt. Ltd." autoFocus />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Trade name" hint="Brand or 'doing business as' name.">
                  <Input value={form.tradeName} onChange={(e) => set('tradeName', e.target.value)} placeholder="Northwind" />
                </Field>
                <Field label="Website">
                  <Input value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://northwind.example" />
                </Field>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-surface2/50 px-3 py-2.5">
                <Hash className="h-4 w-4 text-primary" />
                <span className="text-[13px] text-muted-fg">Company code preview</span>
                <Badge tone="primary" className="tnum ml-auto">{companyCode}</Badge>
              </div>
            </>
          )}

          {step === 1 && (
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Registration type">
                <Select value={form.regType} onChange={(e) => set('regType', e.target.value)}>
                  {regTypes.map((r) => <option key={r}>{r}</option>)}
                </Select>
              </Field>
              <Field label="Registration number" hint={`Your ${form.regType} identifier.`}>
                <Input value={form.regNumber} onChange={(e) => set('regNumber', e.target.value)} placeholder="27ABCDE1234F1Z5" />
              </Field>
              <Field label="Incorporation date">
                <Input type="date" value={form.incorpDate} onChange={(e) => set('incorpDate', e.target.value)} />
              </Field>
            </div>
          )}

          {step === 2 && (
            <>
              <Field label="Address line">
                <Input value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Floor 4, Tower B, Business Park" />
              </Field>
              <div className="grid gap-5 sm:grid-cols-3">
                <Field label="City"><Input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Mumbai" /></Field>
                <Field label="State">
                  <Select value={form.state} onChange={(e) => set('state', e.target.value)}>
                    {indianStates.map((s) => <option key={s}>{s}</option>)}
                  </Select>
                </Field>
                <Field label="Postal code"><Input value={form.postal} onChange={(e) => set('postal', e.target.value)} placeholder="400001" /></Field>
              </div>
              <div className="grid gap-5 sm:grid-cols-3">
                <Field label="Primary contact"><Input value={form.contactName} onChange={(e) => set('contactName', e.target.value)} placeholder="Full name" /></Field>
                <Field label="Email"><Input type="email" value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} placeholder="ops@northwind.example" /></Field>
                <Field label="Phone"><Input value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} placeholder="+91 98200 00000" /></Field>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <Field label="Operating jurisdictions" hint="States where this company employs people.">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {indianStates.map((s) => {
                    const on = form.jurisdictions.includes(s)
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleJurisdiction(s)}
                        className={cn(
                          'flex items-center gap-2 rounded-lg border px-3 py-2 text-[13px] font-semibold transition-colors cursor-pointer',
                          on ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-fg hover:bg-muted',
                        )}
                      >
                        <span className={cn('flex h-4 w-4 items-center justify-center rounded border', on ? 'border-primary bg-primary text-primary-fg' : 'border-border')}>
                          {on && <CheckCircle2 className="h-3 w-3" />}
                        </span>
                        {s}
                      </button>
                    )
                  })}
                </div>
              </Field>
              <div className="grid gap-5 sm:grid-cols-3">
                <Field label="Base currency">
                  <Select value={form.currency} onChange={(e) => set('currency', e.target.value)}>
                    {currencies.map((c) => <option key={c}>{c}</option>)}
                  </Select>
                </Field>
                <Field label="Time zone">
                  <Select value={form.timeZone} onChange={(e) => set('timeZone', e.target.value)}>
                    {timeZones.map((t) => <option key={t}>{t}</option>)}
                  </Select>
                </Field>
                <Field label="Language">
                  <Select value={form.language} onChange={(e) => set('language', e.target.value)}>
                    {languages.map((l) => <option key={l}>{l}</option>)}
                  </Select>
                </Field>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div className="flex items-start gap-3 rounded-lg bg-primary/5 px-4 py-3 text-sm text-muted-fg">
                <UserCog className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                This person becomes the first <span className="font-semibold text-fg">Company HR Admin</span> and receives an invite to finish setup.
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Admin name"><Input value={form.adminName} onChange={(e) => set('adminName', e.target.value)} placeholder="Full name" /></Field>
                <Field label="Admin email"><Input type="email" value={form.adminEmail} onChange={(e) => set('adminEmail', e.target.value)} placeholder="admin@northwind.example" /></Field>
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <Table>
                <tbody>
                  {[
                    ['Company code', companyCode], ['Legal name', form.legalName || '—'], ['Trade name', form.tradeName || '—'],
                    ['Website', form.website || '—'], ['Registration', `${form.regType} · ${form.regNumber || '—'}`],
                    ['Incorporated', form.incorpDate || '—'], ['Address', [form.address, form.city, form.state, form.postal].filter(Boolean).join(', ') || '—'],
                    ['Primary contact', [form.contactName, form.contactEmail].filter(Boolean).join(' · ') || '—'],
                    ['Jurisdictions', form.jurisdictions.join(', ') || '—'], ['Currency', form.currency],
                    ['Time zone', form.timeZone], ['Language', form.language],
                    ['Initial admin', [form.adminName, form.adminEmail].filter(Boolean).join(' · ') || '—'],
                  ].map(([k, v], i) => (
                    <Tr key={k} className={i === 0 ? 'border-t-0' : ''}>
                      <Th className="w-44 align-top normal-case text-muted-fg">{k}</Th>
                      <Td className="font-semibold">{v}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
              <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface2/50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-fg">
                  <ClipboardCheck className="h-4 w-4 text-success" />
                  Everything looks good. Bring <span className="font-semibold text-fg">{form.legalName || 'this company'}</span> online.
                </div>
                <Button size="lg" onClick={createCompany}>
                  <Building2 className="h-4 w-4" /> Create company
                </Button>
              </div>
            </>
          )}

          <div className="border-t border-border pt-4">
            <button
              type="button"
              onClick={() => setAdvanced((a) => !a)}
              className="flex items-center gap-1.5 text-[13px] font-semibold text-muted-fg transition-colors hover:text-fg cursor-pointer"
            >
              <ChevronDown className={cn('h-4 w-4 transition-transform', advanced && 'rotate-180')} />
              Advanced settings (optional)
            </button>
            {advanced && (
              <p className="mt-2 max-w-prose text-xs text-muted-fg">
                Custom fields, SSO/SAML, data residency, default leave calendars and approval workflows can be
                configured after creation from the company's settings. None are required to go live.
              </p>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Footer nav */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" onClick={() => push({ title: 'Draft saved', tone: 'neutral' })}>
          <Save className="h-4 w-4" /> Save as draft
        </Button>
        <div className="flex items-center gap-2">
          {step > 0 && (
            <Button variant="outline" onClick={back}><ArrowLeft className="h-4 w-4" /> Back</Button>
          )}
          {step < setupSteps.length - 1 ? (
            <Button onClick={next} disabled={!canNext}>
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="outline" onClick={() => goTo(0)}>
              <Pencil className="h-4 w-4" /> Edit details
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
