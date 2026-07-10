import { useState } from 'react'
import { Power, Bell } from 'phosphor-react'
import { Button } from '@/components/ui/button'
import { ToggleTile, ToggleTileGrid } from '@/components/common/settings/toggle-tile'
import { AdvancedSection } from '@/components/common/settings/advanced-section'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { TEMPLATE_EVENTS, type NotificationTemplate } from '../data/config'
import { type LeaveSettingsStore } from '../hooks/use-leave-settings'
import { PagerControls, RefreshButton, usePager } from './list-controls'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December', 'Joining month',
]

const TEMPLATE_PAGE_SIZE = 4

/**
 * Sample values substituted for {{variables}} when previewing a template
 * (ETMPL/NTMPL preview). Uses the fixed reference date of 2026-07-09.
 */
const PREVIEW_SAMPLE_VALUES: Record<string, string> = {
  employee: 'Ananya Sharma',
  recipient: 'Rahul Menon',
  leaveType: 'Privileged Leave',
  from: '09 Jul 2026',
  to: '10 Jul 2026',
  status: 'Approved',
  credited: '1.5',
  creditDate: '01 Jul 2026',
  balance: '12.5',
  holiday: 'Onam',
  date: '26 Aug 2026',
}

/** Substitute sample values for {{variable}} placeholders. */
function renderPreview(text: string) {
  return text.replace(
    /\{\{\s*(\w+)\s*\}\}/g,
    (match, key: string) => PREVIEW_SAMPLE_VALUES[key] ?? match
  )
}

/**
 * Browsable template register (ETMPL-03/04, NTMPL-03): paged list with a
 * refresh control; Edit loads the row into the template editor below and
 * Preview renders the template with sample values.
 */
