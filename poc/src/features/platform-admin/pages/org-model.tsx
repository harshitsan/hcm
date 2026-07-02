import { useState } from 'react'
import { toast } from 'sonner'
import { useRole } from '@/context/role-context'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { OrgPlacementCard } from '../components/org-placement-card'
import { OrgStructureCards } from '../components/org-structure-cards'
import { SectionCard } from '../components/shared'
import { seedJurisdictions } from '../data/tenants'
import { useOrgModel } from '../hooks/use-org-model'

/**
 * Organization Model sub-page (SYS-06, 07, 22, 45, 46, 47, 48, 49, 50, 51,
 * 55, 56) — company setup for the active tenant: details, departments,
 * positions, locations, employee placement and policy applicability, plus
 * reporting/bulk operations within their SLA limits.
 */
export function OrgModelPage() {
  const { hasRole } = useRole()
  const canEdit = hasRole('Company Admin', 'Platform Admin')
  const store = useOrgModel()
  const [details, setDetails] = useState(store.company)

  return (
    <>
      <CommonHeader
        title='Platform Administration — Organization Model'
        className='bg-blue-150'
        backButton
      />
      <Main fluid className='bg-neutral-200'>
        <div className='w-full'>
          {/* Company details & supported jurisdictions (SYS-06, 48) */}
          <SectionCard
            title='Company details'
            description='Tenant setup — the Company Super Administrator holds ultimate authority for structures and configuration within the tenant'
            actions={
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  className='h-8'
                  onClick={() =>
                    toast.success(
                      'Standard report generated in 14 s — within the 30-second limit for ≤1,000 records'
                    )
                  }
                >
                  Run report
                </Button>
                <Button
                  variant='outline'
                  className='h-8'
                  disabled={!canEdit}
                  onClick={() =>
                    toast.success(
                      'Bulk import (860 records) completed in 38 s — within the 1-minute limit'
                    )
                  }
                >
                  Bulk import
                </Button>
                <Button
                  variant='outline'
                  className='h-8'
                  onClick={() =>
                    toast.success(
                      'Export queued — files up to 10,000 records complete within 5 minutes'
                    )
                  }
                >
                  Export
                </Button>
              </div>
            }
          >
            <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
              <div className='flex flex-col gap-1.5'>
                <Label>Legal name</Label>
                <Input
                  value={details.legalName}
                  disabled={!canEdit}
                  onChange={(e) =>
                    setDetails({ ...details, legalName: e.target.value })
                  }
                />
              </div>
              <div className='flex flex-col gap-1.5'>
                <Label>Tenant code</Label>
                <Input value={details.code} disabled />
              </div>
              <div className='flex flex-col gap-1.5'>
                <Label>Supported jurisdictions (multi-jurisdiction allowed)</Label>
                <div className='flex flex-wrap gap-3 pt-1.5'>
                  {seedJurisdictions
                    .filter((j) => j.status === 'available')
                    .map((j) => (
                      <label key={j.id} className='flex items-center gap-1.5 text-sm'>
                        <Checkbox
                          variant='blue'
                          disabled={!canEdit}
                          checked={details.jurisdictionIds.includes(j.id)}
                          onCheckedChange={(checked) =>
                            setDetails({
                              ...details,
                              jurisdictionIds: checked
                                ? [...details.jurisdictionIds, j.id]
                                : details.jurisdictionIds.filter(
                                    (id) => id !== j.id
                                  ),
                            })
                          }
                        />
                        {j.code}
                      </label>
                    ))}
                </div>
              </div>
            </div>
            <div className='mt-3'>
              <Button
                disabled={!canEdit || details.jurisdictionIds.length === 0}
                onClick={() => store.updateCompany(details)}
              >
                Save company details
              </Button>
            </div>
          </SectionCard>

          <OrgStructureCards store={store} />
          <OrgPlacementCard store={store} />
        </div>
      </Main>
    </>
  )
}
