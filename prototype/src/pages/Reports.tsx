/**
 * Reports — the exemplar page for this prototype's composition style:
 * a glow hero row, big friendly numbers, rounded pill charts, zero tables-first.
 */
import { ArrowUpRight, CalendarDays, TrendingUp, UserPlus, Users } from 'lucide-react'
import { Bars, Donut, Gauge, Spark } from '../charts'
import { Btn, Card, Pill, SectionTitle, Stat } from '../ui'
import { useApp } from '../store'

export default function Reports() {
  const { company, toast } = useApp()

  return (
    <div className="mx-auto max-w-6xl animate-fade-in">
      {/* hero */}
      <Card glow className="mb-5 p-7">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="mb-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">Reports</div>
            <h1 className="font-display text-[32px] font-medium leading-tight tracking-tight">
              {company.id === 'all' ? 'How your companies are doing' : `How ${company.name} is doing`}
            </h1>
            <p className="mt-1.5 max-w-md text-[13.5px] text-muted">
              The numbers that matter this month — click any card to go deeper.
            </p>
          </div>
          <div className="flex items-center gap-6 pb-1">
            <Stat icon={<Users />} value={company.employees} label="People" />
            <Stat icon={<UserPlus />} value="6" label="Joining this month" />
            <Stat icon={<CalendarDays />} value="94%" label="On time today" />
            <Btn variant="dark" onClick={() => toast('Monthly report will land in your email')}>
              Email me this <ArrowUpRight className="h-4 w-4" />
            </Btn>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* headcount trend */}
        <Card className="p-6 lg:col-span-2">
          <SectionTitle
            hint="People at the end of each month"
            right={<Pill tone="green" dot>+12% this quarter</Pill>}
          >
            Team growth
          </SectionTitle>
          <div className="mb-2 flex items-baseline gap-2">
            <span className="text-[34px] font-bold tracking-tight">{company.employees}</span>
            <span className="flex items-center gap-1 text-[12.5px] font-bold text-green">
              <TrendingUp className="h-3.5 w-3.5" /> +9 since May
            </span>
          </div>
          <Spark points={[98, 107, 103, 116, 122, 131, 142]} labels={['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']} height={120} />
        </Card>

        {/* satisfaction gauge */}
        <Card className="flex flex-col items-center justify-center p-6">
          <SectionTitle className="w-full" hint="From last week's pulse check">
            How people feel
          </SectionTitle>
          <Gauge value={81} label="said this is a great place to work" size={170} />
          <div className="mt-2 text-[12px] font-medium text-muted">128 of 142 answered</div>
        </Card>

        {/* who's where */}
        <Card className="p-6">
          <SectionTitle hint="Right now, across all offices">Where everyone is</SectionTitle>
          <Bars
            height={140}
            data={[
              { label: 'Office', value: 86, tone: 'amber', hint: '86' },
              { label: 'Remote', value: 38, tone: 'ink', hint: '38' },
              { label: 'Time off', value: 12, tone: 'line', hint: '12' },
              { label: 'Travel', value: 6, tone: 'line', hint: '6' },
            ]}
          />
        </Card>

        {/* leave health */}
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
              <p className="pt-1 text-muted">
                Nudge: 14 people haven't taken a single day yet.
              </p>
            </div>
          </div>
        </Card>

        {/* hiring funnel */}
        <Card className="p-6">
          <SectionTitle hint="Open roles this quarter" right={<Pill tone="amber">4 roles</Pill>}>
            Hiring at a glance
          </SectionTitle>
          <ul className="space-y-3">
            {[
              { stage: 'Applied', n: 96, w: 100 },
              { stage: 'Interviewing', n: 14, w: 36 },
              { stage: 'Offer out', n: 3, w: 14 },
              { stage: 'Joining', n: 2, w: 10 },
            ].map((s) => (
              <li key={s.stage} className="flex items-center gap-3">
                <span className="w-24 text-[12.5px] font-semibold text-ink-soft">{s.stage}</span>
                <span className="h-7 rounded-full bg-accent" style={{ width: `${s.w}%`, opacity: 0.25 + s.w / 140 }} />
                <span className="text-[13px] font-bold">{s.n}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
