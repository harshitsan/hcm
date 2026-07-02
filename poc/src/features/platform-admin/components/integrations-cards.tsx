import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { RoleGate, useRole } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { WEBHOOK_EVENTS, type WebhookEvent } from '../data/config'
import { type GovernedConfigStore } from '../hooks/use-governed-config'
import { MiniTable, SectionCard, ToneBadge } from './shared'

const webhookSchema = z.object({
  url: z
    .url('Enter a valid URL')
    .refine((u) => u.startsWith('https://'), 'Webhooks must be delivered over HTTPS'),
  events: z.array(z.enum(WEBHOOK_EVENTS)).min(1, 'Subscribe to at least one event'),
})

type WebhookFormValues = z.infer<typeof webhookSchema>

/** Webhooks + workflow approval engine (SYS-28, 34, 36, 77). */
export function IntegrationsCards({ store }: { store: GovernedConfigStore }) {
  const { hasRole } = useRole()
  const [webhookOpen, setWebhookOpen] = useState(false)
  const form = useForm<WebhookFormValues>({
    resolver: zodResolver(webhookSchema),
    defaultValues: { url: '', events: [] },
  })

  const canApprove = hasRole('Company Admin', 'Platform Admin')

  return (
    <>
      {/* Company webhooks (SYS-28, 34, 77) */}
      <SectionCard
        title={`Company webhooks (${store.webhooks.length})`}
        description='HTTPS delivery with signature verification; unavailable endpoints are retried. Only the owning company&apos;s events and endpoints are processed. Notification records kept 1 year.'
        actions={
          <RoleGate roles={['Company Admin', 'Platform Admin']}>
            <Button
              variant='outline'
              className='h-8'
              onClick={() => {
                form.reset({ url: '', events: [] })
                setWebhookOpen(true)
              }}
            >
              New webhook
            </Button>
          </RoleGate>
        }
      >
        <MiniTable
          headers={['Endpoint', 'Subscribed events', 'Active', 'Last delivery', '']}
          rows={store.webhooks.map((w) => [
            <span key='u' className='font-mono text-xs'>{w.url}</span>,
            <div key='e' className='flex flex-wrap gap-1'>
              {w.events.map((e) => (
                <Badge key={e} variant='pending'>
                  {e}
                </Badge>
              ))}
            </div>,
            <Switch
              key='a'
              checked={w.active}
              disabled={!canApprove}
              onCheckedChange={() => store.toggleWebhook(w.id)}
            />,
            w.lastDelivery ? (
              <div key='d' className='flex items-center gap-2'>
                <span className='text-paragraph-sm'>{w.lastDelivery}</span>
                <ToneBadge tone={w.lastStatus === 'delivered' ? 'green' : 'amber'}>
                  {w.lastStatus}
                </ToneBadge>
              </div>
            ) : (
              <span key='d' className='text-paragraph-sm text-neutral-1000'>—</span>
            ),
            <div key='t' className='flex justify-end'>
              <Button
                variant='outline'
                className='h-7 px-2 text-xs'
                disabled={!w.active || !canApprove}
                onClick={() => store.sendTest(w.id)}
              >
                Send test event
              </Button>
            </div>,
          ])}
        />
      </SectionCard>

      {/* Workflow & approval routing engine (SYS-36) */}
      <SectionCard
        title='Workflow & approval routing'
        description='Lifecycle actions, sensitive-field changes and cross-company sharing route to configured approvers. Changes apply only on final approval; completed workflows are retained 7 years.'
      >
        <MiniTable
          headers={['Type', 'Subject', 'Requested by', 'Company', 'Submitted', 'Status', '']}
          rows={store.workflows.map((w) => [
            w.type,
            <span key='s' className='font-medium'>{w.subject}</span>,
            w.requestedBy,
            w.tenantCode,
            w.submittedAt,
            <ToneBadge
              key='st'
              tone={
                w.status === 'approved'
                  ? 'green'
                  : w.status === 'rejected'
                    ? 'red'
                    : w.status === 'returned'
                      ? 'amber'
                      : 'blue'
              }
            >
              {w.status}
            </ToneBadge>,
            <div key='a' className='flex justify-end gap-1'>
              {w.status === 'pending' && canApprove && (
                <>
                  <Button
                    className='h-7 px-2 text-xs'
                    onClick={() => store.decideWorkflow(w.id, 'approved')}
                  >
                    Approve
                  </Button>
                  <Button
                    variant='outline'
                    className='h-7 px-2 text-xs'
                    onClick={() => store.decideWorkflow(w.id, 'rejected')}
                  >
                    Reject
                  </Button>
                  <Button
                    variant='outline'
                    className='h-7 px-2 text-xs'
                    onClick={() => store.decideWorkflow(w.id, 'returned')}
                  >
                    Return
                  </Button>
                </>
              )}
            </div>,
          ])}
        />
      </SectionCard>

      {/* New webhook (SYS-77) */}
      <Dialog open={webhookOpen} onOpenChange={setWebhookOpen}>
        <DialogContent className='sm:max-w-[440px]'>
          <DialogHeader>
            <DialogTitle>New company webhook</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => {
                store.addWebhook({
                  url: values.url,
                  events: values.events as WebhookEvent[],
                })
                setWebhookOpen(false)
              })}
              className='space-y-4'
            >
              <FormField
                control={form.control}
                name='url'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endpoint URL (HTTPS only)</FormLabel>
                    <FormControl>
                      <Input placeholder='https://example.com/hooks/hr' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='events'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subscribed events</FormLabel>
                    <div className='border-grey-200 grid gap-2 rounded-[6px] border p-3'>
                      {WEBHOOK_EVENTS.map((event) => (
                        <label key={event} className='flex items-center gap-2 text-sm'>
                          <Checkbox
                            variant='blue'
                            checked={field.value.includes(event)}
                            onCheckedChange={(checked) =>
                              field.onChange(
                                checked
                                  ? [...field.value, event]
                                  : field.value.filter((e) => e !== event)
                              )
                            }
                          />
                          {event}
                        </label>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <p className='text-paragraph-sm text-neutral-1000'>
                Deliveries are signed — receivers verify the signature before
                trusting the payload.
              </p>
              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setWebhookOpen(false)}
                >
                  Cancel
                </Button>
                <Button type='submit'>Subscribe</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}
