/**
 * Manager home — Journey 4: "queue first."
 * Arjun's headline IS the queue: who's waiting, how urgent, and one button to clear it.
 */
import { ArrowRight, Briefcase, CalendarDays, Users } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Gauge } from '../../charts'
import { PEOPLE, TEAM_OFF } from '../../data'
import { useApp } from '../../store'
import { Avatar, Btn, Card, Pill, SectionTitle, Stat, Toggle } from '../../ui'

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
/** June 2026 starts on a Monday */
const dayName = (d: number) => DOW[(d - 1) % 7]

const personFor = (first: string) => PEOPLE.find((p) => p.name.startsWith(first))

/** teammate days off, merged into friendly one-liners */
const OFF_ROWS = (() => {
  const merged: { from: number; to: number; who: string[] }[] = []
  for (const t of TEAM_OFF) {
    const last = merged[merged.length - 1]
    if (last && t.date === last.to + 1 && t.who.join() === last.who.join()) last.to = t.date
    else merged.push({ from: t.date, to: t.date, who: t.who })
  }
  return merged.map((m) => ({
    key: m.from,
    who: m.who,
    text: `${m.who.join(' & ')} ${m.who.length > 1 ? 'are' : 'is'} off ${
      m.from === m.to ? `${dayName(m.from)} ${m.from}` : `${dayName(m.from)} ${m.from}–${dayName(m.to)} ${m.to}`
    }`,
  }))
})()

export default function HomeManager() {
  const nav = useNavigate()
  const { inbox, toast } = useApp()
  const [coverOn, setCoverOn] = useState(false)

  const waiting = inbox.filter((i) => i.status === 'waiting')
  const topThree = waiting.slice(0, 3)
  const nikhil = PEOPLE.find((p) => p.id === 'p12')!

  return (
    <div className="mx-auto max-w-6xl animate-fade-in">
      {/* hero — the queue is the headline */}
      <Card glow className="mb-5 p-7">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="mb-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">Wednesday, 10 June</div>
            <h1 className="font-display text-[32px] font-medium leading-tight tracking-tight">Good morning, Arjun</h1>
            <div className="mt-3 flex items-baseline gap-2.5">
              <span className="text-[34px] font-bold leading-none tracking-tight">{waiting.length}</span>
              <span className="text-[15px] font-semibold text-ink-soft">people are waiting on you</span>
            </div>
            <p className="mt-1.5 text-[13.5px] text-muted">about 5 minutes to clear — most are safe to approve</p>
          </div>
          <div className="flex items-center gap-6 pb-1">
            <Stat icon={<Users />} value="6" label="Team" />
            <Stat icon={<CalendarDays />} value="1" label="On leave today" />
            <Stat icon={<Briefcase />} value="1" label="Offers out" />
            <Btn variant="dark" onClick={() => nav('/inbox')}>
              Clear your queue <ArrowRight className="h-4 w-4" />
            </Btn>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* queue preview */}
        <Card className="p-6 lg:col-span-2">
          <SectionTitle hint="Newest deadline first — decide from the card in your inbox">Waiting on you</SectionTitle>
          <div className="space-y-1">
            {topThree.map((i) => (
              <div
                key={i.id}
                onClick={() => nav('/inbox')}
                className="flex cursor-pointer items-center gap-3.5 rounded-2xl px-3 py-3 transition-colors hover:bg-card2/70"
              >
                <Avatar name={i.who} hue={i.whoHue} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-bold tracking-tight">{i.who}</div>
                  <div className="truncate text-[12.5px] text-muted">{i.title}</div>
                </div>
                {i.safe && (
                  <Pill tone="green" dot>
                    Safe to approve
                  </Pill>
                )}
                <Pill tone={i.dueTone} dot>
                  {i.due}
                </Pill>
              </div>
            ))}
          </div>
          {waiting.length > 3 && (
            <Btn variant="ghost" size="sm" className="mt-3" onClick={() => nav('/inbox')}>
              {waiting.length - 3} more in your inbox <ArrowRight className="h-4 w-4" />
            </Btn>
          )}
        </Card>

        {/* pulse */}
        <Card className="flex flex-col items-center justify-center p-6">
          <SectionTitle className="w-full" hint="From Friday's team check-in">
            Team pulse
          </SectionTitle>
          <Gauge value={78} label="team energy this sprint" size={150} />
          <p className="mt-2 text-center text-[12.5px] text-muted">Steady — Meera's return next week should lift it.</p>
        </Card>

        {/* team calendar peek */}
        <Card className="p-6 lg:col-span-2">
          <SectionTitle hint="Days off and arrivals, at a glance">Team this week</SectionTitle>
          <div className="space-y-4">
            {OFF_ROWS.map((row) => (
              <div key={row.key} className="flex items-center gap-3">
                <span className="flex shrink-0 -space-x-2">
                  {row.who.map((w) => {
                    const p = personFor(w)
                    return <Avatar key={w} name={p?.name ?? w} hue={p?.hue ?? 0} size="sm" className="ring-2 ring-card" />
                  })}
                </span>
                <div className="text-[13px] font-medium">{row.text}</div>
              </div>
            ))}
            <div className="flex items-center gap-3">
              <Avatar name={nikhil.name} hue={nikhil.hue} size="sm" />
              <div className="text-[13px] font-medium">Nikhil Bose joins Mon 16 Jun</div>
              <Pill tone="amber" dot>
                Joining soon
              </Pill>
            </div>
          </div>
        </Card>

        {/* delegation as one sentence */}
        <Card className="p-6">
          <SectionTitle hint="One flip, and nothing waits on you">Going on leave?</SectionTitle>
          <Toggle
            on={coverOn}
            onChange={(v) => {
              setCoverOn(v)
              if (v) toast('Approvals will go to Sara — flip it back any time')
            }}
            label="Route my approvals to Sara while I'm out"
          />
          <p className="mt-3 text-[12.5px] text-muted">
            {coverOn ? 'Sara picks up anything new from here.' : 'Sara will see new approvals the moment you flip this on.'}
          </p>
        </Card>
      </div>
    </div>
  )
}
