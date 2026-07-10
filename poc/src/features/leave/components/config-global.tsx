import { useState } from 'react'
import { Button } from '@/components/ui/button'
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
import { toast } from 'sonner'
import { MONTHS, type TimeOffGlobalSettings } from '../data/global-settings'
import { type GlobalSettingsStore } from '../hooks/use-global-settings'

/** A yes/no question row with a Switch, matching the PDF's checkbox rows. */
function SwitchRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className='flex items-center justify-between gap-4 py-3'>
      <div>
        <p className='text-neutral-1600 text-sm font-medium'>{label}</p>
        {hint && <p className='text-paragraph-sm text-neutral-1000'>{hint}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

/** A labelled numeric input with helper text. */
function NumberField({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  hint?: string
  value: number
  min?: number
  max?: number
  onChange: (v: number) => void
}) {
  return (
    <div className='space-y-1'>
      <Label>{label}</Label>
      <Input
        type='number'
        className='h-7 w-24'
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint && <p className='text-paragraph-sm text-neutral-1000'>{hint}</p>}
    </div>
  )
}

/** A labelled month Select with helper text. */
function MonthField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string
  hint?: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className='space-y-1'>
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger variant='secondary' className='h-7 w-[150px]'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MONTHS.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hint && <p className='text-paragraph-sm text-neutral-1000'>{hint}</p>}
    </div>
  )
}

function Section({
  title,
  hint,
  children,
}: {
  title: string
  hint: string
  children: React.ReactNode
}) {
  return (
    <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
      <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
        {title}
        <span className='text-neutral-1000 ml-2 text-xs'>{hint}</span>
      </h3>
      {children}
    </div>
  )
}

/**
 * Configuration → Time Off Management: the organization-level global
 * settings form (pointers 1–20) — policy applicability, calculation and
 * credit periods, approval thresholds, payout rules, payroll reminders and
 * notification rules. Save persists via the store and toasts.
 */
