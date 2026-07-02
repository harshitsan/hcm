import { CheckCircle2, Database, GitBranch, Link2, MinusCircle, ShieldCheck } from 'lucide-react'
import { useRole } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { COMPANIES } from '../data/entries'
import { type FeedbackConfigStore } from '../hooks/use-feedback-config'

const PHASE1_IN_SCOPE = [
  'Entry submission (incl. anonymous and on-behalf)',
  'Role-based review workflow',
  'Access restricted to authorized personnel',
  'Status tracking with history',
  'Auditability of every action',
] as const

const DEFERRED = [
  'Full case-management workflows',
  'Investigation task boards & evidence lockers',
  'External ombudsman / legal case handoff',
  'Case merging and cross-entry linking',
] as const

const DATA_MODEL_PANELS = [
  {
    icon: ShieldCheck,
    title: 'Tenant-scoped isolation (RLS)',
    body: 'Entries persist against the owning tenant; access is evaluated at the data layer so no query returns rows outside the caller’s tenant scope — a cross-tenant read is impossible regardless of code path.',
  },
  {
    icon: GitBranch,
    title: 'Effective-dated status history',
    body: 'Every status change is written as a new history row rather than overwriting, so an entry’s full progression is reconstructable for any point in time (visible per entry in its audit trail).',
  },
  {
    icon: Link2,
    title: 'Person-record integrity',
    body: 'Submitter and concerned-employee references link to canonical person records with referential integrity — including Employee (Non-User) records for on-behalf submissions.',
  },
] as const

/**
 * Platform/Portfolio governance (FBG-07/10/12): Phase 1 scope statement,
 * canonical data-model guarantees, and per-company portfolio provisioning.
 */
export function GovernanceTab({ store }: { store: FeedbackConfigStore }) {
  const { role } = useRole()
  const canProvision = role === 'Portfolio Admin' || role === 'Platform Admin'

  return (
    <div className='grid w-full grid-cols-1 gap-4 xl:grid-cols-2'>
      <Card className='gap-3 border-none bg-white py-4'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Phase 1 scope
          </CardTitle>
          <p className='text-paragraph-sm text-neutral-1000'>
            The module is scoped to feedback and grievance tracking; broader
            case-management is deferred to a future phase.
          </p>
        </CardHeader>
        <CardContent className='space-y-3 px-4'>
          <div>
            <p className='text-neutral-1600 mb-1 text-sm font-medium'>In scope</p>
            <ul className='space-y-1'>
              {PHASE1_IN_SCOPE.map((item) => (
                <li key={item} className='text-neutral-1900 flex items-center gap-2 text-sm'>
                  <CheckCircle2 className='text-green-1300 size-4 shrink-0' />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className='text-neutral-1600 mb-1 text-sm font-medium'>
              Deferred to a future phase
            </p>
            <ul className='space-y-1'>
              {DEFERRED.map((item) => (
                <li key={item} className='text-neutral-1000 flex items-center gap-2 text-sm'>
                  <MinusCircle className='size-4 shrink-0' />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className='gap-3 border-none bg-white py-4'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Portfolio provisioning (per company)
          </CardTitle>
          <p className='text-paragraph-sm text-neutral-1000'>
            Enable feedback & grievance tracking, role-based review and access
            restriction for each company in the portfolio.
          </p>
        </CardHeader>
        <CardContent className='space-y-2 px-4'>
          {COMPANIES.map((c) => (
            <div
              key={c.name}
              className='border-grey-200 flex items-center justify-between rounded-[6px] border px-3 py-2'
            >
              <div>
                <Label className='text-sm font-medium'>{c.name}</Label>
                <p className='text-paragraph-sm text-neutral-1000'>{c.group}</p>
              </div>
              <div className='flex items-center gap-2'>
                <Badge
                  variant={
                    store.config.companyProvisioning[c.name]
                      ? 'badge_active'
                      : 'badge_inactive'
                  }
                >
                  {store.config.companyProvisioning[c.name] ? 'Enabled' : 'Disabled'}
                </Badge>
                <Switch
                  checked={store.config.companyProvisioning[c.name] ?? false}
                  disabled={!canProvision}
                  onCheckedChange={() => store.toggleCompanyProvisioning(c.name)}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className='gap-3 border-none bg-white py-4 xl:col-span-2'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            <span className='flex items-center gap-2'>
              <Database className='size-4' />
              Canonical tenant-scoped data model
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className='px-4'>
          <div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
            {DATA_MODEL_PANELS.map((panel) => (
              <div key={panel.title} className='border-grey-200 rounded-[6px] border px-3 py-2'>
                <div className='mb-1 flex items-center gap-2'>
                  <panel.icon className='text-blue-1400 size-4' />
                  <p className='text-neutral-1600 text-sm font-medium'>{panel.title}</p>
                </div>
                <p className='text-paragraph-sm text-neutral-1000'>{panel.body}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
