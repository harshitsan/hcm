import { useMemo, useState } from 'react'
import {
  FileText, FileSpreadsheet, FileBox, Upload, Search, Download, ShieldCheck,
  UploadCloud, CalendarClock, FolderOpen, Lock,
} from 'lucide-react'
import { useApp } from '../app/store'
import { useCompanyData, type CompanyData } from '../data/companyData'
import {
  Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader, Segmented,
  Select, Table, Td, Th, Tr, useToast,
} from '../components/ui'
import { cn } from '../lib/cn'

type Doc = CompanyData['documents'][number] & { category: string }
type View = 'table' | 'grid'

const CATEGORIES = ['HR', 'Finance', 'Security', 'Compliance', 'Legal']

// derive a stable category for each seed doc (mock has no category field)
const CAT_BY_OWNER: Record<string, string> = {
  HR: 'HR', Finance: 'Finance', Security: 'Security',
}
const docCategory = (owner: string): string => CAT_BY_OWNER[owner] ?? 'Legal'

const TODAY = new Date('2026-06-08')
const DAY = 86_400_000

function expiryInfo(expiry: string): { date: Date | null; days: number | null; expiring: boolean } {
  if (!expiry || expiry === '—') return { date: null, days: null, expiring: false }
  const date = new Date(expiry)
  if (Number.isNaN(date.getTime())) return { date: null, days: null, expiring: false }
  const days = Math.round((date.getTime() - TODAY.getTime()) / DAY)
  return { date, days, expiring: days >= 0 && days <= 90 }
}

function fileIcon(type: string) {
  if (type === 'DOCX' || type === 'XLSX') return <FileSpreadsheet className="h-4 w-4 text-info" />
  if (type === 'PDF') return <FileText className="h-4 w-4 text-danger" />
  return <FileBox className="h-4 w-4 text-muted-fg" />
}