export function ConfigGlobal({ store }: { store: GlobalSettingsStore }) {
  const [draft, setDraft] = useState<TimeOffGlobalSettings>(store.settings)

  const set = <K extends keyof TimeOffGlobalSettings>(
    key: K,
    value: TimeOffGlobalSettings[K]
  ) => setDraft((prev) => ({ ...prev, [key]: value }))

  const save = () => {
    if (draft.creditDayOfMonth < 1 || draft.creditDayOfMonth > 28) {
      toast.error('Time offs must be credited on a day between 1 and 28')
      return
    }
    if (
      draft.secondReminderDaysBeforePayroll >
      draft.firstReminderDaysBeforePayroll
    ) {
      toast.error(
        'The second reminder must be closer to payroll than the first reminder'
      )
      return
    }
    store.updateSettings(draft)
  }

  const cancel = () => {
    setDraft(store.settings)
    toast.info('Global settings changes discarded')
  }

  return (
    <div className='w-full space-y-5'>
      <Section
        title='Policy applicability'
        hint='which dimensions can carry their own time-off rules'
      >
        <div className='divide-y divide-gray-100'>
          <SwitchRow
            label='Do you support location based time off policies?'
            hint='E.g. define time-off rules specific to a few locations.'
            checked={draft.supportLocationBasedPolicies}
            onChange={(v) => set('supportLocationBasedPolicies', v)}
          />
          <SwitchRow
            label='Do you support department based time off policies?'
            hint='E.g. different time-off rules for different departments.'
            checked={draft.supportDepartmentBasedPolicies}
            onChange={(v) => set('supportDepartmentBasedPolicies', v)}
          />
          <SwitchRow
            label='Do you support position based time off policies?'
            hint='E.g. paid time off applicable only to managers.'
            checked={draft.supportPositionBasedPolicies}
            onChange={(v) => set('supportPositionBasedPolicies', v)}
          />
        </div>
      </Section>

      <Section
        title='Calculation & credits'
        hint='when balances are computed and when credits land'
      >
        <div className='grid gap-4 sm:grid-cols-3'>
          <MonthField
            label='Time off calculation starts from'
            hint='Balances, carry-forward and encashment are computed as on the month before this.'
            value={draft.calculationStartMonth}
            onChange={(v) => set('calculationStartMonth', v)}
          />
          <NumberField
            label='Time offs to be credited on (day of month)'
            hint='E.g. credit time offs on the 1st of every month.'
            value={draft.creditDayOfMonth}
            min={1}
            max={28}
            onChange={(v) => set('creditDayOfMonth', v)}
          />
          <NumberField
            label='Maximum time off days per year'
            hint='Allotments across all time-off types will not exceed this limit.'
            value={draft.maxTimeOffDaysPerYear}
            min={0}
            onChange={(v) => set('maxTimeOffDaysPerYear', v)}
          />
        </div>
      </Section>

      <Section
        title='Approval thresholds'
        hint='when a request escalates beyond the immediate supervisor'
      >
        <div className='grid gap-4 sm:grid-cols-3'>
          <NumberField
            label='Max days approvable by immediate supervisor'
            hint='Requests exceeding this go to the second-level approver per the workflow.'
            value={draft.maxSupervisorApprovableDays}
            min={0}
            onChange={(v) => set('maxSupervisorApprovableDays', v)}
          />
          <NumberField
            label='Days of time off requiring handover'
            hint='Beyond this the Time Off Admin assigns roles & responsibilities to another employee.'
            value={draft.handoverThresholdDays}
            min={0}
            onChange={(v) => set('handoverThresholdDays', v)}
          />
          <NumberField
            label='Payroll cutoff day of month'
            hint='Time offs raised after this day, for the period before the payroll date, require additional approval.'
            value={draft.payrollCutoffDay}
            min={1}
            max={28}
            onChange={(v) => set('payrollCutoffDay', v)}
          />
        </div>
      </Section>

      <Section title='Payout' hint='time-off payout (encashment) rules'>
        <div className='divide-y divide-gray-100'>
          <SwitchRow
            label='Do you have time off payout?'
            hint='Enables payout rules to be configured per time-off type.'
            checked={draft.payoutEnabled}
            onChange={(v) => set('payoutEnabled', v)}
          />
          {draft.payoutEnabled && (
            <>
              <SwitchRow
                label='Allow employee to raise the time off payout request'
                hint='Employees may raise payout requests per the defined policy.'
                checked={draft.allowEmployeePayoutRequest}
                onChange={(v) => set('allowEmployeePayoutRequest', v)}
              />
              <SwitchRow
                label='Do you support force payout of excess time offs?'
                hint='The system alerts the user to start the payout process in the selected period.'
                checked={draft.forcePayoutExcess}
                onChange={(v) => set('forcePayoutExcess', v)}
              />
              {draft.forcePayoutExcess && (
                <div className='py-3'>
                  <MonthField
                    label='Period for force en-payout'
                    hint='Month during which the time-off payout process is initiated.'
                    value={draft.forcePayoutMonth}
                    onChange={(v) => set('forcePayoutMonth', v)}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </Section>

      <Section
        title='Reminders'
        hint='nudge managers on pending approvals before payroll'
      >
        <div className='grid gap-4 sm:grid-cols-2'>
          <NumberField
            label='First reminder (days before payroll)'
            hint='Reporting managers are reminded of pending time-off approvals.'
            value={draft.firstReminderDaysBeforePayroll}
            min={0}
            onChange={(v) => set('firstReminderDaysBeforePayroll', v)}
          />
          <NumberField
            label='Second reminder (days before payroll)'
            hint='A second reminder closer to the payroll period.'
            value={draft.secondReminderDaysBeforePayroll}
            min={0}
            onChange={(v) => set('secondReminderDaysBeforePayroll', v)}
          />
        </div>
      </Section>

      <Section
        title='Notifications'
        hint='who is told about applications, approvals and credits'
      >
        <div className='divide-y divide-gray-100'>
          <SwitchRow
            label='Do you support notifications for time off applications?'
            hint='Enables the notification rules below.'
            checked={draft.notificationsEnabled}
            onChange={(v) => set('notificationsEnabled', v)}
          />
          {draft.notificationsEnabled && (
            <>
              <SwitchRow
                label="Notify the peers about employees' approved time off"
                hint='Peers named on the application are notified as soon as it is approved.'
                checked={draft.notifyPeersOnApproval}
                onChange={(v) => set('notifyPeersOnApproval', v)}
              />
              <div className='py-3'>
                <NumberField
                  label='Notify peers before the time off (days)'
                  hint='Peers are reminded this many days before the approved leave starts.'
                  value={draft.notifyPeersBeforeLeaveDays}
                  min={0}
                  onChange={(v) => set('notifyPeersBeforeLeaveDays', v)}
                />
              </div>
              <div className='py-3'>
                <NumberField
                  label='Notify approver(s) and time off admin before (days)'
                  hint="Approvers and the Time Off Admin are notified before the employee's time off."
                  value={draft.notifyApproversBeforeDays}
                  min={0}
                  onChange={(v) => set('notifyApproversBeforeDays', v)}
                />
              </div>
              <SwitchRow
                label='Do you support notifications for time off credits?'
                hint='Employees are notified as soon as time offs are credited.'
                checked={draft.notifyOnCredit}
                onChange={(v) => set('notifyOnCredit', v)}
              />
            </>
          )}
        </div>
      </Section>

      <div className='flex gap-2'>
        <Button className='h-7' onClick={save}>
          Save
        </Button>
        <Button variant='ghost' className='h-7' onClick={cancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
