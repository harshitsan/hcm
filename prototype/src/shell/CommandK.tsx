/**
 * ⌘K palette (ux-research §5.5): people, companies, and *actions* in one place.
 * Doubles as the company switcher for multi-company personas.
 */
import { ArrowRight, Building2, Search, Sparkles, User } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PEOPLE } from '../data'
import { cn } from '../lib'
import { Avatar } from '../ui'
import { useApp } from '../store'

type Item = { id: string; kind: 'action' | 'person' | 'company'; label: string; sub: string; run: () => void; hue?: number; accent?: string; short?: string }

export function CommandK() {
  const { cmdOpen, setCmdOpen, myCompanies, setCompanyId, persona, toast } = useApp()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCmdOpen(!cmdOpen)
      }
      if (e.key === 'Escape') setCmdOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cmdOpen, setCmdOpen])

  useEffect(() => {
    if (cmdOpen) {
      setQ('')
      setSel(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [cmdOpen])

  const items = useMemo<Item[]>(() => {
    const go = (to: string) => () => {
      setCmdOpen(false)
      navigate(to)
    }
    const allActions: Item[] = [
      { id: 'a1', kind: 'action', label: 'Request time off', sub: 'Time off', run: go('/time-off') },
      { id: 'a2', kind: 'action', label: 'See who’s waiting on you', sub: 'Inbox', run: go('/inbox') },
      { id: 'a3', kind: 'action', label: 'Create a rule', sub: 'Rules & flows', run: go('/rules') },
      { id: 'a4', kind: 'action', label: 'Add a company', sub: 'Companies', run: go('/companies/new') },
      { id: 'a5', kind: 'action', label: 'Read pending documents', sub: 'Documents', run: go('/documents') },
    ]
    const actions = allActions.filter((a) => {
      // actions follow the persona's nav — an operator never "requests time off"
      if (a.id === 'a1') return persona.nav.includes('timeoff')
      if (a.id === 'a2') return persona.id === 'manager'
      if (a.id === 'a3') return persona.id === 'hradmin' || persona.id === 'portfolio'
      if (a.id === 'a4') return persona.id === 'operator' || persona.id === 'portfolio'
      if (a.id === 'a5') return persona.nav.includes('documents')
      return true
    })
    const people: Item[] = PEOPLE.slice(0, 8).map((p) => ({
      id: p.id,
      kind: 'person',
      label: p.name,
      sub: `${p.role} · ${p.dept}`,
      hue: p.hue,
      run: go('/people'),
    }))
    const allEntry: Item[] =
      myCompanies.length > 1
        ? [
            {
              id: 'all-view',
              kind: 'company',
              label: 'See everything — all companies',
              sub: `The big picture across ${myCompanies.length} companies`,
              accent: '#E8B23D',
              short: '✦',
              run: () => {
                setCompanyId('all')
                setCmdOpen(false)
                toast('Viewing everything — no single company selected')
              },
            },
          ]
        : []
    const companies: Item[] =
      myCompanies.length > 1
        ? myCompanies.map((c) => ({
            id: c.id,
            kind: 'company',
            label: `Switch to ${c.name}`,
            sub: `${c.employees} people · ${c.city}`,
            accent: c.accent,
            short: c.short,
            run: () => {
              setCompanyId(c.id)
              setCmdOpen(false)
              toast(`Now working in ${c.name}`)
            },
          }))
        : []
    const all = [...actions, ...allEntry, ...companies, ...people]
    if (!q.trim()) return all.slice(0, 9)
    const needle = q.toLowerCase()
    return all.filter((i) => (i.label + ' ' + i.sub).toLowerCase().includes(needle)).slice(0, 9)
  }, [q, myCompanies, persona, navigate, setCmdOpen, setCompanyId, toast])

  useEffect(() => setSel(0), [q])

  if (!cmdOpen) return null

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 animate-fade-in bg-ink/30 backdrop-blur-[2px]" onClick={() => setCmdOpen(false)} />
      <div className="absolute left-1/2 top-[16vh] w-[600px] max-w-[calc(100vw-32px)] -translate-x-1/2 animate-scale-in overflow-hidden rounded-3xl bg-card shadow-pop">
        <div className="flex items-center gap-3 border-b border-line/70 px-5 py-4">
          <Search className="h-[18px] w-[18px] text-muted" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') setSel((s) => Math.min(items.length - 1, s + 1))
              if (e.key === 'ArrowUp') setSel((s) => Math.max(0, s - 1))
              if (e.key === 'Enter') items[sel]?.run()
            }}
            placeholder="Search people, companies, or type an action…"
            className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted/70"
          />
          <kbd className="rounded-md bg-card2 px-1.5 py-0.5 text-[10px] font-bold text-muted">esc</kbd>
        </div>
        <ul className="max-h-[380px] overflow-y-auto p-2">
          {items.length === 0 && <li className="px-4 py-8 text-center text-[13px] text-muted">Nothing matches — try a name or “time off”.</li>}
          {items.map((i, idx) => (
            <li key={i.id}>
              <button
                onClick={i.run}
                onMouseEnter={() => setSel(idx)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                  idx === sel && 'bg-card2',
                )}
              >
                {i.kind === 'action' && (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
                    <Sparkles className="h-4 w-4" />
                  </span>
                )}
                {i.kind === 'person' && <Avatar name={i.label} hue={i.hue ?? 0} size="sm" />}
                {i.kind === 'company' && (
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-extrabold text-ink"
                    style={{ background: i.accent }}
                  >
                    {i.short}
                  </span>
                )}
                <span className="flex-1">
                  <span className="block text-[13.5px] font-bold leading-tight">{i.label}</span>
                  <span className="block text-[11.5px] text-muted">{i.sub}</span>
                </span>
                {idx === sel && <ArrowRight className="h-4 w-4 text-muted" />}
              </button>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-4 border-t border-line/70 bg-card2/50 px-5 py-2.5 text-[11px] font-medium text-muted">
          <span className="flex items-center gap-1.5"><User className="h-3 w-3" /> people</span>
          <span className="flex items-center gap-1.5"><Building2 className="h-3 w-3" /> companies</span>
          <span className="flex items-center gap-1.5"><Sparkles className="h-3 w-3" /> actions</span>
          <span className="ml-auto">↑↓ to move · ↵ to open</span>
        </div>
      </div>
    </div>
  )
}
