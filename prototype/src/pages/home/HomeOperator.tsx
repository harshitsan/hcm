/**
 * HomeOperator — Maya Kapoor, Platform Operator (Journey 1).
 * Platform health + onboarding momentum: who's getting set up, who's paused,
 * and a plain-language activity feed (audit trail as a UX asset, §5.2).
 */
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, Building2, ChevronRight, Plus, Users } from 'lucide-react'
import { Gauge } from '../../charts'
import { Avatar, Btn, Card, Pill, Progress, SectionTitle, Stat, statusTone } from '../../ui'
import { useApp } from '../../store'

export default function HomeOperator() {
  const { companies, company, setCompanyId, updateCompany, toast, audit } = useApp()
  const navigate = useNavigate()

  const totalPeople = companies.reduce((sum, c) => sum + c.employees, 0)
  const gamma = companies.find((c) => c.id === 'gamma')!
  const epsilon = companies.find((c) => c.id === 'epsilon')!
  const inOneCompany = company.id !== 'all'

  return (
    <div className="mx-auto max-w-6xl animate-fade-in">
      {/* context strip — you stepped into one company; this page is still the
          platform-wide view, so say so instead of letting it feel wrong */}
      {inOneCompany && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-line/70 bg-accent-soft/50 px-5 py-3">
          <span
            className="grid h-7 w-7 place-items-center rounded-full text-[11px] font-extrabold text-ink"
            style={{ background: company.accent }}
          >
            {company.short}
          </span>
          <span className="text-[13px] font-semibold">
            You're working in {company.name} — this overview is still the whole platform.
          </span>
          <Btn variant="ghost" size="sm" className="ml-auto" onClick={() => setCompanyId('all')}>
            Back to the big picture
          </Btn>
        </div>
      )}

      {/* hero */}
      <Card glow className="mb-5 p-7">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="mb-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">
              Platform overview
            </div>
            <h1 className="font-display text-[32px] font-medium leading-tight tracking-tight">
              All systems steady, Maya
            </h1>
            <p className="mt-1.5 max-w-md text-[13.5px] text-muted">
              Every company is healthy. One is mid-setup and could go live this week.
            </p>
          </div>
          <div className="flex items-center gap-6 pb-1">
            <Stat icon={<Building2 />} value={companies.length} label="Companies" />
            <Stat icon={<Users />} value={totalPeople} label="People on platform" />
            <Stat value="+2" label="Companies this month" />
            <Btn variant="dark" onClick={() => navigate('/companies/new')}>
              Add a company <Plus className="h-4 w-4" />
            </Btn>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* getting set up — spotlight */}
        <Card className="p-6 lg:col-span-2">
          <SectionTitle hint="One nudge could get Gamma live this week">Getting set up</SectionTitle>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className="grid h-9 w-9 place-items-center rounded-full font-extrabold text-ink"
                style={{ background: gamma.accent }}
              >
                {gamma.short}
              </span>
              <div>
                <div className="text-[14.5px] font-bold tracking-tight">{gamma.name}</div>
                <div className="text-[12px] text-muted">{gamma.city} · started May 2026</div>
              </div>
            </div>
            <span className="text-[24px] font-bold tracking-tight">{gamma.setupProgress}% set up</span>
          </div>
          <Progress value={gamma.setupProgress ?? 68} className="mt-3.5" />
          <div className="mt-2.5 text-[12.5px] font-medium text-muted">
            Profile ✓ · Teams ✓ · Time off ✓ · People — next
          </div>
          <Btn variant="dark" size="sm" className="mt-4" onClick={() => navigate('/companies/new')}>
            Continue setup <ArrowUpRight className="h-4 w-4" />
          </Btn>

          {/* quieter: the paused one (disappears once resumed) */}
          {epsilon.status === 'Paused' && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line/70 pt-4">
            <div className="flex items-center gap-3">
              <span
                className="grid h-8 w-8 place-items-center rounded-full text-[12px] font-extrabold text-ink opacity-70"
                style={{ background: epsilon.accent }}
              >
                {epsilon.short}
              </span>
              <div>
                <div className="flex items-center gap-2 text-[13px] font-bold">
                  {epsilon.name}
                  <Pill tone={statusTone(epsilon.status)} dot>
                    {epsilon.status}
                  </Pill>
                </div>
                <div className="text-[11.5px] text-muted">People can't sign in while paused</div>
              </div>
            </div>
            <Btn
              variant="ghost"
              size="sm"
              onClick={() => {
                updateCompany(epsilon.id, { status: 'Live' })
                toast(`${epsilon.name} is back on — its ${epsilon.employees} people can sign in again`)
              }}
            >
              Resume
            </Btn>
          </div>
          )}
        </Card>

        {/* platform health */}
        <Card className="flex flex-col items-center p-6">
          <SectionTitle className="w-full" hint="The numbers behind the calm">
            Platform health
          </SectionTitle>
          <Gauge value={99} label="uptime this quarter" size={150} />
          <div className="mt-4 flex w-full justify-around border-t border-line/70 pt-4">
            <div className="text-center">
              <div className="text-[18px] font-bold tracking-tight">320ms</div>
              <div className="text-[11.5px] font-medium text-muted">API p95</div>
            </div>
            <div className="text-center">
              <div className="text-[18px] font-bold tracking-tight">0</div>
              <div className="text-[11.5px] font-medium text-muted">incidents this month</div>
            </div>
          </div>
        </Card>

        {/* companies */}
        <Card className="p-6">
          <SectionTitle hint="Everyone on the platform">Companies</SectionTitle>
          <ul className="space-y-1.5">
            {companies.map((c) => (
              <li
                key={c.id}
                onClick={() => navigate('/companies')}
                className="flex cursor-pointer items-center gap-3 rounded-2xl px-2.5 py-2 transition-colors hover:bg-card2"
              >
                <span
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[12px] font-extrabold text-ink"
                  style={{ background: c.accent }}
                >
                  {c.short}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-bold tracking-tight">{c.name}</div>
                  <div className="text-[11.5px] text-muted">{c.employees} people</div>
                </div>
                <Pill tone={statusTone(c.status)} dot>
                  {c.status}
                </Pill>
              </li>
            ))}
          </ul>
        </Card>

        {/* recent activity */}
        <Card className="p-6 lg:col-span-2">
          <SectionTitle
            hint="What changed across the platform, in plain words"
            right={
              <Btn variant="ghost" size="sm" onClick={() => navigate('/activity')}>
                Full history <ChevronRight className="h-4 w-4" />
              </Btn>
            }
          >
            Recent activity
          </SectionTitle>
          <ul className="space-y-1">
            {audit.slice(0, 4).map((a) => (
              <li key={a.id} className="flex items-center gap-3 rounded-2xl px-2.5 py-2.5">
                <Avatar name={a.who} hue={a.hue} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold">{a.what}</div>
                </div>
                <span className="shrink-0 text-[11.5px] font-medium text-muted">{a.where + ' · ' + a.when}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
