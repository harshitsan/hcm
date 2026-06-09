import { useMemo, useState } from 'react'
import { Briefcase, Users, Building2, Plus, Search } from 'lucide-react'
import { useApp } from '../app/store'
import { rbacRoleFor, useRbac } from '../app/rbac'
import { useCompanyData } from '../data/companyData'
import {
  Badge, Button, Card, CardBody, CardHeader, CardTitle, EmptyState, Field, Input,
  Modal, PageHeader, ProgressBar, Segmented, Select, StatCard, Table, Td, Th, Tr, useToast,
} from '../components/ui'

type Requisition = ReturnType<typeof useCompanyData>['requisitions'][number]
type StatusFilter = 'all' | 'Open' | 'On hold'

const APPLICANT_TARGET = 50

const statusTone = (s: string): 'success' | 'warning' | 'neutral' =>
  s === 'Open' ? 'success' : s === 'On hold' ? 'warning' : 'neutral'

const fillTone = (pct: number): 'success' | 'primary' | 'warning' =>
  pct >= 80 ? 'success' : pct >= 40 ? 'primary' : 'warning'

export default function Requisitions() {
  const { requisitions: reqSeed, departments } = useCompanyData()
  const { role, company } = useApp()
  const { effModule } = useRbac()
  const { push } = useToast()
  // Opening a requisition is a write affordance — only roles with edit access to
  // the requisitions module (Company HR Admin, Portfolio Manager, Platform admin)
  // may create. People Manager / Employee get a read-only view.
  const canCreate = effModule(rbacRoleFor(role ?? 'employee'), 'requisitions') === 'edit'

  const [reqs, setReqs] = useState<Requisition[]>(reqSeed)
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  // new requisition form state
  const [title, setTitle] = useState('')
  const [dept, setDept] = useState(departments[1]?.name ?? '')
  const [openings, setOpenings] = useState('1')

  const visible = useMemo(
    () =>
      reqs.filter((r) => {
        const matchStatus = filter === 'all' || r.status === filter
        const matchQuery =
          query.trim() === '' ||
          r.title.toLowerCase().includes(query.toLowerCase()) ||
          r.dept.toLowerCase().includes(query.toLowerCase())
        return matchStatus && matchQuery
      }),
    [reqs, filter, query],
  )

  const stats = useMemo(() => {
    const openRoles = reqs
      .filter((r) => r.status === 'Open')
      .reduce((sum, r) => sum + r.openings, 0)
    const applicants = reqs.reduce((sum, r) => sum + r.applicants, 0)
    const depts = new Set(reqs.map((r) => r.dept)).size
    return { openRoles, applicants, depts }
  }, [reqs])

  const resetForm = () => {
    setTitle('')
    setDept(departments[1]?.name ?? '')
    setOpenings('1')
  }

  const createReq = () => {
    if (!title.trim()) {
      push({ title: 'Add a role title first', tone: 'warning' })
      return
    }
    const next: Requisition = {
      id: `rq${Date.now()}`,
      title: title.trim(),
      dept,
      openings: Math.max(1, Number(openings) || 1),
      applicants: 0,
      status: 'Open',
    }
    setReqs((p) => [next, ...p])
    setOpen(false)
    resetForm()
    push({ title: `Requisition opened · ${next.title}`, tone: 'success' })
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Requisitions"
        subtitle={`Open roles and hiring pipeline at ${company.name}`}
        icon={<Briefcase className="h-5 w-5" />}
        actions={
          canCreate && (
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> New requisition
            </Button>
          )
        }
      />

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Open roles"
          value={stats.openRoles}
          delta="positions"
          deltaTone="primary"
          icon={<Briefcase className="h-4 w-4" />}
        />
        <StatCard
          label="Total applicants"
          value={stats.applicants}
          delta="across pipeline"
          deltaTone="info"
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          label="Departments hiring"
          value={stats.depts}
          delta="active reqs"
          deltaTone="accent"
          icon={<Building2 className="h-4 w-4" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All requisitions</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-fg" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search roles…"
                className="h-8 w-44 pl-8 text-[13px]"
              />
            </div>
            <Segmented<StatusFilter>
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all', label: 'All' },
                { value: 'Open', label: 'Open' },
                { value: 'On hold', label: 'On hold' },
              ]}
            />
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {visible.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={<Briefcase className="h-5 w-5" />}
                title="No requisitions match"
                description="Try a different filter or search term."
              />
            </div>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Role</Th>
                  <Th>Department</Th>
                  <Th className="text-right">Openings</Th>
                  <Th className="w-48">Applicants</Th>
                  <Th className="text-right">Status</Th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => {
                  const pct = Math.min(100, (r.applicants / APPLICANT_TARGET) * 100)
                  return (
                    <Tr
                      key={r.id}
                      className="cursor-pointer"
                      onClick={() => push({ title: `Opening ${r.title}`, tone: 'info' })}
                    >
                      <Td className="font-semibold text-fg">{r.title}</Td>
                      <Td className="text-muted-fg">{r.dept}</Td>
                      <Td className="text-right tnum font-semibold">{r.openings}</Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <ProgressBar value={pct} tone={fillTone(pct)} className="flex-1" />
                          <span className="tnum w-14 shrink-0 text-right text-xs text-muted-fg">
                            {r.applicants}/{APPLICANT_TARGET}
                          </span>
                        </div>
                      </Td>
                      <Td className="text-right">
                        <Badge tone={statusTone(r.status)} dot>
                          {r.status}
                        </Badge>
                      </Td>
                    </Tr>
                  )
                })}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New requisition"
        description="Open a role and start collecting applicants."
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createReq}>
              <Plus className="h-4 w-4" /> Open role
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Role title" required>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Backend Engineer"
              autoFocus
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Department">
              <Select value={dept} onChange={(e) => setDept(e.target.value)}>
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Openings" hint="How many to hire">
              <Input
                type="number"
                min={1}
                value={openings}
                onChange={(e) => setOpenings(e.target.value)}
              />
            </Field>
          </div>
        </div>
      </Modal>
    </div>
  )
}
