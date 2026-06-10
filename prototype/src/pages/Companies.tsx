/**
 * Companies — the operator / portfolio view of every company in one place.
 * Journey 2 groundwork: pick where you're working, see who's healthy at a glance.
 * Click any card for the detail view (the 6 facts + lifecycle), where the
 * operator's real power lives: pause / resume with consequences stated up front.
 */
import { AlertTriangle, Building2, ChevronRight, Mail, Plus, Users, Wrench } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Company } from '../data'
import { Btn, Card, Drawer, Input, Modal, Pill, Progress, Stat, Timeline, statusTone } from '../ui'
import { useApp } from '../store'

/** human-readable code, spec-style: COMP-2026-NNNN */
function codeFor(c: Company, all: Company[]): string {
  const i = all.findIndex((x) => x.id === c.id)
  return `COMP-2026-${String(41 + (i < 0 ? all.length : i)).padStart(4, '0')}`
}

function lifecycleSteps(c: Company) {
  if (c.status === 'Getting set up')
    return [
      { label: `Created from a template · ${c.since}`, done: true },
      { label: `Setting up — ${c.setupProgress ?? 0}% done`, done: false },
      { label: 'Goes live', done: false },
    ]
  if (c.status === 'Paused')
    return [
      { label: `Created · ${c.since}`, done: true },
      { label: 'Went live', done: true },
      { label: 'Paused — people can’t sign in', at: 'now', done: false },
    ]
  return [
    { label: `Created · ${c.since}`, done: true },
    { label: `Live since ${c.since}`, done: true },
    { label: 'Healthy — nothing needs you', at: 'today', done: true },
  ]
}

