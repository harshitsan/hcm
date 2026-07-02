import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { type DomainCatalog } from '../data/catalogs'
import { type CatalogsStore } from '../hooks/use-catalogs'

interface CatalogRoutingPanelProps {
  domain: DomainCatalog
  store: CatalogsStore
  canEdit: boolean
}

/**
 * Approver/receiver routing co-located with the domain's templates (HLC-31):
 * members configured here receive the domain's communications; an empty
 * routing is flagged so generation never dispatches to no one. The timesheet
 * domain additionally carries the Short Time Settings threshold (HLC-36).
 */
export function CatalogRoutingPanel({
  domain,
  store,
  canEdit,
}: CatalogRoutingPanelProps) {
  const [newMember, setNewMember] = useState('')
  const routing = store.routings.find((r) => r.domainId === domain.id)

  return (
    <div className='rounded-[6px] border border-gray-200 bg-white p-4'>
      <div className='mb-2 flex flex-wrap items-center gap-2'>
        <h3 className='text-neutral-1600 font-medium'>{domain.routingLabel}</h3>
        {routing && routing.members.length === 0 && (
          <Badge variant='dropped'>
            No routing configured — generation will be flagged
          </Badge>
        )}
      </div>
      <p className='text-paragraph-sm text-neutral-1000 mb-3'>
        Approvers/receivers configured here are the recipients of every{' '}
        {domain.name} communication generated from this catalog.
      </p>
      {routing?.thresholdHours !== undefined && (
        <div className='mb-3 flex items-center gap-2'>
          <span className='text-sm'>Short-time threshold (hours/week)</span>
          <Input
            type='number'
            className='w-24'
            value={routing.thresholdHours}
            disabled={!canEdit}
            onChange={(e) =>
              store.setRoutingThreshold(domain.id, Number(e.target.value))
            }
          />
        </div>
      )}
      <ul className='mb-3 space-y-1'>
        {routing?.members.map((m) => (
          <li key={m} className='flex items-center gap-2 text-sm'>
            <Badge variant='badge_active'>{m}</Badge>
            {canEdit && (
              <Button
                size='sm'
                variant='outline'
                onClick={() => store.removeRoutingMember(domain.id, m)}
              >
                Remove
              </Button>
            )}
          </li>
        ))}
      </ul>
      {canEdit && (
        <div className='flex items-center gap-2'>
          <Input
            placeholder='Add approver / receiver'
            className='w-64'
            value={newMember}
            onChange={(e) => setNewMember(e.target.value)}
          />
          <Button
            size='sm'
            disabled={newMember.trim().length < 3}
            onClick={() => {
              store.addRoutingMember(domain.id, newMember.trim())
              setNewMember('')
            }}
          >
            Add
          </Button>
        </div>
      )}
    </div>
  )
}
