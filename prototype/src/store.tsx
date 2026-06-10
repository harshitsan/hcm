/**
 * App state: demo persona, active company (drives the accent color — Journey 2),
 * the interactive data slices each journey mutates, and the platform-wide
 * activity log — every action below writes an audit event (BRD §6.29:
 * logging for everything, not just rules).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  ACK_DOCS,
  AUDIT_SEED,
  CANDIDATES,
  COMPANIES,
  OBSERVATIONS,
  OPENINGS,
  POLICIES,
  FLOWS,
  INBOX,
  MY_REQUESTS,
  PEOPLE,
  PERSONAS,
  RULES,
  TEMPLATES,
  type AckDoc,
  type AuditEvent,
  type AuditKind,
  type Candidate,
  type Company,
  type Flow,
  type InboxItem,
  type LeaveRequest,
  type Observation,
  type Opening,
  type Person,
  type Policy,
  type Persona,
  type PersonaId,
  type Rule,
  type Template,
} from './data'
import { hexToTriple } from './lib'

/* ── accent derivation: soft + readable-ink variants from the company hex ── */

function applyAccent(hex: string) {
  const root = document.documentElement
  const [r, g, b] = hexToTriple(hex).split(' ').map(Number)
  root.style.setProperty('--accent', `${r} ${g} ${b}`)
  // soft = blend towards cream
  const mix = (ch: number, to: number, t: number) => Math.round(ch + (to - ch) * t)
  root.style.setProperty('--accent-soft', `${mix(r, 250, 0.72)} ${mix(g, 246, 0.72)} ${mix(b, 235, 0.72)}`)
  // ink-on-soft = darken
  root.style.setProperty('--accent-ink', `${Math.round(r * 0.42)} ${Math.round(g * 0.42)} ${Math.round(b * 0.35)}`)
}

/* ── toasts ── */

type Toast = { id: number; msg: string; undo?: () => void }

type LogOpts = { detail?: string; where?: string; who?: string; hue?: number }

type AppCtx = {
  persona: Persona
  setPersonaId: (id: PersonaId) => void
  company: Company
  setCompanyId: (id: string) => void
  /** companies this persona can switch between */
  myCompanies: Company[]
  companies: Company[]
  addCompany: (c: Company) => void
  updateCompany: (id: string, patch: Partial<Company>) => void

  inbox: InboxItem[]
  decideInbox: (id: string, decision: 'approved' | 'declined') => void
  bulkApproveSafe: () => number

  requests: LeaveRequest[]
  addRequest: (r: LeaveRequest) => void

  rules: Rule[]
  updateRule: (id: string, patch: Partial<Rule>) => void
  addRule: (r: Rule) => void

  flows: Flow[]
  updateFlow: (id: string, patch: Partial<Flow>) => void
  addFlow: (f: Flow) => void

  acks: AckDoc[]
  confirmAck: (id: string) => void

  /** the company-setup gallery — grows when someone saves their setup */
  templates: Template[]
  addTemplate: (t: Template) => void

  /** the directory — grows when HR adds someone or a candidate converts */
  people: Person[]
  addPerson: (p: Person) => void

  /** the hiring pipeline (BRD 6.13) — Offer → Joining converts to a person */
  candidates: Candidate[]
  advanceCandidate: (id: string) => void

  /** openings — created, approval-gated, assigned to a recruiter + hiring manager */
  openings: Opening[]
  addOpening: (o: Opening) => void
  approveOpening: (id: string) => void

  /** policy studio (BRD §E) — policies compose the rule machinery per clause */
  policies: Policy[]
  addPolicy: (p: Policy) => void
  updatePolicy: (id: string, patch: Partial<Policy>) => void
  publishPolicy: (id: string) => void

  /** observations — humans as the sensor; concerns become tickets, kudos become recognition */
  observations: Observation[]
  addObservation: (o: Observation) => void

  /** the platform-wide activity log — newest first; everything writes here */
  audit: AuditEvent[]
  logEvent: (kind: AuditKind, what: string, opts?: LogOpts) => void

  toasts: Toast[]
  toast: (msg: string, undo?: () => void) => void
  dismissToast: (id: number) => void

  cmdOpen: boolean
  setCmdOpen: (v: boolean) => void
}

