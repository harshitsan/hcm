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
import {
  membershipsAsOf,
  type GroupCompany,
  type RelationshipType,
} from '../data/group-companies'
import { type GroupCompaniesStore } from '../hooks/use-group-companies'
import { CompanyStatusBadge } from './group-badges'

const RELATIONSHIP_OPTIONS: RelationshipType[] = [
  'Subsidiary',
  'Sister Concern',
  'JV Partner',
  'Affiliated Entity',
]

interface MembersPanelProps {
  group: GroupCompany
  store: GroupCompaniesStore
  /** Manage Group / Add-Remove Members permitted (own group or Platform Admin). */
  canManage: boolean
}

/**
 * Effective-dated membership panel for the selected construct (GRP-01/12/22).
 * Shows history rows (ended memberships), supports an as-of date query, and
 * gates add/remove behind the §7.1 RBAC matrix.
 */
export function MembersPanel({ group, store, canManage }: MembersPanelProps) {
  const today = new Date().toISOString().slice(0, 10)
  const [asOf, setAsOf] = useState(today)
  const [newCompanyId, setNewCompanyId] = useState('')
  const [relationship, setRelationship] = useState<RelationshipType>('Subsidiary')
  const [effectiveFrom, setEffectiveFrom] = useState(today)

  const visible = membershipsAsOf(group, asOf)
  const history = group.memberships.filter((m) => m.effectiveTo)

  const handleAdd = () => {
    if (!canManage) {
      toast.error('AUTH_001 — only the Group Company Admin of this group or a Platform Admin can add members')
      return
    }
    if (!newCompanyId) {
      toast.error('Select a company to add')
      return
    }
    if (store.addMember(group.id, newCompanyId, relationship, effectiveFrom)) {
      setNewCompanyId('')
    }
  }

  const handleRemove = (membershipId: string) => {
    if (!canManage) {
      toast.error('AUTH_001 — only the Group Company Admin of this group or a Platform Admin can remove members')
      return
    }
    store.removeMember(group.id, membershipId)
  }

  return (
    <Card className='mt-4 gap-3 border-gray-200 py-4'>
      <CardHeader className='flex flex-wrap items-center justify-between gap-2 px-4'>
        <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
          {group.code} — members ({visible.length} effective on {asOf}) ·
          tenant {group.tenantId}
        </CardTitle>
        <div className='flex items-center gap-2'>
          <span className='text-paragraph-sm text-neutral-1000'>View as of</span>
          <Input
            type='date'
            value={asOf}
            onChange={(e) => setAsOf(e.target.value)}
            className='h-8 w-40'
          />
        </div>
      </CardHeader>
      <CardContent className='space-y-4 px-4'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Relationship</TableHead>
              <TableHead>Company status</TableHead>
              <TableHead>Effective from</TableHead>
              <TableHead>Effective to</TableHead>
              <TableHead>Added by</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((m) => {
              const company = store.companies.find((c) => c.id === m.companyId)
              return (
                <TableRow key={m.id}>
                  <TableCell className='font-medium'>
                    {store.companyName(m.companyId)}
                    {group.parentCompanyId === m.companyId && (
                      <Badge variant='open' className='ml-2'>Parent</Badge>
                    )}
                  </TableCell>
                  <TableCell>{m.relationshipType}</TableCell>
                  <TableCell>
                    {company ? <CompanyStatusBadge status={company.status} /> : '—'}
                  </TableCell>
                  <TableCell>{m.effectiveFrom}</TableCell>
                  <TableCell>{m.effectiveTo ?? 'Open'}</TableCell>
                  <TableCell className='text-neutral-1000 text-xs'>{m.addedBy}</TableCell>
                  <TableCell className='text-right'>
                    {!m.effectiveTo && (
                      <Button
                        variant='outline'
                        size='sm'
                        className='h-7'
                        onClick={() => handleRemove(m.id)}
                      >
                        End membership
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
            {visible.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className='text-neutral-1000 text-center'>
                  No memberships were effective on {asOf}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {history.length > 0 && (
          <p className='text-paragraph-sm text-neutral-1000'>
            History preserved: {history.length} ended membership
            {history.length > 1 ? 's' : ''} (
            {history
              .map((m) => `${store.companyName(m.companyId)} → ${m.effectiveTo}`)
              .join('; ')}
            ). Change the as-of date to inspect past composition.
          </p>
        )}

        <div className='flex flex-wrap items-end gap-3 rounded-md border border-gray-200 bg-white p-3'>
          <div className='flex flex-col gap-1'>
            <span className='text-paragraph-sm text-neutral-1000'>Add company</span>
            <Select value={newCompanyId} onValueChange={setNewCompanyId}>
              <SelectTrigger variant='secondary' className='h-8 w-56'>
                <SelectValue placeholder='Select a company' />
              </SelectTrigger>
              <SelectContent>
                {store.companies
                  .filter(
                    (c) => !membershipsAsOf(group, today).some((m) => m.companyId === c.id)
                  )
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} {c.status !== 'Active' ? `(${c.status})` : ''}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className='flex flex-col gap-1'>
            <span className='text-paragraph-sm text-neutral-1000'>Relationship</span>
            <Select
              value={relationship}
              onValueChange={(v) => setRelationship(v as RelationshipType)}
            >
              <SelectTrigger variant='secondary' className='h-8 w-44'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIP_OPTIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='flex flex-col gap-1'>
            <span className='text-paragraph-sm text-neutral-1000'>Effective from</span>
            <Input
              type='date'
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
              className='h-8 w-40'
            />
          </div>
          <Button size='sm' className='h-8' onClick={handleAdd}>
            Add member
          </Button>
          <span className='text-paragraph-sm text-neutral-1000'>
            Validations: active companies only, one group per company
            (GROUP_001), no duplicate membership, effective-dated history.
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
