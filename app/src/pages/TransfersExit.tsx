import { useState } from 'react'
import {
  ArrowLeftRight, LogOut, Plus, Building2, Laptop, Wallet, FileText, Users,
  CheckCircle2, Circle, AlertTriangle, CalendarClock, Info,
} from 'lucide-react'
import { useApp } from '../app/store'
import { useCompanyData } from '../data/companyData'
import {
  Badge, Button, Card, CardBody, CardHeader, CardTitle, Field, Input, Modal,
  PageHeader, Select, Table, Tabs, Td, Th, Tr, Avatar, useToast,
} from '../components/ui'
import { cn } from '../lib/cn'

type TransferStatus = 'Pending' | 'Approved' | 'Effective'
type TransferRecord = {
  id: string
  employee: string
  from: string
  to: string
  effective: string
  status: TransferStatus
}

type ClearanceFn = 'IT' | 'Finance' | 'HR' | 'Manager'
type ClearanceItem = {
  id: string
  fn: ClearanceFn
  owner: string
  task: string
  cleared: boolean
}

const seedTransfers: TransferRecord[] = [
  { id: 't1', employee: 'Sanjay Gupta', from: 'Platform', to: 'Data', effective: 'Jul 1', status: 'Approved' },
  { id: 't2', employee: 'Divya Menon', from: 'Platform', to: 'Engineering', effective: 'Jun 18', status: 'Effective' },
  { id: 't3', employee: 'Joseph Thomas', from: 'Operations', to: 'Sales', effective: 'Aug 1', status: 'Pending' },
  { id: 't4', employee: 'Imran Khan', from: 'Data', to: 'Platform', effective: 'Jul 15', status: 'Pending' },
]

const seedClearance: ClearanceItem[] = [
  { id: 'cl1', fn: 'IT', owner: 'IT Helpdesk', task: 'Recover laptop, badge & revoke access', cleared: true },
  { id: 'cl2', fn: 'Finance', owner: 'Arjun Desai', task: 'Settle dues, advances & final pay', cleared: false },
  { id: 'cl3', fn: 'HR', owner: 'Priya Sharma', task: 'Issue relieving & experience letters', cleared: false },
  { id: 'cl4', fn: 'Manager', owner: 'Sneha Kapoor', task: 'Confirm knowledge handover complete', cleared: true },
]

const fnIcon: Record<ClearanceFn, typeof Laptop> = {
  IT: Laptop, Finance: Wallet, HR: FileText, Manager: Users,
}

const statusTone: Record<TransferStatus, 'warning' | 'info' | 'success'> = {
  Pending: 'warning', Approved: 'info', Effective: 'success',
}

