import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type TenantsStore } from '../hooks/use-tenants'
import { SectionCard } from './shared'

/**
 * Single-login company context switcher (SYS-04, 40) — surfaced at the top
 * of the module, above the tabs, so it is never buried mid-page.
 */
export function CompanyContextCard({ store }: { store: TenantsStore }) {
  const activeCompany = store.tenants.find(
    (t) => t.id === store.activeCompanyId
  )
  return (
    <SectionCard
      title='Active company context'
      description='One login — switch between authorized companies without re-authentication. Unauthorized companies are denied.'
    >
      <div className='flex flex-wrap items-center gap-3'>
        <Select value={store.activeCompanyId} onValueChange={store.switchCompany}>
          <SelectTrigger className='w-[300px] bg-white'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {store.tenants.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name} {t.authorized ? '' : '· not authorized'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className='text-paragraph-sm text-neutral-1000'>
          Working in <b>{activeCompany?.code}</b> — only this company&apos;s
          data and your roles here apply.
        </span>
      </div>
    </SectionCard>
  )
}
