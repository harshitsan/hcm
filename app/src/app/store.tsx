/* eslint-disable react-refresh/only-export-components */
/**
 * App state for the SatelliteHR prototype.
 *  - persona/role: who you're logged in as
 *  - scope: 'platform' (the provider/portfolio console) vs 'company' (acting
 *    inside one tenant). Platform roles land on the console; entering a company
 *    switches to company scope and reveals the operational nav.
 *  - companyId: which tenant is active (when in company scope)
 *  - theme: light/dark
 * Persisted to localStorage. No backend.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { companies, personas, type Company, type Persona, type Role } from '../data/mock'

export type Scope = 'platform' | 'company'

type AppState = {
  persona: Persona | null
  role: Role | null
  scope: Scope
  loginAs: (personaId: string) => void
  logout: () => void
  companyId: string
  company: Company
  setCompanyId: (id: string) => void
  enterCompany: (id: string) => void
  exitToPlatform: () => void
  authorizedCompanies: Company[]
  theme: 'light' | 'dark'
  toggleTheme: () => void
}

const Ctx = createContext<AppState | null>(null)

const LS_PERSONA = 'shr.persona'
const LS_COMPANY = 'shr.company'
const LS_THEME = 'shr.theme'
const LS_SCOPE = 'shr.scope'

const roleOf = (id: string | null): Role | null => personas.find((p) => p.id === id)?.role ?? null
const isPlatformRole = (r: Role | null) => r === 'provider_admin' || r === 'portfolio_manager'

export function AppProvider({ children }: { children: ReactNode }) {
  const [personaId, setPersonaId] = useState<string | null>(() => localStorage.getItem(LS_PERSONA))
  const [companyId, setCompanyId] = useState<string>(() => localStorage.getItem(LS_COMPANY) || 'c1')
  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (localStorage.getItem(LS_THEME) as 'light' | 'dark') || 'light',
  )
  const [scope, setScope] = useState<Scope>(
    () => (localStorage.getItem(LS_SCOPE) as Scope)
      || (isPlatformRole(roleOf(localStorage.getItem(LS_PERSONA))) ? 'platform' : 'company'),
  )

  const persona = useMemo(() => personas.find((p) => p.id === personaId) ?? null, [personaId])
  const role = persona?.role ?? null

  const authorizedCompanies = useMemo(() => {
    if (!persona) return companies
    if (persona.companyIds.length === 0) return companies // provider sees all
    return companies.filter((c) => persona.companyIds.includes(c.id))
  }, [persona])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(LS_THEME, theme)
  }, [theme])

  useEffect(() => {
    if (personaId) localStorage.setItem(LS_PERSONA, personaId)
    else localStorage.removeItem(LS_PERSONA)
  }, [personaId])
  useEffect(() => { localStorage.setItem(LS_COMPANY, companyId) }, [companyId])
  useEffect(() => { localStorage.setItem(LS_SCOPE, scope) }, [scope])

  const company =
    authorizedCompanies.find((c) => c.id === companyId) ?? authorizedCompanies[0] ?? companies[0]

  const value: AppState = {
    persona,
    role,
    scope,
    loginAs: (id) => {
      setPersonaId(id)
      // platform roles start at the console; everyone else acts inside their company
      setScope(isPlatformRole(roleOf(id)) ? 'platform' : 'company')
    },
    logout: () => setPersonaId(null),
    companyId,
    company,
    setCompanyId,
    enterCompany: (id) => { setCompanyId(id); setScope('company') },
    exitToPlatform: () => setScope('platform'),
    authorizedCompanies,
    theme,
    toggleTheme: () => setTheme((t) => (t === 'light' ? 'dark' : 'light')),
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
