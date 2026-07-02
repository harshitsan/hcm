import { useState } from 'react'
import { toast } from 'sonner'
import { useRole } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  activeMemberships,
  PERSONAS,
  SETTING_LABELS,
  SHARED_SETTINGS,
} from '../data/group-companies'
import { ADMIN_ACTIONS } from '../data/sharing'
import { type AuditEntry } from '../data/audit'
import { type GroupCompaniesStore } from '../hooks/use-group-companies'
import { GroupRolesCard } from './group-roles-card'

interface SharingTabProps {
  store: GroupCompaniesStore
  auditEntries: AuditEntry[]
}

/**
 * Shared-scenario authorization & governance (GRP-02/04/07/10/13).
 * Everything defaults to OFF; changes are stored as versioned,
 * effective-dated configuration and every authorization event is audited.
 */
export function SharingTab({ store, auditEntries }: SharingTabProps) {
  const { role } = useRole()
  const persona = PERSONAS[role]
  const today = new Date().toISOString().slice(0, 10)

  const [groupId, setGroupId] = useState(store.groups[0]?.id ?? '')
  const [effectiveDate, setEffectiveDate] = useState(today)
  const [targetCompanyId, setTargetCompanyId] = useState('')
  const [adminAction, setAdminAction] = useState<string>(ADMIN_ACTIONS[0])

  const group = store.groups.find((g) => g.id === groupId) ?? store.groups[0]
  if (!group) return null

  const canManage =
    role === 'Platform Admin' ||
    role === 'Portfolio Admin' ||
    (role === 'Group Company Admin' && group.administratorEmail === persona.email)

  const canActCross =
    role === 'Platform Admin' ||
    (role === 'Group Company Admin' && group.administratorEmail === persona.email)

  const myCompanyGroups = persona.companyId
    ? store.groups.filter((g) =>
        activeMemberships(g).some((m) => m.companyId === persona.companyId)
      )
    : []

  const handleToggle = (setting: (typeof SHARED_SETTINGS)[number], value: boolean) => {
    if (!canManage) {
      toast.error('AUTH_001 — shared-scenario authorization requires the owning Group Company Admin, Portfolio Admin, or Platform Admin')
      return
    }
    store.setScenario(group.id, setting, value, effectiveDate)
  }

  const versions = [...group.configVersions].reverse()

  return (
    <div className='w-full space-y-4'>
      <div className='flex flex-wrap items-center gap-3'>
        <span className='text-paragraph-sm text-neutral-1000'>Construct</span>
        <Select value={group.id} onValueChange={setGroupId}>
          <SelectTrigger variant='secondary' className='h-8 w-72'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {store.groups.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.code} — {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className='text-paragraph-sm text-neutral-1000'>Change effective</span>
        <Input
          type='date'
          value={effectiveDate}
          onChange={(e) => setEffectiveDate(e.target.value)}
          className='h-8 w-40'
        />
      </div>

      <div className='grid gap-4 lg:grid-cols-2'>
        <Card className='gap-3 border-gray-200 py-4'>
          <CardHeader className='px-4'>
            <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
              Shared-scenario authorization — disabled by default, never implicit
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-3 px-4'>
            {SHARED_SETTINGS.map((setting) => (
              <div
                key={setting}
                className='flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2'
              >
                <div className='flex flex-col'>
                  <span className='text-sm font-medium'>{SETTING_LABELS[setting]}</span>
                  <span className='text-paragraph-sm text-neutral-1000'>
                    {setting === 'sharedAdministration' &&
                      'Central admin actions across linked companies'}
                    {setting === 'sharedLocations' &&
                      'Member companies may reference each other’s locations'}
                    {setting === 'crossCompanyAccess' &&
                      'Prerequisite for consolidated reporting & directory search'}
                  </span>
                </div>
                <Switch
                  checked={group[setting]}
                  disabled={!canManage}
                  onCheckedChange={(v) => handleToggle(setting, v)}
                />
              </div>
            ))}
            {!canManage && (
              <p className='text-paragraph-sm text-neutral-1000'>
                Read-only for your role — authorization changes are limited to
                the owning Group Company Admin, Portfolio Admin, or Platform Admin.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className='gap-3 border-gray-200 py-4'>
          <CardHeader className='px-4'>
            <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
              Cross-company administrative action (audited)
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-3 px-4'>
            <div className='flex flex-wrap items-end gap-3'>
              <div className='flex flex-col gap-1'>
                <span className='text-paragraph-sm text-neutral-1000'>
                  Target member company (companies outside the construct are not selectable)
                </span>
                <Select value={targetCompanyId} onValueChange={setTargetCompanyId}>
                  <SelectTrigger variant='secondary' className='h-8 w-60'>
                    <SelectValue placeholder='Select target' />
                  </SelectTrigger>
                  <SelectContent>
                    {activeMemberships(group).map((m) => (
                      <SelectItem key={m.companyId} value={m.companyId}>
                        {store.companyName(m.companyId)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='flex flex-col gap-1'>
                <span className='text-paragraph-sm text-neutral-1000'>Action</span>
                <Select value={adminAction} onValueChange={setAdminAction}>
                  <SelectTrigger variant='secondary' className='h-8 w-56'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ADMIN_ACTIONS.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                size='sm'
                className='h-8'
                onClick={() => {
                  if (!canActCross) {
                    toast.error('AUTH_001 — cross-company administration requires the owning Group Company Admin or a Platform Admin')
                    return
                  }
                  if (!targetCompanyId) {
                    toast.error('Select a target member company')
                    return
                  }
                  store.runAdminAction(group.id, targetCompanyId, adminAction)
                }}
              >
                Run action
              </Button>
            </div>
            <p className='text-paragraph-sm text-neutral-1000'>
              Denied unless shared administration is explicitly authorized for{' '}
              {group.code}. Every execution is captured with actor, target
              company and timestamp.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className='gap-3 border-gray-200 py-4'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Configuration version history — governed, effective-dated, no code deploys
          </CardTitle>
        </CardHeader>
        <CardContent className='px-4'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Version</TableHead>
                <TableHead>Setting</TableHead>
                <TableHead>Prior → New</TableHead>
                <TableHead>Effective date</TableHead>
                <TableHead>Changed by</TableHead>
                <TableHead>Changed at</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {versions.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className='font-mono text-xs'>v{v.version}</TableCell>
                  <TableCell className='text-sm'>{SETTING_LABELS[v.setting]}</TableCell>
                  <TableCell className='text-sm'>
                    {String(v.priorValue)} → {String(v.newValue)}
                  </TableCell>
                  <TableCell className='text-sm'>
                    {v.effectiveDate}
                    {v.effectiveDate > today && (
                      <Badge variant='open' className='ml-2'>Scheduled</Badge>
                    )}
                  </TableCell>
                  <TableCell className='text-paragraph-sm text-neutral-1000'>{v.changedBy}</TableCell>
                  <TableCell className='text-paragraph-sm text-neutral-1000'>{v.changedAt}</TableCell>
                </TableRow>
              ))}
              {versions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className='text-neutral-1000 text-center'>
                    No configuration changes yet — all shared scenarios remain at the default (off)
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <GroupRolesCard group={group} store={store} canManage={canActCross} />

      {role === 'Company Admin' && persona.companyId && (
        <Card className='gap-3 border-gray-200 py-4'>
          <CardHeader className='px-4'>
            <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
              My company — {store.companyName(persona.companyId)} (member visibility & consent)
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-3 px-4'>
            {myCompanyGroups.length === 0 && (
              <p className='text-paragraph-sm text-neutral-1000'>
                Your company is not part of any group-company construct — no
                cross-company capability applies to it.
              </p>
            )}
            {myCompanyGroups.map((g) => (
              <div key={g.id} className='rounded-md border border-gray-200 bg-white px-3 py-2'>
                <div className='flex flex-wrap items-center justify-between gap-2'>
                  <span className='text-sm font-medium'>
                    {g.code} — {g.name}
                  </span>
                  <div className='flex gap-1'>
                    {SHARED_SETTINGS.map((s) => (
                      <Badge key={s} variant={g[s] ? 'completed' : 'pending'}>
                        {SETTING_LABELS[s]}: {g[s] ? 'applies' : 'not authorized'}
                      </Badge>
                    ))}
                  </div>
                </div>
                <p className='text-paragraph-sm text-neutral-1000 mt-1'>
                  Cross-company actions on your company from admins of other
                  companies are denied for any scenario shown as “not
                  authorized”. If your company is removed from the construct,
                  all shared administration and locations stop applying.
                </p>
              </div>
            ))}
            <div>
              <span className='text-paragraph-sm font-medium'>
                Cross-company activity affecting my company
              </span>
              <ul className='mt-1 space-y-1'>
                {auditEntries
                  .filter((e) => e.targetCompany === store.companyName(persona.companyId))
                  .slice(0, 5)
                  .map((e) => (
                    <li key={e.id} className='text-paragraph-sm text-neutral-1000'>
                      {e.timestamp} — {e.actor}: {e.detail}
                    </li>
                  ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
