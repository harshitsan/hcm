import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { evaluateRouting, type RoutingRule } from '../data/routing'
import {
  DEPARTMENTS,
  JURISDICTIONS,
  LOCATIONS,
  ORG_GROUPS,
  TRANSACTION_TYPES,
} from '../data/shared'
import type { StartInstanceInput } from '../hooks/use-instances'

const startSchema = z.object({
  title: z.string().min(3, 'Describe the request'),
  requester: z.string().min(2, 'Requester is required'),
  transactionType: z.enum(TRANSACTION_TYPES),
  company: z.string().min(1),
  jurisdiction: z.enum(JURISDICTIONS),
  location: z.enum(LOCATIONS),
  department: z.enum(DEPARTMENTS),
  orgGroup: z.enum(ORG_GROUPS),
})

type StartValues = z.infer<typeof startSchema>

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: readonly string[]
}) {
  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <Select value={value} onValueChange={onChange}>
        <FormControl>
          <SelectTrigger variant='secondary' className='w-full'>
            <SelectValue />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )
}

/**
 * Initiates a transaction through the routing decision table (WFE-02,
 * WFE-25): the live preview shows which rule the sample transaction matches
 * before it is started.
 */
export function StartRequestDialog({
  open,
  onOpenChange,
  companies,
  rules,
  defaultRequester,
  onStart,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  companies: string[]
  rules: RoutingRule[]
  defaultRequester: string
  onStart: (input: StartInstanceInput) => void
}) {
  const form = useForm<StartValues>({
    resolver: zodResolver(startSchema),
    defaultValues: {
      title: '',
      requester: defaultRequester,
      transactionType: 'Leave Request',
      company: companies[0] ?? '',
      jurisdiction: 'India',
      location: 'Hyderabad',
      department: 'Engineering',
      orgGroup: 'Aurora Group',
    },
  })

  useEffect(() => {
    if (open) form.reset()
  }, [open, form])

  const watched = form.watch()
  const preview = evaluateRouting(rules, {
    transactionType: watched.transactionType,
    company: watched.company,
    jurisdiction: watched.jurisdiction,
    location: watched.location,
    department: watched.department,
    orgGroup: watched.orgGroup,
  })

  function handleSubmit(values: StartValues) {
    onStart(values)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[520px]'>
        <DialogHeader>
          <DialogTitle>Start a request</DialogTitle>
          <DialogDescription>
            The engine evaluates the routing decision table in priority order
            and binds the request to the definition version effective today.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Request title</FormLabel>
                  <FormControl>
                    <Input placeholder='Annual leave — 2 days' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='requester'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requester</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='transactionType'
                render={({ field }) => (
                  <SelectField
                    label='Transaction type'
                    value={field.value}
                    onChange={field.onChange}
                    options={TRANSACTION_TYPES}
                  />
                )}
              />
              <FormField
                control={form.control}
                name='company'
                render={({ field }) => (
                  <SelectField
                    label='Company'
                    value={field.value}
                    onChange={field.onChange}
                    options={companies}
                  />
                )}
              />
              <FormField
                control={form.control}
                name='jurisdiction'
                render={({ field }) => (
                  <SelectField
                    label='Jurisdiction'
                    value={field.value}
                    onChange={field.onChange}
                    options={JURISDICTIONS}
                  />
                )}
              />
              <FormField
                control={form.control}
                name='location'
                render={({ field }) => (
                  <SelectField
                    label='Location'
                    value={field.value}
                    onChange={field.onChange}
                    options={LOCATIONS}
                  />
                )}
              />
              <FormField
                control={form.control}
                name='department'
                render={({ field }) => (
                  <SelectField
                    label='Department'
                    value={field.value}
                    onChange={field.onChange}
                    options={DEPARTMENTS}
                  />
                )}
              />
              <FormField
                control={form.control}
                name='orgGroup'
                render={({ field }) => (
                  <SelectField
                    label='Org group'
                    value={field.value}
                    onChange={field.onChange}
                    options={ORG_GROUPS}
                  />
                )}
              />
            </div>

            <div className='rounded-md border border-gray-200 bg-neutral-100 px-3 py-2 text-sm'>
              <span className='text-neutral-1000'>Routing preview: </span>
              {preview ? (
                <span className='text-neutral-1900'>
                  matches rule{' '}
                  <span className='font-medium'>{preview.rule.id}</span>{' '}
                  (priority {preview.rule.priority}
                  {preview.matchedOnDefault ? ' · default path' : ''}) →{' '}
                  <span className='font-medium'>{preview.rule.routeTo}</span>
                </span>
              ) : (
                <span className='text-neutral-1900'>
                  no rule matches — the engine falls back to the transaction
                  type
                </span>
              )}
            </div>

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>Route &amp; start</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