export default function Documents() {
  const { documents } = useCompanyData()
  const { role, company } = useApp()
  const { push } = useToast()
  const isEmployee = role === 'employee'

  const seed: Doc[] = useMemo(
    () => documents.map((d) => ({ ...d, category: docCategory(d.owner) })),
    [documents],
  )
  const [docs, setDocs] = useState<Doc[]>(seed)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [view, setView] = useState<View>('table')

  // upload modal state
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [uploadCat, setUploadCat] = useState(CATEGORIES[0])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return docs.filter(
      (d) =>
        (category === 'All' || d.category === category) &&
        (q === '' || d.name.toLowerCase().includes(q) || d.owner.toLowerCase().includes(q)),
    )
  }, [docs, query, category])

  const expiringCount = useMemo(
    () => docs.filter((d) => expiryInfo(d.expiry).expiring).length,
    [docs],
  )

  const submitUpload = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      push({ title: 'Give the document a name', tone: 'warning' })
      return
    }
    const id = `doc-${Date.now()}`
    const fileName = /\.[a-z0-9]+$/i.test(trimmed) ? trimmed : `${trimmed}.pdf`
    setDocs((p) => [
      { id, name: fileName, type: 'PDF', owner: company.name, expiry: '—', size: '0.4 MB', category: uploadCat },
      ...p,
    ])
    push({ title: 'Document uploaded · encrypted at rest', tone: 'success' })
    setOpen(false)
    setName('')
    setUploadCat(CATEGORIES[0])
  }

  const ExpiryCell = ({ doc }: { doc: Doc }) => {
    const { date, days, expiring } = expiryInfo(doc.expiry)
    if (!date) return <span className="text-muted-fg">No expiry</span>
    const label = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    if (expiring) {
      return (
        <Badge tone="warning">
          <CalendarClock className="h-3 w-3" /> Expiring · {days}d
        </Badge>
      )
    }
    return <span className="tnum text-muted-fg">{label}</span>
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Documents"
        subtitle={`Policies, certificates & records for ${company.name}.`}
        icon={<FolderOpen className="h-5 w-5" />}
        actions={
          !isEmployee && (
            <Button onClick={() => setOpen(true)}>
              <Upload className="h-4 w-4" /> Upload
            </Button>
          )
        }
      />

      <Card className="p-4">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative sm:max-w-xs sm:flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-fg" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search documents or owner…"
                className="pl-9"
              />
            </div>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="sm:w-44"
              aria-label="Filter by category"
            >
              <option value="All">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>
          <div className="flex items-center gap-3">
            {expiringCount > 0 && (
              <Badge tone="warning" className="hidden sm:inline-flex">
                <CalendarClock className="h-3 w-3" /> {expiringCount} expiring
              </Badge>
            )}
            <Segmented<View>
              value={view}
              onChange={setView}
              options={[
                { value: 'table', label: 'Table' },
                { value: 'grid', label: 'Grid' },
              ]}
            />
          </div>
        </div>

        {/* Results */}
        <div className="mt-4">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Search className="h-5 w-5" />}
              title="No documents found"
              description="Try a different search term or clear the category filter."
              action={
                <Button variant="outline" size="sm" onClick={() => { setQuery(''); setCategory('All') }}>
                  Clear filters
                </Button>
              }
            />
          ) : view === 'table' ? (
            <div className="overflow-hidden rounded-lg border border-border">
              <Table>
                <thead>
                  <Tr className="border-t-0 hover:bg-transparent">
                    <Th>Name</Th>
                    <Th>Category</Th>
                    <Th>Owner</Th>
                    <Th>Expiry</Th>
                    <Th className="text-right">Size</Th>
                    <Th className="w-10" />
                  </Tr>
                </thead>
                <tbody>
                  {filtered.map((d) => (
                    <Tr key={d.id}>
                      <Td>
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                            {fileIcon(d.type)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-fg">{d.name}</p>
                            <p className="text-2xs uppercase tracking-wide text-muted-fg">{d.type}</p>
                          </div>
                        </div>
                      </Td>
                      <Td><Badge tone="neutral">{d.category}</Badge></Td>
                      <Td className="text-muted-fg">{d.owner}</Td>
                      <Td><ExpiryCell doc={d} /></Td>
                      <Td className="text-right tnum text-muted-fg">{d.size}</Td>
                      <Td className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Download ${d.name}`}
                          onClick={() => push({ title: `Downloading ${d.name}`, tone: 'info' })}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((d) => {
                const { expiring } = expiryInfo(d.expiry)
                return (
                  <div
                    key={d.id}
                    className={cn(
                      'group rounded-xl border border-border bg-surface2/40 p-4 transition-colors hover:bg-muted/50',
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface">
                        {fileIcon(d.type)}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Download ${d.name}`}
                        className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                        onClick={() => push({ title: `Downloading ${d.name}`, tone: 'info' })}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="mt-3 truncate text-sm font-semibold text-fg" title={d.name}>{d.name}</p>
                    <p className="mt-0.5 text-xs text-muted-fg">{d.owner}</p>
                    <div className="mt-3 flex items-center justify-between">
                      {expiring ? (
                        <ExpiryCell doc={d} />
                      ) : (
                        <Badge tone="neutral">{d.category}</Badge>
                      )}
                      <span className="tnum text-xs text-muted-fg">{d.size}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Card>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-fg">
        <ShieldCheck className="h-3.5 w-3.5 text-success" />
        Files are encrypted at rest (AES-256). Visibility follows role-based access — you only see documents your role permits.
      </p>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Upload document"
        description="Add a file to this company's secure document store."
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submitUpload}>
              <Upload className="h-4 w-4" /> Upload
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Document name" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Insurance Renewal 2026.pdf"
              autoFocus
            />
          </Field>
          <Field label="Category">
            <Select value={uploadCat} onChange={(e) => setUploadCat(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface2/50 px-6 py-8 text-center">
            <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <UploadCloud className="h-5 w-5" />
            </span>
            <p className="text-sm font-semibold text-fg">Drag &amp; drop a file here</p>
            <p className="mt-0.5 text-xs text-muted-fg">PDF, DOCX or XLSX up to 25 MB</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => push({ title: 'Demo only — pick a file in the prototype', tone: 'neutral' })}>
              Browse files
            </Button>
          </div>
          <p className="flex items-center gap-1.5 text-2xs text-muted-fg">
            <Lock className="h-3 w-3" /> Encrypted on upload and scoped to your company tenant.
          </p>
        </div>
      </Modal>
    </div>
  )
}
