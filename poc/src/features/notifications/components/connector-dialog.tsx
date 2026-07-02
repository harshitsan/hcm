import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { type Connector } from '../data/settings'
import { type ConnectorDraft } from '../hooks/use-notification-settings'

const connectorFormSchema = z.object({
  webhookUrl: z.url('Enter a valid webhook URL'),
  apiKey: z.string().min(8, 'API key must be at least 8 characters'),
})

type ConnectorFormValues = z.infer<typeof connectorFormSchema>

interface ConnectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  connector: Connector | null
  onSubmit: (id: Connector['id'], draft: ConnectorDraft) => void
}

/** Platform Admin provisioning of Teams/WhatsApp connectors (NTF-13). */
export function ConnectorDialog({
  open,
  onOpenChange,
  connector,
  onSubmit,
}: ConnectorDialogProps) {
  const form = useForm<ConnectorFormValues>({
    resolver: zodResolver(connectorFormSchema),
    defaultValues: { webhookUrl: '', apiKey: '' },
  })

  useEffect(() => {
    if (!open || !connector) return
    form.reset({
      webhookUrl: connector.webhookUrl,
      apiKey: connector.credentialStatus === 'valid' ? connector.apiKey : '',
    })
  }, [open, connector, form])

  function handleSubmit(values: ConnectorFormValues) {
    if (!connector) return
    onSubmit(connector.id, values)
    onOpenChange(false)
  }

  if (!connector) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-[460px]'>
        <DialogHeader>
          <DialogTitle>Configure {connector.name} connector</DialogTitle>
          <DialogDescription>
            Supply the third-party integration credentials. Once provisioned,
            Company Admins can enable the channel; failures always fall back to
            mandatory email.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='webhookUrl'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Webhook URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='https://provider.example.com/webhook/…'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='apiKey'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API key</FormLabel>
                  <FormControl>
                    <Input
                      type='password'
                      placeholder='Integration API key'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>Provision connector</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