export default function TransfersExit() {
  const { departments, employees } = useCompanyData()
  const { role, company } = useApp()
  const deptNames = departments.map((d) => d.name)
  const { push } = useToast()
  const isEmployee = role === 'employee'

  const [tab, setTab] = useState('transfers')
  const [transfers, setTransfers] = useState(seedTransfers)
  const [clearance, setClearance] = useState(seedClearance)
  const [open, setOpen] = useState(false)

  const [emp, setEmp] = useState('')
  const [target, setTarget] = useState('')
  const [effective, setEffective] = useState('')

  const clearedCount = clearance.filter((c) => c.cleared).length
  const allClear = clearedCount === clearance.length

  const toggleClear = (id: string) => {
    const item = clearance.find((c) => c.id === id)
    setClearance((p) => p.map((c) => (c.id === id ? { ...c, cleared: !c.cleared } : c)))
    if (item) {
      push({
        title: `${item.fn} clearance ${item.cleared ? 'reopened' : 'marked complete'}`,
        tone: item.cleared ? 'neutral' : 'success',
      })
    }
  }

  const submitTransfer = () => {
    if (!emp || !target || !effective) {
      push({ title: 'Pick an employee, target department & date', tone: 'warning' })
      return
    }
    const e = employees.find((x) => x.id === emp)
    const from = departments.find((d) => d.id === e?.departmentId)?.name ?? '—'
    const date = new Date(effective).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    setTransfers((p) => [
      { id: `t${Date.now()}`, employee: e?.name ?? 'Employee', from, to: target, effective: date, status: 'Pending' },
      ...p,
    ])
    setOpen(false)
    setEmp('')
    setTarget('')
    setEffective('')
    push({ title: 'Transfer initiated · routed for approval', tone: 'success' })
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Transfers & Exit"
        subtitle={`Lifecycle moves and clearances at ${company.name}.`}
        icon={<ArrowLeftRight className="h-5 w-5" />}
        actions={
          !isEmployee && tab === 'transfers' ? (
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Initiate transfer
            </Button>
          ) : undefined
        }
      />

      <Tabs
        className="mb-6"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'transfers', label: <span className="inline-flex items-center gap-1.5"><ArrowLeftRight className="h-3.5 w-3.5" /> Transfers</span> },
          { value: 'exit', label: <span className="inline-flex items-center gap-1.5"><LogOut className="h-3.5 w-3.5" /> Exit</span> },
        ]}
      />

      {tab === 'transfers' ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="overflow-hidden lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Transfer records</CardTitle>
                <Badge tone="primary">{transfers.length}</Badge>
              </div>
              <span className="text-2xs font-semibold uppercase tracking-wide text-muted-fg">
                Inter-department moves
              </span>
            </CardHeader>
            <CardBody className="p-0">
              <Table>
                <thead>
                  <tr>
                    <Th>Employee</Th>
                    <Th>From → To</Th>
                    <Th>Effective</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.map((t) => (
                    <Tr key={t.id}>
                      <Td>
                        <div className="flex items-center gap-2.5">
                          <Avatar name={t.employee} size="sm" />
                          <span className="font-semibold">{t.employee}</span>
                        </div>
                      </Td>
                      <Td>
                        <span className="inline-flex items-center gap-1.5 text-muted-fg">
                          {t.from}
                          <ArrowLeftRight className="h-3.5 w-3.5 text-border" />
                          <span className="font-semibold text-fg">{t.to}</span>
                        </span>
                      </Td>
                      <Td>
                        <Badge tone="info">
                          <CalendarClock className="h-3 w-3" /> {t.effective}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge tone={statusTone[t.status]} dot>{t.status}</Badge>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </CardBody>
          </Card>

          <Card className="self-start border-info/30 bg-info/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-4 w-4 text-info" /> Downstream impact
              </CardTitle>
            </CardHeader>
            <CardBody className="space-y-3 text-sm text-muted-fg">
              <p>A transfer doesn't just move a row — it cascades:</p>
              <ul className="space-y-2.5">
                <li className="flex items-start gap-2">
                  <Laptop className="mt-0.5 h-4 w-4 shrink-0 text-fg" />
                  <span><span className="font-semibold text-fg">Assets</span> stay assigned; IT reviews access for the new team.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-fg" />
                  <span><span className="font-semibold text-fg">Leave balance</span> carries over; accruals follow the new policy group.</span>
                </li>
                <li className="flex items-start gap-2">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-fg" />
                  <span><span className="font-semibold text-fg">Policies</span> re-evaluate — new acknowledgements may be due.</span>
                </li>
              </ul>
            </CardBody>
          </Card>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="self-start lg:col-span-1">
            <CardHeader>
              <CardTitle>Exit case</CardTitle>
              <Badge tone="warning" dot>In progress</Badge>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar name="Fatima Sheikh" size="lg" />
                <div>
                  <p className="font-bold">Fatima Sheikh</p>
                  <p className="text-xs text-muted-fg">Account Executive · Sales</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-surface2/50 px-3 py-2.5">
                  <p className="text-2xs font-semibold uppercase tracking-wide text-muted-fg">Last working day</p>
                  <p className="mt-0.5 font-bold tnum">Jun 30, 2026</p>
                </div>
                <div className="rounded-lg border border-border bg-surface2/50 px-3 py-2.5">
                  <p className="text-2xs font-semibold uppercase tracking-wide text-muted-fg">Notice period</p>
                  <p className="mt-0.5 font-bold tnum">30 days</p>
                </div>
              </div>
              <div className="rounded-lg border border-warning/30 bg-warning/5 px-3 py-2.5 text-xs text-muted-fg">
                <AlertTriangle className="mb-1 inline h-3.5 w-3.5 text-warning" /> Final settlement releases only after all clearances pass.
              </div>
            </CardBody>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Clearance checklist</CardTitle>
              <Badge tone={allClear ? 'success' : 'warning'}>
                {clearedCount}/{clearance.length} cleared
              </Badge>
            </CardHeader>
            <CardBody className="space-y-3">
              {clearance.map((c) => {
                const Icon = fnIcon[c.fn]
                return (
                  <div
                    key={c.id}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors',
                      c.cleared ? 'border-success/30 bg-success/5' : 'border-border',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                        c.cleared ? 'bg-success/12 text-success' : 'bg-muted text-muted-fg',
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{c.fn}</p>
                        <Badge tone={c.cleared ? 'success' : 'neutral'} dot>
                          {c.cleared ? 'Cleared' : 'Pending'}
                        </Badge>
                      </div>
                      <p className="truncate text-xs text-muted-fg">{c.task} · {c.owner}</p>
                    </div>
                    {isEmployee ? (
                      c.cleared
                        ? <CheckCircle2 className="h-5 w-5 text-success" />
                        : <Circle className="h-5 w-5 text-muted-fg/50" />
                    ) : (
                      <Button
                        size="sm"
                        variant={c.cleared ? 'ghost' : 'subtle'}
                        onClick={() => toggleClear(c.id)}
                      >
                        {c.cleared ? 'Reopen' : 'Mark cleared'}
                      </Button>
                    )}
                  </div>
                )
              })}
              {allClear && !isEmployee && (
                <Button
                  className="w-full"
                  variant="primary"
                  onClick={() => push({ title: 'Final settlement released', tone: 'success' })}
                >
                  <CheckCircle2 className="h-4 w-4" /> Release final settlement
                </Button>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Initiate transfer"
        description="Move an employee to a new department. It routes for approval."
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submitTransfer}>
              <ArrowLeftRight className="h-4 w-4" /> Initiate
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Employee" required>
            <Select value={emp} onChange={(e) => setEmp(e.target.value)}>
              <option value="">Select an employee…</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.name} · {e.title}</option>
              ))}
            </Select>
          </Field>
          <Field label="Target department" required hint="Where the employee will move to.">
            <Select value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="">Select a department…</option>
              {deptNames.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </Select>
          </Field>
          <Field label="Effective date" required>
            <Input type="date" value={effective} onChange={(e) => setEffective(e.target.value)} />
          </Field>
          <div className="flex items-start gap-2 rounded-lg border border-info/30 bg-info/5 px-3 py-2.5 text-xs text-muted-fg">
            <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-info" />
            Assets, leave balance and policy acknowledgements will be re-evaluated on the effective date.
          </div>
        </div>
      </Modal>
    </div>
  )
}
