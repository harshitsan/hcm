/**
 * Roles & Security — fully dynamic RBAC console.
 * Create roles AND change their access across three axes (Modules · Fields ·
 * Actions) on a clickable role × permission matrix. Edits are a governed draft:
 * Review & save with a reason → append-only history. 'Platform Super Admin' is a
 * locked superuser.
 */
import { useMemo, useState } from 'react'
import {
  ShieldCheck, KeyRound, Plus, Save, RotateCcw, Check, Minus, Eye, EyeOff, Lock,
  Layers, UserCog, History, ArrowRight, SlidersHorizontal,
} from 'lucide-react'
import { useApp } from '../app/store'
import {
  useRbac, ADMIN_ROLE, rbacRoleFor, MODULE_GROUPS, ALL_MODULES, MODULE_LABEL, FIELDS, FIELD_LABEL,
  ACTION_GROUPS, ALL_ACTIONS, ACTION_LABEL,
  type PermLevel, type FieldLevel, type RoleLevel, type PolicyOverrides, type PolicyChangeItem,
} from '../app/rbac'
import {
  Avatar, Badge, Button, Card, CardBody, CardHeader, CardTitle, EmptyState, Field,
  Input, Modal, PageHeader, Select, StatCard, Tabs, Textarea, useToast,
} from '../components/ui'
import { cn } from '../lib/cn'

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'accent'
const PERM_TONE: Record<PermLevel, Tone> = { edit: 'success', read: 'accent', hidden: 'neutral' }
const PERM_LABEL: Record<PermLevel, string> = { edit: 'Edit', read: 'View', hidden: 'None' }
const FIELD_TONE: Record<FieldLevel, Tone> = { visible: 'success', masked: 'warning', hidden: 'neutral' }
const FIELD_LABEL_TXT: Record<FieldLevel, string> = { visible: 'Visible', masked: 'Masked', hidden: 'Hidden' }
const FIELD_ICON = { visible: Eye, masked: Lock, hidden: EyeOff }
const nextPerm: Record<PermLevel, PermLevel> = { hidden: 'read', read: 'edit', edit: 'hidden' }
const nextField: Record<FieldLevel, FieldLevel> = { hidden: 'masked', masked: 'visible', visible: 'hidden' }
const toneBg: Record<Tone, string> = {
  neutral: 'bg-muted text-muted-fg', primary: 'bg-primary/12 text-primary', success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning', danger: 'bg-danger/15 text-danger', info: 'bg-info/15 text-info', accent: 'bg-accent/15 text-accent',
}
const maskSample = (lvl: FieldLevel, s: string) => (lvl === 'visible' ? s : lvl === 'masked' ? `••• ${s.slice(-4)}` : 'Hidden')
const split = (k: string) => { const i = k.lastIndexOf('|'); return [k.slice(0, i), k.slice(i + 1)] as [string, string] }
const LEVELS: RoleLevel[] = ['Platform', 'Portfolio', 'Group', 'Company', 'Manager', 'Employee']

