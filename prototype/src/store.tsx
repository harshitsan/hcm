/**
 * App state: demo persona, active company (drives the accent color — Journey 2),
 * and the interactive data slices each journey mutates.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ACK_DOCS,
  COMPANIES,
  INBOX,
  MY_REQUESTS,
  PERSONAS,
  RULES,
  type AckDoc,
  type Company,
  type InboxItem,
  type LeaveRequest,
  type Persona,
  type PersonaId,
  type Rule,
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

type AppCtx = {
  persona: Persona
  setPersonaId: (id: PersonaId) => void
  company: Company
  setCompanyId: (id: string) => void
  /** companies this persona can switch between */
  myCompanies: Company[]
  companies: Company[]
  addCompany: (c: Company) => void

  inbox: InboxItem[]
  decideInbox: (id: string, decision: 'approved' | 'declined') => void
  bulkApproveSafe: () => number

  requests: LeaveRequest[]
  addRequest: (r: LeaveRequest) => void

  rules: Rule[]
  updateRule: (id: string, patch: Partial<Rule>) => void
  addRule: (r: Rule) => void

  acks: AckDoc[]
  confirmAck: (id: string) => void

  toasts: Toast[]
  toast: (msg: string, undo?: () => void) => void
  dismissToast: (id: number) => void

  cmdOpen: boolean
  setCmdOpen: (v: boolean) => void
}

const Ctx = createContext<AppCtx | null>(null)

let toastSeq = 1

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
  const [acks, setAcks] = useState<AckDoc[]>(ACK_DOCS)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [cmdOpen, setCmdOpen] = useState(false)

  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const toast = useCallback(
    (msg: string, undo?: () => void) => {
      const id = toastSeq++
      setToasts((t) => [...t.slice(-2), { id, msg, undo }])
      window.setTimeout(() => dismissToast(id), 4200)
    },
    [dismissToast],
  )

  const decideInbox = useCallback((id: string, decision: 'approved' | 'declined') => {
    setInbox((items) => items.map((i) => (i.id === id ? { ...i, status: decision } : i)))
  }, [])

  const bulkApproveSafe = useCallback(() => {
    let n = 0
    setInbox((items) =>
      items.map((i) => {
        if (i.safe && i.status === 'waiting') {
          n++
          return { ...i, status: 'approved' as const }
        }
        return i
      }),
    )
    return n
  }, [])

  const addRequest = useCallback((r: LeaveRequest) => setRequests((rs) => [r, ...rs]), [])

  const updateRule = useCallback(
    (id: string, patch: Partial<Rule>) => setRules((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r))),
    [],
  )
  const addRule = useCallback((r: Rule) => setRules((rs) => [r, ...rs]), [])

  const confirmAck = useCallback(
    (id: string) => setAcks((ds) => ds.map((d) => (d.id === id ? { ...d, state: 'done' as const, due: 'done today' } : d))),
    [],
  )

  const addCompany = useCallback((c: Company) => setCompanies((cs) => [...cs, c]), [])

  const value: AppCtx = {
    persona,
    setPersonaId,
    company,
    setCompanyId,
    myCompanies,
    companies,
    addCompany,
    inbox,
    decideInbox,
    bulkApproveSafe,
    requests,
    addRequest,
    rules,
    updateRule,
    addRule,
    acks,
    confirmAck,
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
