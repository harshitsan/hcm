import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { RoleGate } from '@/context/role-context'
import {
  type FieldDefinition,
  type FieldVersionEntry,
} from '../data/custom-fields'
import { valueAsOf } from '../data/field-engine'
import { type ValueHistoryEntry } from '../data/records'
import { PortfolioOversightPanel, TenantIsolationPanel } from './oversight-panels'

interface GovernanceTabProps {
  fields: FieldDefinition[]
  versions: FieldVersionEntry[]
  valueHistory: ValueHistoryEntry[]
}

const today = () => new Date().toISOString().slice(0, 10)

/**
 * Governance & history: versioned definitions (L2), bitemporal value history
 * with as-of queries (L1), portfolio/group oversight, and tenant isolation.
 */
export function GovernanceTab({
  fields,
  versions,
  valueHistory,
}: GovernanceTabProps) {
  const [asOf, setAsOf] = useState(today())

  /** Distinct (record, field) pairs that have history, resolved as-of. */
  const asOfRows = useMemo(() => {
    const seen = new Set<string>()
    const rows: {
      key: string
      recordName: string
      fieldName: string
      value: string | null
    }[] = []
    for (const h of valueHistory) {
      const key = `${h.recordId}|${h.fieldId}`
      if (seen.has(key)) continue
      seen.add(key)
      rows.push({
        key,
        recordName: h.recordName,
        fieldName: h.fieldName,
        value: valueAsOf(valueHistory, h.recordId, h.fieldId, asOf),
      })
    }
    return rows
  }, [valueHistory, asOf])

  return (
    <div className='space-y-4'>
      <Card className='gap-3 py-4'>
        <CardHeader>
          <CardTitle className='text-paragraph-md'>
            Field definition versions (governed config — no code deployment)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Field</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>What changed</TableHead>
                <TableHead>Effective</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Changed by</TableHead>
                <TableHead>Changed at</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {versions.map((v) => {
                const scheduled = v.effectiveDate > today()
                const stillExists = fields.some((f) => f.id === v.fieldId)
                return (
                  <TableRow key={v.id}>
                    <TableCell className='font-medium'>
                      {v.fieldName}
                      {!stillExists && (
                        <Badge variant='badge_inactive' className='ml-1.5'>
                          deleted
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant='outline'>v{v.version}</Badge>
                    </TableCell>
                    <TableCell className='max-w-[320px] text-sm'>
                      {v.change}
                    </TableCell>
                    <TableCell>{v.effectiveDate}</TableCell>
                    <TableCell>
                      <Badge variant={scheduled ? 'overdue' : 'badge_active'}>
                        {scheduled ? 'Scheduled' : 'Effective'}
                      </Badge>
                    </TableCell>
                    <TableCell>{v.changedBy}</TableCell>
                    <TableCell>{v.changedAt}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className='gap-3 py-4'>
        <CardHeader className='flex flex-row items-center justify-between'>
          <CardTitle className='text-paragraph-md'>
            Custom value history (bitemporal — corrections never destroy
            earlier versions)
          </CardTitle>
          <div className='flex items-center gap-2'>
            <span className='text-paragraph-sm text-neutral-1000'>
              Query as of:
            </span>
            <Input
              type='date'
              value={asOf}
              onChange={(e) => setAsOf(e.target.value)}
              className='w-[170px]'
            />
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-2 md:grid-cols-2 lg:grid-cols-3'>
            {asOfRows.map((r) => (
              <div
                key={r.key}
                className='rounded-md border border-gray-200 bg-white px-3 py-2'
              >
                <p className='text-paragraph-sm text-neutral-1000'>
                  {r.recordName} · {r.fieldName}
                </p>
                <p className='text-sm font-medium'>
                  {r.value ?? 'No value effective on this date'}
                </p>
              </div>
            ))}
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Record</TableHead>
                <TableHead>Field</TableHead>
                <TableHead>Prior value</TableHead>
                <TableHead>New value</TableHead>
                <TableHead>Effective</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead>Changed by</TableHead>
                <TableHead>Changed at</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {valueHistory.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className='font-medium'>{h.recordName}</TableCell>
                  <TableCell>{h.fieldName}</TableCell>
                  <TableCell>{h.priorValue}</TableCell>
                  <TableCell>{h.newValue}</TableCell>
                  <TableCell>{h.effectiveDate}</TableCell>
                  <TableCell>
                    <Badge variant={h.kind === 'correction' ? 'overdue' : 'open'}>
                      {h.kind}
                    </Badge>
                  </TableCell>
                  <TableCell>{h.changedBy}</TableCell>
                  <TableCell>{h.changedAt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <RoleGate
        roles={['Portfolio Admin', 'Platform Admin', 'Group Company Admin']}
      >
        <PortfolioOversightPanel />
      </RoleGate>

      <RoleGate roles={['Platform Admin']}>
        <TenantIsolationPanel fields={fields} />
      </RoleGate>
    </div>
  )
}
