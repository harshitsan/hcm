/**
 * Time Off — Journey 5: "requesting leave is 3 taps".
 * Calendar pre-shaded with weekends / holidays / team conflicts, live balance
 * math, and order-tracking timelines for every request.
 */
import { ChevronDown, Send, Users } from 'lucide-react'
import { useState } from 'react'
import { Donut } from '../charts'
import {
  HOLIDAYS,
  MY_BALANCES,
  PEOPLE,
  TEAM_OFF,
  TODAY,
  type LeaveType,
} from '../data'
import { cn } from '../lib'
import { useApp } from '../store'
import { Avatar, Btn, Card, Input, Pill, Progress, SectionTitle, Segmented, statusTone, Timeline } from '../ui'

/* ── static June 2026 facts (1 June is a Monday → zero leading blanks) ── */

const DAYS_IN_JUNE = 30
const WEEKDAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const LEAVE_TYPES = ['Casual', 'Sick', 'Earned'] as const
const MONTH_SHORT = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const holidayByDate = new Map(HOLIDAYS.map((h) => [h.date, h.label]))
const teamOffByDate = new Map(TEAM_OFF.map((t) => [t.date, t.who]))

const isWeekend = (d: number) => ((d - 1) % 7) >= 5
const countsAsLeave = (d: number) => !isWeekend(d) && !holidayByDate.has(d)

const hueFor = (firstName: string) => PEOPLE.find((p) => p.name.startsWith(firstName))?.hue ?? 0

/** [22,23] → "22–23", [12,15] → "12 & 15" */
function collapseDates(ds: number[]): string {
  const sorted = [...ds].sort((a, b) => a - b)
  const runs: string[] = []
  let from = sorted[0]
  let prev = sorted[0]
  for (let i = 1; i <= sorted.length; i++) {
    const d = sorted[i]
    if (d !== undefined && d === prev + 1) {
      prev = d
      continue
    }
    runs.push(from === prev ? `${from}` : `${from}–${prev}`)
    if (d !== undefined) {
      from = d
      prev = d
    }
  }
  return runs.join(' & ')
}

/** '2026-06-22','2026-06-24' → "22–24 Jun" · same day → "28 May" */
function fmtRequestRange(from: string, to: string): string {
  const [, m1, d1] = from.split('-')
  const [, m2, d2] = to.split('-')
  if (from === to) return `${Number(d1)} ${MONTH_SHORT[Number(m1)]}`
  if (m1 === m2) return `${Number(d1)}–${Number(d2)} ${MONTH_SHORT[Number(m1)]}`
  return `${Number(d1)} ${MONTH_SHORT[Number(m1)]} – ${Number(d2)} ${MONTH_SHORT[Number(m2)]}`
}

