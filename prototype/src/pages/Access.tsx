/**
 * Access — roles & permissions in plain language (BRD §6.12 + §5).
 * The principle on display: roles are PERSONAS, permissions are CAPABILITIES.
 * The same capability list can back many roles — that's why cloning exists.
 * Built-ins are fixed; custom roles save on every flip, straight to Activity.
 */
import { useState } from 'react'
import { Copy, KeyRound, Layers, Plus, ShieldCheck, Users } from 'lucide-react'
import { ROLES, type Role, type RoleLevelName } from '../data'
import { useApp } from '../store'
import { Btn, Card, Drawer, Field, Input, Modal, Pill, SectionTitle, Segmented, Select, Stat, Toggle, type PillTone } from '../ui'

const LEVELS = ['Platform', 'Portfolio', 'Group', 'Company'] as const

const LEVEL_HINTS: Record<RoleLevelName, string> = {
  Platform: 'Runs the platform itself',
  Portfolio: 'Several companies, one seat',
  Group: 'Affiliated companies',
  Company: 'Inside one company',
}

const LEVEL_TONES: Record<RoleLevelName, PillTone> = {
  Platform: 'ink',
  Portfolio: 'amber',
  Group: 'green',
  Company: 'neutral',
}

/** capabilities currently switched on */
function onCount(role: Role): number {
  return role.perms.reduce((n, g) => n + g.items.filter((i) => i.on).length, 0)
}

function copyPerms(role: Role) {
  return role.perms.map((g) => ({ area: g.area, items: g.items.map((i) => ({ ...i })) }))
}

