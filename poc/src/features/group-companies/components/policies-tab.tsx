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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { activeMemberships, PERSONAS } from '../data/group-companies'
import { type PolicyTemplate } from '../data/sharing'
import { type GroupCompaniesStore } from '../hooks/use-group-companies'
import { type PolicyTemplatesStore } from '../hooks/use-policy-templates'

const CATEGORIES: PolicyTemplate['category'][] = [
  'Leave',
  'Attendance',
  'Expense',
  'Conduct',
  'Remote Work',
]

interface PoliciesTabProps {
  store: GroupCompaniesStore
  policies: PolicyTemplatesStore
}

/**
 * Shared policy templates (GRP-23). A policy shared with the group is a
 * read-only template; each member company adopts its own independent
 * instance, and later template versions never propagate automatically.
 */
export function PoliciesTab({ store, policies }: PoliciesTabProps) {
  const { role } = useRole()
  const persona = PERSONAS[role]
  const canShare = role === 'Platform Admin' || role === 'Group Company Admin'
  const canAdopt = canShare || role === 'Company Admin'

  const [name, setName] = useState('')
  const [category, setCategory] = useState<PolicyTemplate['category']>('Leave')
  const [sourceCompanyId, setSourceCompanyId] = useState(persona.companyId ?? '')
  const [groupId, setGroupId] = useState(store.groups[0]?.id ?? '')
  const [adoptAs, setAdoptAs] = useState<Record<string, string>>({})

  const groupOf = (id: string) => store.groups.find((g) => g.id === id)

  const handleShare = () => {
    if (!canShare) {
      toast.error('AUTH_001 — sharing a template with the group requires a Group Company Admin or Platform Admin')
      return
    }
    if (!name.trim() || !sourceCompanyId || !groupId) {
      toast.error('Provide a policy name, source company and group')
      return
    }
    policies.shareTemplate(
      { name: name.trim(), category, sourceCompanyId, groupId },
      groupOf(groupId)?.code ?? '',
      persona.email
    )
    setName('')
  }

  const handleAdopt = (tpl: PolicyTemplate) => {
    const companyId = adoptAs[tpl.id] ?? persona.companyId ?? ''
    if (!canAdopt) {
      toast.error('AUTH_001 — adopting a template requires a company or group administrator')
      return
    }
    if (!companyId) {
      toast.error('Select the member company that adopts the template')
      return
    }
    policies.adoptTemplate(tpl.id, companyId, groupOf(tpl.groupId)?.code ?? '')
  }

  return (
    <div className='w-full space-y-4'>
      {canShare && (
        <Card className='gap-3 border-gray-200 py-4'>
          <CardHeader className='px-4'>
            <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
              Share a policy with the group (read-only template, no auto-propagation)
            </CardTitle>
          </CardHeader>
          <CardContent className='flex flex-wrap items-end gap-3 px-4'>
            <div className='flex flex-col gap-1'>
              <span className='text-paragraph-sm text-neutral-1000'>Policy name</span>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='Travel Policy FY27'
                className='h-8 w-52'
              />
            </div>
            <div className='flex flex-col gap-1'>
              <span className='text-paragraph-sm text-neutral-1000'>Category</span>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as PolicyTemplate['category'])}
              >
                <SelectTrigger variant='secondary' className='h-8 w-40'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='flex flex-col gap-1'>
              <span className='text-paragraph-sm text-neutral-1000'>Source company</span>
              <Select value={sourceCompanyId} onValueChange={setSourceCompanyId}>
                <SelectTrigger variant='secondary' className='h-8 w-52'>
                  <SelectValue placeholder='Owning company' />
                </SelectTrigger>
                <SelectContent>
                  {store.companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='flex flex-col gap-1'>
              <span className='text-paragraph-sm text-neutral-1000'>Group</span>
              <Select value={groupId} onValueChange={setGroupId}>
                <SelectTrigger variant='secondary' className='h-8 w-64'>
                  <SelectValue placeholder='Group construct' />
                </SelectTrigger>
                <SelectContent>
                  {store.groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.code} — {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button size='sm' className='h-8' onClick={handleShare}>
              Share as template
            </Button>
          </CardContent>
        </Card>
      )}

      {policies.templates.map((tpl) => {
        const group = groupOf(tpl.groupId)
        const eligible = group
          ? activeMemberships(group)
              .map((m) => store.companies.find((c) => c.id === m.companyId))
              .filter(
                (c) =>
                  c &&
                  c.id !== tpl.sourceCompanyId &&
                  !tpl.instances.some((i) => i.companyId === c.id)
              )
          : []
        return (
          <Card key={tpl.id} className='gap-2 border-gray-200 py-4'>
            <CardHeader className='flex flex-wrap items-center justify-between gap-2 px-4'>
              <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
                {tpl.name}
                <span className='text-paragraph-sm text-neutral-1000 ml-2 font-normal'>
                  {tpl.category} · source {store.companyName(tpl.sourceCompanyId)} ·{' '}
                  {group?.code}
                </span>
              </CardTitle>
              <div className='flex items-center gap-2'>
                <Badge variant='open'>Template v{tpl.version}</Badge>
                <Badge variant='pending'>Read-only to members</Badge>
                {canShare && (
                  <Button
                    variant='outline'
                    size='sm'
                    className='h-7'
                    onClick={() => policies.updateTemplate(tpl.id, group?.code ?? '')}
                  >
                    Update template (v{tpl.version + 1})
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className='space-y-3 px-4'>
              {tpl.instances.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company instance</TableHead>
                      <TableHead>Adopted version</TableHead>
                      <TableHead>Adopted on</TableHead>
                      <TableHead>Drift</TableHead>
                      <TableHead className='text-right'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tpl.instances.map((inst) => (
                      <TableRow key={inst.id}>
                        <TableCell className='text-sm font-medium'>
                          {store.companyName(inst.companyId)}
                        </TableCell>
                        <TableCell className='text-sm'>
                          v{inst.adoptedVersion}
                          {inst.adoptedVersion < tpl.version && (
                            <Badge variant='overdue' className='ml-2'>
                              Template ahead — not auto-updated
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className='text-sm'>{inst.adoptedOn}</TableCell>
                        <TableCell>
                          {inst.locallyEdited ? (
                            <Badge variant='badge_active'>Locally edited</Badge>
                          ) : (
                            <Badge variant='pending'>Unmodified</Badge>
                          )}
                        </TableCell>
                        <TableCell className='text-right'>
                          <Button
                            variant='outline'
                            size='sm'
                            className='h-7'
                            onClick={() => {
                              if (!canAdopt && persona.companyId !== inst.companyId) {
                                toast.error('AUTH_001 — an instance can only be edited by its own company')
                                return
                              }
                              policies.editInstance(tpl.id, inst.id, group?.code ?? '')
                            }}
                          >
                            Edit instance
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className='text-paragraph-sm text-neutral-1000'>
                  No member company has adopted this template yet.
                </p>
              )}

              <div className='flex flex-wrap items-center gap-3'>
                <Select
                  value={adoptAs[tpl.id] ?? ''}
                  onValueChange={(v) => setAdoptAs((prev) => ({ ...prev, [tpl.id]: v }))}
                >
                  <SelectTrigger variant='secondary' className='h-8 w-56'>
                    <SelectValue placeholder='Adopt as member company…' />
                  </SelectTrigger>
                  <SelectContent>
                    {eligible.map(
                      (c) =>
                        c && (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        )
                    )}
                  </SelectContent>
                </Select>
                <Button
                  variant='outline'
                  size='sm'
                  className='h-8'
                  onClick={() => handleAdopt(tpl)}
                >
                  Create independent instance
                </Button>
                <span className='text-paragraph-sm text-neutral-1000'>
                  Adopting copies v{tpl.version} into a company-owned instance —
                  edits stay local and template updates never propagate back.
                </span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