export default function TimeOff() {
  const { requests, addRequest, toast } = useApp()

  const [type, setType] = useState<LeaveType>('Casual')
  const [start, setStart] = useState<number | null>(null)
  const [end, setEnd] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)

  const balance = MY_BALANCES.find((b) => b.type === type)!
  const remaining = balance.total - balance.used

  /* selection → countable days (weekends + holidays don't count) */
  const lo = start
  const hi = start !== null ? (end ?? start) : null
  let countable = 0
  if (lo !== null && hi !== null) {
    for (let d = lo; d <= hi; d++) if (countsAsLeave(d)) countable++
  }
  const over = countable - remaining
  const leftAfter = remaining - countable

  /* conflict hint: teammates already off inside the picked range */
  let conflictMsg: string | null = null
  if (lo !== null && hi !== null) {
    const overlaps = TEAM_OFF.filter((t) => t.date >= lo && t.date <= hi)
    if (overlaps.length > 0) {
      const names = [...new Set(overlaps.flatMap((t) => t.who))]
      const dates = collapseDates([...new Set(overlaps.map((t) => t.date))])
      conflictMsg =
        names.length === 1
          ? `${names[0]} is also off ${dates} — your call, just so you know.`
          : `${names.join(' & ')} are also off ${dates} — your call, just so you know.`
    }
  }

  const pickDay = (d: number) => {
    if (start === null) {
      setStart(d)
      setEnd(null)
      return
    }
    if (end === null) {
      if (d > start) setEnd(d)
      else if (d === start) setStart(null)
      else setStart(d) // earlier day → restart the range there
      return
    }
    setStart(null)
    setEnd(null)
  }

  const send = () => {
    if (lo === null || hi === null || countable < 1) return
    const pad = (d: number) => String(d).padStart(2, '0')
    addRequest({
      id: 'lr' + (requests.length + 1),
      type,
      from: `2026-06-${pad(lo)}`,
      to: `2026-06-${pad(hi)}`,
      days: countable,
      note: note.trim() ? note.trim() : undefined,
      status: 'With your manager',
      timeline: [
        { label: 'Sent', at: 'Just now', done: true },
        { label: 'With Arjun (your manager)', done: false },
        { label: 'Confirmed', done: false },
      ],
    })
    toast('Sent — Arjun usually replies within a day')
    setStart(null)
    setEnd(null)
    setNote('')
  }

  return (
    <div className="mx-auto max-w-6xl animate-fade-in">
      {/* hero */}
      <Card glow className="mb-5 p-7">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="mb-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">Time off</div>
            <h1 className="font-display text-[32px] font-medium leading-tight tracking-tight">
              Take the break — we'll handle the rest
            </h1>
            <p className="mt-1.5 max-w-md text-[13.5px] text-muted">
              Pick days on the calendar — holidays, weekends and team clashes are already worked in.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 pb-1">
            {MY_BALANCES.map((b) => {
              const left = b.total - b.used
              return (
                <div key={b.type} className="flex items-center gap-2.5 rounded-2xl border border-line/60 bg-card px-3.5 py-2.5">
                  <Donut
                    value={b.used}
                    max={b.total}
                    size={44}
                    stroke={6}
                    center={<span className="text-[11px] font-bold">{left}</span>}
                  />
                  <div>
                    <div className="text-[13px] font-bold leading-tight">{left} {b.type}</div>
                    <div className="text-[11px] font-medium text-muted">days left</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* ── calendar — the centerpiece ── */}
        <Card className="p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h3 className="font-display text-[20px] font-medium tracking-tight">June 2026</h3>
            <Segmented
              options={['June', 'July'] as const}
              value="June"
              onChange={(m) => m === 'July' && toast('Prototype shows June')}
            />
          </div>

          <div className="mb-1.5 grid grid-cols-7 gap-1.5">
            {WEEKDAY_HEADERS.map((h) => (
              <div key={h} className="text-center text-[11px] font-semibold uppercase tracking-wide text-muted">
                {h}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: DAYS_IN_JUNE }, (_, i) => i + 1).map((d) => {
              const weekend = isWeekend(d)
              const holiday = holidayByDate.get(d)
              const off = teamOffByDate.get(d)
              const inRange = lo !== null && hi !== null && d >= lo && d <= hi
              const selected = inRange && !weekend && !holiday
              return (
                <button
                  key={d}
                  type="button"
                  disabled={weekend || !!holiday}
                  onClick={() => pickDay(d)}
                  className={cn(
                    'relative flex h-[72px] flex-col items-center justify-center rounded-2xl text-[13px] font-semibold transition-all',
                    weekend && 'bg-card2 text-muted',
                    holiday && 'bg-accent-soft text-accent-ink',
                    !weekend && !holiday && !selected && 'cursor-pointer hover:bg-card2',
                    selected && 'bg-ink text-card',
                    d === TODAY && 'ring-2 ring-accent ring-offset-2 ring-offset-card',
                  )}
                >
                  <span>{d}</span>
                  {holiday && (
                    <span className="mt-0.5 max-w-full px-1 text-center text-[11px] font-medium leading-tight">
                      {holiday}
                    </span>
                  )}
                  {off && !holiday && (
                    <span className="mt-1 flex -space-x-2">
                      {off.map((w) => (
                        <Avatar key={w} name={w} hue={hueFor(w)} size="xs" className="ring-2 ring-card" />
                      ))}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* legend */}
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-medium text-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full border-2 border-accent bg-card" /> Today
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full border border-accent/40 bg-accent-soft" /> Holiday
            </span>
            <span className="flex items-center gap-1.5">
              <span className="flex -space-x-1">
                <span className="h-2.5 w-2.5 rounded-full bg-muted/60 ring-1 ring-card" />
                <span className="h-2.5 w-2.5 rounded-full bg-muted/30 ring-1 ring-card" />
              </span>
              Teammates off
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-ink" /> Your pick
            </span>
          </div>
        </Card>

        {/* ── new request ── */}
        <Card className="p-6">
          <SectionTitle hint="Three taps: type, days, send">New request</SectionTitle>
          <div className="space-y-4">
            <Segmented options={LEAVE_TYPES} value={type} onChange={setType} />

            <div className="rounded-xl bg-card2 px-3.5 py-2.5 text-[13.5px] font-semibold">
              {lo !== null ? (
                hi !== null && hi !== lo ? `${lo} – ${hi} June` : `${lo} June`
              ) : (
                <span className="font-medium text-muted">Pick days on the calendar</span>
              )}
            </div>

            {lo !== null && (
              <div>
                <p className="text-[13.5px] leading-snug text-ink-soft">
                  This uses{' '}
                  <span className="px-0.5 font-display text-[28px] font-medium tracking-tight text-ink">
                    {countable}
                  </span>{' '}
                  of your {remaining} {type.toLowerCase()} days
                </p>
                <Progress className="mt-2.5" value={((balance.used + countable) / balance.total) * 100} />
                {over > 0 ? (
                  <p className="mt-1.5 text-[12px] font-semibold text-red">
                    That's {over} more than you have{type !== 'Earned' && ' — Earned leave might fit better'}
                  </p>
                ) : (
                  <p className="mt-1.5 text-[11.5px] text-muted">
                    {leftAfter} {type.toLowerCase()} {leftAfter === 1 ? 'day' : 'days'} left after this
                  </p>
                )}
              </div>
            )}

            {conflictMsg && (
              <div className="flex items-start gap-2 rounded-xl bg-accent-soft px-3.5 py-2.5 text-[12px] font-medium leading-snug text-accent-ink">
                <Users className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{conflictMsg}</span>
              </div>
            )}

            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anything your manager should know? (optional)"
            />

            <Btn variant="dark" size="lg" className="w-full" disabled={lo === null || countable < 1} onClick={send}>
              <Send className="h-4 w-4" /> Send to Arjun
            </Btn>
          </div>
        </Card>

        {/* ── your requests ── */}
        <Card className="p-6 lg:col-span-3">
          <SectionTitle hint="Track every request like a parcel — tap a row for the full story">
            Your requests
          </SectionTitle>
          <ul className="divide-y divide-line/60">
            {requests.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(openId === r.id ? null : r.id)}
                  className="flex w-full items-center justify-between gap-4 py-3.5 text-left"
                >
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                    <span className="text-[13.5px] font-bold">{r.type}</span>
                    <span className="text-[13px] text-muted">
                      {fmtRequestRange(r.from, r.to)} · {r.days} {r.days === 1 ? 'day' : 'days'}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Pill tone={statusTone(r.status)} dot>
                      {r.status}
                    </Pill>
                    <ChevronDown
                      className={cn('h-4 w-4 text-muted transition-transform', openId === r.id && 'rotate-180')}
                    />
                  </div>
                </button>
                {openId === r.id && (
                  <div className="animate-fade-in pb-4 pl-1">
                    <Timeline steps={r.timeline} />
                    {r.note && (
                      <div className="mt-3 inline-block rounded-xl bg-card2 px-3.5 py-2 text-[12.5px] text-ink-soft">
                        "{r.note}"
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
