import { useState } from 'react'
import { toast } from 'sonner'
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
import { useRole } from '@/context/role-context'
import { TENANTS, type FieldDefinition } from '../data/custom-fields'
import { seedPortfolio } from '../data/records'
import { ScopeBadge } from './field-badges'

/**
 * Portfolio / group governance: definitions across companies, platform-field
 * coverage, and deviations from standards surfaced for action.
 */
export function PortfolioOversightPanel() {
  const { role } = useRole()
  const rows =
    role === 'Group Company Admin'
      ? seedPortfolio.filter((c) => c.group === 'Acme Group')
      : seedPortfolio

  return (
    <Card className='gap-3 py-4'>
      <CardHeader>
        <CardTitle className='text-paragraph-md'>
          {role === 'Group Company Admin'
            ? 'Group companies — field configuration review'
            : 'Portfolio oversight — definitions across companies'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Company fields</TableHead>
              <TableHead>Platform coverage</TableHead>
              <TableHead>Deviations</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((c) => {
              const consistent =
                c.platformFieldsApplied === c.platformFieldsTotal &&
                c.deviations.length === 0
              return (
                <TableRow key={c.id}>
                  <TableCell className='font-medium'>{c.company}</TableCell>
                  <TableCell>{c.group}</TableCell>
                  <TableCell>{c.companyFieldCount}</TableCell>
                  <TableCell>
                    <Badge variant={consistent ? 'badge_active' : 'overdue'}>
                      {c.platformFieldsApplied}/{c.platformFieldsTotal}{' '}
                      {consistent ? 'consistent' : 'drift'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {c.deviations.length === 0 ? (
                      <span className='text-neutral-1000 text-sm'>None</span>
                    ) : (
                      <div className='flex flex-col gap-1'>
                        {c.deviations.map((d) => (
                          <Badge key={d} variant='dropped'>
                            {d}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {c.deviations.length > 0 && (
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() =>
                          toast.success(
                            `Governance action raised for ${c.company}`
                          )
                        }
                      >
                        Flag for governance
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

/**
 * Tenant isolation (RLS) demo: values are partitioned per owning tenant —
 * switching the query context hides every other tenant's values.
 */
export function TenantIsolationPanel({
  fields,
}: {
  fields: FieldDefinition[]
}) {
  const [tenant, setTenant] = useState<string>(TENANTS[0])
  const companyFields = fields.filter((f) => f.scope !== 'Platform')

  return (
    <Card className='gap-3 py-4'>
      <CardHeader className='flex flex-row items-center justify-between'>
        <CardTitle className='text-paragraph-md'>
          Tenant-scoped storage & row-level security
        </CardTitle>
        <div className='flex items-center gap-2'>
          <span className='text-paragraph-sm text-neutral-1000'>
            Query context:
          </span>
          <Select value={tenant} onValueChange={setTenant}>
            <SelectTrigger variant='secondary' className='w-[210px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TENANTS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className='space-y-3'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Field</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Owning tenant</TableHead>
              <TableHead>Visible under “{tenant}”?</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companyFields.map((f) => {
              const visible =
                f.owner === tenant ||
                (f.scope === 'Group' && tenant === 'Acme Manufacturing')
              return (
                <TableRow key={f.id}>
                  <TableCell className='font-medium'>{f.name}</TableCell>
                  <TableCell>
                    <ScopeBadge scope={f.scope} />
                  </TableCell>
                  <TableCell>{f.owner}</TableCell>
                  <TableCell>
                    <Badge variant={visible ? 'badge_active' : 'dropped'}>
                      {visible ? 'Readable & writable' : 'Isolated by RLS'}
                    </Badge>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        <p className='text-paragraph-sm text-neutral-1000 rounded-md border border-gray-200 bg-white p-3'>
          Platform-scope fields span all tenants, but their VALUES are still
          partitioned and returned only within the owning tenant's scope.
          Every stored value keeps referential integrity to both its field
          definition and its host record.
        </p>
      </CardContent>
    </Card>
  )
}