function TemplateList({
  title,
  hint,
  templates,
  onEdit,
}: {
  title: string
  hint: string
  templates: NotificationTemplate[]
  onEdit: (t: NotificationTemplate) => void
}) {
  const pager = usePager(templates, TEMPLATE_PAGE_SIZE)
  const [previewing, setPreviewing] = useState<NotificationTemplate | null>(null)
  return (
    <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
      <div className='mb-2 flex items-center justify-between'>
        <h3 className='text-neutral-1600 text-sm font-medium'>
          {title} ({templates.length})
          <span className='text-neutral-1000 ml-2 text-xs'>{hint}</span>
        </h3>
        <RefreshButton label={title} />
      </div>
      {templates.length === 0 ? (
        <p className='text-neutral-1000 py-4 text-center text-sm'>
          No records to display.
        </p>
      ) : (
        <>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-neutral-1000 border-b text-left text-xs'>
                <th className='py-2 pr-3 font-medium'>Event</th>
                <th className='px-2 font-medium'>Subject</th>
                <th className='px-2 font-medium'>Body</th>
                <th className='px-2 text-right font-medium'>Action</th>
              </tr>
            </thead>
            <tbody>
              {pager.pageItems.map((t) => (
                <tr key={t.id} className='border-b last:border-0'>
                  <td className='py-2 pr-3 font-medium'>{t.event}</td>
                  <td className='max-w-[220px] truncate px-2'>{t.subject}</td>
                  <td className='text-neutral-1000 max-w-[260px] truncate px-2 text-xs'>
                    {t.body}
                  </td>
                  <td className='px-2 text-right'>
                    <span className='inline-flex gap-1'>
                      <Button
                        variant='outline'
                        className='h-6 px-2 text-xs'
                        onClick={() => setPreviewing(t)}
                      >
                        Preview
                      </Button>
                      <Button
                        variant='outline'
                        className='h-6 px-2 text-xs'
                        onClick={() => onEdit(t)}
                      >
                        Edit
                      </Button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <PagerControls
            page={pager.page}
            pageCount={pager.pageCount}
            total={pager.total}
            onPrev={pager.prev}
            onNext={pager.next}
          />
        </>
      )}

      {/* ETMPL/NTMPL preview: template rendered with sample values. */}
      <Dialog
        open={previewing !== null}
        onOpenChange={(o) => {
          if (!o) setPreviewing(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Preview — {previewing?.event} ({previewing?.channel})
            </DialogTitle>
          </DialogHeader>
          {previewing && (
            <div className='space-y-3 text-sm'>
              <p className='text-neutral-1000 text-xs'>
                Rendered with sample values in place of the{' '}
                {'{{variable}}'} placeholders.
              </p>
              <div className='rounded-[8px] border border-gray-200 bg-white'>
                <div className='border-b border-gray-200 px-3 py-2'>
                  <span className='text-neutral-1000 mr-2 text-xs uppercase'>
                    Subject
                  </span>
                  <span className='font-medium'>
                    {renderPreview(previewing.subject)}
                  </span>
                </div>
                <p className='whitespace-pre-wrap px-3 py-3'>
                  {renderPreview(previewing.body)}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant='outline' onClick={() => setPreviewing(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface ConfigGeneralProps {
  settings: LeaveSettingsStore
  /** Advance to the next configuration step (Save & Next, LVE-47). */
  onNextStep: () => void
}

/**
 * Setup (enable/disable the time-off module, LVE-47), per-employee-class
 * accrual start and supervisor approval limits (LVE-44), and email /
 * notification templates (LVE-48).
 */
export function ConfigGeneral({ settings, onNextStep }: ConfigGeneralProps) {
  const [enabledChoice, setEnabledChoice] = useState(
    settings.moduleEnabled ? 'yes' : 'no'
  )
  const [templateEvent, setTemplateEvent] = useState<string>(TEMPLATE_EVENTS[0])
  const [channel, setChannel] = useState<'Email' | 'In-app'>('Email')

  const template = settings.templates.find(
    (t) => t.event === templateEvent && t.channel === channel
  )
  const [subject, setSubject] = useState(template?.subject ?? '')
  const [body, setBody] = useState(template?.body ?? '')

  const loadTemplate = (event: string, ch: 'Email' | 'In-app') => {
    const t = settings.templates.find((x) => x.event === event && x.channel === ch)
    setSubject(t?.subject ?? '')
    setBody(t?.body ?? '')
  }

  const save = () => {
    settings.setModuleEnabled(enabledChoice === 'yes')
    toast.success(
      enabledChoice === 'yes'
        ? 'Time-off management module enabled'
        : 'Time-off management module disabled — employee leave features are unavailable until re-enabled'
    )
  }

  return (
    <div className='w-full space-y-5'>
      {/* Quick-toggle tiles */}
      <ToggleTileGrid>
        <ToggleTile
          icon={<Power size={20} />}
          label='Time-off module'
          description='Enable the time-off management module for this organization'
          checked={enabledChoice === 'yes'}
          onCheckedChange={(c) => {
            // Write through to the store so the toggle survives navigating
            // away from the group and back within the session.
            setEnabledChoice(c ? 'yes' : 'no')
            settings.setModuleEnabled(c)
          }}
          scope='company'
        />
        <ToggleTile
          icon={<Bell size={20} />}
          label='Notify employees'
          description='Send email notifications on leave events'
          checked={settings.templates.some((t) => t.channel === 'Email')}
          onCheckedChange={() => {}}
          disabled
        />
      </ToggleTileGrid>

      <div className='flex gap-2'>
        <Button className='h-7' onClick={save}>
          Save
        </Button>
        <Button
          variant='outline'
          className='h-7'
          onClick={() => {
            save()
            onNextStep()
          }}
        >
          Save & Next
        </Button>
      </div>

      <AdvancedSection count={3}>
        <div className='space-y-5'>
      {/* LVE-47: Setup */}
      <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
        <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>Setup</h3>
        <p className='text-neutral-1000 mb-3 text-sm'>
          Do you want to enable the time-off management module for this
          organization?
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
      </div>

      {/* LVE-44: employee class rules */}
      <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
        <div className='mb-2 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Time Off Management — Employee Classes
            <span className='text-neutral-1000 ml-2 text-xs'>
              calculation start month and the max time-offs an immediate
              supervisor may approve; beyond the limit the request escalates
            </span>
          </h3>
          {/* TOM-04: refresh the per-class settings list. */}
          <RefreshButton label='Time off management settings' />
        </div>
        <table className='w-full text-sm'>
          <thead>
            <tr className='text-neutral-1000 border-b text-left text-xs'>
              <th className='py-2 pr-3 font-medium'>Employee class</th>
              <th className='px-2 font-medium'>Calculations start from</th>
              <th className='px-2 font-medium'>Max supervisor approval (days)</th>
              <th className='px-2 font-medium'>Accrual rules</th>
            </tr>
          </thead>
          <tbody>
            {settings.classRules.map((r) => (
              <tr key={r.id} className='border-b last:border-0'>
                <td className='py-2 pr-3 font-medium'>{r.employeeClass}</td>
                <td className='px-2'>
                  <Select
                    value={r.calcStartMonth}
                    onValueChange={(v) => settings.updateClassRule(r.id, { calcStartMonth: v })}
                  >
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
                </td>
                <td className='px-2'>
                  <Input
                    type='number'
                    className='h-7 w-20'
                    value={r.maxSupervisorApproval}
                    onChange={(e) =>
                      settings.updateClassRule(r.id, {
                        maxSupervisorApproval: Number(e.target.value),
                      })
                    }
                  />
                </td>
                <td className='text-neutral-1000 px-2 text-xs'>{r.accrualNote}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ETMPL-03/04: browsable, paged email templates register. */}
      <TemplateList
        title='Email Templates'
        hint='sent for workflow events; Edit loads the template into the editor below'
        templates={settings.templates.filter((t) => t.channel === 'Email')}
        onEdit={(t) => {
          setTemplateEvent(t.event)
          setChannel('Email')
          loadTemplate(t.event, 'Email')
          toast.info(`Editing "${t.event}" email template in the editor below`)
        }}
      />

      {/* NTMPL-03: notification (in-app) templates register with refresh. */}
      <TemplateList
        title='Notification Templates'
        hint='in-app notifications; Edit loads the template into the editor below'
        templates={settings.templates.filter((t) => t.channel === 'In-app')}
        onEdit={(t) => {
          setTemplateEvent(t.event)
          setChannel('In-app')
          loadTemplate(t.event, 'In-app')
          toast.info(`Editing "${t.event}" notification template in the editor below`)
        }}
      />

      {/* LVE-48: templates */}
      <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
        <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
          Email & Notification Templates
          <span className='text-neutral-1000 ml-2 text-xs'>
            placeholders: {'{{employee}} {{leaveType}} {{from}} {{to}} {{status}} {{recipient}}'}
          </span>
        </h3>
        <div className='mb-3 flex gap-2'>
          <Select
            value={templateEvent}
            onValueChange={(v) => {
              setTemplateEvent(v)
              loadTemplate(v, channel)
            }}
          >
            <SelectTrigger variant='secondary' className='h-7 w-[160px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TEMPLATE_EVENTS.map((e) => (
                <SelectItem key={e} value={e}>
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={channel}
            onValueChange={(v) => {
              const ch = v as 'Email' | 'In-app'
              setChannel(ch)
              loadTemplate(templateEvent, ch)
            }}
          >
            <SelectTrigger variant='secondary' className='h-7 w-[120px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='Email'>Email</SelectItem>
              <SelectItem value='In-app'>In-app</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className='space-y-3'>
          <div className='space-y-1'>
            <Label>Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className='space-y-1'>
            <Label>Body</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} />
          </div>
          <Button
            className='h-7'
            onClick={() => {
              if (template) settings.updateTemplate(template.id, subject, body)
            }}
          >
            Save template
          </Button>
        </div>
      </div>
        </div>
      </AdvancedSection>
    </div>
  )
}
