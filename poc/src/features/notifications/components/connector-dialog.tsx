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

const connectorFormSchema = z.object({
  target: z.string().trim().min(3, 'Enter the workspace or number to connect'),
})

type ConnectorFormValues = z.infer<typeof connectorFormSchema>

interface ConnectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  connector: Connector | null
  onConnect: (id: Connector['id'], target: string) => void
}

/** Connect a Teams workspace / WhatsApp business number (mock, NTF-13). */
export function ConnectorDialog({
  open,
  onOpenChange,
  connector,
  onConnect,
}: ConnectorDialogProps) {
  const form = useForm<ConnectorFormValues>({
    resolver: zodResolver(connectorFormSchema),
    defaultValues: { target: '' },
  })

  useEffect(() => {
    if (!open || !connector) return
    form.reset({ target: connector.target })
  }, [open, connector, form])

  function handleSubmit(values: ConnectorFormValues) {
    if (!connector) return
    onConnect(connector.id, values.target)
    onOpenChange(false)
  }

  if (!connector) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-[440px]'>
        <DialogHeader>
          <DialogTitle>Connect {connector.name}</DialogTitle>
          <DialogDescription>
            Point the connector at your {connector.targetLabel.toLowerCase()}.
            Once connected, the channel can be switched on for delivery; any
            failure always falls back to the mandatory email channel.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='target'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{connector.targetLabel}</FormLabel>
                  <FormControl>
                    <Input placeholder={connector.targetPlaceholder} {...field} />
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
              <Button type='submit'>Connect</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
