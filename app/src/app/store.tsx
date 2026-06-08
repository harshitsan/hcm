/* eslint-disable react-refresh/only-export-components */
/**
 * App state for the SatelliteHR prototype: who you're logged in as (persona/role),
 * which company you're in (context switcher), and light/dark theme.
 * Persisted to localStorage. No backend.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { companies, personas, type Company, type Persona, type Role } from '../data/mock'

type AppState = {
  persona: Persona | null
  role: Role | null
  loginAs: (personaId: string) => void
  logout: () => void
  companyId: string
  company: Company
  setCompanyId: (id: string) => void
  authorizedCompanies: Company[]
  theme: 'light' | 'dark'
  toggleTheme: () => void
}

const Ctx = createContext<AppState | null>(null)

const LS_PERSONA = 'shr.persona'
const LS_COMPANY = 'shr.company'
const LS_THEME = 'shr.theme'

export function AppProvider({ children }: { children: ReactNode }) {
  const [personaId, setPersonaId] = useState<string | null>(() => localStorage.getItem(LS_PERSONA))
  const [companyId, setCompanyId] = useState<string>(() => localStorage.getItem(LS_COMPANY) || 'c1')
  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (localStorage.getItem(LS_THEME) as 'light' | 'dark') || 'light',
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
  useEffect(() => {
    localStorage.setItem(LS_COMPANY, companyId)
  }, [companyId])

  // Always resolve to a company the persona may actually see (no effect/setState needed).
  const company =
    authorizedCompanies.find((c) => c.id === companyId) ?? authorizedCompanies[0] ?? companies[0]

  const value: AppState = {
    persona,
    role,
    loginAs: (id) => setPersonaId(id),
    logout: () => setPersonaId(null),
    companyId,
    company,
    setCompanyId,
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
