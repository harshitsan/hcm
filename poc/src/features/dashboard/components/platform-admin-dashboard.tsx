import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { useRole } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { PLATFORM_TODAY } from '../data/platform-metrics'
import { PlatformActivityFeed } from './platform-activity-feed'
import {
  InvoiceStatusPanel,
  MrrTrendChart,
  PlanMixChart,
  RevenueByTenantChart,
} from './platform-billing-charts'
import { PendingActionsPanel } from './pending-actions'
import { PlatformHealthPanel } from './platform-health'
import { PlatformKpis } from './platform-kpis'
import { ModuleAdoptionPanel } from './platform-module-adoption'
import {
  TenantGrowthChart,
  TenantHierarchyPanel,
} from './platform-tenant-hierarchy'

/**
 * Platform Admin landing view — the platform owner sits above every tenant
 * and sees portfolio-wide billing, the tenant hierarchy and adoption/usage
 * charts. All figures are in-memory seed data (frontend-only POC).
 */
export function PlatformAdminDashboard() {
  const { role } = useRole()

  return (
    <>
      <CommonHeader title='SatelliteHR — Platform Overview' />
      <Main>
        <div className='flex flex-col gap-4 pb-10'>
          {/* Context strip */}
          <div className='flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-gray-200 bg-white p-4'>
            <div>
              <div className='flex flex-wrap items-center gap-2'>
                <h2 className='font-display text-neutral-1600 text-xl font-semibold'>
                  Mission control — platform owner
                </h2>
                <Badge variant='outline'>{role}</Badge>
              </div>
              <p className='text-paragraph-sm text-neutral-1000 mt-1'>
                Billing, tenant hierarchy and adoption across every portfolio,
                group company and company · data as of {PLATFORM_TODAY} (mock)
              </p>
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={() =>
                toast.success('Billing summary export queued', {
                  description:
                    'POC only — the CSV export is mocked with no backend.',
                })
              }
            >
              <Download className='size-4' />
              Export billing summary
            </Button>
          </div>

          {/* KPI stat cards */}
          <PlatformKpis />

          {/* Pending actions + platform health (R2) */}
          <div className='grid grid-cols-1 gap-4 xl:grid-cols-2'>
            <PendingActionsPanel />
            <PlatformHealthPanel />
          </div>

          {/* Billing charts */}
          <div className='grid grid-cols-1 gap-4 xl:grid-cols-3'>
            <div className='xl:col-span-2'>
              <MrrTrendChart />
            </div>
            <PlanMixChart />
          </div>
          <div className='grid grid-cols-1 gap-4 xl:grid-cols-2'>
            <RevenueByTenantChart />
            <InvoiceStatusPanel />
          </div>

          {/* Tenant hierarchy + growth */}
          <div className='grid grid-cols-1 gap-4 xl:grid-cols-2'>
            <TenantHierarchyPanel />
            <TenantGrowthChart />
          </div>

          {/* Adoption + activity */}
          <div className='grid grid-cols-1 gap-4 xl:grid-cols-2'>
            <ModuleAdoptionPanel />
            <PlatformActivityFeed />
          </div>
        </div>
      </Main>
    </>
  )
}
