import { useState } from 'react'
import { toast } from 'sonner'
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
import { activeMemberships, type GroupCompany } from '../data/group-companies'
import { GROUP_LEVEL_ROLES, type GroupLevelRole } from '../data/sharing'
import { type GroupCompaniesStore } from '../hooks/use-group-companies'

interface GroupRolesCardProps {
  group: GroupCompany
  store: GroupCompaniesStore
  canManage: boolean
}

/**
 * Explicit group-level role grants (GRP-07). Grants and revocations are
 * auditable and take effect on the next access attempt — the Reporting &
 * Directory tab re-evaluates them live.
 */
export function GroupRolesCard({ group, store, canManage }: GroupRolesCardProps) {
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [grantRole, setGrantRole] = useState<GroupLevelRole>('Group Reporting Viewer')

  const grants = store.roleGrants.filter((r) => r.groupId === group.id)
  const memberCompanies = activeMemberships(group).map((m) =>
    store.companies.find((c) => c.id === m.companyId)
  )

  const handleGrant = () => {
    if (!canManage) {
      toast.error('AUTH_001 — only the owning Group Company Admin or a Platform Admin can grant group-level roles')
      return
    }
    if (!userName.trim() || !userEmail.trim()) {
      toast.error('Provide the user name and email for the grant')
      return
    }
    store.grantRole(group.id, {
      userName: userName.trim(),
      userEmail: userEmail.trim(),
      companyId: companyId || null,
      role: grantRole,
    })
    setUserName('')
    setUserEmail('')
  }

  const handleRevoke = (grantId: string) => {
    if (!canManage) {
      toast.error('AUTH_001 — only the owning Group Company Admin or a Platform Admin can revoke group-level roles')
      return
    }
    store.revokeRole(grantId)
  }

  return (
    <Card className='gap-3 border-gray-200 py-4'>
      <CardHeader className='px-4'>
        <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
          Group-level roles — without an explicit grant, cross-company access is rejected
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4 px-4'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Home company</TableHead>
              <TableHead>Granted by / on</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grants.map((g) => (
              <TableRow key={g.id}>
                <TableCell>
                  <div className='flex flex-col'>
                    <span className='text-sm font-medium'>{g.userName}</span>
                    <span className='text-paragraph-sm text-neutral-1000'>{g.userEmail}</span>
                  </div>
                </TableCell>
                <TableCell className='text-sm'>{g.role}</TableCell>
                <TableCell className='text-sm'>{store.companyName(g.companyId)}</TableCell>
                <TableCell className='text-paragraph-sm text-neutral-1000'>
                  {g.grantedBy} · {g.grantedOn}
                </TableCell>
                <TableCell>
                  {g.revoked ? (
                    <Badge variant='badge_inactive'>Revoked {g.revokedOn}</Badge>
                  ) : (
                    <Badge variant='badge_active'>Active</Badge>
                  )}
                </TableCell>
                <TableCell className='text-right'>
                  {!g.revoked && (
                    <Button
                      variant='outline'
                      size='sm'
                      className='h-7'
                      onClick={() => handleRevoke(g.id)}
                    >
                      Revoke
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {grants.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className='text-neutral-1000 text-center'>
                  No group-level roles granted — all cross-company access is denied
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className='flex flex-wrap items-end gap-3 rounded-md border border-gray-200 bg-white p-3'>
          <div className='flex flex-col gap-1'>
            <span className='text-paragraph-sm text-neutral-1000'>Name</span>
            <Input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder='e.g. Jordan Avery'
              className='h-8 w-40'
            />
          </div>
          <div className='flex flex-col gap-1'>
            <span className='text-paragraph-sm text-neutral-1000'>Email</span>
            <Input
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder='e.g. user@company.in'
              className='h-8 w-56'
            />
          </div>
          <div className='flex flex-col gap-1'>
            <span className='text-paragraph-sm text-neutral-1000'>Home company</span>
            <Select value={companyId} onValueChange={setCompanyId}>
              <SelectTrigger variant='secondary' className='h-8 w-52'>
                <SelectValue placeholder='Member company' />
              </SelectTrigger>
              <SelectContent>
                {memberCompanies.map(
                  (c) =>
                    c && (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    )
                )}
              </SelectContent>
            </Select>
          </div>
          <div className='flex flex-col gap-1'>
            <span className='text-paragraph-sm text-neutral-1000'>Group-level role</span>
            <Select value={grantRole} onValueChange={(v) => setGrantRole(v as GroupLevelRole)}>
              <SelectTrigger variant='secondary' className='h-8 w-56'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GROUP_LEVEL_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button size='sm' className='h-8' onClick={handleGrant}>
            Grant role
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
