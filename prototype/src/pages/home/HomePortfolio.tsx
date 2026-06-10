/**
 * HomePortfolio — David Chen, who runs 3 companies (Journey 2).
 * The cross-company digest lives in the hero; switching companies
 * recolors the whole workspace — that's the demo moment.
 */
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Inbox, Megaphone, Upload } from 'lucide-react'
import { Bars } from '../../charts'
import { Btn, Card, Pill, Progress, SectionTitle, statusTone } from '../../ui'
import { useApp } from '../../store'
import type { Company } from '../../data'

const DIGEST = [
  { icon: Inbox, n: '12', label: 'approvals waiting' },
  { icon: Megaphone, n: '3', label: 'rules ready to roll out' },
  { icon: Upload, n: '1', label: 'import needs a look' },
]

function CompanyDot({ c, size = 'h-9 w-9' }: { c: Company; size?: string }) {
  return (
    <span
      className={`grid ${size} shrink-0 place-items-center rounded-full font-extrabold text-ink`}
      style={{ background: c.accent }}
    >
      {c.short}
    </span>
  )
}

export default function HomePortfolio() {
  const { myCompanies, setCompanyId, toast } = useApp()
  const navigate = useNavigate()

  const totalPeople = myCompanies.reduce((sum, c) => sum + c.employees, 0)

  const workIn = (c: Company) => {
    setCompanyId(c.id)
    toast(`You're working in ${c.name} now — notice the workspace took on its color`)
  }

  return (
    <div className="mx-auto max-w-6xl animate-fade-in">
      {/* hero — the digest IS the hero */}
      <Card glow className="mb-5 p-7">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="mb-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">
              Across your 3 companies
            </div>
            <h1 className="font-display text-[32px] font-medium leading-tight tracking-tight">
              Here's what needs you, David
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              {DIGEST.map((d) => (
                <span
                  key={d.label}
                  className="inline-flex items-center gap-2 rounded-full border border-line/70 bg-card px-4 py-2"
                >
                  <d.icon className="h-4 w-4 text-muted" />
                  <span className="text-[14px] font-bold">{d.n}</span>
                  <span className="text-[12.5px] font-medium text-muted">{d.label}</span>
                </span>
              ))}
            </div>
          </div>
          <div className="pb-1">
            <Btn variant="dark" onClick={() => navigate('/companies')}>
              See your companies <ArrowUpRight className="h-4 w-4" />
            </Btn>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* one card per company */}
        {myCompanies.map((c) => (
          <Card key={c.id} className="flex flex-col p-6">
            <div className="flex items-start justify-between gap-3">
              <CompanyDot c={c} />
              <Pill tone={statusTone(c.status)} dot>
                {c.status}
              </Pill>
            </div>
            <div className="mt-3 text-[16.5px] font-bold tracking-tight">{c.name}</div>
            <div className="text-[12.5px] text-muted">
              {c.city} · {c.employees} people
            </div>
            {c.setupProgress !== undefined && (
              <div className="mt-3.5">
                <Progress value={c.setupProgress} />
                <div className="mt-1.5 text-[11.5px] font-medium text-muted">{c.setupProgress}% set up</div>
              </div>
            )}
            <div className="mt-auto pt-5">
              <Btn variant="outline" size="sm" className="w-full" onClick={() => workIn(c)}>
                Work in {c.name}
              </Btn>
            </div>
          </Card>
        ))}

        {/* blast radius — roll out one rule to many companies */}
        <Card className="p-6 lg:col-span-2">
          <SectionTitle hint="One draft, every company it touches — review before anything moves">
            Roll out one rule to many companies
          </SectionTitle>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2 text-[14.5px] font-semibold">
            <span className="rounded-lg bg-accent-soft px-2 py-0.5 text-accent-ink">Festive bonus letters</span>
            <ArrowRight className="h-4 w-4 text-muted" />
            {myCompanies.map((c, i) => (
              <span key={c.id} className="inline-flex items-center gap-1.5">
                <CompanyDot c={c} size="h-5 w-5 text-[9px]" />
                {c.name}
                {i < myCompanies.length - 1 && <span className="text-muted">,</span>}
              </span>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-[30px] font-bold tracking-tight">= {totalPeople} people</span>
              <span className="ml-2 text-[13px] font-medium text-muted">across 3 companies</span>
            </div>
            <Btn variant="outline" onClick={() => navigate('/rules')}>
              Review & roll out <ArrowUpRight className="h-4 w-4" />
            </Btn>
          </div>
        </Card>

        {/* people across companies */}
        <Card className="p-6">
          <SectionTitle hint="Headcount today">People across companies</SectionTitle>
          <Bars
            height={140}
            data={[
              { label: 'Acme', value: 142, tone: 'amber', hint: '142' },
              { label: 'Beta', value: 86, tone: 'ink', hint: '86' },
              { label: 'Gamma', value: 47, tone: 'line', hint: '47' },
            ]}
          />
        </Card>
      </div>
    </div>
  )
}
