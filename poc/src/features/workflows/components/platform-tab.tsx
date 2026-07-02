import { useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { DataTable } from '@/components/common/data-table/table'
import { LongText } from '@/components/common/long-text'
import { RoleGate } from '@/context/role-context'
import type {
  AlertSettings,
  AuditSettings,
} from '../data/attendance-config'
import type { TenantRecord } from '../data/platform'
import type { AttendanceConfigStore } from '../hooks/use-attendance-config'
import type { PlatformStore } from '../hooks/use-platform'
import { SummaryCards } from './summary-cards'
import { SectionToolbar, SortableHeader } from './table-helpers'

function tenantColumns(
  onToggle: (id: string, enabled: boolean) => void,
  canToggle: boolean
): ColumnDef<TenantRecord>[] {
  return [
    {
      accessorKey: 'name',
      header: ({ column }) => <SortableHeader column={column} label='Tenant' />,
      cell: ({ row }) => (
        <div className='flex min-w-0 flex-col'>
          <LongText className='text-neutral-1600 font-medium'>
            {row.original.name}
          </LongText>
          <span className='text-paragraph-sm text-neutral-1000 truncate'>
            {row.original.region} · {row.original.companies} compan
            {row.original.companies === 1 ? 'y' : 'ies'}
          </span>
        </div>
      ),
    },
    {
      id: 'engine',
      header: () => (
        <span className='text-paragraph-sm font-medium'>Workflow engine</span>
      ),
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <Switch
            checked={row.original.engineEnabled}
            disabled={!canToggle}
            onCheckedChange={(checked) => onToggle(row.original.id, checked)}
            aria-label={`Toggle engine for ${row.original.name}`}
          />
          <span className='text-neutral-1900 text-sm'>
            {row.original.engineEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'activeInstances',
      header: ({ column }) => (
        <SortableHeader column={column} label='Active instances' />
      ),
      cell: ({ row }) => (
        <span className='text-neutral-1900 text-sm'>
          {row.original.activeInstances}
        </span>
      ),
    },
    {
      accessorKey: 'escalations30d',
      header: ({ column }) => (
        <SortableHeader column={column} label='Escalations (30d)' />
      ),
      cell: ({ row }) => (
        <span className='text-neutral-1900 text-sm'>
          {row.original.escalations30d}
        </span>
      ),
    },
    {
      accessorKey: 'slaBreaches30d',
      header: ({ column }) => (
        <SortableHeader column={column} label='SLA breaches (30d)' />
      ),
      cell: ({ row }) => (
        <span className='text-neutral-1900 text-sm'>
          {row.original.slaBreaches30d}
        </span>
      ),
    },
    {
      accessorKey: 'deniedAttempts30d',
      header: ({ column }) => (
        <SortableHeader column={column} label='RLS denials (30d)' />
      ),
      cell: ({ row }) => (
        <span className='text-neutral-1900 text-sm'>
          {row.original.deniedAttempts30d}
        </span>
      ),
    },
    {
      accessorKey: 'health',
      header: ({ column }) => <SortableHeader column={column} label='Health' />,
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.health === 'healthy' ? 'badge_active' : 'overdue'
          }
        >
          {row.original.health === 'healthy' ? 'Healthy' : 'Degraded'}
        </Badge>
      ),
    },
  ]
}

function SwitchRow({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  label: string
  hint?: string
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className='flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2'>
      <div className='flex flex-col'>
        <span className='text-neutral-1600 text-sm font-medium'>{label}</span>
        {hint && <span className='text-neutral-1000 text-xs'>{hint}</span>}
      </div>
      <Switch checked={checked} disabled={disabled} onCheckedChange={onChange} />
    </div>
  )
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div className='flex flex-col gap-1'>
      <Label className='text-neutral-1000 text-xs font-medium'>{label}</Label>
      <Input
        type='number'
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </div>
  )
}

/**
 * Platform & module configuration: tenant provisioning + engine health with
 * tenant-scoped storage / RLS denial visibility (WFE-18, WFE-19), the
 * per-company alerts module toggle and workflow alert triggers (WFE-40,
 * WFE-41), and attendance-audit sampling settings (WFE-33).
 */
