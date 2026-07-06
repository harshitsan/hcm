import { useState } from 'react'
import { Megaphone } from 'phosphor-react'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { type CalendarAccessConfig } from '../data/config'
import { type LeaveSettingsStore } from '../hooks/use-leave-settings'

interface ConfigCalendarProps {
  settings: LeaveSettingsStore
  /** Advance to the next configuration step (Save & Next, CAL-03 Setup). */
  onNextStep: () => void
}

interface AccessRow {
  key: keyof CalendarAccessConfig
  label: string
  hint: string
}

const ACCESS_ROWS: AccessRow[] = [
  {
    key: 'peerCalendars',
    label: "Employees can add and view other employees' calendars",
    hint: 'Team members subscribe to each other’s calendars to coordinate schedules.',
  },
  {
    key: 'managerHierarchy',
    label: "Reporting manager hierarchy can view an employee's calendar events",
    hint: 'Every manager up the reporting chain gets visibility into the employee’s events.',
  },
  {
    key: 'hrVisibility',
    label: "HR can view any employee's calendar events",
    hint: 'The HR team oversees organization-wide scheduling.',
  },
  {
    key: 'eventAnnouncements',
    label: 'Show event-based announcements on the calendar',
    hint: 'Company announcements tied to a date (town halls, enrollment windows) appear inline.',
  },
]

/**
 * Configuration → Calendar: module Setup (enable/disable with Save & Next /
 * Cancel, CAL-01..04 Setup) and calendar accessibility — peer calendars,
 * manager-hierarchy and HR visibility, event-based announcements — persisted
 * via Save (CAL-01..05 Configure Calendar).
 */
export function ConfigCalendar({ settings, onNextStep }: ConfigCalendarProps) {
  const [enabledChoice, setEnabledChoice] = useState(
    settings.calendarModuleEnabled ? 'yes' : 'no'
  )
  const [draft, setDraft] = useState<CalendarAccessConfig>(
    settings.calendarAccess
  )
  const dirty =
    draft.peerCalendars !== settings.calendarAccess.peerCalendars ||
    draft.managerHierarchy !== settings.calendarAccess.managerHierarchy ||
    draft.hrVisibility !== settings.calendarAccess.hrVisibility ||
    draft.eventAnnouncements !== settings.calendarAccess.eventAnnouncements

  const saveSetup = () => {
    settings.setCalendarModuleEnabled(enabledChoice === 'yes')
  }

  /** CAL-04 (Setup): discard unsaved Setup edits. */
  const cancelSetup = () => {
    setEnabledChoice(settings.calendarModuleEnabled ? 'yes' : 'no')
    toast.info('Setup changes discarded')
  }

  /** CAL-05: persist the accessibility configuration. */
  const saveAccess = () => {
    settings.saveCalendarAccess(draft)
  }

  const cancelAccess = () => {
    setDraft(settings.calendarAccess)
    toast.info('Accessibility changes discarded')
  }

  return (
    <div className='w-full space-y-5'>
      {/* CAL-01..04 (Setup): enable/disable the calendar module */}
      <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
        <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
          Calendar Setup
        </h3>
        <p className='text-neutral-1000 mb-3 text-sm'>
          Do you want to enable the calendar module for this organization?
        </p>
        <RadioGroup
          value={enabledChoice}
          onValueChange={setEnabledChoice}
          className='mb-4 flex gap-6'
        >
          <label className='flex items-center gap-2 text-sm'>
            <RadioGroupItem value='yes' /> Yes
          </label>
          <label className='flex items-center gap-2 text-sm'>
            <RadioGroupItem value='no' /> No
          </label>
        </RadioGroup>
        <div className='flex gap-2'>
          <Button className='h-7' onClick={saveSetup}>
            Save
          </Button>
          <Button
            variant='outline'
            className='h-7'
            onClick={() => {
              saveSetup()
              onNextStep()
            }}
          >
            Save & Next
          </Button>
          <Button variant='ghost' className='h-7' onClick={cancelSetup}>
            Cancel
          </Button>
        </div>
      </div>

      {/* CAL-01..05 (Configure Calendar): accessibility configuration */}
      <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
        <h3 className='text-neutral-1600 mb-1 text-sm font-medium'>
          Calendar Accessibility
          <span className='text-neutral-1000 ml-2 text-xs'>
            who can view calendar events and what appears on the calendar
          </span>
        </h3>
        {!settings.calendarModuleEnabled && (
          <p className='text-red-1400 mb-2 text-xs'>
            The calendar module is disabled — enable it above before
            configuring accessibility.
          </p>
        )}
        <div className='divide-y divide-gray-100'>
          {ACCESS_ROWS.map((row) => (
            <div
              key={row.key}
              className='flex items-center justify-between gap-4 py-3'
            >
              <div>
                <p className='text-neutral-1600 text-sm font-medium'>
                  {row.label}
                </p>
                <p className='text-neutral-1000 text-xs'>{row.hint}</p>
              </div>
              <Switch
                checked={draft[row.key]}
                disabled={!settings.calendarModuleEnabled}
                onCheckedChange={(checked) =>
                  setDraft((prev) => ({ ...prev, [row.key]: checked }))
                }
              />
            </div>
          ))}
        </div>
        {draft.eventAnnouncements && (
          <div className='bg-blue-150 text-neutral-1600 mt-3 flex items-start gap-2 rounded-[6px] p-3 text-xs'>
            <Megaphone size={16} weight='bold' className='mt-0.5 shrink-0' />
            <span>
              Event-based announcements will appear on the Company Calendar —
              e.g. town halls, benefits enrollment windows and office
              celebrations.
            </span>
          </div>
        )}
        <div className='mt-4 flex gap-2'>
          <Button
            className='h-7'
            disabled={!settings.calendarModuleEnabled}
            onClick={saveAccess}
          >
            Save configuration
          </Button>
          <Button
            variant='ghost'
            className='h-7'
            disabled={!dirty}
            onClick={cancelAccess}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
