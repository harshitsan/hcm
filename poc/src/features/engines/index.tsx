import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { useRole } from '@/context/role-context'
import { useBusinessLogic } from '@/features/workflows/hooks/use-business-logic'
import { ACTORS } from '@/features/workflows/data/shared'
import { HubCatalog } from './components/hub-catalog'

/**
 * Engines Hub (/engines) — Task A3.
 *
 * Central view of every engine artifact in the catalog, browsable by module
 * or by type, with inline attach/detach to any module surface.
 */
export function EnginesHub() {
  const { role } = useRole()
  const actor = ACTORS[role]
  const store = useBusinessLogic({ actor })

  return (
    <>
      <CommonHeader title='Engines Hub' />
      <Main className='bg-neutral-200'>
        <div className='mb-4'>
          <p className='text-paragraph-sm text-neutral-1000'>
            Every business-logic artifact in one place — browse by module or by
            type, toggle scope activation, and attach artifacts to any HRMS
            module in two clicks.
          </p>
        </div>
        <HubCatalog store={store} />
      </Main>
    </>
  )
}