export default function Companies() {
  const { myCompanies, companies, setCompanyId, updateCompany, toast } = useApp()
  const navigate = useNavigate()
  const [openId, setOpenId] = useState<string | null>(null)
  const [pausingId, setPausingId] = useState<string | null>(null)
  const [confirmName, setConfirmName] = useState('')

  const live = myCompanies.filter((c) => c.status === 'Live').length
  const settingUp = myCompanies.filter((c) => c.status === 'Getting set up').length
  const totalPeople = myCompanies.reduce((n, c) => n + c.employees, 0)

  const open = myCompanies.find((c) => c.id === openId) ?? null
  const pausing = myCompanies.find((c) => c.id === pausingId) ?? null

  const resume = (c: Company) => {
    updateCompany(c.id, { status: 'Live' })
    toast(`${c.name} is back — its ${c.employees} people can sign in again`)
  }

  const startPause = (c: Company) => {
    setConfirmName('')
    setPausingId(c.id)
  }

  const confirmPause = () => {
    if (!pausing) return
    updateCompany(pausing.id, { status: 'Paused' })
    toast(`${pausing.name} is paused — its admins have been emailed`)
    setPausingId(null)
    setOpenId(null)
  }

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
          <Card key={c.id} className="flex flex-col p-6" onClick={() => setOpenId(c.id)}>
            <div className="flex items-center gap-3">
              <span
                className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-[15px] font-extrabold text-ink"
                style={{ background: c.accent }}
              >
                {c.short}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[16px] font-bold tracking-tight">{c.name}</div>
                <div className="text-[12.5px] text-muted">
                  {c.city} · since {c.since}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted/60" />
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

            {c.setupProgress != null && c.status === 'Getting set up' ? (
              <div className="mt-auto pt-5" onClick={(e) => e.stopPropagation()}>
                <Progress value={c.setupProgress} />
                <p className="mt-2 text-[12px] text-muted">{c.setupProgress}% set up · next: bring people in</p>
                <Btn variant="amber" size="sm" className="mt-3" onClick={() => navigate('/companies/new')}>
                  Continue setup
                </Btn>
              </div>
            ) : c.status === 'Paused' ? (
              <div className="mt-auto pt-5" onClick={(e) => e.stopPropagation()}>
                <p className="text-[12px] text-muted">People can't sign in while paused</p>
                <Btn variant="outline" size="sm" className="mt-3" onClick={() => resume(c)}>
                  Resume
                </Btn>
              </div>
            ) : (
              <div className="mt-auto pt-5" onClick={(e) => e.stopPropagation()}>
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

      {/* ── company detail — the 6 facts, lifecycle, and the operator's controls ── */}
      <Drawer
        open={open != null}
        onClose={() => setOpenId(null)}
        title={
          open ? (
            <span className="flex items-center gap-2.5">
              <span
                className="grid h-8 w-8 place-items-center rounded-xl text-[12px] font-extrabold text-ink"
                style={{ background: open.accent }}
              >
                {open.short}
              </span>
              {open.name}
            </span>
          ) : (
            ''
          )
        }
        footer={
          open && (
            <div className="flex items-center justify-between gap-3">
              {open.status === 'Live' && (
                <Btn variant="danger" size="sm" onClick={() => startPause(open)}>
                  Pause {open.name}
                </Btn>
              )}
              {open.status === 'Paused' && (
                <Btn variant="outline" size="sm" onClick={() => resume(open)}>
                  Resume
                </Btn>
              )}
              {open.status === 'Getting set up' && (
                <Btn variant="amber" size="sm" onClick={() => navigate('/companies/new')}>
                  Continue setup
                </Btn>
              )}
              {open.status !== 'Paused' ? (
                <Btn
                  variant="dark"
                  size="sm"
                  onClick={() => {
                    setCompanyId(open.id)
                    setOpenId(null)
                    toast(`You're now working in ${open.name}`)
                  }}
                >
                  Work in {open.name}
                </Btn>
              ) : (
                <span className="text-[12px] text-muted">Resume it to work inside</span>
              )}
            </div>
          )
        }
      >
        {open && (
          <div>
            <div className="mb-5 flex items-center gap-2">
              <Pill tone={statusTone(open.status)} dot>
                {open.status}
              </Pill>
              <Pill tone="outline">{open.plan}</Pill>
              <span className="ml-auto text-[11.5px] font-semibold text-muted">{codeFor(open, companies)}</span>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {(
                [
                  ['People', `${open.employees}`],
                  ['City', open.city || '—'],
                  ['On the platform since', open.since || 'this month'],
                  ['Plan', `${open.plan} · up to ${Math.max(250, Math.ceil(open.employees / 50) * 50)} people`],
                  ['Primary contact', `admin@${open.id}.in`],
                  ['Code', codeFor(open, companies)],
                ] as const
              ).map(([label, value]) => (
                <div key={label}>
                  <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted">{label}</div>
                  <div className="mt-0.5 text-[13.5px] font-semibold">{value}</div>
                </div>
              ))}
            </div>

            <div className="mt-7">
              <div className="mb-3 text-[13px] font-bold tracking-tight">Its story so far</div>
              <Timeline steps={lifecycleSteps(open)} />
            </div>

            {open.status === 'Paused' && (
              <div className="mt-6 flex items-start gap-2.5 rounded-2xl bg-red-soft/60 p-4 text-[12.5px] text-red">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  While paused, its {open.employees} people can't sign in. Everything they had is safe and
                  comes back the moment you resume.
                </span>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* ── pause = consequences first, then a deliberate confirmation ── */}
      <Modal
        open={pausing != null}
        onClose={() => setPausingId(null)}
        title={pausing ? `Pause ${pausing.name}?` : ''}
        footer={
          pausing && (
            <div className="flex items-center justify-end gap-2">
              <Btn variant="ghost" size="sm" onClick={() => setPausingId(null)}>
                Keep it running
              </Btn>
              <Btn
                variant="danger"
                size="sm"
                disabled={confirmName.trim().toLowerCase() !== pausing.name.toLowerCase()}
                onClick={confirmPause}
              >
                Pause the company
              </Btn>
            </div>
          )
        }
      >
        {pausing && (
          <div>
            <p className="text-[13.5px] text-muted">Here's exactly what happens — no surprises:</p>
            <ul className="mt-4 space-y-3">
              {[
                { icon: <Users className="h-4 w-4" />, text: `All ${pausing.employees} people lose sign-in right away` },
                { icon: <Wrench className="h-4 w-4" />, text: 'Anything already running finishes first — nothing is lost' },
                { icon: <Mail className="h-4 w-4" />, text: 'Company admins get an email the moment you confirm' },
              ].map((row, i) => (
                <li key={i} className="flex items-center gap-3 rounded-2xl bg-card2 px-4 py-3 text-[13px] font-medium">
                  <span className="text-muted">{row.icon}</span>
                  {row.text}
                </li>
              ))}
            </ul>
            <div className="mt-5">
              <div className="mb-1.5 text-[12.5px] font-semibold text-ink-soft">
                Type <b>{pausing.name}</b> to confirm
              </div>
              <Input
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={pausing.name}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
