/**
 * HomeAdmin — Sara Iyer, HR Admin (Journey 3).
 * Answers "will my rules actually fire the way I think?" with proof:
 * rules at a glance, acknowledgment momentum, who's joining, time-off health.
 */
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, ChevronRight, Hourglass, Users, Zap } from 'lucide-react'
import { Donut } from '../../charts'
import { Avatar, Btn, Card, Pill, Progress, SectionTitle, Stat, Timeline, statusTone } from '../../ui'
import { useApp } from '../../store'
import { PEOPLE } from '../../data'

const ACK_PROGRESS = [
  { title: 'Code of conduct 2026', pct: 84 },
  { title: 'Data protection basics', pct: 100 },
  { title: 'Work from anywhere guide', pct: 41 },
]

export default function HomeAdmin() {
  const { rules, acks } = useApp()
  const navigate = useNavigate()

  const running = rules.filter((r) => r.status === 'Running').length
  const waiting = rules.filter((r) => r.status === 'Waiting for approval').length
  const nikhil = PEOPLE.find((p) => p.id === 'p12')!

  return (
    <div className="mx-auto max-w-6xl animate-fade-in">
      {/* hero */}
      <Card glow className="mb-5 p-7">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="mb-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">
              Wednesday, 10 June
            </div>
            <h1 className="font-display text-[32px] font-medium leading-tight tracking-tight">
              Good morning, Sara
            </h1>
            <p className="mt-1.5 max-w-md text-[13.5px] text-muted">
              Your rules are doing the work on their own — here's proof, plus two things worth a look.
            </p>
          </div>
          <div className="flex items-center gap-6 pb-1">
            <Stat icon={<Zap />} value={running} label="Running rules" />
            <Stat icon={<Hourglass />} value={waiting} label="Waiting for approval" />
            <Stat icon={<Users />} value="142" label="People" />
            <Btn variant="dark" onClick={() => navigate('/rules')}>
              Review rules <ArrowUpRight className="h-4 w-4" />
            </Btn>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* rules at a glance */}
        <Card className="p-6 lg:col-span-2">
          <SectionTitle
            hint="What each rule reaches, and where it stands"
            right={
              <Btn variant="ghost" size="sm" onClick={() => navigate('/rules')}>
                All rules <ChevronRight className="h-4 w-4" />
              </Btn>
            }
          >
            Your rules, at a glance
          </SectionTitle>
          <ul className="space-y-2">
            {rules.slice(0, 5).map((r) => (
              <li
                key={r.id}
                onClick={() => navigate('/rules')}
                className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-line/60 px-4 py-3 transition-colors hover:bg-card2"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-bold tracking-tight">{r.name}</div>
                  <div className="text-[11.5px] font-medium text-muted">{r.category}</div>
                </div>
                {r.shadowedBy && <Pill tone="amber">Covered by a platform policy</Pill>}
                <span className="text-[12.5px] font-semibold text-ink-soft">→ {r.headcount} people</span>
                <Pill tone={statusTone(r.status)} dot>
                  {r.status}
                </Pill>
                <ChevronRight className="h-4 w-4 text-muted" />
              </li>
            ))}
          </ul>
        </Card>

        {/* acknowledgment progress */}
        <Card className="p-6">
          <SectionTitle hint="Read-and-confirm, across the company">Acknowledgment progress</SectionTitle>
          <ul className="space-y-5">
            {ACK_PROGRESS.map((a) => {
              const doc = acks.find((d) => d.title === a.title)
              const confirmed = Math.round((a.pct / 100) * 142)
              return (
                <li key={a.title}>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-[13px] font-semibold">
                      {a.title}
                      {doc?.required && <Pill tone="outline">Required</Pill>}
                    </span>
                    <span className="text-[13px] font-bold">{a.pct}%</span>
                  </div>
                  <Progress value={a.pct} tone={a.pct > 80 ? 'green' : 'amber'} />
                  <div className="mt-1 text-[11.5px] text-muted">{confirmed} of 142 confirmed</div>
                </li>
              )
            })}
          </ul>
        </Card>

        {/* joining & leaving */}
        <Card className="p-6 lg:col-span-2">
          <SectionTitle hint="The next 30 days">Joining & leaving</SectionTitle>
          <div className="flex flex-wrap items-start gap-8">
            <div className="flex items-center gap-3">
              <Avatar name={nikhil.name} hue={nikhil.hue} size="lg" />
              <div>
                <div className="text-[14.5px] font-bold tracking-tight">{nikhil.name}</div>
                <div className="text-[12px] text-muted">{nikhil.role} · joins Mon 16 Jun</div>
                <Pill tone={statusTone('Joining soon')} dot className="mt-1.5">
                  Joining soon
                </Pill>
              </div>
            </div>
            <div className="min-w-[220px] flex-1">
              <Timeline
                steps={[
                  { label: 'Offer accepted', at: 'signed 2 Jun', done: true },
                  { label: 'Laptop reserved', at: 'MacBook ready to ship', done: true },
                  { label: 'Day-one checklist', at: 'waiting on Arjun', done: false },
                ]}
              />
            </div>
          </div>
          <p className="mt-4 border-t border-line/70 pt-3 text-[12.5px] text-muted">
            Your day-one rule kicked all of this off by itself. No exits coming up — quiet on that front.
          </p>
        </Card>

        {/* time-off health */}
        <Card className="p-6">
          <SectionTitle hint="Balance used across the company">Time-off health</SectionTitle>
          <div className="flex items-center gap-5">
            <Donut value={38} max={100} size={104} stroke={12} center={<span className="text-[18px] font-bold">38%</span>} />
            <div className="space-y-2 text-[12.5px]">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                <span className="font-semibold">Used</span>
                <span className="text-muted">— healthy pace</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-line" />
                <span className="font-semibold">Remaining</span>
              </div>
            </div>
          </div>
          <p className="mt-4 text-[12.5px] text-muted">
            14 people haven't taken a day yet — maybe a nudge?
          </p>
        </Card>
      </div>
    </div>
  )
}
