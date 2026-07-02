import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { RoleGate, useRole } from '@/context/role-context'
import { JURISDICTIONS } from '../../data/employees'
import { type RulePack } from '../../data/configuration'
import { type ConfigurationStore } from '../../hooks/use-configuration'
import { FilterSelect, SectionTitle, StatusBadge } from '../shared'

/**
 * EMP-19/22/23/28 — effective-dated, versioned jurisdiction rule-packs plus
 * the per-jurisdiction statutory field schema. Engines read the effective
 * pack as of the relevant date; publishing needs no code deployment.
 */
export function RulePacksTab({ store }: { store: ConfigurationStore }) {
  const { hasRole } = useRole()
  const [editing, setEditing] = useState<RulePack | null>(null)
  const [draft, setDraft] = useState<RulePack | null>(null)
  const [schemaJurisdiction, setSchemaJurisdiction] = useState('all')

  const openEditor = (pack: RulePack) => {
    setEditing(pack)
    setDraft({ ...pack })
  }

  const publish = () => {
    if (!editing || !draft) return
    store.publishRulePack(editing.id, draft, draft.effectiveFrom)
    setEditing(null)
    setDraft(null)
  }

  const schemaFields = store.schemaFields.filter(
    (f) => schemaJurisdiction === 'all' || f.jurisdiction === schemaJurisdiction
  )

  return (
    <div className='space-y-4'>
      <SectionTitle>Jurisdiction statutory rule-packs</SectionTitle>
      <div className='rounded-md border border-gray-200 bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Jurisdiction</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Effective from</TableHead>
              <TableHead>ESI wage ceiling</TableHead>
              <TableHead>PT slab</TableHead>
              <TableHead>LWF</TableHead>
              <TableHead>Maternity</TableHead>
              <TableHead>Gratuity min.</TableHead>
              <TableHead>EL / CL / SL per yr</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {store.rulePacks.map((p) => (
              <TableRow key={p.id}>
                <TableCell className='font-medium'>{p.jurisdiction}</TableCell>
                <TableCell>
                  <Badge variant='pending'>v{p.version}</Badge>
                </TableCell>
                <TableCell className='text-neutral-1000'>
                  {p.effectiveFrom}
                </TableCell>
                <TableCell>₹{p.esiWageCeiling.toLocaleString('en-IN')}</TableCell>
                <TableCell className='text-neutral-1000 max-w-[180px] truncate'>
                  {p.ptSlab}
                </TableCell>
                <TableCell>{p.lwfApplicable ? 'Yes' : 'No'}</TableCell>
                <TableCell>{p.maternityWeeks} weeks</TableCell>
                <TableCell>{p.gratuityMinYears} yrs</TableCell>
                <TableCell className='text-neutral-1000'>
                  {p.earnedLeavePerYear} / {p.casualLeavePerYear} /{' '}
                  {p.sickLeavePerYear}
                </TableCell>
                <TableCell>
                  <StatusBadge status={p.status} />
                </TableCell>
                <TableCell>
                  <RoleGate roles={['Platform Admin']}>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => openEditor(p)}
                    >
                      Edit & publish
                    </Button>
                  </RoleGate>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className='rounded-md border border-gray-200 bg-white px-3 py-2'>
        <p className='text-sm font-medium'>Engines driven by these packs</p>
        <p className='text-paragraph-sm text-neutral-1000'>
          The Rules engine determines ESI/PF, maternity and gratuity
          eligibility from these decision tables (rule-pack version and inputs
          recorded per outcome); the Accrual engine computes leave balances
          from the entitlement parameters. Both re-read the effective pack on
          each evaluation — updates apply without code changes.
        </p>
      </div>
      {!hasRole('Platform Admin') && (
        <p className='text-paragraph-sm text-neutral-1000'>
          Rule-packs are governed config maintained by the Platform Admin.
        </p>
      )}

      <SectionTitle>
        Statutory field schema per jurisdiction (dynamic form metadata)
      </SectionTitle>
      <FilterSelect
        label='Jurisdiction'
        value={schemaJurisdiction}
        onChange={setSchemaJurisdiction}
        options={JURISDICTIONS}
      />
      <div className='rounded-md border border-gray-200 bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Jurisdiction</TableHead>
              <TableHead>Field label</TableHead>
              <TableHead>Data type</TableHead>
              <TableHead>Validation</TableHead>
              <TableHead>Mandatory</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schemaFields.map((f) => (
              <TableRow key={f.id}>
                <TableCell>{f.order}</TableCell>
                <TableCell className='text-neutral-1000'>
                  {f.jurisdiction}
                </TableCell>
                <TableCell className='font-medium'>{f.label}</TableCell>
                <TableCell>
                  <Badge variant='pending'>{f.dataType}</Badge>
                </TableCell>
                <TableCell className='text-neutral-1000'>
                  {f.validation}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={f.required}
                    disabled={!hasRole('Platform Admin')}
                    onCheckedChange={() =>
                      store.toggleSchemaFieldRequired(f.id)
                    }
                    aria-label={`Toggle mandatory for ${f.label}`}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className='text-paragraph-sm text-neutral-1000'>
        Definitions are versioned, effective-dated metadata — publishing a
        change re-renders the employee capture form for that jurisdiction
        without code deployment, and mandatory fields are enforced per config.
      </p>

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
        }}
      >
        <DialogContent className='sm:max-w-[420px]'>
          <DialogHeader>
            <DialogTitle>
              {editing?.jurisdiction} — publish v{(editing?.version ?? 0) + 1}
            </DialogTitle>
          </DialogHeader>
          {draft && (
            <div className='space-y-3'>
              {(
                [
                  ['esiWageCeiling', 'ESI wage ceiling (₹/month)'],
                  ['maternityWeeks', 'Maternity benefit (weeks)'],
                  ['gratuityMinYears', 'Gratuity minimum service (years)'],
                  ['earnedLeavePerYear', 'Earned leave entitlement (days/yr)'],
                  ['casualLeavePerYear', 'Casual leave entitlement (days/yr)'],
                  ['sickLeavePerYear', 'Sick leave entitlement (days/yr)'],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className='space-y-1'>
                  <Label>{label}</Label>
                  <Input
                    type='number'
                    value={draft[key]}
                    onChange={(e) =>
                      setDraft((d) =>
                        d ? { ...d, [key]: Number(e.target.value) || 0 } : d
                      )
                    }
                  />
                </div>
              ))}
              <div className='space-y-1'>
                <Label>Effective from</Label>
                <Input
                  type='date'
                  value={draft.effectiveFrom}
                  onChange={(e) =>
                    setDraft((d) =>
                      d ? { ...d, effectiveFrom: e.target.value } : d
                    )
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant='outline' onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={publish}>Publish new version</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
