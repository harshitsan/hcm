import { useState } from 'react'
import { toast } from 'sonner'
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
import { Textarea } from '@/components/ui/textarea'
import { COMPANIES } from '../data/catalog'
import { type NotificationTemplate } from '../data/config'
import { type DataConfigStore } from '../hooks/use-data-config'

function TemplateEditor({
  template,
  onSave,
}: {
  template: NotificationTemplate
  onSave: (subject: string, body: string) => void
}) {
  const [subject, setSubject] = useState(template.subject)
  const [body, setBody] = useState(template.body)
  return (
    <div className='space-y-2 rounded-[6px] border border-gray-200 px-3 py-2.5'>
      <Label className='text-neutral-1600'>
        On “{template.event}” (sent to the job submitter and authorized admins
        in the job’s tenant only)
      </Label>
      <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
      />
      <p className='text-paragraph-sm text-neutral-1000'>
        Placeholders:{' '}
        {'{jobId} {entity} {format} {total} {success} {failed} {skipped}'}
      </p>
      <Button
        variant='outline'
        onClick={() => onSave(subject.trim(), body.trim())}
      >
        Save template
      </Button>
    </div>
  )
}

interface ConfigNotificationsProps {
  store: DataConfigStore
}

/**
 * Governed notification templates for async job completion/failure
 * (DM-19) and per-tenant limit overrides (DM-17).
 */
export function ConfigNotifications({ store }: ConfigNotificationsProps) {
  const { templates, updateTemplate, overrides, addOverride, removeOverride } =
    store

  const [companyId, setCompanyId] = useState('')
  const [sizeMb, setSizeMb] = useState('')
  const [batch, setBatch] = useState('')

  const submitOverride = () => {
    const company = COMPANIES.find((c) => c.id === companyId)
    const size = Number(sizeMb)
    const records = Number(batch)
    if (!company || !size || !records || size <= 0 || records <= 0) {
      toast.error('Pick a tenant and provide positive limit values')
      return
    }
    addOverride({
      companyId: company.id,
      companyName: company.name,
      maxFileSizeMb: size,
      maxBatchRecords: records,
      note: 'Manual override',
    })
    setCompanyId('')
    setSizeMb('')
    setBatch('')
  }

  return (
    <div className='grid gap-4 lg:grid-cols-2'>
      <Card className='gap-3 border-gray-200 py-4'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Job notification templates
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 px-4'>
          {templates.map((t) => (
            <TemplateEditor
              key={t.event}
              template={t}
              onSave={(subject, body) => updateTemplate(t.event, subject, body)}
            />
          ))}
        </CardContent>
      </Card>

      <Card className='gap-3 border-gray-200 py-4'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Per-tenant limit overrides
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 px-4'>
          <div className='space-y-1.5'>
            {overrides.map((o) => (
              <div
                key={o.id}
                className='flex items-center justify-between rounded-[6px] border border-gray-200 px-3 py-1.5 text-sm'
              >
                <span>
                  <span className='text-neutral-1600 font-medium'>
                    {o.companyName}
                  </span>{' '}
                  <span className='text-neutral-1000'>
                    {o.maxFileSizeMb} MB / {o.maxBatchRecords.toLocaleString()}{' '}
                    records — {o.note}
                  </span>
                </span>
                <Button
                  variant='outline'
                  className='h-7 px-2'
                  onClick={() => removeOverride(o.id)}
                >
                  Remove
                </Button>
              </div>
            ))}
            {overrides.length === 0 && (
              <p className='text-paragraph-sm text-neutral-1000'>
                No overrides — platform defaults govern every tenant.
              </p>
            )}
          </div>

          <div className='space-y-2 rounded-[6px] border border-gray-200 px-3 py-2.5'>
            <Label>Add override (applies only within that tenant)</Label>
            <Select value={companyId} onValueChange={setCompanyId}>
              <SelectTrigger variant='secondary' className='w-full'>
                <SelectValue placeholder='Tenant' />
              </SelectTrigger>
              <SelectContent>
                {COMPANIES.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className='grid grid-cols-2 gap-2'>
              <Input
                placeholder='Max MB'
                value={sizeMb}
                onChange={(e) => setSizeMb(e.target.value)}
              />
              <Input
                placeholder='Max records'
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
              />
            </div>
            <Button variant='outline' onClick={submitOverride}>
              Apply override
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
