import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus } from 'phosphor-react'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/common/data-table/table'
import { LongText } from '@/components/common/long-text'
import type { Department } from '../data/positions'
import type { Requisition } from '../data/recruitment'
import type { EmployeesStore } from '../hooks/use-employees'
import type { OrgConfigStore } from '../hooks/use-org-config'
import type { PositionsStore } from '../hooks/use-positions'
import type { RecruitmentStore } from '../hooks/use-recruitment'
import { positionLabel } from './assignment-dialogs'
import { RequisitionBadge } from './badges'
import { ExtendOfferDialog, NewRequisitionDialog } from './recruitment-dialogs'

interface RecruitmentTabProps {
  companyId: string
  departments: Department[]
  store: PositionsStore
  employees: EmployeesStore
  orgConfig: OrgConfigStore
  recruitment: RecruitmentStore
}

/**
 * Recruitment & onboarding pipeline consuming governed positions
 * (POS-04/18/37): requisitions carry a position, offers validate against the
 * level's pay-grade band, and completing onboarding creates the hire as an
 * employee holding that exact position.
 */
export function RecruitmentTab({
  companyId,
  departments,
  store,
  employees,
  orgConfig,
  recruitment,
}: RecruitmentTabProps) {
  const [newOpen, setNewOpen] = useState(false)
  const [offerTarget, setOfferTarget] = useState<Requisition | null>(null)

  const scoped = useMemo(
    () => recruitment.requisitions.filter((r) => r.companyId === companyId),
    [recruitment.requisitions, companyId]
  )
  const companyPositions = useMemo(
    () => store.positions.filter((p) => p.companyId === companyId),
    [store.positions, companyId]
  )
  const companyDepartments = useMemo(
    () => departments.filter((d) => d.companyId === companyId),
    [departments, companyId]
  )

  const gradeForLevel = (level: number | null) =>
    orgConfig.gradeForLevel(companyId, level)

  const handleCompleteOnboarding = (r: Requisition) => {
    const position = companyPositions.find((p) => p.id === r.positionId)
    if (!position) return
    recruitment.completeOnboarding(r.id)
    // The hire's single assigned position is the requisition's position;
    // the employee code comes from the numbering series (POS-04/18/35).
    employees.addEmployeeFromHire({
      companyId,
      code: orgConfig.generateId(companyId, 'Employee Code'),
      name: r.candidateName,
      positionId: position.id,
      positionLabel: positionLabel(position, companyDepartments),
    })
  }

  const columns: ColumnDef<Requisition>[] = [
      {
        accessorKey: 'id',
        header: () => (
          <span className='text-paragraph-sm font-medium'>Requisition</span>
        ),
        cell: ({ row }) => (
          <span className='text-neutral-1900 font-mono text-xs'>
            {row.original.id}
          </span>
        ),
      },
      {
        accessorKey: 'candidateName',
        header: () => (
          <span className='text-paragraph-sm font-medium'>Candidate</span>
        ),
        cell: ({ row }) => (
          <LongText className='text-neutral-1600 font-medium'>
            {row.original.candidateName}
          </LongText>
        ),
      },
      {
        id: 'position',
        header: () => (
          <span className='text-paragraph-sm font-medium'>
            Governed Position
          </span>
        ),
        cell: ({ row }) => {
          const position = companyPositions.find(
            (p) => p.id === row.original.positionId
          )
          return position ? (
            <div className='flex min-w-0 flex-col'>
              <span className='text-neutral-1900 text-sm'>
                {positionLabel(position, companyDepartments)}
              </span>
              <span className='text-paragraph-sm text-neutral-1000 font-mono'>
                {position.id}
              </span>
            </div>
          ) : (
            <span className='text-neutral-1000 text-sm'>—</span>
          )
        },
      },
      {
        id: 'offer',
        header: () => (
          <span className='text-paragraph-sm font-medium'>
            Offer / Pay Grade
          </span>
        ),
        cell: ({ row }) => {
          const r = row.original
          if (r.offeredSalary === null) {
            return <span className='text-neutral-1000 text-sm'>No offer yet</span>
          }
          const grade = orgConfig.payGrades.find(
            (g) => g.id === r.resolvedPayGradeId
          )
          return (
            <div className='flex min-w-0 flex-col'>
              <span className='text-neutral-1900 text-sm'>
                ${r.offeredSalary.toLocaleString()}
              </span>
              <span className='text-paragraph-sm text-neutral-1000'>
                {grade ? `Within ${grade.name}` : 'No band validation applied'}
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: 'status',
        header: () => (
          <span className='text-paragraph-sm font-medium'>Status</span>
        ),
        size: 110,
        cell: ({ row }) => <RequisitionBadge status={row.original.status} />,
      },
      {
        id: 'action',
        header: () => (
          <span className='text-paragraph-sm font-medium'>Next Step</span>
        ),
        cell: ({ row }) => {
          const r = row.original
          switch (r.status) {
            case 'open':
              return (
                <Button
                  variant='outline'
                  className='h-7'
                  onClick={() => setOfferTarget(r)}
                >
                  Extend offer
                </Button>
              )
            case 'offer-extended':
              return (
                <Button
                  variant='outline'
                  className='h-7'
                  onClick={() => recruitment.startOnboarding(r.id)}
                >
                  Start onboarding
                </Button>
              )
            case 'onboarding':
              return (
                <Button
                  variant='outline'
                  className='h-7'
                  onClick={() => handleCompleteOnboarding(r)}
                >
                  Complete &amp; hire
                </Button>
              )
            case 'hired':
              return (
                <span className='text-neutral-1000 text-sm'>
                  Position assigned to hire
                </span>
              )
          }
        },
      },
    ]

  return (
    <div className='w-full'>
      <div className='mb-3 flex items-center justify-between'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          Requisitions &amp; Onboarding ({scoped.length})
        </h2>
        <Button
          variant='red'
          onClick={() => setNewOpen(true)}
          className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
        >
          <Plus size={10} weight='bold' />
          New Requisition
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={scoped}
        variant='no-status'
        resetSelectionKey={companyId}
      />

      <p className='text-paragraph-sm text-neutral-1000 mt-2'>
        The workflow engine carries the target position as context through each
        stage; on completion the hire&apos;s employee record is created holding
        that single governed position (POS-04/18).
      </p>

      <NewRequisitionDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        positions={companyPositions}
        departments={companyDepartments}
        customFieldDefs={store.customFieldDefs.filter(
          (d) => d.companyId === companyId
        )}
        gradeForLevel={gradeForLevel}
        payGradeEnabled={orgConfig.payGradeEnabled}
        onCreate={(positionId, candidateName) =>
          recruitment.addRequisition({ companyId, positionId, candidateName })
        }
      />

      <ExtendOfferDialog
        requisition={offerTarget}
        onOpenChange={(open) => {
          if (!open) setOfferTarget(null)
        }}
        positions={companyPositions}
        gradeForLevel={gradeForLevel}
        payGradeEnabled={orgConfig.payGradeEnabled}
        onExtend={(salary, gradeId) => {
          if (offerTarget) recruitment.extendOffer(offerTarget.id, salary, gradeId)
        }}
      />
    </div>
  )
}