export default function Access() {
  const { logEvent, toast } = useApp()

  // roles live locally — this page is their home
  const [roles, setRoles] = useState<Role[]>(ROLES)
  const [openId, setOpenId] = useState<string | null>(null)

  // create modal
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newLevel, setNewLevel] = useState<RoleLevelName>('Company')
  const [startFrom, setStartFrom] = useState(ROLES[0].name)

  const openRole = roles.find((r) => r.id === openId) ?? null
  const peopleCovered = roles.reduce((n, r) => n + r.people, 0)

  function flipPerm(role: Role, area: string, itemId: string) {
    if (role.builtIn) {
      toast('Built-in roles are fixed — clone it to make your own version')
      return
    }
    const item = role.perms.find((g) => g.area === area)?.items.find((i) => i.id === itemId)
    if (!item) return
    const newVal = !item.on
    setRoles((rs) =>
      rs.map((r) =>
        r.id === role.id
          ? {
              ...r,
              perms: r.perms.map((g) =>
                g.area === area ? { ...g, items: g.items.map((i) => (i.id === itemId ? { ...i, on: newVal } : i)) } : g,
              ),
            }
          : r,
      ),
    )
    toast(`Saved — applies to ${role.people} people right away`)
    logEvent('Access', `Changed what “${role.name}” can do`, {
      detail: `${item.label} → ${newVal ? 'allowed' : 'not allowed'}`,
    })
  }

  function cloneRole(src: Role) {
    const copy: Role = {
      id: 'ro' + (roles.length + 1),
      name: `${src.name} (copy)`,
      level: src.level,
      desc: src.desc,
      people: 0,
      builtIn: false,
      perms: copyPerms(src),
      clonedFrom: src.name,
    }
    setRoles((rs) => [...rs, copy])
    setOpenId(copy.id)
    logEvent('Access', `Created the “${src.name} (copy)” role`, { detail: `Cloned from ${src.name}` })
    toast('Cloned — flip what you need, it saves itself')
  }

  function openCreate() {
    setNewName('')
    setNewLevel('Company')
    setStartFrom(roles[0].name)
    setCreateOpen(true)
  }

  function createRole() {
    const src = roles.find((r) => r.name === startFrom) ?? roles[0]
    const role: Role = {
      id: 'ro' + (roles.length + 1),
      name: newName.trim(),
      level: newLevel,
      desc: 'Custom role — adjust what it can do.',
      people: 0,
      builtIn: false,
      perms: copyPerms(src),
      clonedFrom: src.name,
    }
    setRoles((rs) => [...rs, role])
    setCreateOpen(false)
    setOpenId(role.id)
    logEvent('Access', `Created the “${role.name}” role`, { detail: `Started from ${src.name}` })
    toast(`“${role.name}” is ready — flip what it can do`)
  }

  return (
    <div className="mx-auto max-w-6xl animate-fade-in">
      {/* hero */}
      <Card glow className="mb-6 p-7">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="mb-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">Roles &amp; access</div>
            <h1 className="font-display text-[32px] font-medium leading-tight tracking-tight">Who can do what</h1>
            <p className="mt-1.5 max-w-md text-[13.5px] text-muted">
              A role is a job hat. Permissions are what the hat allows. Clone a role, flip a few switches, done.
            </p>
          </div>
          <div className="flex items-center gap-6 pb-1">
            <Stat icon={<KeyRound />} value={roles.length} label="Roles" />
            <Stat icon={<Users />} value={peopleCovered} label="People covered" />
            <Stat icon={<Layers />} value="4" label="Levels" />
            <Btn variant="dark" onClick={openCreate}>
              <Plus className="h-4 w-4" /> New role
            </Btn>
          </div>
        </div>
      </Card>

      {/* roles by level */}
      {LEVELS.map((level) => {
        const inLevel = roles.filter((r) => r.level === level)
        if (inLevel.length === 0) return null
        return (
          <div key={level} className="mb-8">
            <SectionTitle hint={LEVEL_HINTS[level]}>{level}</SectionTitle>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {inLevel.map((role) => (
                <Card key={role.id} className="p-5" onClick={() => setOpenId(role.id)}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[15px] font-bold tracking-tight">{role.name}</span>
                    {role.builtIn && <Pill tone="neutral">Built-in</Pill>}
                  </div>
                  <p className="mt-1 text-[12.5px] text-muted">{role.desc}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-[13px] font-bold">{role.people} people</span>
                    <span className="text-[12.5px] text-muted">{onCount(role)} things it can do</span>
                    {role.clonedFrom && <span className="text-[11.5px] text-muted">cloned from {role.clonedFrom}</span>}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )
      })}

      {/* the per-company principle, said out loud */}
      <Card className="flex items-start gap-4 p-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-ink">
          <ShieldCheck className="h-4 w-4" />
        </span>
        <div>
          <div className="text-[14px] font-bold tracking-tight">One person, different hats in different companies</div>
          <p className="mt-0.5 text-[13px] text-muted">
            The same person can be an HR admin in Acme and just an employee in Beta — roles attach per company, never
            globally.
          </p>
        </div>
      </Card>

      {/* role drawer */}
      <Drawer
        open={openRole !== null}
        onClose={() => setOpenId(null)}
        title={openRole?.name ?? ''}
        footer={
          openRole &&
          (openRole.builtIn ? (
            <Btn variant="outline" className="w-full" onClick={() => cloneRole(openRole)}>
              <Copy className="h-4 w-4" /> Clone this role
            </Btn>
          ) : (
            <p className="text-center text-[12px] text-muted">Changes apply immediately — every flip lands in Activity.</p>
          ))
        }
      >
        {openRole && (
          <>
            <div className="flex items-center gap-2.5">
              <Pill tone={LEVEL_TONES[openRole.level]}>{openRole.level}</Pill>
              <span className="text-[12.5px] font-semibold text-ink-soft">{openRole.people} people</span>
              {openRole.clonedFrom && <span className="text-[11.5px] text-muted">cloned from {openRole.clonedFrom}</span>}
            </div>
            <p className="mt-2 text-[13px] text-muted">{openRole.desc}</p>

            {openRole.perms.map((group) => (
              <div key={group.area} className="mt-5">
                <div className="mb-2 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-muted">{group.area}</div>
                <div className="divide-y divide-line/60 rounded-2xl border border-line/70">
                  {group.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <span className="text-[13px] font-medium">{item.label}</span>
                      <Toggle on={item.on} onChange={() => flipPerm(openRole, group.area, item.id)} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </Drawer>

      {/* new role modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New role"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Btn variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Btn>
            <Btn variant="dark" disabled={!newName.trim()} onClick={createRole}>
              Create role
            </Btn>
          </div>
        }
      >
        <div className="space-y-5">
          <Field label="Name">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Payroll reviewer"
              autoFocus
            />
          </Field>
          <div>
            <span className="mb-1.5 block text-[12.5px] font-semibold text-ink-soft">Where does it live?</span>
            <Segmented options={LEVELS} value={newLevel} onChange={setNewLevel} />
          </div>
          <Field label="Start from" hint="The new role begins with this role's switches — flip from there.">
            <Select value={startFrom} onChange={(e) => setStartFrom(e.target.value)}>
              {roles.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Modal>
    </div>
  )
}
