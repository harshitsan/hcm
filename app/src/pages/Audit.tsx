import { useMemo, useState } from 'react'
import { ShieldCheck, Search, Download, ScrollText } from 'lucide-react'
import { useApp } from '../app/store'
import { type AuditEntry } from '../data/mock'
import { useCompanyData } from '../data/companyData'
import {
  Avatar, Badge, Button, Card, CardBody, CardHeader, CardTitle, EmptyState,
  Input, PageHeader, Select, Table, Td, Th, Tr, useToast,
} from '../components/ui'

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'accent'

const actionTone: Record<string, Tone> = {
  Created: 'success',
  Updated: 'info',
  Approved: 'primary',
  Published: 'accent',
  'Context switch': 'neutral',
  Escalated: 'warning',
}

const ACTIONS = ['All', 'Created', 'Updated', 'Approved', 'Published', 'Context switch', 'Escalated']

function toneFor(action: string): Tone {
  return actionTone[action] ?? 'neutral'
}

function parseTime(t: string): number {
  // "2026-06-08 14:32" — normalize to ISO so newest sorts first reliably
  return new Date(t.replace(' ', 'T')).getTime()
}

export default function Audit() {
  const { auditLog } = useCompanyData()
  const { role, company } = useApp()
  const { push } = useToast()
  const [query, setQuery] = useState('')
  const [action, setAction] = useState('All')

  const isReadOnly = role === 'employee' || role === 'people_manager'

  const sorted = useMemo<AuditEntry[]>(
    () => [...auditLog].sort((a, b) => parseTime(b.time) - parseTime(a.time)),
    [auditLog],
  )

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return sorted.filter((e) => {
      if (action !== 'All' && e.action !== action) return false
      if (!q) return true
      return (
        e.actor.toLowerCase().includes(q) ||
        e.entity.toLowerCase().includes(q) ||
        e.detail.toLowerCase().includes(q) ||
        e.action.toLowerCase().includes(q)
      )
    })
  }, [sorted, query, action])

  const exportLog = () => {
    push({ title: `Exported ${rows.length} entries to CSV`, tone: 'success' })
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        icon={<ScrollText className="h-5 w-5" />}
        title="Audit Log"
        subtitle={`Activity across ${company.name}`}
        actions={
          <Button variant="ghost" size="sm" onClick={exportLog}>
            <Download className="h-4 w-4" /> Export
          </Button>
        }
      />

      <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-border bg-surface2/60 px-4 py-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
        <p className="text-sm text-muted-fg">
          <span className="font-semibold text-fg">Tamper-resistant.</span>{' '}
          Every create, update, delete and status change is recorded.
        </p>
      </div>

      <Card>
        <CardHeader className="flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <CardTitle>Recorded events</CardTitle>
            <Badge tone="neutral">{rows.length}</Badge>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-fg" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search actor, entity, detail…"
                className="w-full pl-8 sm:w-64"
                aria-label="Search audit log"
              />
            </div>
            <Select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              aria-label="Filter by action"
              className="sm:w-44"
            >
              {ACTIONS.map((a) => (
                <option key={a} value={a}>
                  {a === 'All' ? 'All actions' : a}
                </option>
              ))}
            </Select>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {rows.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={<Search className="h-5 w-5" />}
                title="No matching events"
                description="Try a different search term or clear the action filter."
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setQuery('')
                      setAction('All')
                    }}
                  >
                    Clear filters
                  </Button>
                }
              />
            </div>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Time</Th>
                  <Th>Actor</Th>
                  <Th>Action</Th>
                  <Th>Entity</Th>
                  <Th>Detail</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <Tr key={e.id}>
                    <Td className="whitespace-nowrap tnum text-xs text-muted-fg">{e.time}</Td>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={e.actor} size="xs" />
                        <span className="whitespace-nowrap font-semibold">{e.actor}</span>
                      </div>
                    </Td>
                    <Td>
                      <Badge tone={toneFor(e.action)} dot>
                        {e.action}
                      </Badge>
                    </Td>
                    <Td className="whitespace-nowrap text-fg">{e.entity}</Td>
                    <Td className="text-muted-fg">{e.detail}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      <p className="mt-3 text-xs text-muted-fg">
        Showing {rows.length} of {sorted.length} entries · newest first
        {isReadOnly && ' · read-only view'}
      </p>
    </div>
  )
}
