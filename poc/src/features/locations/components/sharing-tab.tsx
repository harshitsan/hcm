import { useState } from 'react'
import { ClockCounterClockwise, PencilSimple, Plus, Prohibit } from 'phosphor-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
import { RoleGate, useRole } from '@/context/role-context'
import { GROUP_NAME, type LocationShare } from '../data/locations'
import type { LocationsStore } from '../hooks/use-locations'
import type { OrganizationStore } from '../hooks/use-organization'
import { formatDate } from '../utils/format'
import { ShareStatusBadge } from './location-badges'
import { ShareDialog } from './share-dialog'
import { ShareHistoryDialog } from './share-history-dialog'

interface SharingTabProps {
  store: LocationsStore
  org: OrganizationStore
}

/**
 * Governed sharing configuration for group companies (LOC-04/05/06/13):
 * explicit, versioned, effective-dated shares plus the audit trail of every
 * configuration change. Group Company Admin manages; Platform Admin observes.
 */
export function SharingTab({ store, org }: SharingTabProps) {
  const { role } = useRole()
  const actor = `You (${role})`
  const dateFormat = org.localization.dateFormat

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingShare, setEditingShare] = useState<LocationShare | null>(null)
  const [historyShare, setHistoryShare] = useState<LocationShare | null>(null)
  const [revoking, setRevoking] = useState<LocationShare | null>(null)

  return (
    <div className='w-full space-y-4'>
      <Card className='gap-2 border-none bg-white py-3'>
        <CardHeader className='flex items-center justify-between px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Sharing configuration — {GROUP_NAME} ({store.shares.length})
          </CardTitle>
          <RoleGate roles={['Group Company Admin']}>
            <Button
              variant='red'
              onClick={() => {
                setEditingShare(null)
                setDialogOpen(true)
              }}
              className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
            >
              <Plus size={10} weight='bold' />
              New Sharing Configuration
            </Button>
          </RoleGate>
        </CardHeader>
        <CardContent className='px-4'>
          <p className='text-paragraph-sm text-neutral-1000 mb-3'>
            No location is shared implicitly: references become available only
            after explicit configuration, and only between companies of the
            same group-company structure. Revoking removes the reference for
            all target companies.
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Shared with</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Effective from</TableHead>
                <TableHead>Version</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {store.shares.map((share) => {
                const location = store.locationById.get(share.locationId)
                const status = store.shareStatus(share)
                return (
                  <TableRow key={share.id}>
                    <TableCell>
                      <div className='flex flex-col'>
                        <span className='text-neutral-1600 font-medium'>
                          {location?.name ?? share.locationId}
                        </span>
                        <span className='text-paragraph-sm text-neutral-1000'>
                          {location?.acronym}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className='text-sm'>
                      {store.companyName(location?.companyId ?? '')}
                    </TableCell>
                    <TableCell>
                      <div className='flex flex-wrap gap-1'>
                        {share.targetCompanyIds.length > 0 ? (
                          share.targetCompanyIds.map((id) => (
                            <Badge key={id} variant='open'>
                              {store.companyName(id)}
                            </Badge>
                          ))
                        ) : (
                          <span className='text-paragraph-sm text-neutral-1000'>—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <ShareStatusBadge status={status} />
                    </TableCell>
                    <TableCell className='text-sm'>
                      {formatDate(share.effectiveFrom, dateFormat)}
                    </TableCell>
                    <TableCell className='text-sm'>v{share.version}</TableCell>
                    <TableCell>
                      <div className='flex items-center justify-end gap-2'>
                        <Button
                          variant='icon2'
                          className='text-neutral-1900 h-7 w-7'
                          aria-label='Version history'
                          onClick={() => setHistoryShare(share)}
                        >
                          <ClockCounterClockwise size={16} weight='bold' />
                        </Button>
                        <RoleGate roles={['Group Company Admin']}>
                          <Button
                            variant='icon2'
                            className='text-neutral-1900 h-7 w-7'
                            aria-label='Edit share'
                            disabled={status === 'revoked'}
                            onClick={() => {
                              setEditingShare(share)
                              setDialogOpen(true)
                            }}
                          >
                            <PencilSimple size={16} weight='fill' />
                          </Button>
                          <Button
                            variant='icon2'
                            className='text-red-1400 h-7 w-7'
                            aria-label='Revoke share'
                            disabled={status === 'revoked'}
                            onClick={() => setRevoking(share)}
                          >
                            <Prohibit size={16} weight='bold' />
                          </Button>
                        </RoleGate>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Audit trail (LOC-06) */}
      <Card className='gap-2 border-none bg-white py-3'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Audit trail ({store.audit.length})
          </CardTitle>
        </CardHeader>
        <CardContent className='px-4'>
          <div className='space-y-2'>
            {store.audit.map((entry) => (
              <div
                key={entry.id}
                className='flex items-start gap-3 rounded-[6px] border border-gray-200 p-3'
              >
                <Badge
                  variant={entry.action.includes('revoked') ? 'dropped' : 'open'}
                  className='mt-0.5 shrink-0'
                >
                  {entry.action}
                </Badge>
                <div className='min-w-0'>
                  <p className='text-neutral-1900 text-sm'>{entry.detail}</p>
                  <p className='text-paragraph-sm text-neutral-1000'>
                    {entry.actor} · {formatDate(entry.timestamp.slice(0, 10), dateFormat)}{' '}
                    · {entry.locationId}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <ShareDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingShare(null)
        }}
        store={store}
        share={editingShare}
        actor={actor}
      />

      <ShareHistoryDialog
        open={historyShare !== null}
        onOpenChange={(open) => {
          if (!open) setHistoryShare(null)
        }}
        share={historyShare}
        store={store}
        dateFormat={dateFormat}
      />

      <AlertDialog
        open={revoking !== null}
        onOpenChange={(open) => {
          if (!open) setRevoking(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke sharing?</AlertDialogTitle>
            <AlertDialogDescription>
              Referencing companies will immediately lose the ability to
              reference{' '}
              {revoking
                ? (store.locationById.get(revoking.locationId)?.name ?? 'this location')
                : 'this location'}
              . The change is recorded as a new version and an audit entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (revoking) store.revokeShare(revoking.id, actor)
                setRevoking(null)
              }}
              className='bg-destructive hover:bg-destructive/90 text-white'
            >
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
