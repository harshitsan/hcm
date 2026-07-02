import { useMemo, useState } from 'react'
import { Plus } from 'phosphor-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@/components/common/data-table/table'
import { RoleGate } from '@/context/role-context'
import { type OnboardingCase } from '../data/onboarding'
import { type OnboardingStore } from '../hooks/use-onboarding'
import { onboardingColumns } from './onboarding-columns'
import { OnboardingDetailSheet } from './onboarding-detail-sheet'
import { StartOnboardingOverlay } from './start-onboarding-overlay'

interface OnboardingTabProps {
  store: OnboardingStore
  templateVersion: string
}

/** Admin grid of onboarding cases with search/filter and case workspace. */
export function OnboardingTab({ store, templateVersion }: OnboardingTabProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [newOpen, setNewOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const data = useMemo(
    () =>
      statusFilter === 'all'
        ? store.cases
        : store.cases.filter((c) => c.status === statusFilter),
    [statusFilter, store.cases]
  )

  const selected = store.cases.find((c) => c.id === selectedId) ?? null

  return (
    <div className='w-full'>
      <div className='mb-3 flex items-center justify-between'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          Onboarding ({data.length})
        </h2>
        <div className='flex items-center gap-3'>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger variant='secondary' className='h-7 w-[170px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All statuses</SelectItem>
              <SelectItem value='in-progress'>Still onboarding</SelectItem>
              <SelectItem value='completed'>Completed</SelectItem>
            </SelectContent>
          </Select>
          <RoleGate roles={['Company Admin']}>
            <Button
              variant='red'
              onClick={() => setNewOpen(true)}
              className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
            >
              <Plus size={10} weight='bold' />
              Initiate Onboarding
            </Button>
          </RoleGate>
        </div>
      </div>

      <DataTable
        columns={onboardingColumns}
        data={data}
        variant='no-status'
        onRowClick={(row: OnboardingCase) => setSelectedId(row.id)}
      />

      <StartOnboardingOverlay
        open={newOpen}
        onOpenChange={setNewOpen}
        templateVersion={templateVersion}
        onSubmit={store.startOnboarding}
      />
      <OnboardingDetailSheet
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null)
        }}
        onboardingCase={selected}
        store={store}
      />
    </div>
  )
}
