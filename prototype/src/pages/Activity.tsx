/**
 * Activity — the everything-log (BRD §6.29), readable as a story.
 * One stream for every change in the app: who did it, what changed, where.
 * Live — every store action prepends an event marked "just now".
 */
import { useMemo, useState } from 'react'
import { Archive, CalendarDays, History, Sparkles, X, Zap } from 'lucide-react'
import { useApp } from '../store'
import { Avatar, Card, EmptyState, Input, Pill, Select, Stat } from '../ui'
import { cn } from '../lib'
import type { AuditKind } from '../data'

const KIND_ORDER: AuditKind[] = ['Company', 'Rule', 'Flow', 'Access', 'People', 'Time off', 'Documents']
/** seed time-buckets — "today" is anything from this morning */
const TODAY_WHENS = ['just now', '2h ago', '3h ago', '6h ago']
/** seed entries older than this week */
const OLDER_WHENS = ['12 May', '2 May', '28 Apr', '15 Apr', '3 Mar']

export default function Activity() {
  const { audit, myCompanies, persona, company } = useApp()
  const [kind, setKind] = useState<'All' | AuditKind>('All')
  const [place, setPlace] = useState('All places')
  const [query, setQuery] = useState('')
  const [hintDismissed, setHintDismissed] = useState(false)

  // scope the stream to what this persona looks after — generously, by name
  const visible = useMemo(() => {
    if (persona.id === 'operator') return audit
    const names = new Set(myCompanies.map((c) => c.name))
    names.add('Platform')
    if (persona.id === 'portfolio') names.add('Helix portfolio')
    return audit.filter((e) => names.has(e.where))
  }, [audit, myCompanies, persona])

  const todayCount = visible.filter((e) => TODAY_WHENS.includes(e.when)).length
  const weekCount = visible.filter((e) => !OLDER_WHENS.includes(e.when)).length

  const kindsPresent = KIND_ORDER.filter((k) => visible.some((e) => e.kind === k))
  const kindChips: ('All' | AuditKind)[] = ['All', ...kindsPresent]
  const placesPresent = Array.from(new Set(visible.map((e) => e.where)))

  const q = query.trim().toLowerCase()
  const filtered = visible.filter(
    (e) =>
      (kind === 'All' || e.kind === kind) &&
      (place === 'All places' || e.where === place) &&
      (q === '' ||
        e.what.toLowerCase().includes(q) ||
        (e.detail ?? '').toLowerCase().includes(q) ||
        e.who.toLowerCase().includes(q)),
  )

  const scope = persona.multiCompany ? 'your companies' : company.name

  return (
    <div className="mx-auto max-w-6xl animate-fade-in">
      {/* hero */}
      <Card glow className="mb-5 p-7">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="mb-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">Activity</div>
            <h1 className="font-display text-[32px] font-medium leading-tight tracking-tight">
              Everything, on the record
            </h1>
            <p className="mt-1.5 max-w-md text-[13.5px] text-muted">
              Every change across {scope} — who did it, what changed, where. Nothing edits this list; it only grows.
            </p>
          </div>
          <div className="flex items-center gap-6 pb-1">
            <Stat icon={<Zap />} value={todayCount} label="Today" />
            <Stat icon={<CalendarDays />} value={weekCount} label="This week" />
            <Stat icon={<Archive />} value="7 yrs" label="then archived" />
          </div>
        </div>
      </Card>

      {/* filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {kindChips.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-all',
              kind === k ? 'bg-ink text-card shadow-sm' : 'border border-line bg-card text-muted hover:text-ink',
            )}
          >
            {k}
          </button>
        ))}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {persona.multiCompany && (
            <Select value={place} onChange={(e) => setPlace(e.target.value)} className="w-44">
              <option>All places</option>
              {placesPresent.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </Select>
          )}
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search activity…"
            className="w-56"
          />
        </div>
      </div>

      {/* live demo hint */}
      {!hintDismissed && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl bg-accent-soft px-5 py-3.5 text-accent-ink">
          <Sparkles className="h-4 w-4 shrink-0" />
          <p className="text-[13px] font-medium">
            Try it — approve something in Inbox or pause a company, then come back. It'll be at the top, marked{' '}
            <span className="font-bold">just now</span>.
          </p>
          <button
            type="button"
            onClick={() => setHintDismissed(true)}
            className="ml-auto shrink-0 rounded-full p-1 transition-colors hover:bg-card/60"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* the stream */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<History />}
          title="Nothing matches"
          body="Try a different type, place, or search — every change ever made is in here somewhere."
        />
      ) : (
        <Card>
          <ul className="divide-y divide-line/60">
            {filtered.map((e) => (
              <li key={e.id} className="flex items-start gap-3.5 p-4">
                <Avatar name={e.who} hue={e.hue} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-semibold leading-snug">{e.what}</div>
                  {e.detail && <div className="mt-0.5 text-[12px] text-muted">{e.detail}</div>}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Pill tone="outline">{e.kind}</Pill>
                  <span className="text-[11.5px] font-medium text-muted">{e.where}</span>
                  <span
                    className={cn(
                      'text-[11.5px]',
                      e.when === 'just now' ? 'font-semibold text-green' : 'font-medium text-muted',
                    )}
                  >
                    {e.when}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
