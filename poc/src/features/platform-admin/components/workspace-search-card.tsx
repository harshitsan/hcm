import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { type WorkspaceStore } from '../hooks/use-workspace'
import { SectionCard, ToneBadge, type BadgeTone } from './shared'

const kindTone: Record<string, BadgeTone> = {
  Employee: 'blue',
  Candidate: 'amber',
  Document: 'grey',
}

/** Tenant-aware global search + recently viewed (SYS-27, 33, 72, 73). */
export function WorkspaceSearchCard({ store }: { store: WorkspaceStore }) {
  return (
    <SectionCard
      title='Global search'
      description='Searches Employees, Candidates and Document names — including custom fields — within your tenant only. Cross-tenant matches are excluded.'
    >
      <Input
        placeholder='Search your tenant… try “UAN” or “offer letter”'
        value={store.query}
        onChange={(e) => store.setQuery(e.target.value)}
        className='max-w-[420px] bg-white'
      />

      {store.query.trim() !== '' && (
        <ul className='mt-3 space-y-1'>
          {store.results.length === 0 && (
            <li className='text-paragraph-sm text-neutral-1000'>
              No matches in your tenant (ASTER-IN)
            </li>
          )}
          {store.results.map(({ record, viaCustomField }) => (
            <li key={record.id}>
              <button
                type='button'
                className='hover:bg-neutral-200 flex w-full items-center gap-2 rounded-[6px] px-2 py-1.5 text-left text-sm'
                onClick={() => store.viewRecord(record)}
              >
                <ToneBadge tone={kindTone[record.kind] ?? 'grey'}>
                  {record.kind}
                </ToneBadge>
                <span className='font-medium'>{record.title}</span>
                <span className='text-paragraph-sm text-neutral-1000'>
                  {record.subtitle}
                </span>
                {viaCustomField && (
                  <Badge variant='pending'>
                    matched custom field: {viaCustomField}
                  </Badge>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <h3 className='text-paragraph-sm text-neutral-1600 mt-4 mb-2 font-medium'>
        Recently viewed (last {Math.min(store.recentlyViewed.length, 10)} of 10)
      </h3>
      <div className='flex flex-wrap gap-2'>
        {store.recentlyViewed.map((r) => (
          <button
            key={r.id}
            type='button'
            className='border-gray-200 hover:bg-neutral-200 flex items-center gap-1.5 rounded-[6px] border px-2 py-1 text-sm'
            onClick={() => store.viewRecord(r)}
          >
            <ToneBadge tone={kindTone[r.kind] ?? 'grey'}>{r.kind}</ToneBadge>
            {r.title}
          </button>
        ))}
      </div>
    </SectionCard>
  )
}
