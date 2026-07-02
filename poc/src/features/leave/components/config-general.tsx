import { useState } from 'react'
import { Button } from '@/components/ui/button'
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
import { TEMPLATE_EVENTS } from '../data/config'
import { type LeaveSettingsStore } from '../hooks/use-leave-settings'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December', 'Joining month',
]

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
      </div>

      {/* LVE-44: employee class rules */}
      <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
        <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
          Time Off Management — Employee Classes
          <span className='text-neutral-1000 ml-2 text-xs'>
            calculation start month and the max time-offs an immediate
            supervisor may approve; beyond the limit the request escalates
          </span>
        </h3>
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
  )
}
