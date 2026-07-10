import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/utils/helpers'
import { type SurveysStore } from '../hooks/use-surveys'

/**
 * Survey Email Templates step (SAP-04 target): view and edit the invitation,
 * approval-request and reminder templates used by survey notifications.
 */
export function SurveyTemplatesStep({ store }: { store: SurveysStore }) {
  const { templates } = store
  const [activeId, setActiveId] = useState(templates[0]?.id ?? '')
  const active = templates.find((t) => t.id === activeId)
  const [subject, setSubject] = useState(active?.subject ?? '')
  const [body, setBody] = useState(active?.body ?? '')

  const selectTemplate = (id: string) => {
    const t = templates.find((x) => x.id === id)
    if (!t) return
    setActiveId(id)
    setSubject(t.subject)
    setBody(t.body)
  }

  return (
    <div className='grid w-full grid-cols-1 gap-4 xl:grid-cols-3'>
      <Card className='gap-3 border-none bg-white py-4'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Survey Email Templates
          </CardTitle>
          <p className='text-paragraph-sm text-neutral-1000'>
            Wording for every survey notification event — invitations,
            approver requests and reminders.
          </p>
        </CardHeader>
        <CardContent className='space-y-1 px-4'>
          {templates.map((t) => (
            <button
              key={t.id}
              type='button'
              onClick={() => selectTemplate(t.id)}
              className={cn(
                'w-full rounded-[6px] px-3 py-2 text-left',
                t.id === activeId
                  ? 'bg-blue-150 text-blue-1400'
                  : 'text-neutral-1900 hover:bg-neutral-200'
              )}
            >
              <p className='text-sm font-medium'>{t.name}</p>
              <p className='text-paragraph-sm text-neutral-1000'>
                Last updated {t.updatedOn}
              </p>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card className='gap-3 border-none bg-white py-4 xl:col-span-2'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            {active?.name ?? 'Template'}
          </CardTitle>
          <p className='text-paragraph-sm text-neutral-1000'>
            Placeholders like {'{{survey_title}}'} resolve at send time.
            Anonymous surveys never expose respondent identity in
            notifications.
          </p>
        </CardHeader>
        <CardContent className='space-y-3 px-4'>
          <div>
            <Label className='text-sm'>Subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className='mt-1'
            />
          </div>
          <div>
            <Label className='text-sm'>Body</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={9}
              className='mt-1 font-mono text-sm'
            />
          </div>
          <div className='flex items-center justify-end gap-3'>
            <Button
              variant='outline'
              onClick={() => active && selectTemplate(active.id)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => active && store.saveTemplate(active.id, subject, body)}
            >
              Save template
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
