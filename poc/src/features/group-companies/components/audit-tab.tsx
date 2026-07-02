import { useState } from 'react'
import { RoleGate } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { AUDIT_CATEGORIES, type AuditCategory } from '../data/audit'
import { type AuditStore } from '../hooks/use-audit'

const CATEGORY_LABELS: Record<AuditCategory, string> = {
  construct: 'Construct',
  membership: 'Membership',
  config: 'Configuration',
  'role-grant': 'Role grant',
  'admin-action': 'Admin action',
  location: 'Location',
  policy: 'Policy',
  reporting: 'Reporting',
  directory: 'Directory',
}

interface AuditTabProps {
  audit: AuditStore
}

/**
 * Tamper-evident audit trail for every shared-scenario and cross-company
 * action (GRP-05, GRP-08). Each entry chains a hash from the previous one,
 * so reviewers can verify nothing was omitted or altered.
 */
export function AuditTab({ audit }: AuditTabProps) {
  const [category, setCategory] = useState<'all' | AuditCategory>('all')

  const entries =
    category === 'all'
      ? audit.entries
      : audit.entries.filter((e) => e.category === category)

  return (
    <div className='w-full space-y-4'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='flex items-center gap-3'>
          <span className='text-paragraph-sm text-neutral-1000'>Category</span>
          <Select
            value={category}
            onValueChange={(v) => setCategory(v as 'all' | AuditCategory)}
          >
            <SelectTrigger variant='secondary' className='h-8 w-48'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All categories</SelectItem>
              {AUDIT_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant='open'>
            {entries.length} of {audit.entries.length} entries
          </Badge>
        </div>
        <Button variant='outline' size='sm' className='h-8' onClick={audit.verifyChain}>
          Verify chain integrity
        </Button>
      </div>

      <RoleGate roles={['Platform Admin']}>
        <Card className='gap-2 border-gray-200 py-3'>
          <CardHeader className='px-4'>
            <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
              Platform enforcement (GRP-08)
            </CardTitle>
          </CardHeader>
          <CardContent className='px-4'>
            <p className='text-paragraph-sm text-neutral-1000'>
              Row-level security filters constrain returned data at the data
              layer even if a feature bypasses application logic, and every
              cross-company read, report and search event is recorded here with
              actor, company scope and timestamp. Records are retained and
              chained for tamper evidence.
            </p>
          </CardContent>
        </Card>
      </RoleGate>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead>Actor</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Target company</TableHead>
            <TableHead>Group</TableHead>
            <TableHead>Detail</TableHead>
            <TableHead>Chain hash</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((e) => (
            <TableRow key={e.id}>
              <TableCell className='text-sm whitespace-nowrap'>{e.timestamp}</TableCell>
              <TableCell>
                <div className='flex flex-col'>
                  <span className='text-sm'>{e.actor}</span>
                  <span className='text-paragraph-sm text-neutral-1000'>{e.actorRole}</span>
                </div>
              </TableCell>
              <TableCell className='font-mono text-xs font-medium'>{e.action}</TableCell>
              <TableCell>
                <Badge variant='pending'>{CATEGORY_LABELS[e.category]}</Badge>
              </TableCell>
              <TableCell className='text-sm'>{e.targetCompany ?? '—'}</TableCell>
              <TableCell className='font-mono text-xs'>{e.groupCode ?? '—'}</TableCell>
              <TableCell className='text-paragraph-sm text-neutral-1000 max-w-md'>
                {e.detail}
              </TableCell>
              <TableCell className='font-mono text-xs'>{e.hash}</TableCell>
            </TableRow>
          ))}
          {entries.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className='text-neutral-1000 text-center'>
                No audit entries in this category yet
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
