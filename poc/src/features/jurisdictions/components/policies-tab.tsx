import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { RoleGate } from '@/context/role-context'
import { type Jurisdiction } from '../data/jurisdictions'
import { type JurisdictionPolicy } from '../data/assignments'
import { type AssignmentsStore } from '../hooks/use-assignments'
import { JurisdictionPickerDialog } from './jurisdiction-picker-dialog'

interface PoliciesTabProps {
  store: AssignmentsStore
  catalog: Jurisdiction[]
}

/**
 * Jurisdiction as policy applicability criteria (JUR-05): each policy is
 * scoped to one or more catalog jurisdictions; names resolve live from the
 * catalog so updates there are reflected here (JUR-07). Company Admin edits
 * criteria; evaluation outcomes are shown in the Rules engine simulator.
 */
export function PoliciesTab({ store, catalog }: PoliciesTabProps) {
  const [editing, setEditing] = useState<JurisdictionPolicy | null>(null)

  const catalogById = useMemo(
    () => new Map(catalog.map((j) => [j.id, j])),
    [catalog]
  )

  return (
    <div className='w-full space-y-4'>
      <div>
        <h2 className='text-neutral-1600 text-paragraph-md mb-1 font-medium'>
          Policies with jurisdiction applicability criteria (
          {store.policies.length})
        </h2>
        <p className='text-paragraph-sm text-neutral-1000'>
          When a policy is evaluated it applies only where the employee or
          operation falls inside its jurisdiction criteria — anything outside
          does not apply. Criteria always reference the current catalog entry.
        </p>
      </div>

      <div className='rounded-md border border-gray-200 bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Policy</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Applies in (jurisdiction criteria)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className='w-[120px]' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {store.policies.map((policy) => (
              <TableRow key={policy.id}>
                <TableCell className='font-medium'>
                  {policy.name}
                  <span className='text-neutral-1000 block text-xs'>
                    {policy.owner}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant='pending'>{policy.module}</Badge>
                </TableCell>
                <TableCell>
                  <div className='flex flex-wrap gap-1.5'>
                    {policy.jurisdictionIds.map((jid) => {
                      const j = catalogById.get(jid)
                      return (
                        <Badge
                          key={jid}
                          variant={j?.status === 'inactive' ? 'dropped' : 'open'}
                        >
                          {j?.name ?? 'Removed from catalog'}
                          {j?.status === 'inactive' && ' · inactive'}
                        </Badge>
                      )
                    })}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      policy.status === 'active' ? 'badge_active' : 'pending'
                    }
                  >
                    {policy.status === 'active' ? 'Active' : 'Draft'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <RoleGate roles={['Company Admin', 'Platform Admin']}>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setEditing(policy)}
                    >
                      Edit criteria
                    </Button>
                  </RoleGate>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <RoleGate roles={['Company Admin', 'Platform Admin']} fallback={
        <p className='text-paragraph-sm text-neutral-1000'>
          Policy applicability criteria are maintained by Company Admins.
        </p>
      }>
        <p className='text-paragraph-sm text-neutral-1000'>
          Tip: run the Rules engine simulator in the Rule Packs tab to see
          which of these policies apply for a given company, employee and
          date.
        </p>
      </RoleGate>

      <JurisdictionPickerDialog
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
        title={`${editing?.name ?? ''} — applicability criteria`}
        description='Select the catalog jurisdictions this policy applies to. It will not apply outside these.'
        catalog={catalog}
        selectedIds={editing?.jurisdictionIds ?? []}
        onSave={(ids) =>
          editing ? store.setPolicyJurisdictions(editing.id, ids) : false
        }
      />
    </div>
  )
}
