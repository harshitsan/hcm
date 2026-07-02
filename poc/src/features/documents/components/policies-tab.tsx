import { useMemo, useState } from 'react'
import { Eye, PencilSimple, Plus, Trash } from 'phosphor-react'
import { useRole } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  policyAppliesToCurrentEmployee,
  policyIsActive,
  type PolicyDocument,
} from '../data/masters'
import { CURRENT_EMPLOYEE, todayIso } from '../data/org'
import { type MastersStore } from '../hooks/use-masters'
import { PolicyOverlay } from './policy-overlay'
import { PolicyStatusBadge } from './status-badges'

interface PoliciesTabProps {
  masters: MastersStore
}

/**
 * Policy documents (DOC-32..35): admins publish policies with effective
 * windows, applicability, and excluded position levels; the Active/Inactive
 * + name search bar applies on Search and clears on Reset (DOC-35).
 * Employees see only policies applicable to them and can preview content
 * with applicability and exclusions shown (DOC-34).
 */
export function PoliciesTab({ masters }: PoliciesTabProps) {
  const { role } = useRole()
  const isEmployee =
    role === 'Employee (User)' || role === 'Employee (Non-User)'
  const canManage = role === 'Company Admin'

  const [draftStatus, setDraftStatus] = useState('All')
  const [draftName, setDraftName] = useState('')
  const [applied, setApplied] = useState({ status: 'All', name: '' })
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [editing, setEditing] = useState<PolicyDocument | null>(null)
  const [preview, setPreview] = useState<PolicyDocument | null>(null)

  const today = todayIso()

  const policies = useMemo(() => {
    let list = masters.policies
    if (isEmployee) {
      list = list.filter((p) => policyAppliesToCurrentEmployee(p, today))
    }
    if (applied.status !== 'All') {
      const wantActive = applied.status === 'Active'
      list = list.filter((p) => policyIsActive(p, today) === wantActive)
    }
    if (applied.name.trim()) {
      const q = applied.name.trim().toLowerCase()
      list = list.filter((p) => p.name.toLowerCase().includes(q))
    }
    return list
  }, [masters.policies, isEmployee, applied, today])

  return (
    <div className='w-full'>
      {!isEmployee && (
        <div className='mb-3 flex flex-wrap items-center gap-2'>
          <Select value={draftStatus} onValueChange={setDraftStatus}>
            <SelectTrigger variant='secondary' className='h-7 w-[150px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='All'>All statuses</SelectItem>
              <SelectItem value='Active'>Active</SelectItem>
              <SelectItem value='Inactive'>Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder='Search by policy name'
            className='h-7 w-[220px]'
          />
          <Button
            className='h-7 px-3'
            onClick={() => setApplied({ status: draftStatus, name: draftName })}
          >
            Search
          </Button>
          <Button
            variant='outline'
            className='h-7 px-3'
            onClick={() => {
              setDraftStatus('All')
              setDraftName('')
              setApplied({ status: 'All', name: '' })
            }}
          >
            Reset
          </Button>
        </div>
      )}

      <div className='mb-3 flex items-center justify-between'>
        <div>
          <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
            {isEmployee ? 'Policies applicable to me' : 'Policy documents'} (
            {policies.length})
          </h2>
          {isEmployee && (
            <p className='text-paragraph-sm text-neutral-1000'>
              Showing active policies for {CURRENT_EMPLOYEE.department} /
              level {CURRENT_EMPLOYEE.positionLevel}. Policies excluding your
              position level or outside their effective period are hidden.
            </p>
          )}
        </div>
        {canManage && (
          <Button
            variant='red'
            onClick={() => {
              setEditing(null)
              setOverlayOpen(true)
            }}
            className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
          >
            <Plus size={10} weight='bold' />
            New Policy
          </Button>
        )}
      </div>

      <div className='rounded-md border bg-white'>
        <Table>
          <TableHeader>
            <TableRow className='bg-gray-50'>
              <TableHead>Policy</TableHead>
              <TableHead>Effective from</TableHead>
              <TableHead>Effective till</TableHead>
              <TableHead>Applicability</TableHead>
              <TableHead>Excluded levels</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {policies.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className='text-neutral-1000 h-24 text-center'
                >
                  No policies match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              policies.map((policy) => (
                <TableRow key={policy.id}>
                  <TableCell className='text-sm font-medium'>
                    {policy.name}
                  </TableCell>
                  <TableCell className='text-sm'>
                    {policy.effectiveFrom}
                  </TableCell>
                  <TableCell className='text-sm'>
                    {policy.effectiveTill ?? 'Open-ended'}
                  </TableCell>
                  <TableCell className='text-sm'>
                    {policy.applicability}
                  </TableCell>
                  <TableCell>
                    <div className='flex flex-wrap gap-1'>
                      {policy.excludedPositionLevels.length === 0 ? (
                        <span className='text-paragraph-sm text-neutral-1000'>
                          None
                        </span>
                      ) : (
                        policy.excludedPositionLevels.map((level) => (
                          <Badge key={level} variant='dropped'>
                            {level}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <PolicyStatusBadge active={policyIsActive(policy, today)} />
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center justify-end gap-2'>
                      <Button
                        variant='icon2'
                        className='text-neutral-1900 h-7 w-7'
                        aria-label='Preview'
                        onClick={() => setPreview(policy)}
                      >
                        <Eye size={16} weight='bold' />
                      </Button>
                      {canManage && (
                        <>
                          <Button
                            variant='icon2'
                            className='text-neutral-1900 h-7 w-7'
                            aria-label='Edit'
                            onClick={() => {
                              setEditing(policy)
                              setOverlayOpen(true)
                            }}
                          >
                            <PencilSimple size={16} weight='fill' />
                          </Button>
                          <Button
                            variant='icon2'
                            className='text-neutral-1900 h-7 w-7'
                            aria-label='Delete'
                            onClick={() => masters.deletePolicy(policy.id)}
                          >
                            <Trash size={16} weight='bold' />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PolicyOverlay
        open={overlayOpen}
        onOpenChange={(open) => {
          setOverlayOpen(open)
          if (!open) setEditing(null)
        }}
        policy={editing}
        onSubmit={(draft) => {
          if (editing) masters.updatePolicy(editing.id, draft)
          else masters.addPolicy(draft)
        }}
      />

      <Dialog open={Boolean(preview)} onOpenChange={() => setPreview(null)}>
        <DialogContent className='sm:max-w-[520px]'>
          <DialogHeader>
            <DialogTitle>{preview?.name}</DialogTitle>
            <DialogDescription>
              Effective {preview?.effectiveFrom} –{' '}
              {preview?.effectiveTill ?? 'open-ended'} · Applies to:{' '}
              {preview?.applicability}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-3'>
            <p className='text-neutral-1600 text-sm whitespace-pre-line'>
              {preview?.content}
            </p>
            <div>
              <p className='text-neutral-1600 mb-1 text-sm font-medium'>
                Excluded position levels
              </p>
              <div className='flex flex-wrap gap-1'>
                {preview && preview.excludedPositionLevels.length > 0 ? (
                  preview.excludedPositionLevels.map((level) => (
                    <Badge key={level} variant='dropped'>
                      {level}
                    </Badge>
                  ))
                ) : (
                  <span className='text-paragraph-sm text-neutral-1000'>
                    None — applies at every level
                  </span>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
