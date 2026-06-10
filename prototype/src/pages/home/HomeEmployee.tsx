/**
 * Employee home — Journey 5: "my numbers + my pending stuff, no navigation needed."
 * Priya's balances, requests in flight, things to read, and who's around this week.
 */
import { ArrowRight, CalendarDays, FileText, Sun } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Donut, WeekBars } from '../../charts'
import { HOLIDAYS, MY_BALANCES, PEOPLE, TEAM_OFF } from '../../data'
import { useApp } from '../../store'
import { Avatar, Btn, Card, EmptyState, Pill, SectionTitle, Stat, Timeline, statusTone } from '../../ui'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
/** June 2026 starts on a Monday */
const dayName = (d: number) => DOW[(d - 1) % 7]

function fmtRange(from: string, to: string) {
  const [, fm, fd] = from.split('-').map(Number)
  const [, tm, td] = to.split('-').map(Number)
  if (fm === tm && fd === td) return `${fd} ${MONTHS[fm - 1]}`
  if (fm === tm) return `${fd}–${td} ${MONTHS[fm - 1]}`
  return `${fd} ${MONTHS[fm - 1]} – ${td} ${MONTHS[tm - 1]}`
}

const personFor = (first: string) => PEOPLE.find((p) => p.name.startsWith(first))

/** holidays + teammate days off, merged into friendly one-liners */
type OffRow = { date: number; text: string; who?: string[]; holiday?: boolean }
const OFF_ROWS: OffRow[] = (() => {
  const merged: { from: number; to: number; who: string[] }[] = []
  for (const t of TEAM_OFF) {
    const last = merged[merged.length - 1]
    if (last && t.date === last.to + 1 && t.who.join() === last.who.join()) last.to = t.date
    else merged.push({ from: t.date, to: t.date, who: t.who })
  }
  const rows: OffRow[] = merged.map((m) => ({
    date: m.from,
    who: m.who,
    text: `${m.who.join(' & ')} ${m.who.length > 1 ? 'are' : 'is'} off ${
      m.from === m.to ? `${dayName(m.from)} ${m.from}` : `${dayName(m.from)} ${m.from}–${dayName(m.to)} ${m.to}`
    }`,
  }))
  for (const h of HOLIDAYS) {
    rows.push({ date: h.date, holiday: true, text: `${h.label} · everyone's off ${dayName(h.date)} ${h.date}` })
  }
  return rows.sort((a, b) => a.date - b.date).slice(0, 4)
})()

const WEEK = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 1 },
  { label: 'Wed', value: 0.85 },
  { label: 'Thu', value: 0.4 },
  { label: 'Fri', value: 0 },
  { label: 'Sat', value: 0 },
  { label: 'Sun', value: 0 },
]

export default function HomeEmployee() {
  const nav = useNavigate()
  const { requests, acks } = useApp()

  const daysLeft = MY_BALANCES.reduce((s, b) => s + (b.total - b.used), 0)
  const toRead = acks.filter((d) => d.state === 'todo')
  const readDone = acks.length - toRead.length

  return (
    <div className="mx-auto max-w-6xl animate-fade-in">
      {/* hero */}
      <Card glow className="mb-5 p-7">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="mb-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">Wednesday, 10 June</div>
            <h1 className="font-display text-[32px] font-medium leading-tight tracking-tight">Good morning, Priya</h1>
            <p className="mt-1.5 max-w-md text-[13.5px] text-muted">
              Everything that needs you is on this page — two quick reads, and one request on its way.
            </p>
          </div>
          <div className="flex items-center gap-6 pb-1">
            <Stat icon={<CalendarDays />} value={daysLeft} label="Days off left" />
            <Stat icon={<Sun />} value="17 Jun" label="Bakrid · next holiday" />
            <Btn variant="dark" onClick={() => nav('/time-off')}>
              Request time off <ArrowRight className="h-4 w-4" />
            </Btn>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* balances */}
        <Card className="p-6">
          <SectionTitle hint="Across your three balances">Your time off</SectionTitle>
          <div className="space-y-4">
            {MY_BALANCES.map((b) => (
              <div key={b.type} className="flex items-center gap-4">
                <Donut value={b.used} max={b.total} size={56} />
                <div>
                  <div className="text-[14px] font-bold tracking-tight">
                    {b.total - b.used} of {b.total} left
                  </div>
                  <div className="text-[12px] text-muted">
                    {b.type} · {b.note}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Btn variant="ghost" size="sm" className="-ml-2 mt-4" onClick={() => nav('/time-off')}>
            Plan time off <ArrowRight className="h-4 w-4" />
          </Btn>
        </Card>

        {/* requests — order-tracking feel */}
        <Card className="p-6">
          <SectionTitle hint="Track them like a delivery">Your requests</SectionTitle>
          <div className="space-y-3">
            {requests.map((r) => (
              <div key={r.id} className="rounded-2xl border border-line/70 bg-card2/30 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[13.5px] font-bold tracking-tight">
                      {r.type} leave · {fmtRange(r.from, r.to)}
                    </div>
                    <div className="mt-0.5 text-[12px] text-muted">
                      {r.days} {r.days === 1 ? 'day' : 'days'}
                      {r.note ? ` · ${r.note}` : ''}
                    </div>
                  </div>
                  <Pill tone={statusTone(r.status)} dot>
                    {r.status}
                  </Pill>
                </div>
                {r.status === 'With your manager' && (
                  <div className="mt-3 border-t border-line/60 pt-3">
                    <Timeline steps={r.timeline} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* acknowledgments */}
        <Card className="p-6" onClick={() => nav('/documents')}>
          <SectionTitle hint={`${readDone} of ${acks.length} done`}>To read</SectionTitle>
          {toRead.length === 0 ? (
            <EmptyState
              title="All caught up"
              body="Nothing waiting on your confirmation — check back when something new lands."
            />
          ) : (
            <div className="space-y-4">
              {toRead.map((d) => (
                <div key={d.id} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-card2 text-muted">
                    <FileText className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-bold leading-tight tracking-tight">{d.title}</div>
                    <div className="mt-0.5 text-[12px] text-muted">{d.minutes} min read</div>
                  </div>
                  {d.required ? <Pill tone="amber">Required · {d.due}</Pill> : <Pill tone="neutral">Optional</Pill>}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* who's off */}
        <Card className="p-6">
          <SectionTitle hint="So you can plan around it">Who's off this week</SectionTitle>
          <div className="space-y-4">
            {OFF_ROWS.map((row) => (
              <div key={row.date} className="flex items-center gap-3">
                {row.holiday ? (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
                    <Sun className="h-4 w-4" />
                  </span>
                ) : (
                  <span className="flex shrink-0 -space-x-2">
                    {row.who!.map((w) => {
                      const p = personFor(w)
                      return <Avatar key={w} name={p?.name ?? w} hue={p?.hue ?? 0} size="sm" className="ring-2 ring-card" />
                    })}
                  </span>
                )}
                <div className="text-[13px] font-medium">{row.text}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* hours */}
        <Card className="p-6">
          <SectionTitle hint="Hours logged, Monday to Sunday">Your week</SectionTitle>
          <WeekBars data={WEEK} highlight={2} height={96} />
          <p className="mt-3 text-[12.5px] font-medium text-muted">On track — 22h 30m so far</p>
        </Card>
      </div>
    </div>
  )
}
