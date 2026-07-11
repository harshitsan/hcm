import { useRole } from '@/context/role-context'
import { type TenantsStore } from '../hooks/use-tenants'
import {
  GroupsCard,
  JurisdictionsCard,
  PortfoliosCard,
} from './tenant-panels'

/**
 * Portfolios, groups & jurisdictions tab (SYS-03, 05, 15, 16, 49) — split
 * out of the former Tenants & companies mega-tab so each governance surface
 * has its own page.
 */
export function StructuresTab({ store }: { store: TenantsStore }) {
  const { hasRole } = useRole()
  return (
    <div className='w-full'>
      {hasRole('Platform Admin') && <JurisdictionsCard store={store} />}
      <PortfoliosCard store={store} />
      <GroupsCard store={store} />
    </div>
  )
}