export default function Roles() {
  const { role: myRole, persona } = useApp()
  const { push } = useToast()
  const rbac = useRbac()
  // Editing the RBAC matrix requires BOTH edit on the Roles module AND the
  // role.assign action — by default only the platform super admin qualifies.
  // HR Admin / Portfolio Manager are read-only (their roles grant is 'read'),
  // which closes the privilege-escalation hole.
  const rbacSelf = rbacRoleFor(myRole ?? 'employee')
  const readOnly = !(rbac.effModule(rbacSelf, 'roles') === 'edit' && rbac.effAction(rbacSelf, 'role.assign'))
  const actor = persona?.name ?? 'You'

  const [tab, setTab] = useState('modules')
  const [focusRole, setFocusRole] = useState(rbac.roles[1]?.name ?? ADMIN_ROLE)
  const [draftMod, setDraftMod] = useState<Record<string, PermLevel>>({})
  const [draftField, setDraftField] = useState<Record<string, FieldLevel>>({})
  const [draftAction, setDraftAction] = useState<Record<string, boolean>>({})
  const [saveOpen, setSaveOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [nName, setNName] = useState('')
  const [nLevel, setNLevel] = useState<RoleLevel>('Company')
  const [nBase, setNBase] = useState(rbac.roles[4]?.name ?? ADMIN_ROLE)
  const [nDesc, setNDesc] = useState('')

  const roles = rbac.roles
  const modLevel = (r: string, k: string): PermLevel => draftMod[`${r}|${k}`] ?? rbac.effModule(r, k)
  const fLevel = (r: string, k: string): FieldLevel => draftField[`${r}|${k}`] ?? rbac.effField(r, k)
  const aOn = (r: string, k: string): boolean => draftAction[`${r}|${k}`] ?? rbac.effAction(r, k)

  const dirty = Object.keys(draftMod).length + Object.keys(draftField).length + Object.keys(draftAction).length
  const customCount = Object.keys(rbac.policy.modules).length + Object.keys(rbac.policy.fields).length + Object.keys(rbac.policy.actions).length

  const lockToast = () => push({ title: `${ADMIN_ROLE} is a superuser — access is locked on.`, tone: 'neutral' })
  const cycleMod = (r: string, k: string) => { if (readOnly) return; if (r === ADMIN_ROLE) return lockToast(); setDraftMod((p) => ({ ...p, [`${r}|${k}`]: nextPerm[modLevel(r, k)] })) }
  const cycleField = (r: string, k: string) => { if (readOnly) return; if (r === ADMIN_ROLE) return lockToast(); setDraftField((p) => ({ ...p, [`${r}|${k}`]: nextField[fLevel(r, k)] })) }
  const toggleAct = (r: string, k: string) => { if (readOnly) return; if (r === ADMIN_ROLE) return lockToast(); setDraftAction((p) => ({ ...p, [`${r}|${k}`]: !aOn(r, k) })) }
  const discard = () => { setDraftMod({}); setDraftField({}); setDraftAction({}) }

  const pending = useMemo(() => {
    const items: PolicyChangeItem[] = []
    const next: PolicyOverrides = { modules: { ...rbac.policy.modules }, fields: { ...rbac.policy.fields }, actions: { ...rbac.policy.actions } }
    for (const [key, v] of Object.entries(draftMod)) {
      const [r, k] = split(key); const b = rbac.effModule(r, k); if (v === b) continue
      items.push({ kind: 'module', target: `${r} · ${MODULE_LABEL.get(k) ?? k}`, from: PERM_LABEL[b], to: PERM_LABEL[v] })
      if (v === rbac.defModule(r, k)) delete next.modules[key]; else next.modules[key] = v
    }
    for (const [key, v] of Object.entries(draftField)) {
      const [r, k] = split(key); const b = rbac.effField(r, k); if (v === b) continue
      items.push({ kind: 'field', target: `${r} · ${FIELD_LABEL.get(k) ?? k}`, from: FIELD_LABEL_TXT[b], to: FIELD_LABEL_TXT[v] })
      if (v === rbac.defField(r, k)) delete next.fields[key]; else next.fields[key] = v
    }
    for (const [key, v] of Object.entries(draftAction)) {
      const [r, k] = split(key); const b = rbac.effAction(r, k); if (v === b) continue
      items.push({ kind: 'action', target: `${r} · ${ACTION_LABEL.get(k) ?? k}`, from: b ? 'Allowed' : 'Denied', to: v ? 'Allowed' : 'Denied' })
      if (v === rbac.defAction(r, k)) delete next.actions[key]; else next.actions[key] = v
    }
    return { items, next }
  }, [draftMod, draftField, draftAction, rbac])

  const confirmSave = () => {
    if (pending.items.length === 0) { discard(); setReason(''); setSaveOpen(false); push({ title: 'No net changes', tone: 'neutral' }); return }
    rbac.savePolicy(pending.next, pending.items, reason.trim() || 'No reason provided', actor)
    discard(); setReason(''); setSaveOpen(false)
    push({ title: `Saved ${pending.items.length} permission change${pending.items.length > 1 ? 's' : ''}`, tone: 'success' })
  }
  const confirmReset = () => { rbac.resetPolicy(reason.trim() || 'Reverted to defaults', actor); discard(); setReason(''); setResetOpen(false); push({ title: 'Policy reset to defaults', tone: 'success' }) }
  const createRole = () => {
    if (!nName.trim()) { push({ title: 'Name the role', tone: 'warning' }); return }
    rbac.addRole(nName.trim(), nLevel, nDesc.trim() || `Custom ${nLevel} role`, nBase)
    push({ title: `Created “${nName.trim()}” (cloned from ${nBase})`, tone: 'success' })
    setFocusRole(nName.trim()); setCreateOpen(false); setNName(''); setNDesc('')
  }

  const summary = {
    edit: ALL_MODULES.filter((m) => modLevel(focusRole, m.key) === 'edit').length,
    view: ALL_MODULES.filter((m) => modLevel(focusRole, m.key) === 'read').length,
    actions: ALL_ACTIONS.filter((a) => aOn(focusRole, a.key)).length,
  }

  const tabs = [
    { value: 'modules', label: 'Modules' },
    { value: 'fields', label: 'Field security' },
    { value: 'actions', label: 'Actions' },
    { value: 'effective', label: 'Effective' },
    { value: 'history', label: <span className="flex items-center gap-1.5">History {rbac.log.length > 0 && <Badge tone="neutral">{rbac.log.length}</Badge>}</span> },
  ]

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Roles & Security"
        subtitle="Create roles and define exactly what each can see, edit and do. Changes are governed — justified and logged."
        icon={<KeyRound className="h-5 w-5" />}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            {!readOnly && dirty > 0 && (
              <>
                <Button variant="ghost" size="sm" onClick={discard}>Discard</Button>
                <Button size="sm" onClick={() => setSaveOpen(true)}><Save className="h-4 w-4" /> Review &amp; save ({dirty})</Button>
              </>
            )}
            {customCount > 0 ? <Badge tone="warning">Custom policy · {customCount}</Badge> : <Badge tone="neutral">Default policy</Badge>}
            {!readOnly && customCount > 0 && dirty === 0 && <Button variant="outline" size="sm" onClick={() => setResetOpen(true)}><RotateCcw className="h-4 w-4" /> Reset</Button>}
            {!readOnly && <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> New role</Button>}
          </div>
        }
      />

      {readOnly && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-info/30 bg-info/5 px-4 py-3 text-sm text-muted-fg">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-info" /> You can review the access matrix; editing roles is limited to admins.
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Roles" value={roles.length} delta="access profiles" deltaTone="primary" icon={<UserCog className="h-4 w-4" />} />
        <StatCard label="Governed modules" value={ALL_MODULES.length} delta="screens" deltaTone="accent" icon={<Layers className="h-4 w-4" />} />
        <StatCard label="Field rules" value={FIELDS.length} delta="PII protected" deltaTone="warning" icon={<Lock className="h-4 w-4" />} />
        <StatCard label="Policy changes" value={rbac.log.length} delta="audit trail" deltaTone="info" icon={<History className="h-4 w-4" />} />
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle>Roles</CardTitle><span className="text-2xs font-semibold uppercase tracking-wide text-muted-fg">Select to focus · {roles.length} total</span></CardHeader>
        <CardBody className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((r) => {
            const ed = ALL_MODULES.filter((m) => modLevel(r.name, m.key) === 'edit').length
            const vw = ALL_MODULES.filter((m) => modLevel(r.name, m.key) === 'read').length
            const focused = r.name === focusRole
            return (
              <button key={r.name} onClick={() => setFocusRole(r.name)} className={cn('flex items-center gap-3 rounded-xl border p-3 text-left transition-colors cursor-pointer', focused ? 'border-accent/50 bg-accent/5' : 'border-border bg-surface hover:bg-muted/40')}>
                <Avatar name={r.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-sm font-bold">{r.name}{r.custom && <Badge tone="accent">Custom</Badge>}{r.name === ADMIN_ROLE && <Lock className="h-3 w-3 text-muted-fg" />}</p>
                  <p className="truncate text-2xs text-muted-fg">{r.level} · {ed} edit · {vw} view</p>
                </div>
              </button>
            )
          })}
        </CardBody>
      </Card>

      <Tabs tabs={tabs} value={tab} onChange={setTab} className="mb-5" />

      {(tab === 'modules' || tab === 'actions') && (
        <Card className="overflow-hidden p-0">
          <div className="border-b border-border px-5 py-3">
            <p className="text-sm font-bold">{tab === 'modules' ? 'Module permissions' : 'Workflow actions'}</p>
            <p className="text-2xs text-muted-fg">{tab === 'modules' ? 'Click a cell to cycle None → View → Edit. Dot = changed from default.' : 'Click to toggle allowed / denied. Admin can do everything.'}</p>
          </div>
          <Matrix roles={roles.map((r) => r.name)}>
            {(tab === 'modules' ? MODULE_GROUPS : ACTION_GROUPS).map((g) => (
              <GroupRows key={g.label} label={g.label} cols={roles.length}>
                {g.items.map((it) => (
                  <tr key={it.key} className="border-t border-border hover:bg-muted/30">
                    <RowHead>{it.label}</RowHead>
                    {roles.map((r) => (
                      <td key={r.name} className="px-2 py-1.5 text-center">
                        {tab === 'modules' ? (
                          <PermBtn locked={r.name === ADMIN_ROLE} custom={modLevel(r.name, it.key) !== rbac.defModule(r.name, it.key)} tone={PERM_TONE[modLevel(r.name, it.key)]} onClick={() => cycleMod(r.name, it.key)}>{PERM_LABEL[modLevel(r.name, it.key)]}</PermBtn>
                        ) : (
                          <ActBtn on={aOn(r.name, it.key)} locked={r.name === ADMIN_ROLE} custom={aOn(r.name, it.key) !== rbac.defAction(r.name, it.key)} onClick={() => toggleAct(r.name, it.key)} />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </GroupRows>
            ))}
          </Matrix>
        </Card>
      )}

      {tab === 'fields' && (
        <Card className="overflow-hidden p-0">
          <div className="border-b border-border px-5 py-3">
            <p className="text-sm font-bold">Field-level security</p>
            <p className="text-2xs text-muted-fg">Sensitive HR fields. Click to cycle Hidden → Masked → Visible. Admin always sees full values.</p>
          </div>
          <Matrix roles={roles.map((r) => r.name)}>
            {FIELDS.map((f) => (
              <tr key={f.key} className="border-t border-border hover:bg-muted/30">
                <RowHead hint={f.hint}>{f.label}</RowHead>
                {roles.map((r) => {
                  const lvl = fLevel(r.name, f.key); const Icon = FIELD_ICON[lvl]
                  return (
                    <td key={r.name} className="px-2 py-1.5 text-center">
                      <PermBtn locked={r.name === ADMIN_ROLE} custom={lvl !== rbac.defField(r.name, f.key)} tone={FIELD_TONE[lvl]} onClick={() => cycleField(r.name, f.key)}><Icon className="h-3 w-3" /> {FIELD_LABEL_TXT[lvl]}</PermBtn>
                    </td>
                  )
                })}
              </tr>
            ))}
          </Matrix>
        </Card>
      )}

      {tab === 'effective' && (
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <Avatar name={focusRole} size="lg" />
                <div className="min-w-0"><p className="truncate text-sm font-bold">{focusRole}</p><p className="truncate text-2xs text-muted-fg">{roles.find((r) => r.name === focusRole)?.level}</p></div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                {([['Edit', summary.edit, 'text-success'], ['View', summary.view, 'text-accent'], ['Actions', summary.actions, 'text-info']] as const).map(([l, v, c]) => (
                  <div key={l} className="rounded-lg border border-border py-2"><p className={cn('text-lg font-extrabold tnum', c)}>{v}</p><p className="text-2xs uppercase tracking-wide text-muted-fg">{l}</p></div>
                ))}
              </div>
            </CardBody>
          </Card>
          <div className="space-y-4">
            <Card><CardHeader><CardTitle>Sensitive fields · how they render</CardTitle></CardHeader><CardBody className="grid gap-2 sm:grid-cols-2">
              {FIELDS.map((f) => { const lvl = fLevel(focusRole, f.key); const Icon = FIELD_ICON[lvl]; return (
                <div key={f.key} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                  <div className="min-w-0"><p className="truncate text-xs font-semibold">{f.label}</p><p className="truncate font-mono text-2xs text-muted-fg">{maskSample(lvl, f.sample)}</p></div>
                  <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-semibold', toneBg[FIELD_TONE[lvl]])}><Icon className="h-3 w-3" /> {FIELD_LABEL_TXT[lvl]}</span>
                </div>
              )})}
            </CardBody></Card>
            <Card><CardHeader><CardTitle>Permitted actions</CardTitle></CardHeader><CardBody className="flex flex-wrap gap-1.5">
              {ALL_ACTIONS.filter((a) => aOn(focusRole, a.key)).map((a) => <Badge key={a.key} tone="success"><Check className="h-3 w-3" /> {a.label}</Badge>)}
              {summary.actions === 0 && <span className="text-sm text-muted-fg">No workflow actions for this role.</span>}
            </CardBody></Card>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <Card>
          <CardHeader><CardTitle>Policy change history</CardTitle><Badge tone="success" dot>Append-only</Badge></CardHeader>
          <CardBody>
            {rbac.log.length === 0 ? (
              <EmptyState icon={<History className="h-5 w-5" />} title="No changes yet" description="Edit a permission and save it — every change is recorded here with a reason." />
            ) : (
              <div className="space-y-3">
                {rbac.log.map((e) => (
                  <div key={e.id} className="rounded-xl border border-border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="flex items-center gap-2"><Avatar name={e.actor} size="sm" /><span className="text-sm font-semibold">{e.actor}</span></span>
                      <span className="text-2xs text-muted-fg">{e.at}</span>
                    </div>
                    <p className="mt-2 text-sm">{e.reason}</p>
                    <div className="mt-2 space-y-1.5">
                      {e.items.map((it, i) => (
                        <div key={i} className="flex flex-wrap items-center gap-2 text-2xs">
                          <span className="font-semibold">{it.target}</span>
                          <span className="rounded bg-muted px-1.5 py-0.5 text-muted-fg">{it.from}</span>
                          <ArrowRight className="h-3 w-3 text-muted-fg" />
                          <span className="rounded bg-accent/12 px-1.5 py-0.5 font-semibold text-accent">{it.to}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      <Modal open={saveOpen} onClose={() => { setSaveOpen(false); setReason('') }} title="Review permission changes" size="lg"
        description={pending.items.length > 0 ? `${pending.items.length} change${pending.items.length > 1 ? 's' : ''} take effect immediately and are logged.` : 'No net changes — your edits match the current policy.'}
        footer={<><Button variant="ghost" onClick={() => { setSaveOpen(false); setReason('') }}>Cancel</Button><Button onClick={confirmSave} disabled={pending.items.length > 0 && !reason.trim()}><Save className="h-4 w-4" /> {pending.items.length > 0 ? 'Save changes' : 'Done'}</Button></>}>
        <div className="space-y-4">
          {pending.items.length > 0 && (
            <div className="max-h-56 space-y-1.5 overflow-y-auto">
              {pending.items.map((it, i) => (
                <div key={i} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
                  <div className="min-w-0"><p className="truncate text-sm font-semibold">{it.target}</p><p className="text-2xs capitalize text-muted-fg">{it.kind}</p></div>
                  <div className="flex shrink-0 items-center gap-1.5 text-2xs"><span className="rounded bg-muted px-1.5 py-0.5 text-muted-fg">{it.from}</span><ArrowRight className="h-3 w-3 text-muted-fg" /><span className="rounded bg-accent/12 px-1.5 py-0.5 font-semibold text-accent">{it.to}</span></div>
                </div>
              ))}
            </div>
          )}
          <Field label="Reason for change" hint="Recorded against your name in the append-only audit trail.">
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Grant People Managers edit access to Onboarding during a hiring push." />
          </Field>
        </div>
      </Modal>

      <Modal open={resetOpen} onClose={() => { setResetOpen(false); setReason('') }} title="Reset to default policy"
        description={`Reverts all ${customCount} custom override${customCount === 1 ? '' : 's'} to built-in defaults. The reset is logged.`}
        footer={<><Button variant="ghost" onClick={() => { setResetOpen(false); setReason('') }}>Cancel</Button><Button variant="danger" onClick={confirmReset}><RotateCcw className="h-4 w-4" /> Reset policy</Button></>}>
        <Field label="Reason (optional)"><Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Quarterly access review — restoring baseline." /></Field>
      </Modal>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New role" description="Create a role by cloning an existing one — then tailor its access on the matrix."
        footer={<><Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={createRole}><Plus className="h-4 w-4" /> Create role</Button></>}>
        <div className="space-y-4">
          <Field label="Role name" required><Input value={nName} onChange={(e) => setNName(e.target.value)} placeholder="e.g. Recruiter, Finance Viewer" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Level"><Select value={nLevel} onChange={(e) => setNLevel(e.target.value as RoleLevel)}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</Select></Field>
            <Field label="Clone access from"><Select value={nBase} onChange={(e) => setNBase(e.target.value)}>{roles.map((r) => <option key={r.name}>{r.name}</option>)}</Select></Field>
          </div>
          <Field label="Description"><Input value={nDesc} onChange={(e) => setNDesc(e.target.value)} placeholder="What this role is for." /></Field>
          <p className="flex items-center gap-1.5 rounded-lg bg-surface2/60 px-3 py-2 text-2xs text-muted-fg"><SlidersHorizontal className="h-3.5 w-3.5" /> Starts with {nBase}'s access; adjust any cell on the matrix, then Review &amp; save.</p>
        </div>
      </Modal>
    </div>
  )
}

/* ---------------- matrix building blocks ---------------- */
function Matrix({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-surface px-4 py-2.5">&nbsp;</th>
            {roles.map((r) => (
              <th key={r} className="min-w-[96px] px-2 py-2.5 text-center">
                <span className="text-2xs font-bold text-fg">{r === ADMIN_ROLE ? 'Super Admin' : r.replace(/ — Standard/, '').replace('Company ', '').replace('Platform ', '')}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}
function GroupRows({ label, cols, children }: { label: string; cols: number; children: React.ReactNode }) {
  return (
    <>
      <tr className="bg-muted/40"><td colSpan={cols + 1} className="sticky left-0 px-4 py-1.5 text-2xs font-bold uppercase tracking-wide text-muted-fg/80">{label}</td></tr>
      {children}
    </>
  )
}
function RowHead({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <td className="sticky left-0 z-10 bg-surface px-4 py-1.5">
      <p className="text-[13px] font-semibold">{children}</p>
      {hint && <p className="text-2xs text-muted-fg">{hint}</p>}
    </td>
  )
}
function PermBtn({ children, onClick, tone, locked, custom }: { children: React.ReactNode; onClick: () => void; tone: Tone; locked?: boolean; custom?: boolean }) {
  return (
    <button onClick={onClick} className={cn('relative inline-flex min-w-[64px] items-center justify-center gap-1 rounded-full px-2 py-1 text-2xs font-bold transition-colors', toneBg[tone], locked ? 'cursor-default opacity-90' : 'cursor-pointer hover:brightness-95')}>
      {children}
      {locked && <Lock className="h-2.5 w-2.5 opacity-60" />}
      {custom && !locked && <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-accent ring-2 ring-surface" />}
    </button>
  )
}
function ActBtn({ on, onClick, locked, custom }: { on: boolean; onClick: () => void; locked?: boolean; custom?: boolean }) {
  return (
    <button onClick={onClick} aria-pressed={on} className={cn('relative inline-flex h-6 w-6 items-center justify-center rounded-md transition-colors', on ? 'bg-success/15 text-success' : 'bg-muted text-muted-fg/50', locked ? 'cursor-default opacity-90' : 'cursor-pointer hover:brightness-95')}>
      {on ? <Check className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
      {custom && !locked && <span className="absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full bg-accent ring-2 ring-surface" />}
    </button>
  )
}