const Ctx = createContext<AppCtx | null>(null)

let toastSeq = 1
let auditSeq = 100

export function AppProvider({ children }: { children: ReactNode }) {
  const [personaId, setPersonaIdRaw] = useState<PersonaId>('employee')
  const persona = PERSONAS.find((p) => p.id === personaId)!

  const [companies, setCompanies] = useState<Company[]>(COMPANIES)
  const [companyId, setCompanyId] = useState('acme')

  const myCompanies = useMemo(() => {
    if (persona.id === 'operator') return companies
    if (persona.id === 'portfolio') return companies.filter((c) => c.inPortfolio)
    return companies.filter((c) => c.id === persona.homeCompany)
  }, [companies, persona])

  // 'all' = the global view (portfolio/operator): a synthetic company that
  // aggregates everything the persona can see. Multi-company personas LAND here —
  // you start with the big picture and dive into a company only when you act.
  const allView = useMemo<Company>(
    () => ({
      id: 'all',
      name: 'All companies',
      short: '✦',
      city: `${myCompanies.length} companies`,
      employees: myCompanies.reduce((n, c) => n + c.employees, 0),
      status: 'Live',
      accent: '#E8B23D',
      since: '',
      plan: 'Enterprise',
      inPortfolio: false,
    }),
    [myCompanies],
  )

  const company =
    companyId === 'all' && persona.multiCompany
      ? allView
      : (companies.find((c) => c.id === companyId) ?? companies[0])

  const setPersonaId = useCallback((id: PersonaId) => {
    setPersonaIdRaw(id)
    const p = PERSONAS.find((x) => x.id === id)!
    setCompanyId(p.multiCompany ? 'all' : p.homeCompany)
  }, [])

  // the workspace literally changes color with the company — impossible to miss
  useEffect(() => applyAccent(company.accent), [company])

  const [inbox, setInbox] = useState<InboxItem[]>(INBOX)
  const [requests, setRequests] = useState<LeaveRequest[]>(MY_REQUESTS)
  const [rules, setRules] = useState<Rule[]>(RULES)
  const [flows, setFlows] = useState<Flow[]>(FLOWS)
  const [acks, setAcks] = useState<AckDoc[]>(ACK_DOCS)
  const [templates, setTemplates] = useState<Template[]>(TEMPLATES)
  const [people, setPeople] = useState<Person[]>(PEOPLE)
  const [candidates, setCandidates] = useState<Candidate[]>(CANDIDATES)
  const [openings, setOpenings] = useState<Opening[]>(OPENINGS)
  const [policies, setPolicies] = useState<Policy[]>(POLICIES)
  const [observations, setObservations] = useState<Observation[]>(OBSERVATIONS)
  const [audit, setAudit] = useState<AuditEvent[]>(AUDIT_SEED)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [cmdOpen, setCmdOpen] = useState(false)

  // actor/context refs so logEvent never goes stale inside memoized actions
  const actorRef = useRef({ name: persona.name, hue: persona.hue, where: 'Acme Tech' })
  actorRef.current = {
    name: persona.name,
    hue: persona.hue,
    where: company.id === 'all' ? 'Platform' : company.name,
  }

  const logEvent = useCallback((kind: AuditKind, what: string, opts?: LogOpts) => {
    const a = actorRef.current
    const id = 'ev' + auditSeq++
    setAudit((evs) => [
      {
        id,
        who: opts?.who ?? a.name,
        hue: opts?.hue ?? a.hue,
        what,
        detail: opts?.detail,
        where: opts?.where ?? a.where,
        kind,
        when: 'just now',
      },
      ...evs,
    ])
  }, [])

  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const toast = useCallback(
    (msg: string, undo?: () => void) => {
      const id = toastSeq++
      setToasts((t) => [...t.slice(-2), { id, msg, undo }])
      window.setTimeout(() => dismissToast(id), 4200)
    },
    [dismissToast],
  )

  const decideInbox = useCallback(
    (id: string, decision: 'approved' | 'declined') => {
      const item = inbox.find((i) => i.id === id)
      if (item)
        logEvent(
          item.kind === 'Time off' ? 'Time off' : 'People',
          `${decision === 'approved' ? 'Approved' : 'Declined'} ${item.who.split(' ')[0]}'s ${item.kind.toLowerCase()}`,
          { detail: item.title },
        )
      setInbox((items) => items.map((i) => (i.id === id ? { ...i, status: decision } : i)))
    },
    [inbox, logEvent],
  )

  const bulkApproveSafe = useCallback(() => {
    const n = inbox.filter((i) => i.safe && i.status === 'waiting').length
    if (n > 0) logEvent('Time off', `Approved ${n} routine requests in one go`, { detail: 'All within balance, no conflicts' })
    setInbox((items) => items.map((i) => (i.safe && i.status === 'waiting' ? { ...i, status: 'approved' as const } : i)))
    return n
  }, [inbox, logEvent])

  const addRequest = useCallback(
    (r: LeaveRequest) => {
      setRequests((rs) => [r, ...rs])
      logEvent('Time off', `Asked for ${r.days} day${r.days === 1 ? '' : 's'} of ${r.type.toLowerCase()} leave`, {
        detail: `${r.from} → ${r.to}`,
      })
    },
    [logEvent],
  )

  const updateRule = useCallback(
    (id: string, patch: Partial<Rule>) => {
      const rule = rules.find((r) => r.id === id)
      if (rule && patch.status && patch.status !== rule.status) {
        const verb =
          patch.status === 'Waiting for approval'
            ? `Sent “${rule.name}” for approval`
            : patch.status === 'Running'
              ? `“${rule.name}” is now running`
              : patch.status === 'Paused'
                ? `Paused “${rule.name}”`
                : `Changed “${rule.name}”`
        logEvent('Rule', verb)
      } else if (rule && !patch.status) {
        logEvent('Rule', `Changed “${rule.name}”`, { detail: 'Definition updated — see its history for the diff' })
      }
      setRules((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)))
    },
    [rules, logEvent],
  )

  const addRule = useCallback(
    (r: Rule) => {
      setRules((rs) => [r, ...rs])
      logEvent('Rule', `Created “${r.name}”`, {
        detail: r.level === 'Company' ? undefined : `Lives at ${r.level.toLowerCase()} level`,
      })
    },
    [logEvent],
  )

  const updateFlow = useCallback(
    (id: string, patch: Partial<Flow>) => {
      const flow = flows.find((f) => f.id === id)
      if (flow)
        logEvent('Flow', patch.status === 'Running' ? `“${flow.name}” flow is now running` : `Changed the “${flow.name}” flow`)
      setFlows((fs) => fs.map((f) => (f.id === id ? { ...f, ...patch } : f)))
    },
    [flows, logEvent],
  )

  const addFlow = useCallback(
    (f: Flow) => {
      setFlows((fs) => [f, ...fs])
      logEvent('Flow', `Created the “${f.name}” flow`, { detail: f.routes })
    },
    [logEvent],
  )

  const confirmAck = useCallback(
    (id: string) => {
      const doc = acks.find((d) => d.id === id)
      if (doc) logEvent('Documents', `Confirmed reading “${doc.title}”`, { detail: 'Receipt saved to their file' })
      setAcks((ds) => ds.map((d) => (d.id === id ? { ...d, state: 'done' as const, due: 'done today' } : d)))
    },
    [acks, logEvent],
  )

  const addPerson = useCallback(
    (p: Person) => {
      setPeople((ps) => [...ps, p])
      logEvent('People', `Added ${p.name} as ${p.role}`, { detail: 'Day-one checklist starts automatically' })
    },
    [logEvent],
  )

  const advanceCandidate = useCallback(
    (id: string) => {
      const c = candidates.find((x) => x.id === id)
      if (!c) return
      const order: Candidate['stage'][] = ['Applied', 'Interviewing', 'Offer', 'Joining']
      const nextStage = order[Math.min(order.indexOf(c.stage) + 1, order.length - 1)]
      if (nextStage === c.stage) return
      setCandidates((cs) => cs.map((x) => (x.id === id ? { ...x, stage: nextStage, meta: nextStage === 'Joining' ? 'Converted — employee record created' : x.meta } : x)))
      if (nextStage === 'Joining') {
        // the conversion moment (BRD 6.13.7): candidate becomes an employee record
        setPeople((ps) =>
          ps.some((p) => p.name === c.name)
            ? ps
            : [
                ...ps,
                {
                  id: 'p' + (ps.length + 1),
                  name: c.name,
                  role: c.role,
                  dept: 'Engineering',
                  location: 'Bengaluru',
                  email: c.name.split(' ')[0].toLowerCase() + '@acme.in',
                  status: 'Joining soon',
                  managerId: 'p2',
                  hue: c.hue,
                  companyId: c.companyId,
                },
              ],
        )
        logEvent('People', `Hired ${c.name} — employee record created`, { detail: c.role + ' · onboarding begins' })
      } else {
        logEvent('People', `Moved ${c.name} forward to ${nextStage.toLowerCase()}`, { detail: c.role })
      }
    },
    [candidates, logEvent],
  )

  const addPolicy = useCallback(
    (p: Policy) => {
      setPolicies((ps) => [p, ...ps])
      logEvent('Rule', `Created the policy “${p.name}”`, {
        detail: `${p.clauses.length} clauses · ${p.level === 'Company' ? 'one company' : p.level.toLowerCase()} level`,
      })
    },
    [logEvent],
  )

  const updatePolicy = useCallback(
    (id: string, patch: Partial<Policy>) => {
      const pol = policies.find((x) => x.id === id)
      if (pol && patch.status && patch.status !== pol.status)
        logEvent('Rule', patch.status === 'Waiting for approval' ? `Sent “${pol.name}” for approval` : `“${pol.name}” ${patch.status.toLowerCase()}`)
      setPolicies((ps) => ps.map((x) => (x.id === id ? { ...x, ...patch } : x)))
    },
    [policies, logEvent],
  )

  const publishPolicy = useCallback(
    (id: string) => {
      const pol = policies.find((x) => x.id === id)
      if (!pol) return
      setPolicies((ps) => ps.map((x) => (x.id === id ? { ...x, status: 'Published' as const } : x)))
      logEvent('Rule', `Published “${pol.name}” v${pol.version}`, {
        detail: `Effective ${pol.effectiveFrom} · ${pol.channels.join(' · ')}`,
      })
      // a sign clause means it lands in everyone's Documents inbox
      if (pol.clauses.some((c) => c.binding?.kind === 'sign')) {
        setAcks((ds) =>
          ds.some((d) => d.title.startsWith(pol.name))
            ? ds
            : [
                {
                  id: 'd' + (ds.length + 1),
                  title: `${pol.name} v${pol.version}`,
                  required: true,
                  due: 'by ' + pol.effectiveFrom,
                  minutes: Math.max(2, pol.clauses.length),
                  summary: `New policy — ${pol.clauses.length} clauses. Read and sign before it takes effect.`,
                  state: 'todo' as const,
                },
                ...ds,
              ],
        )
      }
    },
    [policies, logEvent],
  )

  const addObservation = useCallback(
    (o: Observation) => {
      setObservations((os) => [o, ...os])
      if (o.polarity === 'concern') {
        // a concern becomes a ticket, routed by the clause's flow
        setInbox((items) => [
          {
            id: 'in' + (items.length + 20),
            kind: 'Report' as const,
            who: o.about,
            whoHue: o.aboutHue,
            whoRole: 'Reported under “' + o.policy + '”',
            title: o.clause + ' — a concern was raised',
            facts: [o.note, o.anonymous ? 'Reporter chose to stay anonymous' : 'Reported by ' + o.by, o.repeat ?? 'First report on this clause'],
            due: 'due in 2d',
            dueTone: 'amber' as const,
            safe: false,
            status: 'waiting' as const,
            source: o.policy,
          },
          ...items,
        ])
      }
      logEvent(
        'People',
        o.polarity === 'concern'
          ? `A concern was raised about ${o.about.split(' ')[0]} — “${o.clause}”`
          : `${o.about.split(' ')[0]} got recognition — “${o.clause}”`,
        { detail: o.anonymous ? 'Anonymous report · routed by the clause’s flow' : `By ${o.by}`, who: o.anonymous ? 'Anonymous' : undefined, hue: o.anonymous ? 5 : undefined },
      )
    },
    [logEvent],
  )

  const addOpening = useCallback(
    (o: Opening) => {
      setOpenings((os) => [...os, o])
      logEvent('People', `Drafted an opening: ${o.role}`, {
        detail: `${o.recruiter} recruits · ${o.hiringManager} hires — approval routes through the hiring flow`,
      })
    },
    [logEvent],
  )

  const approveOpening = useCallback(
    (id: string) => {
      const o = openings.find((x) => x.id === id)
      if (o) logEvent('People', `Opened the ${o.role} role`, { detail: 'Approved — sourcing starts now' })
      setOpenings((os) => os.map((x) => (x.id === id ? { ...x, status: 'Open' as const } : x)))
    },
    [openings, logEvent],
  )

  const addTemplate = useCallback(
    (t: Template) => {
      setTemplates((ts) => [...ts, t])
      logEvent('Company', `Saved “${t.name}” as a template`, {
        where: 'Platform',
        detail: 'Available in the gallery for every future company',
      })
    },
    [logEvent],
  )

  const addCompany = useCallback(
    (c: Company) => {
      setCompanies((cs) => [...cs, c])
      logEvent('Company', `Created ${c.name} from a template`, {
        where: c.name,
        detail: 'Platform rules applied automatically the moment it went live',
      })
    },
    [logEvent],
  )

  const updateCompany = useCallback(
    (id: string, patch: Partial<Company>) => {
      const c = companies.find((x) => x.id === id)
      if (c && patch.status && patch.status !== c.status)
        logEvent('Company', patch.status === 'Paused' ? `Paused ${c.name}` : `Resumed ${c.name}`, {
          where: c.name,
          detail:
            patch.status === 'Paused'
              ? `${c.employees} people lost sign-in · admins emailed`
              : `${c.employees} people can sign in again`,
        })
      setCompanies((cs) => cs.map((x) => (x.id === id ? { ...x, ...patch } : x)))
    },
    [companies, logEvent],
  )

  const value: AppCtx = {
    persona,
    setPersonaId,
    company,
    setCompanyId,
    myCompanies,
    companies,
    addCompany,
    updateCompany,
    inbox,
    decideInbox,
    bulkApproveSafe,
    requests,
    addRequest,
    rules,
    updateRule,
    addRule,
    flows,
    updateFlow,
    addFlow,
    acks,
    confirmAck,
    templates,
    addTemplate,
    people,
    addPerson,
    candidates,
    advanceCandidate,
    openings,
    addOpening,
    approveOpening,
    policies,
    addPolicy,
    updatePolicy,
    publishPolicy,
    observations,
    addObservation,
    audit,
    logEvent,
    toasts,
    toast,
    dismissToast,
    cmdOpen,
    setCmdOpen,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp outside AppProvider')
  return ctx
}
