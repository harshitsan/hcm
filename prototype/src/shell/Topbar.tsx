/**
 * Topbar: company context (Journey 2 — name + accent dot, switcher for
 * multi-company personas), date, notifications.
 */
import { Bell, Check, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../lib'
import { Pill, statusTone } from '../ui'
import { useApp } from '../store'

/** overlapping accent dots — the "everything at once" mark for the global view */
function StackedDots({ accents, size = 'md' }: { accents: string[]; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'h-5 w-5 text-[8px]' : 'h-7 w-7'
  return (
    <span className="flex items-center pl-1">
      {accents.slice(0, 3).map((a, i) => (
        <span
          key={i}
          className={cn('-ml-1.5 rounded-full ring-2 ring-card first:ml-0', dim)}
          style={{ background: a }}
        />
      ))}
    </span>
  )
}

export function Topbar() {
  const { persona, company, myCompanies, setCompanyId, toast } = useApp()
  const [open, setOpen] = useState(false)
  const multi = persona.multiCompany && myCompanies.length > 1
  const isAll = company.id === 'all'
  const totalPeople = myCompanies.reduce((n, c) => n + c.employees, 0)

  return (
    <header className="flex items-center justify-between gap-4 px-8 pb-2 pt-6">
      {/* company context — always visible, switchable when multi-company.
          Global view inverts to a dark pill so the scope is unmistakable. */}
      <div className="relative">
        <button
          onClick={() => multi && setOpen((o) => !o)}
          className={cn(
            'flex items-center gap-2.5 rounded-full border py-2 pl-2.5 pr-4 shadow-soft',
            isAll ? 'border-transparent bg-ink text-card' : 'border-line/80 bg-card',
            multi && 'transition-all hover:shadow-lift',
            multi && !isAll && 'hover:border-line',
          )}
        >
          {isAll ? (
            <StackedDots accents={myCompanies.map((c) => c.accent)} />
          ) : (
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-extrabold text-ink"
              style={{ background: company.accent }}
            >
              {company.short}
            </span>
          )}
          <span className="text-left leading-tight">
            <span className={cn('block text-[10px] font-bold uppercase tracking-[0.12em]', isAll ? 'text-card/60' : 'text-muted')}>
              {isAll ? "You're viewing" : "You're working in"}
            </span>
            <span className="block text-[13.5px] font-bold">
              {isAll ? `All ${myCompanies.length} companies` : company.name}
            </span>
          </span>
          {multi && <ChevronDown className={cn('ml-1 h-4 w-4', isAll ? 'text-card/60' : 'text-muted')} />}
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
            <div className="absolute left-0 top-full z-30 mt-2 w-72 animate-slide-up rounded-2xl border border-line bg-card p-1.5 shadow-pop">
              {/* the global view — pinned first: the big picture, no company hat on */}
              <button
                onClick={() => {
                  setCompanyId('all')
                  setOpen(false)
                  toast('Viewing everything — no single company selected')
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-card2',
                  isAll && 'bg-card2',
                )}
              >
                <StackedDots accents={myCompanies.map((c) => c.accent)} />
                <span className="flex-1">
                  <span className="block text-[13px] font-bold leading-tight">All companies</span>
                  <span className="block text-[11px] text-muted">
                    The big picture · {totalPeople} people
                  </span>
                </span>
                {isAll && <Check className="h-4 w-4 text-green" />}
              </button>
              <div className="mx-2.5 my-1 border-t border-line/70" />
              <div className="px-2.5 pb-1 pt-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted">
                Work in one company
              </div>
              {myCompanies.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setCompanyId(c.id)
                    setOpen(false)
                    toast(`Now working in ${c.name}`)
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-card2"
                >
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-extrabold text-ink"
                    style={{ background: c.accent }}
                  >
                    {c.short}
                  </span>
                  <span className="flex-1">
                    <span className="block text-[13px] font-bold leading-tight">{c.name}</span>
                    <span className="block text-[11px] text-muted">
                      {c.employees} people · {c.city}
                    </span>
                  </span>
                  {c.id === company.id ? (
                    <Check className="h-4 w-4 text-green" />
                  ) : (
                    <Pill tone={statusTone(c.status)}>{c.status}</Pill>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        <span className="hidden rounded-full border border-line/80 bg-card px-4 py-2 text-[12.5px] font-semibold text-muted shadow-soft md:block">
          Wed, 10 June 2026
        </span>
        <button
          onClick={() => toast('Nothing urgent — 2 quiet updates in your digest')}
          className="relative flex h-10 w-10 items-center justify-center rounded-full border border-line/80 bg-card text-ink shadow-soft transition-all hover:shadow-lift"
          aria-label="Notifications"
        >
          <Bell className="h-[17px] w-[17px]" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-accent ring-2 ring-card" />
        </button>
      </div>
    </header>
  )
}
