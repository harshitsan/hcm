/**
 * Documents — Journey 5 acknowledgments: a checklist, not compliance.
 * Read-and-confirm flow with a receipt, plus the letters in your file.
 */
import { useState } from 'react'
import { Clock, FileText } from 'lucide-react'
import { Donut } from '../charts'
import { Btn, Card, Drawer, Pill, SectionTitle } from '../ui'
import { MY_LETTERS, type AckDoc } from '../data'
import { useApp } from '../store'

const COUNT_WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five'] as const

/** summaries expanded into short, plain-language reads for the drawer */
const DOC_BODY: Record<string, string[]> = {
  d1: [
    'The short version: be honest with customers, generous with teammates, and careful with anything confidential. If something feels off, say so early — your manager or anyone in the People team will listen, no questions asked.',
    'Gifts and hospitality are fine up to ₹5,000 — above that, just log them. A conflict of interest is never a problem when it\'s declared; it\'s only a problem when it\'s hidden.',
    'None of this is fine print. Read it once a year and you\'ll rarely have to think about it — and when you do, you\'ll know exactly who to ask.',
  ],
  d2: [
    'You can work from anywhere in India for up to 4 weeks a quarter — just let your manager know a week ahead so the team can plan around it. Longer stretches need a quick okay from the People team.',
    'Keep your core hours (11am–4pm IST) overlapping with your team, and use a secure network — the IT checklist in this guide takes about five minutes to set up.',
    'Coming back to the office? Book a desk in the app the day before. Hot desks are first-come, but bookings always win.',
  ],
  d3: [
    'Customer and employee data stays inside company systems — no exporting to personal drives, email, or chat apps. If you need data somewhere new, ask IT first; the answer is usually a quick yes.',
    'Lock your screen, use the password manager, and report anything suspicious within an hour of spotting it. Speed matters far more than blame — nobody gets in trouble for reporting early.',
  ],
}

export default function Documents() {
  const { acks, confirmAck, toast } = useApp()
  const [openDoc, setOpenDoc] = useState<AckDoc | null>(null)

  const todo = acks.filter((d) => d.state === 'todo')
  const done = acks.length - todo.length
  const minutesLeft = todo.reduce((n, d) => n + d.minutes, 0)
  const title =
    todo.length === 0
      ? 'All read — nothing for you here'
      : `${COUNT_WORDS[todo.length] ?? todo.length} short read${todo.length === 1 ? '' : 's'}, then you're done`

  const confirm = (id: string) => {
    confirmAck(id)
    toast('Done — receipt saved.')
    setOpenDoc(null)
  }

  return (
    <div className="mx-auto max-w-6xl animate-fade-in">
      {/* hero */}
      <Card glow className="mb-5 p-7">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="mb-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">Documents</div>
            <h1 className="font-display text-[32px] font-medium leading-tight tracking-tight">{title}</h1>
            <p className="mt-1.5 max-w-md text-[13.5px] text-muted">
              Read each one, tap confirm, and a receipt goes straight to your file.
            </p>
          </div>
          <div className="flex items-center gap-4 pb-1">
            <Donut
              value={done}
              max={acks.length}
              size={84}
              stroke={10}
              tone={todo.length === 0 ? 'green' : 'amber'}
              center={<span className="text-[15px] font-bold">{done}/{acks.length}</span>}
            />
            <div>
              <div className="text-[15px] font-bold tracking-tight">
                {done} of {acks.length} done
              </div>
              <div className="text-[12.5px] text-muted">
                {todo.length > 0 ? `≈ ${minutesLeft} min left` : "You're all caught up"}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* for you — the checklist */}
        <div className="lg:col-span-2">
          <SectionTitle hint="Short reads that need your confirmation">For you</SectionTitle>
          <div className="space-y-4">
            {acks.map((d) => (
              <Card key={d.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[15px] font-bold tracking-tight">{d.title}</span>
                      {d.required ? (
                        <Pill tone="amber">Required · {d.due}</Pill>
                      ) : (
                        <Pill tone="neutral">Optional</Pill>
                      )}
                      <span className="inline-flex items-center gap-1 text-[12px] font-medium text-muted">
                        <Clock className="h-3 w-3" />
                        {d.minutes} min read
                      </span>
                    </div>
                    <p className="mt-1.5 max-w-xl text-[13px] text-muted">{d.summary}</p>
                  </div>
                  <div className="shrink-0 pt-0.5">
                    {d.state === 'todo' ? (
                      <Btn size="sm" onClick={() => setOpenDoc(d)}>
                        Read &amp; confirm
                      </Btn>
                    ) : (
                      <div className="flex flex-col items-end gap-1.5">
                        <Pill tone="green" dot>
                          Done
                        </Pill>
                        <span className="text-[11.5px] text-muted">Confirmed · receipt saved to your file</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* your letters */}
        <div>
          <SectionTitle hint="Official letters in your file">Your letters</SectionTitle>
          <Card className="p-5">
            <ul className="space-y-1">
              {MY_LETTERS.map((l) => (
                <li key={l.id} className="-mx-2 flex items-center gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-card2/60">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card2 text-muted">
                    <FileText className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-semibold">{l.title}</div>
                    <div className="text-[11.5px] text-muted">
                      {l.kind} · {l.date}
                    </div>
                  </div>
                  <Btn
                    variant="ghost"
                    size="sm"
                    onClick={() => toast('Downloaded — well, it would be, in the real thing')}
                  >
                    Download
                  </Btn>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {/* read & confirm drawer */}
      {openDoc && (
        <Drawer
          open
          onClose={() => setOpenDoc(null)}
          title={openDoc.title}
          footer={
            <Btn variant="dark" size="lg" className="w-full" onClick={() => confirm(openDoc.id)}>
              I've read this — confirm
            </Btn>
          }
        >
          <div className="space-y-4">
            <p className="text-[13.5px] font-semibold leading-relaxed text-ink-soft">{openDoc.summary}</p>
            {openDoc.id === 'd1' && (
              <div className="rounded-2xl bg-accent-soft p-4">
                <div className="text-[12.5px] font-bold text-accent-ink">What changed</div>
                <p className="mt-1 text-[12.5px] leading-relaxed text-accent-ink">
                  New guidance on AI tools at work — what's fine to paste into them, and what stays inside the
                  company.
                </p>
              </div>
            )}
            {(DOC_BODY[openDoc.id] ?? []).map((para, i) => (
              <p key={i} className="text-[13px] leading-relaxed text-ink-soft">
                {para}
              </p>
            ))}
            <p className="text-[11.5px] text-muted">
              Confirming takes a second — we save a receipt with today's date to your file.
            </p>
          </div>
        </Drawer>
      )}
    </div>
  )
}
