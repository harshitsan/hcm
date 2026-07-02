import { useState } from 'react'
import { Buildings, LockSimple } from 'phosphor-react'
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
import { COMPANIES, companyName, groupName } from '../data/directory'
import { type SecurityAuditStore } from '../hooks/use-security-audit'
import { type CompanyContextStore } from '../hooks/use-company-context'

/**
 * Secure, explicit company context switching (RSEC-09): the active company
 * is always indicated, switching requires explicit confirmation, only
 * authorized companies are selectable and every switch (or denial) is
 * audit-logged with source and target (RSEC-10).
 */
export function ContextTab({
  store,
  audit,
}: {
  store: CompanyContextStore
  audit: SecurityAuditStore
}) {
  const [pendingTarget, setPendingTarget] = useState<string | null>(null)

  const switchLog = audit.events.filter((e) => e.category === 'Context Switch')

  return (
    <div className='w-full space-y-4'>
      <div className='flex items-center gap-3 rounded-[8px] border border-gray-200 bg-white p-4'>
        <Buildings size={22} weight='bold' className='text-blue-1400 shrink-0' />
        <div className='flex-1'>
          <p className='text-neutral-1000 text-xs'>Active company context</p>
          <p className='text-neutral-1600 text-lg font-semibold'>
            {companyName(store.activeCompanyId)}
          </p>
        </div>
        <Badge variant='badge_active'>Always indicated</Badge>
      </div>

      <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
        <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
          Switch company
          <span className='text-neutral-1000 ml-2 text-xs'>
            explicit confirmation required — no implicit switching; only your
            authorized companies are selectable
          </span>
        </h3>
        <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
          {COMPANIES.map((c) => {
            const authorized = store.authorizedIds.includes(c.id)
            const active = c.id === store.activeCompanyId
            return (
              <div
                key={c.id}
                className='flex items-center justify-between rounded-[6px] border border-gray-200 px-3 py-2'
              >
                <div>
                  <p className='text-neutral-1600 text-sm font-medium'>
                    {c.name}
                  </p>
                  <p className='text-neutral-1000 text-xs'>
                    {groupName(c.groupId)}
                  </p>
                </div>
                {active ? (
                  <Badge variant='badge_active'>Active</Badge>
                ) : authorized ? (
                  <Button
                    variant='outline'
                    className='h-6 text-xs'
                    onClick={() => setPendingTarget(c.id)}
                  >
                    Switch
                  </Button>
                ) : (
                  <span className='text-neutral-1000 flex items-center gap-1 text-xs'>
                    <LockSimple size={12} weight='bold' /> Not authorized
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
        <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
          Context-switch audit trail
          <span className='text-neutral-1000 ml-2 text-xs'>
            user, timestamp, source and target company for every switch
          </span>
        </h3>
        <table className='w-full text-sm'>
          <thead>
            <tr className='text-neutral-1000 border-b text-left text-xs'>
              <th className='py-2 pr-3 font-medium'>When</th>
              <th className='px-2 font-medium'>User</th>
              <th className='px-2 font-medium'>From</th>
              <th className='px-2 font-medium'>To</th>
              <th className='px-2 font-medium'>Detail</th>
            </tr>
          </thead>
          <tbody>
            {switchLog.map((e) => (
              <tr key={e.id} className='border-b last:border-0'>
                <td className='text-neutral-1900 py-2 pr-3'>
                  {e.at.replace('T', ' ').slice(0, 16)}
                </td>
                <td className='text-neutral-1600 px-2 font-medium'>
                  {e.actor}
                  <span className='text-neutral-1000 ml-1 text-xs'>
                    ({e.actorRole})
                  </span>
                </td>
                <td className='text-neutral-1900 px-2'>
                  {companyName(e.sourceCompanyId)}
                </td>
                <td className='text-neutral-1900 px-2'>
                  {companyName(e.targetCompanyId)}
                </td>
                <td className='text-neutral-1000 px-2'>{e.detail}</td>
              </tr>
            ))}
            {switchLog.length === 0 && (
              <tr>
                <td colSpan={5} className='text-neutral-1000 py-4 text-center'>
                  No switches recorded yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AlertDialog
        open={pendingTarget !== null}
        onOpenChange={(open) => {
          if (!open) setPendingTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Switch to {companyName(pendingTarget)}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              After the switch, all data and functions will reflect{' '}
              {companyName(pendingTarget)} only. The switch is logged with
              your user, timestamp and the source and target companies.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingTarget) store.switchCompany(pendingTarget)
                setPendingTarget(null)
              }}
            >
              Confirm switch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
