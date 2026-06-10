/**
 * Companies — the operator / portfolio view of every company in one place.
 * Journey 2 groundwork: pick where you're working, see who's healthy at a glance.
 */
import { Building2, Plus, Users, Wrench } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Btn, Card, Pill, Progress, Stat, statusTone } from '../ui'
import { useApp } from '../store'

export default function Companies() {
  const { myCompanies, setCompanyId, toast } = useApp()
  const navigate = useNavigate()

  const live = myCompanies.filter((c) => c.status === 'Live').length
  const settingUp = myCompanies.filter((c) => c.status === 'Getting set up').length
  const totalPeople = myCompanies.reduce((n, c) => n + c.employees, 0)

  return (
    <div className="mx-auto max-w-6xl animate-fade-in">
      {/* hero */}
      <Card glow className="mb-5 p-7">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="mb-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">Companies</div>
            <h1 className="font-display text-[32px] font-medium leading-tight tracking-tight">
              Every company, one place
            </h1>
            <p className="mt-1.5 max-w-md text-[13.5px] text-muted">
              Jump into any of them — the workspace changes color so you always know where you are.
            </p>
          </div>
          <div className="flex items-center gap-6 pb-1">
            <Stat icon={<Building2 />} value={live} label="Live" />
            <Stat icon={<Wrench />} value={settingUp} label="Getting set up" />
            <Stat icon={<Users />} value={totalPeople} label="People in all" />
            <Btn variant="dark" onClick={() => navigate('/companies/new')}>
              <Plus className="h-4 w-4" /> Add a company
            </Btn>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {myCompanies.map((c) => (
          <Card key={c.id} className="flex flex-col p-6">
            <div className="flex items-center gap-3">
              <span
                className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-[15px] font-extrabold text-ink"
                style={{ background: c.accent }}
              >
                {c.short}
              </span>
              <div className="min-w-0">
                <div className="truncate text-[16px] font-bold tracking-tight">{c.name}</div>
                <div className="text-[12.5px] text-muted">
                  {c.city} · since {c.since}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[14px] font-bold">{c.employees} people</span>
              <div className="flex items-center gap-1.5">
                <Pill tone="outline">{c.plan}</Pill>
                <Pill tone={statusTone(c.status)} dot>
                  {c.status}
                </Pill>
              </div>
            </div>

            {c.setupProgress != null ? (
              <div className="mt-auto pt-5">
                <Progress value={c.setupProgress} />
                <p className="mt-2 text-[12px] text-muted">{c.setupProgress}% set up · next: bring people in</p>
                <Btn variant="amber" size="sm" className="mt-3" onClick={() => navigate('/companies/new')}>
                  Continue setup
                </Btn>
              </div>
            ) : c.status === 'Paused' ? (
              <div className="mt-auto pt-5">
                <p className="text-[12px] text-muted">People can't sign in while paused</p>
                <Btn
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => toast(`${c.name} is back — people can sign in again`)}
                >
                  Resume
                </Btn>
              </div>
            ) : (
              <div className="mt-auto pt-5">
                <Btn
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCompanyId(c.id)
                    toast(`You're now working in ${c.name}`)
                  }}
                >
                  Work in {c.name}
                </Btn>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
