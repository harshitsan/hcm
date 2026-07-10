import { useState } from 'react'
import { CheckCircle2, EyeOff, Globe } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { ENTRY_TYPES, type EntryType, type FeedbackEntry } from '../data/entries'
import { type FeedbackConfigStore } from '../hooks/use-feedback-config'
import { type FeedbackEntriesStore } from '../hooks/use-feedback-entries'
import { EmployeeRolePicker } from './employee-role-picker'

interface AnonymousComposeTabProps {
  store: FeedbackEntriesStore
  configStore: FeedbackConfigStore
}

/**
 * Kensium "Submit Anonymous Feedback/Grievance": in the real product this is
 * a public entry point on the login page, used without logging in. The POC
 * simulates that surface here — the submitter's identity is never stored;
 * responses are tracked via an anonymous reference and optionally "sent" to
 * submitter-provided email addresses.
 */
export function AnonymousComposeTab({
  store,
  configStore,
}: AnonymousComposeTabProps) {
  const { config } = configStore
  const [type, setType] = useState<EntryType>('Feedback')
  const [text, setText] = useState('')
  const [sendTo, setSendTo] = useState<string[]>([])
  const [copyTo, setCopyTo] = useState<string[]>([])
  const [emails, setEmails] = useState('')
  const [comments, setComments] = useState('')
  const [submitted, setSubmitted] = useState<FeedbackEntry | null>(null)

  if (!config.anonymousEnabled) {
    return (
      <div className='border-grey-200 flex flex-col items-center gap-2 rounded-[6px] border bg-white px-6 py-12 text-center'>
        <EyeOff size={32} className='text-neutral-1000' />
        <p className='text-neutral-1600 text-paragraph-md font-medium'>
          Anonymous feedback/grievances are not supported
        </p>
        <p className='text-paragraph-sm text-neutral-1000 max-w-md'>
          The company answered "No" to "Do you support anonymous
          feedback/grievances?" in the Feedback/Grievance Receivers
          configuration, so the public anonymous entry point is switched off.
        </p>
      </div>
    )
  }

  const reset = () => {
    setType('Feedback')
    setText('')
    setSendTo([])
    setCopyTo([])
    setEmails('')
    setComments('')
    setSubmitted(null)
  }

  const submit = () => {
    if (!text.trim()) {
      toast.error('Enter the feedback or grievance')
      return
    }
    const emailList = emails
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean)
    if (emailList.some((e) => !e.includes('@'))) {
      toast.error('Check "Send response to emails"', {
        description: 'Enter valid, comma-separated email addresses.',
      })
      return
    }
    const entry = store.submitEntry(
      {
        type,
        category: 'General (public form)',
        details: {
          subject: text.trim().slice(0, 80),
          description: text.trim(),
        },
        anonymous: true,
        onBehalfOf: null,
        sendTo,
        copyTo,
        responseEmails: emailList,
        comments: comments.trim(),
      },
      {
        anonymousReceivers: config.anonymousReceivers,
        nonAnonymousReceivers: config.nonAnonymousReceivers,
        schemaVersion: config.schemaVersion,
        company: 'Aster Retail',
        actor: 'Anonymous',
      }
    )
    setSubmitted(entry)
  }

  if (submitted) {
    return (
      <Card className='mx-auto max-w-2xl gap-3 rounded-[8px] border border-gray-200 bg-white py-4'>
        <CardContent className='flex flex-col items-center gap-2 px-6 py-8 text-center'>
          <CheckCircle2 size={36} className='text-green-1300' />
          <p className='text-neutral-1600 text-paragraph-md font-medium'>
            Anonymous {submitted.type.toLowerCase()} submitted successfully
          </p>
          <p className='text-paragraph-sm text-neutral-1000 max-w-md'>
            Your identity was never stored. Track this submission with
            reference{' '}
            <span className='text-neutral-1600 font-semibold'>
              {submitted.anonymousRef}
            </span>
            .
            {submitted.responseEmails.length > 0
              ? ` Responses will be sent to: ${submitted.responseEmails.join(', ')} (simulated email).`
              : ' No response email was provided — responses are visible via the reference only.'}
          </p>
          <Button variant='outline' onClick={reset} className='mt-2'>
            Submit another
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className='mx-auto max-w-2xl'>
      <div className='bg-blue-150 text-blue-1400 mb-4 flex items-start gap-2 rounded-[6px] px-3 py-2 text-sm'>
        <Globe className='mt-0.5 size-4 shrink-0' />
        <span>
          <span className='font-semibold'>
            Public entry point (simulated):
          </span>{' '}
          in the live product this form sits on the login page — "Submit
          Anonymous Feedback/Grievance" — and is used{' '}
          <span className='font-medium'>without logging in</span>. Your
          identity is never captured or stored.
        </span>
      </div>

      <Card className='gap-3 rounded-[8px] border border-gray-200 bg-white py-4'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 flex items-center gap-2 font-medium'>
            <EyeOff className='size-4' />
            Submit Anonymous Feedback/Grievance
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4 px-4'>
          <div>
            <Label className='text-sm font-medium'>Type</Label>
            <RadioGroup
              value={type}
              onValueChange={(v) => setType(v as EntryType)}
              className='mt-1 flex items-center gap-6'
            >
              {ENTRY_TYPES.map((t) => (
                <label key={t} className='flex items-center gap-2 text-sm'>
                  <RadioGroupItem value={t} />
                  {t}
                </label>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label className='text-sm font-medium'>Feedback</Label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder='Enter the feedback or grievance'
              className='mt-1'
            />
          </div>

          <EmployeeRolePicker
            label='Send to'
            value={sendTo}
            onChange={setSendTo}
            employeesOnly
            hint='Recipients who can respond to this submission. Leave empty to route to the configured anonymous receivers.'
          />

          <EmployeeRolePicker
            label='Copy to'
            value={copyTo}
            onChange={setCopyTo}
            employeesOnly
            hint='Tip: employees marked "Copy to" can only see the response but cannot submit a response.'
          />

          <div>
            <Label className='text-sm font-medium'>
              Send response to emails
            </Label>
            <Input
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              placeholder='Enter email ids (comma separated) where the response needs to be sent'
              className='mt-1'
            />
            <p className='text-paragraph-sm text-neutral-1000 mt-1'>
              Optional — use a personal address; it is stored on the entry, not
              linked to any employee record.
            </p>
          </div>

          <div>
            <Label className='text-sm font-medium'>Comments</Label>
            <Textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={2}
              placeholder='Enter comments (optional)'
              className='mt-1'
            />
          </div>

          <div className='flex items-center justify-end gap-3'>
            <Button variant='outline' onClick={reset}>
              Clear
            </Button>
            <Button onClick={submit}>Submit anonymously</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
