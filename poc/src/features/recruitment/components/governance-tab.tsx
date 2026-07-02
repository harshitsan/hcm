import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { RoleGate } from '@/context/role-context'
import { seedPortfolioMetrics, type EngineLogEntry } from '../data/config'
import type { RecruitmentConfigStore } from '../hooks/use-recruitment-config'
import { StatusBadge } from './badges'

const ENGINE_BADGE: Record<
  EngineLogEntry['engine'],
  'open' | 'live' | 'completed' | 'pending'
> = {
  workflow: 'open',
  rules: 'live',
  notification: 'completed',
  forms: 'pending',
}

const OVERRIDE_LABEL: Record<string, string> = {
  'not-allowed': 'No override',
  'within-limits': 'Override within limits',
  free: 'Free override',
}

/**
 * Governance & platform — tenant provisioning with RLS (TA-21, TA-23),
 * group-level standards (TA-19), portfolio oversight (TA-20) and the shared
 * engine execution log (TA-27…TA-30).
 */
export function GovernanceTab({ config }: { config: RecruitmentConfigStore }) {
  const [companyFilter, setCompanyFilter] = useState('all')
  const [engineFilter, setEngineFilter] = useState<string>('all')

  const metrics = useMemo(
    () =>
      companyFilter === 'all'
        ? seedPortfolioMetrics
        : seedPortfolioMetrics.filter((m) => m.company === companyFilter),
    [companyFilter]
  )

  const log = useMemo(
    () =>
      engineFilter === 'all'
        ? config.engineLog
        : config.engineLog.filter((e) => e.engine === engineFilter),
    [config.engineLog, engineFilter]
  )

  return (
    <div className='w-full space-y-5'>
      {/* TA-21, TA-23: Platform Admin — module provisioning & tenant isolation */}
      <RoleGate roles={['Platform Admin']}>
        <section>
          <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
            Tenant provisioning — Talent Acquisition module
          </h3>
          <div className='rounded-[8px] border border-gray-200 bg-white'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Module enabled</TableHead>
                  <TableHead>Calendar integration</TableHead>
                  <TableHead>Onboarding integration</TableHead>
                  <TableHead>Row-level security</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {config.tenants.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className='font-medium'>{t.name}</TableCell>
                    <TableCell>
                      <Switch
                        checked={t.moduleEnabled}
                        onCheckedChange={(v) =>
                          config.updateTenant(t.id, { moduleEnabled: v })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={t.calendarIntegration}
                        onCheckedChange={(v) =>
                          config.updateTenant(t.id, { calendarIntegration: v })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={t.onboardingIntegration}
                        onCheckedChange={(v) =>
                          config.updateTenant(t.id, {
                            onboardingIntegration: v,
                          })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <StatusBadge status={t.rlsActive ? 'active' : 'inactive'} />
                        <Switch
                          checked={t.rlsActive}
                          onCheckedChange={(v) =>
                            config.updateTenant(t.id, { rlsActive: v })
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className='text-paragraph-sm text-neutral-1000 mt-1.5'>
            Disabling the module hides talent acquisition features for that
            tenant. Requisitions, candidates, resumes and offers are strictly
            tenant-scoped: cross-tenant API requests are denied and logged;
            offboarded tenants lose all data access. Changes are captured in
            the audit log below.
          </p>
        </section>
      </RoleGate>

      {/* TA-19: group standards */}
      <RoleGate roles={['Group Company Admin', 'Platform Admin', 'Company Admin']}>
        <section>
          <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
            Group-level talent acquisition standards
          </h3>
          <div className='rounded-[8px] border border-gray-200 bg-white'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Area</TableHead>
                  <TableHead>Group standard</TableHead>
                  <TableHead>Company override</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {config.groupStandards.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className='font-medium'>{s.area}</TableCell>
                    <TableCell className='text-sm'>{s.standard}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          s.override === 'not-allowed' ? 'dropped' : 'open'
                        }
                      >
                        {OVERRIDE_LABEL[s.override]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className='text-paragraph-sm text-neutral-1000 mt-1.5'>
            Standards apply to all companies in the group; permitted overrides
            are retained without breaching group standards.
          </p>
        </section>
      </RoleGate>

      {/* TA-20: portfolio oversight */}
      <RoleGate roles={['Portfolio Admin', 'Platform Admin', 'Group Company Admin']}>
        <section>
          <div className='mb-2 flex items-center justify-between'>
            <h3 className='text-neutral-1600 text-sm font-medium'>
              Portfolio hiring metrics
            </h3>
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger className='h-7 w-[220px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All companies</SelectItem>
                {seedPortfolioMetrics.map((m) => (
                  <SelectItem key={m.company} value={m.company}>
                    {m.company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='rounded-[8px] border border-gray-200 bg-white'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Open requisitions</TableHead>
                  <TableHead>Active candidates</TableHead>
                  <TableHead>Offers extended</TableHead>
                  <TableHead>Offer acceptance</TableHead>
                  <TableHead>Avg time to hire</TableHead>
                  <TableHead className='text-right'>Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.map((m) => (
                  <TableRow key={m.company}>
                    <TableCell className='font-medium'>{m.company}</TableCell>
                    <TableCell>{m.openRequisitions}</TableCell>
                    <TableCell>{m.activeCandidates}</TableCell>
                    <TableCell>{m.offersExtended}</TableCell>
                    <TableCell>{m.offerAcceptanceRate}%</TableCell>
                    <TableCell>{m.avgTimeToHireDays} days</TableCell>
                    <TableCell className='text-right'>
                      <Button
                        variant='outline'
                        className='h-6 px-2 text-xs'
                        onClick={() => setCompanyFilter(m.company)}
                      >
                        Drill in (read-only)
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      </RoleGate>

      {/* TA-27…TA-30: shared engine execution log */}
      <section>
        <div className='mb-2 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Shared engine execution log ({log.length})
          </h3>
          <Select value={engineFilter} onValueChange={setEngineFilter}>
            <SelectTrigger className='h-7 w-[180px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All engines</SelectItem>
              {(['workflow', 'rules', 'notification', 'forms'] as const).map(
                (e) => (
                  <SelectItem key={e} value={e}>
                    {e} engine
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>
        <div className='max-h-[420px] space-y-1.5 overflow-y-auto'>
          {log.map((e) => (
            <div
              key={e.id}
              className='rounded-[8px] border border-gray-200 bg-white px-3 py-2'
            >
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Badge variant={ENGINE_BADGE[e.engine]} className='capitalize'>
                    {e.engine}
                  </Badge>
                  <span className='text-neutral-1600 text-sm font-medium'>
                    {e.event}
                  </span>
                </div>
                <span className='text-paragraph-sm text-neutral-1000'>
                  {new Date(e.at).toLocaleString('en-GB')}
                </span>
              </div>
              <p className='text-paragraph-sm text-neutral-1000'>{e.detail}</p>
            </div>
          ))}
          {log.length === 0 && (
            <p className='text-neutral-1000 text-sm'>No engine activity yet.</p>
          )}
        </div>
        <p className='text-paragraph-sm text-neutral-1000 mt-1.5'>
          Every workflow routing, rules-engine gate, templated notification and
          dynamic form render is recorded here with actor and timestamp.
        </p>
      </section>
    </div>
  )
}