export function PlatformTab({
  platform,
  attendance,
}: {
  platform: PlatformStore
  attendance: AttendanceConfigStore
}) {
  const { tenants, toggleEngine } = platform
  const { alerts, saveAlerts, auditSettings, saveAuditSettings } = attendance

  const [alertsDraft, setAlertsDraft] = useState<AlertSettings>(alerts)
  const [auditDraft, setAuditDraft] = useState<AuditSettings>(auditSettings)
  const [confirmCancel, setConfirmCancel] = useState<'alerts' | 'audit' | null>(
    null
  )

  useEffect(() => setAlertsDraft(alerts), [alerts])
  useEffect(() => setAuditDraft(auditSettings), [auditSettings])

  const summary = useMemo(
    () => [
      { label: 'Tenants', value: tenants.length },
      {
        label: 'Engine enabled',
        value: tenants.filter((t) => t.engineEnabled).length,
      },
      {
        label: 'Active instances',
        value: tenants.reduce((sum, t) => sum + t.activeInstances, 0),
      },
      {
        label: 'SLA breaches (30d)',
        value: tenants.reduce((sum, t) => sum + t.slaBreaches30d, 0),
      },
    ],
    [tenants]
  )

  return (
    <div className='w-full'>
      <RoleGate roles={['Platform Admin']}>
        <SummaryCards title='Engine health across tenants' items={summary} />
        <SectionToolbar title={`Tenants (${tenants.length})`} />
        <DataTable
          columns={tenantColumns(toggleEngine, true)}
          data={tenants}
          variant='no-status'
        />
        <p className='text-neutral-1000 mt-2 mb-6 text-xs'>
          Workflow instances, tasks, decisions and audit records are stored in
          tenant-scoped storage with row-level security — cross-tenant reads
          are denied and logged (see RLS denials).
        </p>
      </RoleGate>

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <Card className='gap-2 border-gray-200 py-4'>
          <CardHeader className='px-4 pb-0'>
            <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
              Alerts module — per-company enablement &amp; triggers
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-2 px-4'>
            <SwitchRow
              label='Enable the alerts module'
              hint='When disabled, no alerts are generated anywhere in the HRMS.'
              checked={alertsDraft.moduleEnabled}
              onChange={(v) =>
                setAlertsDraft((prev) => ({ ...prev, moduleEnabled: v }))
              }
            />
            <SwitchRow
              label='Attendance not recorded'
              hint='Remind employees to record missing attendance.'
              checked={alertsDraft.attendanceNotRecorded}
              disabled={!alertsDraft.moduleEnabled}
              onChange={(v) =>
                setAlertsDraft((prev) => ({
                  ...prev,
                  attendanceNotRecorded: v,
                }))
              }
            />
            <SwitchRow
              label='Announcements'
              checked={alertsDraft.announcements}
              disabled={!alertsDraft.moduleEnabled}
              onChange={(v) =>
                setAlertsDraft((prev) => ({ ...prev, announcements: v }))
              }
            />
            <SwitchRow
              label='Pending workflow task'
              hint='Alert the employee when a task awaits their action.'
              checked={alertsDraft.pendingTask}
              disabled={!alertsDraft.moduleEnabled}
              onChange={(v) =>
                setAlertsDraft((prev) => ({ ...prev, pendingTask: v }))
              }
            />
            <SwitchRow
              label='Overdue workflow task'
              hint='Notify when a task passes its due date.'
              checked={alertsDraft.overdueTask}
              disabled={!alertsDraft.moduleEnabled}
              onChange={(v) =>
                setAlertsDraft((prev) => ({ ...prev, overdueTask: v }))
              }
            />
            <div className='flex justify-end gap-3 pt-2'>
              <Button
                variant='outline'
                onClick={() => setConfirmCancel('alerts')}
              >
                Cancel
              </Button>
              <Button onClick={() => saveAlerts(alertsDraft)}>Save</Button>
            </div>
          </CardContent>
        </Card>

        <Card className='gap-2 border-gray-200 py-4'>
          <CardHeader className='px-4 pb-0'>
            <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
              Attendance audit configuration — sampling &amp; violators
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-2 px-4'>
            <SwitchRow
              label='Enable attendance audit support'
              checked={auditDraft.enabled}
              onChange={(v) =>
                setAuditDraft((prev) => ({ ...prev, enabled: v }))
              }
            />
            <div className='flex flex-col gap-1'>
              <Label className='text-neutral-1000 text-xs font-medium'>
                Sample-selection method
              </Label>
              <Select
                value={auditDraft.sampleMethod}
                onValueChange={(v) =>
                  setAuditDraft((prev) => ({
                    ...prev,
                    sampleMethod: v as AuditSettings['sampleMethod'],
                  }))
                }
              >
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['Random', 'Stratified', 'Full population'] as const).map(
                    (m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
            <SwitchRow
              label='Automatically include habitual violators'
              hint='Repeat offenders beyond the thresholds are always sampled.'
              checked={auditDraft.includeHabitualViolators}
              onChange={(v) =>
                setAuditDraft((prev) => ({
                  ...prev,
                  includeHabitualViolators: v,
                }))
              }
            />
            <div className='grid grid-cols-2 gap-3'>
              <NumberField
                label='Violator history period (months)'
                value={auditDraft.historyMonths}
                onChange={(v) =>
                  setAuditDraft((prev) => ({ ...prev, historyMonths: v }))
                }
              />
              <NumberField
                label='Minimum reprimands'
                value={auditDraft.minReprimands}
                onChange={(v) =>
                  setAuditDraft((prev) => ({ ...prev, minReprimands: v }))
                }
              />
              <NumberField
                label='Reschedule limit'
                value={auditDraft.rescheduleLimit}
                onChange={(v) =>
                  setAuditDraft((prev) => ({ ...prev, rescheduleLimit: v }))
                }
              />
              <NumberField
                label='List generation (minutes before)'
                value={auditDraft.listGenMinutesBefore}
                onChange={(v) =>
                  setAuditDraft((prev) => ({
                    ...prev,
                    listGenMinutesBefore: v,
                  }))
                }
              />
            </div>
            <div className='flex justify-end gap-3 pt-2'>
              <Button variant='outline' onClick={() => setConfirmCancel('audit')}>
                Cancel
              </Button>
              <Button onClick={() => saveAuditSettings(auditDraft)}>Save</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog
        open={confirmCancel !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmCancel(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              The configuration reverts to its last saved state.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmCancel === 'alerts') setAlertsDraft(alerts)
                if (confirmCancel === 'audit') setAuditDraft(auditSettings)
                setConfirmCancel(null)
              }}
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
