import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import {
  InterviewPanelsCard,
  SelfServiceCard,
} from '../components/workspace-self-service-cards'
import { WorkspaceSearchCard } from '../components/workspace-search-card'
import { useWorkspace } from '../hooks/use-workspace'

/**
 * My Workspace sub-page (SYS-18, 19, 27, 72, 73) — the employee-facing
 * surface: tenant-aware global search with custom fields and recently
 * viewed records, self-service profile/leave/announcements/documents, and
 * interview panel participation.
 */
export function WorkspacePage() {
  const store = useWorkspace()

  return (
    <>
      <CommonHeader
        title='Platform Administration — My Workspace'
        className='bg-blue-150'
        backButton
      />
      <Main fluid className='bg-neutral-200'>
        <div className='w-full'>
          <WorkspaceSearchCard store={store} />
          <SelfServiceCard store={store} />
          <InterviewPanelsCard store={store} />
        </div>
      </Main>
    </>
  )
}
