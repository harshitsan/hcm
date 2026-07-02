import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { useRole } from '@/context/role-context'
import { COMPANIES, companyName, seedEmployees } from '../../data/employees'
import { type DedupScope } from '../../data/configuration'
import { type ConfigurationStore } from '../../hooks/use-configuration'
import { SectionTitle } from '../shared'

type TestResult =
  | { kind: 'clear' }
  | { kind: 'same-company' | 'separate-company'; existing: string }

/**
 * EMP-20/25 — duplicate-detection uniqueness config (per government ID field,
 * with matching scope) plus a Rules-engine evaluation tester that classifies
 * a hit as same-company duplicate (block) vs separate-company record (allow).
 */
export function DedupTab({ store }: { store: ConfigurationStore }) {
  const { hasRole } = useRole()
  const canEdit = hasRole('Platform Admin')

  const [testField, setTestField] = useState<'Aadhar' | 'PAN' | 'Passport'>('PAN')
  const [testValue, setTestValue] = useState('')
  const [testCompany, setTestCompany] = useState(COMPANIES[0].id)
  const [result, setResult] = useState<TestResult | null>(null)

  const runTest = () => {
    const rule = store.dedupRules.find((r) => r.field === testField)
    if (!rule?.enforceUnique) {
      setResult({ kind: 'clear' })
      return
    }
    const hit = seedEmployees.find((e) =>
      testField === 'Aadhar'
        ? e.aadhar === testValue
        : testField === 'PAN'
          ? e.pan === testValue
          : e.passport === testValue
    )
    if (!hit || !testValue) {
      setResult({ kind: 'clear' })
    } else if (hit.companyId === testCompany) {
      setResult({
        kind: 'same-company',
        existing: `${hit.name} (${hit.code}) — ${companyName(hit.companyId)}`,
      })
    } else {
      setResult({
        kind: 'separate-company',
        existing: `${hit.name} (${hit.code}) — ${companyName(hit.companyId)}`,
      })
    }
  }

  return (
    <div className='space-y-4'>
      <SectionTitle>
        Uniqueness rules per government ID (versioned, effective-dated)
      </SectionTitle>
      <div className='rounded-md border border-gray-200 bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Field</TableHead>
              <TableHead>Enforce uniqueness</TableHead>
              <TableHead>Matching scope</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {store.dedupRules.map((r) => (
              <TableRow key={r.id}>
                <TableCell className='font-medium'>{r.field}</TableCell>
                <TableCell>
                  <Switch
                    checked={r.enforceUnique}
                    disabled={!canEdit}
                    onCheckedChange={() =>
                      store.updateDedupRule(r.id, {
                        enforceUnique: !r.enforceUnique,
                      })
                    }
                    aria-label={`Toggle uniqueness for ${r.field}`}
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={r.scope}
                    onValueChange={(v) =>
                      store.updateDedupRule(r.id, { scope: v as DedupScope })
                    }
                    disabled={!canEdit}
                  >
                    <SelectTrigger variant='secondary' className='w-[180px]'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='Within company'>
                        Within company
                      </SelectItem>
                      <SelectItem value='Cross-company'>
                        Cross-company
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <SectionTitle>Matching decision table</SectionTitle>
      <div className='rounded-md border border-gray-200 bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Condition</TableHead>
              <TableHead>Classification</TableHead>
              <TableHead>Engine decision</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>ID matches a record in the same company</TableCell>
              <TableCell>
                <Badge variant='disqualified'>Same-company duplicate</Badge>
              </TableCell>
              <TableCell className='text-neutral-1000'>
                Flag the conflicting field, block save until resolved
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>ID matches a record in another company</TableCell>
              <TableCell>
                <Badge variant='qualified'>Separate-company record</Badge>
              </TableCell>
              <TableCell className='text-neutral-1000'>
                Allow — independent record per company (FR 6.9.1)
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>No match</TableCell>
              <TableCell>
                <Badge variant='pending'>Clear</Badge>
              </TableCell>
              <TableCell className='text-neutral-1000'>Allow save</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <p className='text-paragraph-sm text-neutral-1000'>
        Changes here are governed config — the engine reads them on its next
        evaluation with no code release.
      </p>

      <SectionTitle>Rules-engine evaluation tester</SectionTitle>
      <div className='flex flex-wrap items-end gap-3 rounded-md border border-gray-200 bg-white p-3'>
        <div className='space-y-1'>
          <Label>Field</Label>
          <Select
            value={testField}
            onValueChange={(v) => setTestField(v as typeof testField)}
          >
            <SelectTrigger variant='secondary' className='w-[130px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='Aadhar'>Aadhar</SelectItem>
              <SelectItem value='PAN'>PAN</SelectItem>
              <SelectItem value='Passport'>Passport</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className='space-y-1'>
          <Label>Value (try RIYPI4488D)</Label>
          <Input
            className='w-[180px]'
            value={testValue}
            onChange={(e) => setTestValue(e.target.value)}
            placeholder='ID value'
          />
        </div>
        <div className='space-y-1'>
          <Label>Saving into company</Label>
          <Select value={testCompany} onValueChange={setTestCompany}>
            <SelectTrigger variant='secondary' className='w-[210px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COMPANIES.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button size='sm' onClick={runTest}>
          Evaluate
        </Button>
        {result && (
          <div className='w-full pt-1'>
            {result.kind === 'clear' && (
              <Badge variant='pending'>No collision — save allowed</Badge>
            )}
            {result.kind === 'same-company' && (
              <Badge variant='disqualified'>
                Blocked: same-company duplicate of {result.existing}
              </Badge>
            )}
            {result.kind === 'separate-company' && (
              <Badge variant='qualified'>
                Allowed: valid separate-company record ({result.existing})
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
