import { toast } from 'sonner'
import { useRole } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { activeMemberships, PERSONAS } from '../data/group-companies'
import { type SharedLocation } from '../data/sharing'
import { type GroupCompaniesStore } from '../hooks/use-group-companies'
import { type SharedLocationsStore } from '../hooks/use-shared-locations'
import { ReferenceStatusBadge } from './group-badges'

const MATRIX: { action: string; owner: string; referencing: string }[] = [
  { action: 'Create / edit location', owner: 'Allowed', referencing: 'Not allowed' },
  { action: 'View details (address, contact)', owner: 'Allowed', referencing: 'With approval' },
  { action: 'Use in employee assignment', owner: 'Allowed', referencing: 'Allowed (approved refs)' },
  { action: 'Remove reference', owner: 'N/A', referencing: 'Allowed' },
]

interface LocationsTabProps {
  store: GroupCompaniesStore
  locations: SharedLocationsStore
}

/**
 * Shared locations across related companies (GRP-03/24). The owner keeps
 * control (share, approve, edit); member companies reference with explicit
 * approval and every use is audited. Sharing is scoped to the construct.
 */
export function LocationsTab({ store, locations }: LocationsTabProps) {
  const { role } = useRole()
  const persona = PERSONAS[role]
  const myCompanyId = persona.companyId
  const isPlatform = role === 'Platform Admin'

  const groupOf = (loc: SharedLocation) => store.groups.find((g) => g.id === loc.groupId)

  const isOwner = (loc: SharedLocation) =>
    isPlatform || (myCompanyId !== null && myCompanyId === loc.ownerCompanyId)

  const canRequest = (loc: SharedLocation) => {
    const group = groupOf(loc)
    if (!group || !myCompanyId || myCompanyId === loc.ownerCompanyId) return false
    return activeMemberships(group).some((m) => m.companyId === myCompanyId)
  }

  return (
    <div className='w-full space-y-4'>
      <Card className='gap-3 border-gray-200 py-4'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Shared-location permission matrix (owner vs referencing company)
          </CardTitle>
        </CardHeader>
        <CardContent className='px-4'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Owning company</TableHead>
                <TableHead>Referencing company</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MATRIX.map((r) => (
                <TableRow key={r.action}>
                  <TableCell className='text-sm font-medium'>{r.action}</TableCell>
                  <TableCell className='text-sm'>{r.owner}</TableCell>
                  <TableCell className='text-sm'>{r.referencing}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {locations.locations.map((loc) => {
        const group = groupOf(loc)
        const owner = isOwner(loc)
        const sharingEnabled = group?.sharedLocations ?? false
        return (
          <Card key={loc.id} className='gap-2 border-gray-200 py-4'>
            <CardHeader className='flex flex-wrap items-center justify-between gap-2 px-4'>
              <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
                {loc.name}
                <span className='text-paragraph-sm text-neutral-1000 ml-2 font-normal'>
                  {loc.address} · {loc.contact}
                </span>
              </CardTitle>
              <div className='flex items-center gap-2'>
                <Badge variant='open'>Owner: {store.companyName(loc.ownerCompanyId)}</Badge>
                <Badge variant={loc.shared ? 'completed' : 'pending'}>
                  {loc.shared ? 'Shared with group' : 'Not shared'}
                </Badge>
                <Badge variant={sharingEnabled ? 'qualified' : 'badge_inactive'}>
                  {group?.code} · locations {sharingEnabled ? 'authorized' : 'not authorized'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className='space-y-2 px-4'>
              <div className='flex flex-wrap gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  className='h-7'
                  onClick={() =>
                    owner
                      ? toast.success(`${loc.name} details updated by its owner`)
                      : toast.error('Denied — only the owning company can edit a location')
                  }
                >
                  Edit location
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  className='h-7'
                  onClick={() => {
                    if (!owner) {
                      toast.error('Denied — only the owning company can share or withdraw a location')
                      return
                    }
                    if (!sharingEnabled && !loc.shared) {
                      toast.error(`Denied — shared locations are not authorized for ${group?.code}`)
                      return
                    }
                    locations.toggleShare(loc.id, group?.code ?? '')
                  }}
                >
                  {loc.shared ? 'Withdraw from group' : 'Share with group'}
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  className='h-7'
                  onClick={() => {
                    if (!sharingEnabled) {
                      toast.error(`Denied — shared locations are not authorized for ${group?.code}`)
                      return
                    }
                    if (!canRequest(loc)) {
                      toast.error('Denied — only member companies of this construct (other than the owner) can request a reference')
                      return
                    }
                    locations.requestReference(loc.id, myCompanyId as string, group?.code ?? '')
                  }}
                >
                  Request reference (as {myCompanyId ? store.companyName(myCompanyId) : 'platform'})
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  className='h-7'
                  onClick={() =>
                    locations.assignEmployee(
                      loc.id,
                      null,
                      loc.ownerCompanyId,
                      group?.code ?? ''
                    )
                  }
                  disabled={!owner}
                >
                  Assign employee (owner)
                </Button>
              </div>

              {loc.references.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Referencing company</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Requested / decided</TableHead>
                      <TableHead>Assigned employees</TableHead>
                      <TableHead className='text-right'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loc.references.map((ref) => {
                      const refIsMine = myCompanyId === ref.companyId
                      return (
                        <TableRow key={ref.id}>
                          <TableCell className='text-sm font-medium'>
                            {store.companyName(ref.companyId)}
                          </TableCell>
                          <TableCell>
                            <ReferenceStatusBadge status={ref.status} />
                          </TableCell>
                          <TableCell className='text-paragraph-sm text-neutral-1000'>
                            {ref.requestedOn} / {ref.decidedOn ?? '—'}
                          </TableCell>
                          <TableCell className='text-sm'>{ref.assignedEmployees}</TableCell>
                          <TableCell className='space-x-2 text-right'>
                            {ref.status === 'Pending' && owner && (
                              <>
                                <Button
                                  size='sm'
                                  className='h-7'
                                  onClick={() =>
                                    locations.decideReference(loc.id, ref.id, true, group?.code ?? '')
                                  }
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant='outline'
                                  size='sm'
                                  className='h-7'
                                  onClick={() =>
                                    locations.decideReference(loc.id, ref.id, false, group?.code ?? '')
                                  }
                                >
                                  Deny
                                </Button>
                              </>
                            )}
                            {ref.status === 'Approved' && (refIsMine || isPlatform) && (
                              <>
                                <Button
                                  variant='outline'
                                  size='sm'
                                  className='h-7'
                                  onClick={() =>
                                    locations.assignEmployee(loc.id, ref.id, ref.companyId, group?.code ?? '')
                                  }
                                >
                                  Assign employee
                                </Button>
                                <Button
                                  variant='outline'
                                  size='sm'
                                  className='h-7'
                                  onClick={() =>
                                    locations.removeReference(loc.id, ref.id, group?.code ?? '')
                                  }
                                >
                                  Remove reference
                                </Button>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className='text-paragraph-sm text-neutral-1000'>
                  No references — companies outside the construct are denied access.
                </p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
