import { Database, LockKey } from 'phosphor-react'
import { useRole } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { type PolicyConfigStore } from '../hooks/use-policy-config'
import { ConfigDecisionTable } from './config-decision-table'
import { ConfigReminders } from './config-reminders'
import { ConfigTemplates } from './config-templates'

const DATA_MODEL_FACTS = [
  {
    title: 'Tenant-scoped with row-level security',
    detail:
      'Every acknowledgment record links employee, policy and the specific policy version, isolated per tenant — no tenant can read another tenant’s records.',
  },
  {
    title: 'Uniqueness per employee + policy + version',
    detail:
      'A uniqueness constraint prevents duplicate active acknowledgments for the same policy version; re-runs de-duplicate before assignment.',
  },
  {
    title: 'Bitemporal state history',
    detail:
      'Assigned → pending → acknowledged/overdue transitions are stored with valid-time and transaction-time, so prior states are never overwritten and any past date is reconstructable.',
  },
  {
    title: 'Supersede, never delete',
    detail:
      'Re-acknowledgment marks the prior record as superseded history — it stays queryable in the audit trail while a new pending item is created.',
  },
  {
    title: '7-year retention',
    detail:
      'Acknowledgment events carry a retain-until horizon of 7 years for audit and regulatory evidence.',
  },
] as const

/**
 * Governance surface: reminder/escalation configuration, versioned
 * notification & receipt templates, the re-acknowledgment decision table,
 * module integrations and the acknowledgment data-model guarantees.
 * Platform Admins edit everything; Company Admins govern their tenant's
 * templates and see the rest read-only.
 */
export function ConfigTab({ config }: { config: PolicyConfigStore }) {
  const { role } = useRole()
  const isPlatformAdmin = role === 'Platform Admin'

  return (
    <div className='space-y-6'>
      <ConfigReminders config={config} readOnly={!isPlatformAdmin} />

      <ConfigTemplates config={config} />

      {isPlatformAdmin ? (
        <ConfigDecisionTable config={config} />
      ) : (
        <div className='space-y-2'>
          <h3 className='text-neutral-1600 text-sm font-semibold'>
            Re-acknowledgment decision table
          </h3>
          <p className='text-paragraph-sm text-neutral-1000'>
            Enabled triggers:{' '}
            {config.enabledReAckTriggers.join(', ') || 'none'} — governed by the
            Platform Admin as versioned, effective-dated rules.
          </p>
        </div>
      )}

      {/* Module integrations */}
      <div className='space-y-2'>
        <h3 className='text-neutral-1600 text-sm font-semibold'>
          Module integrations
        </h3>
        <p className='text-paragraph-sm text-neutral-1000'>
          Policy distribution coordinates with the employee lifecycle, the
          workflow engine and the task/checklist module.
        </p>
        <div className='space-y-2'>
          {config.integrations.map((i) => (
            <div
              key={i.id}
              className='border-gray-200 flex items-center justify-between gap-3 rounded-[6px] border bg-white px-4 py-3'
            >
              <div className='min-w-0'>
                <div className='flex items-center gap-2'>
                  <span className='text-neutral-1600 text-sm font-medium'>
                    {i.name}
                  </span>
                  <Badge variant={i.enabled ? 'completed' : 'badge_inactive'}>
                    {i.enabled ? 'Connected' : 'Disconnected'}
                  </Badge>
                </div>
                <p className='text-paragraph-sm text-neutral-1000 mt-0.5'>
                  {i.description}
                </p>
              </div>
              <Switch
                variant='blue'
                checked={i.enabled}
                disabled={!isPlatformAdmin}
                onCheckedChange={() => config.toggleIntegration(i.id)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Acknowledgment data model guarantees */}
      <div className='space-y-2'>
        <div className='flex items-center gap-2'>
          <Database size={16} className='text-blue-1400' />
          <h3 className='text-neutral-1600 text-sm font-semibold'>
            Acknowledgment data model
          </h3>
        </div>
        <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
          {DATA_MODEL_FACTS.map((f) => (
            <div
              key={f.title}
              className='border-gray-200 rounded-[6px] border bg-white px-4 py-3'
            >
              <p className='text-neutral-1600 flex items-center gap-1.5 text-sm font-medium'>
                <LockKey size={14} className='text-neutral-1000 shrink-0' />
                {f.title}
              </p>
              <p className='text-paragraph-sm text-neutral-1000 mt-1'>
                {f.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
