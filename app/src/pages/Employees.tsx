import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Search, Plus, Download, UserX, MoreHorizontal, Eye, Pencil, X,
} from 'lucide-react'
import { useApp } from '../app/store'
import {
  type Employee,
} from '../data/mock'
import { useCompanyData } from '../data/companyData'
import {
  Avatar, Badge, Button, Card, CardHeader, CardTitle, Field, Input, Modal, PageHeader, Select, Table, Td, Th, Tr,
  useToast,
} from '../components/ui'
import { cn } from '../lib/cn'

type StatusTone = 'success' | 'info' | 'warning' | 'accent'
const statusTone: Record<Employee['status'], StatusTone> = {
  Active: 'success',
  'On Leave': 'info',
  Probation: 'warning',
  Onboarding: 'accent',
}

export default function Employees() {
  const { employees: employeeSeed, departments, getDepartment } = useCompanyData()
  const { role, company } = useApp()
  const { push } = useToast()
  const navigate = useNavigate()
  const readOnly = role === 'employee'

  const [query, setQuery] = useState('')
  const [dept, setDept] = useState('all')
  const [status, setStatus] = useState('all')
  const [type, setType] = useState('all')
  const [selected, setSelected] = useState<string[]>([])
  const [addOpen, setAddOpen] = useState(false)
  const [menuFor, setMenuFor] = useState<string | null>(null)

  const locations = useMemo(() => Array.from(new Set(employeeSeed.map((e) => e.location))), [employeeSeed])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return employeeSeed.filter((e) => {
      if (q && !e.name.toLowerCase().includes(q) && !e.email.toLowerCase().includes(q) && !e.title.toLowerCase().includes(q)) return false
      if (dept !== 'all' && e.departmentId !== dept) return false
      if (status !== 'all' && e.status !== status) return false
      if (type !== 'all' && e.type !== type) return false
      return true
    })
  }, [employeeSeed, query, dept, status, type])

  const allChecked = rows.length > 0 && rows.every((r) => selected.includes(r.id))
  const someChecked = selected.length > 0 && !allChecked

  const toggleAll = () => {
    setSelected(allChecked ? [] : rows.map((r) => r.id))
  }
  const toggleOne = (id: string) => {
    setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  }

  const bulk = (verb: string, tone: 'info' | 'warning') => {
    push({ title: `${verb} ${selected.length} ${selected.length === 1 ? 'employee' : 'employees'}`, tone })
    setSelected([])
  }

  const submitAdd = (e: React.FormEvent) => {
    e.preventDefault()
    setAddOpen(false)
    push({ title: 'Employee added to ' + company.name, tone: 'success' })
  }

  return (
    <div className="animate-fade-in" onClick={() => menuFor && setMenuFor(null)}>
      <PageHeader
        title="Employee records"
        subtitle={`${employeeSeed.length} people at ${company.name}`}
        icon={<Users className="h-5 w-5" />}
        actions={
          !readOnly && (
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" /> Add employee
            </Button>
          )
        }
      />

      <Card className="overflow-visible">
        <CardHeader>
          <CardTitle>Directory</CardTitle>
          <Badge tone="neutral">{rows.length} shown</Badge>
        </CardHeader>

        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1 lg:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-fg" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, title…"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={dept} onChange={(e) => setDept(e.target.value)} className="w-auto">
              <option value="all">All departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
            <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-auto">
              <option value="all">Any status</option>
              {(['Active', 'On Leave', 'Probation', 'Onboarding'] as Employee['status'][]).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
            <Select value={type} onChange={(e) => setType(e.target.value)} className="w-auto">
              <option value="all">Any type</option>
              <option value="Employee">Employee</option>
              <option value="Contractor">Contractor</option>
            </Select>
          </div>
        </div>

        {/* Bulk action bar */}
        {selected.length > 0 && (
          <div className="flex items-center justify-between gap-3 border-b border-border bg-primary/5 px-4 py-2.5 animate-fade-in">
            <span className="text-sm font-semibold text-primary">
              {selected.length} selected
            </span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => bulk('Exported', 'info')}>
                <Download className="h-3.5 w-3.5" /> Export
              </Button>
              {!readOnly && (
                <Button size="sm" variant="outline" onClick={() => bulk('Deactivated', 'warning')}>
                  <UserX className="h-3.5 w-3.5" /> Deactivate
                </Button>
              )}
              <Button size="icon" variant="ghost" aria-label="Clear selection" onClick={() => setSelected([])}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <Table>
          <thead>
            <tr>
              <Th className="w-10">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={allChecked}
                  ref={(el) => { if (el) el.indeterminate = someChecked }}
                  onChange={toggleAll}
                  className="h-4 w-4 cursor-pointer rounded border-border accent-primary"
                />
              </Th>
              <Th>Person</Th>
              <Th>Title</Th>
              <Th>Department</Th>
              <Th>Location</Th>
              <Th>Type</Th>
              <Th>Status</Th>
              <Th className="w-10 text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => {
              const checked = selected.includes(e.id)
              return (
                <Tr key={e.id} className={cn(checked && 'bg-primary/5')}>
                  <Td>
                    <input
                      type="checkbox"
                      aria-label={`Select ${e.name}`}
                      checked={checked}
                      onChange={() => toggleOne(e.id)}
                      className="h-4 w-4 cursor-pointer rounded border-border accent-primary"
                    />
                  </Td>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar name={e.name} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{e.name}</p>
                        <p className="truncate text-xs text-muted-fg">{e.email}</p>
                      </div>
                    </div>
                  </Td>
                  <Td className="text-muted-fg">{e.title}</Td>
                  <Td className="text-muted-fg">{getDepartment(e.departmentId)?.name ?? '—'}</Td>
                  <Td className="text-muted-fg">{e.location}</Td>
                  <Td>
                    <Badge tone={e.type === 'Contractor' ? 'neutral' : 'primary'}>{e.type}</Badge>
                  </Td>
                  <Td>
                    <Badge tone={statusTone[e.status]} dot>{e.status}</Badge>
                  </Td>
                  <Td className="text-right">
                    <div className="relative inline-block">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Actions for ${e.name}`}
                        onClick={(ev) => { ev.stopPropagation(); setMenuFor(menuFor === e.id ? null : e.id) }}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                      {menuFor === e.id && (
                        <div
                          className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-lg border border-border bg-surface py-1 text-left shadow-pop animate-scale-in"
                          onClick={(ev) => ev.stopPropagation()}
                        >
                          <button
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-fg hover:bg-muted"
                            onClick={() => { setMenuFor(null); navigate('/people') }}
                          >
                            <Eye className="h-3.5 w-3.5" /> View profile
                          </button>
                          {!readOnly && (
                            <button
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-fg hover:bg-muted"
                              onClick={() => { setMenuFor(null); push({ title: `Editing ${e.name}`, tone: 'info' }) }}
                            >
                              <Pencil className="h-3.5 w-3.5" /> Edit
                            </button>
                          )}
                          {!readOnly && (
                            <button
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger/10"
                              onClick={() => { setMenuFor(null); push({ title: `Deactivated ${e.name}`, tone: 'warning' }) }}
                            >
                              <UserX className="h-3.5 w-3.5" /> Deactivate
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </Td>
                </Tr>
              )
            })}
          </tbody>
        </Table>

        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-fg">
          <span>
            Showing <span className="tnum font-semibold text-fg">{rows.length}</span> of{' '}
            <span className="tnum font-semibold text-fg">{employeeSeed.length}</span> employees
          </span>
          {selected.length > 0 && <span className="tnum">{selected.length} selected</span>}
        </div>
      </Card>

      {/* Add employee modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add employee"
        description={`New record in ${company.name}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" form="add-emp">Create employee</Button>
          </>
        }
      >
        <form id="add-emp" onSubmit={submitAdd} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full name" required className="sm:col-span-2">
            <Input required placeholder="e.g. Aditya Rao" />
          </Field>
          <Field label="Work email" required>
            <Input type="email" required placeholder="name@acme.example" />
          </Field>
          <Field label="Job title" required>
            <Input required placeholder="e.g. Backend Engineer" />
          </Field>
          <Field label="Department" required>
            <Select required defaultValue="">
              <option value="" disabled>Select…</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Location" required>
            <Select required defaultValue="">
              <option value="" disabled>Select…</option>
              {locations.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </Select>
          </Field>
        </form>
      </Modal>
    </div>
  )
}
