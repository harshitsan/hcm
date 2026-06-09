import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users2, Plus, Star, ArrowRight, Briefcase, Search } from 'lucide-react'
import { useApp } from '../app/store'
import { type Candidate } from '../data/mock'
import { useCompanyData } from '../data/companyData'
import {
  Avatar, Badge, Button, Input, PageHeader, StatCard, useToast,
} from '../components/ui'
import { cn } from '../lib/cn'

type Stage = Candidate['stage']
const STAGES: Stage[] = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired']

const stageTone: Record<Stage, 'neutral' | 'info' | 'primary' | 'warning' | 'success'> = {
  Applied: 'neutral',
  Screening: 'info',
  Interview: 'primary',
  Offer: 'warning',
  Hired: 'success',
}
const stageAccent: Record<Stage, string> = {
  Applied: 'bg-muted-fg/40',
  Screening: 'bg-info',
  Interview: 'bg-primary',
  Offer: 'bg-warning',
  Hired: 'bg-success',
}

function nextStage(s: Stage): Stage | null {
  const i = STAGES.indexOf(s)
  return i >= 0 && i < STAGES.length - 1 ? STAGES[i + 1] : null
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn('h-3.5 w-3.5', n <= rating ? 'fill-warning text-warning' : 'text-border')}
        />
      ))}
    </span>
  )
}

export default function Candidates() {
  const { candidates: candidateSeed, requisitions } = useCompanyData()
  const { role, company } = useApp()
  const { push } = useToast()
  const navigate = useNavigate()
  const readOnly = role === 'employee'

  const [board, setBoard] = useState<Candidate[]>(candidateSeed)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return board
    return board.filter(
      (c) => c.name.toLowerCase().includes(q) || c.role.toLowerCase().includes(q),
    )
  }, [board, query])

  const byStage = useMemo(() => {
    const map: Record<Stage, Candidate[]> = {
      Applied: [], Screening: [], Interview: [], Offer: [], Hired: [],
    }
    for (const c of filtered) map[c.stage].push(c)
    return map
  }, [filtered])

  const openRoles = requisitions.filter((r) => r.status === 'Open').length
  const inPipeline = board.filter((c) => c.stage !== 'Hired').length

  const advance = (c: Candidate) => {
    const target = nextStage(c.stage)
    if (!target) return
    setBoard((prev) => prev.map((x) => (x.id === c.id ? { ...x, stage: target } : x)))
    push({ title: `${c.name.split(' ')[0]} → ${target}`, tone: 'success' })
  }

  const addCandidate = (stage: Stage) => {
    push({ title: `Add a candidate to ${stage}`, tone: 'info' })
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Candidates"
        subtitle={`Hiring pipeline for ${company.name}${readOnly ? ' · read-only' : ''}.`}
        icon={<Users2 className="h-5 w-5" />}
        actions={
          !readOnly && (
            <>
              <Button variant="outline" size="sm" onClick={() => navigate('/hiring/requisitions')}>
                <Briefcase className="h-4 w-4" /> Requisitions
              </Button>
              <Button size="sm" onClick={() => addCandidate('Applied')}>
                <Plus className="h-4 w-4" /> Add candidate
              </Button>
            </>
          )
        }
      />

      {/* Stat row */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Active candidates" value={board.length} delta="in board" deltaTone="primary" icon={<Users2 className="h-4 w-4" />} />
        <StatCard label="In pipeline" value={inPipeline} delta="not yet hired" deltaTone="info" icon={<ArrowRight className="h-4 w-4" />} />
        <StatCard label="Open requisitions" value={openRoles} delta="hiring now" deltaTone="warning" icon={<Briefcase className="h-4 w-4" />} />
        <StatCard label="Hired" value={byStage.Hired.length} delta="this quarter" deltaTone="success" icon={<Star className="h-4 w-4" />} />
      </div>

      {/* Search */}
      <div className="mb-6 flex items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-fg" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or role…"
            className="pl-9"
          />
        </div>
        <span className="hidden text-xs text-muted-fg sm:inline">
          {filtered.length} of {board.length} candidates
        </span>
      </div>

      {/* Kanban board */}
      <div className="flex gap-6 overflow-x-auto pb-2">
        {STAGES.map((stage) => {
          const col = byStage[stage]
          return (
            <section
              key={stage}
              className="flex min-w-[260px] flex-1 flex-col rounded-xl border border-border bg-surface2"
            >
              <header className="flex items-center justify-between gap-2 px-3 py-3">
                <div className="flex items-center gap-2">
                  <span className={cn('h-2 w-2 rounded-full', stageAccent[stage])} />
                  <span className="text-sm font-bold tracking-tight">{stage}</span>
                  <Badge tone={stageTone[stage]}>{col.length}</Badge>
                </div>
                {!readOnly && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Add to ${stage}`}
                    onClick={() => addCandidate(stage)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </header>

              <div className="flex flex-1 flex-col gap-2.5 px-3 pb-3">
                {col.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border px-3 py-8 text-center text-xs text-muted-fg">
                    No candidates
                  </div>
                ) : (
                  col.map((c) => {
                    const target = nextStage(c.stage)
                    return (
                      <article
                        key={c.id}
                        className="group rounded-lg border border-border bg-surface p-3 shadow-sm transition-colors hover:border-primary/40"
                      >
                        <div className="flex items-start gap-2.5">
                          <Avatar name={c.name} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-fg">{c.name}</p>
                            <p className="truncate text-xs text-muted-fg">{c.role}</p>
                          </div>
                        </div>
                        <div className="mt-2.5 flex items-center justify-between">
                          {c.rating > 0 ? (
                            <Stars rating={c.rating} />
                          ) : (
                            <span className="text-2xs font-semibold uppercase tracking-wide text-muted-fg">
                              Unrated
                            </span>
                          )}
                          {!readOnly && target && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                              onClick={() => advance(c)}
                            >
                              {target} <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </article>
                    )
                  })
                )}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
