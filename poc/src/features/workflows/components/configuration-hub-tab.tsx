import { useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowsClockwise, PencilSimple, Plus, Trash } from 'phosphor-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { DataTable } from '@/components/common/data-table/table'
import { LongText } from '@/components/common/long-text'
import {
  ALERT_CHANNELS,
  CONFIG_GROUPS,
  INTEGRATION_SYSTEMS,
  OFFICE_TYPES,
  SYNC_FREQUENCIES,
  type AlertRule,
  type ConfigArea,
  type HeadOffice,
  type IntegrationConnection,
  type LocalizationSetting,
} from '../data/configuration'
import type { ConfigurationStore } from '../hooks/use-configuration'
import { SummaryCards } from './summary-cards'
import { SectionToolbar, SortableHeader } from './table-helpers'

/* ------------------------------ Area dialog ------------------------------ */

const areaSchema = z.object({
  group: z.enum(CONFIG_GROUPS),
  name: z.string().min(2, 'Area name is required'),
  description: z.string().min(2, 'Description is required'),
  owner: z.string().min(2, 'Owner is required'),
  enabled: z.boolean(),
})

type AreaValues = z.infer<typeof areaSchema>

const EMPTY_AREA: AreaValues = {
  group: 'Organization',
  name: '',
  description: '',
  owner: '',
  enabled: true,
}

function AreaDialog({
  open,
  onOpenChange,
  area,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  area?: ConfigArea | null
  onSave: (draft: AreaValues) => void
}) {
  const form = useForm<AreaValues>({
    resolver: zodResolver(areaSchema),
    defaultValues: EMPTY_AREA,
  })

  useEffect(() => {
    if (!open) return
    form.reset(
      area
        ? {
            group: area.group,
            name: area.name,
            description: area.description,
            owner: area.owner,
            enabled: area.enabled,
          }
        : EMPTY_AREA
    )
  }, [open, area, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[460px]'>
        <DialogHeader>
          <DialogTitle>
            {area ? 'Edit configuration area' : 'New configuration area'}
          </DialogTitle>
          <DialogDescription>
            Areas appear in the Configuration hub grouped by domain so admins
            can find every setup screen from one place.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => {
              onSave(v)
              onOpenChange(false)
            })}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='group'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger variant='secondary' className='w-full'>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CONFIG_GROUPS.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Area name</FormLabel>
                  <FormControl>
                    <Input placeholder='Localization' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder='What is configured in this area'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='owner'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner</FormLabel>
                  <FormControl>
                    <Input placeholder='HR Operations' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='enabled'
              render={({ field }) => (
                <FormItem className='flex items-center justify-between rounded-md border border-gray-200 px-3 py-2'>
                  <FormLabel className='font-normal'>
                    Visible to admins in the hub
                  </FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
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
              <Button type='submit'>{area ? 'Save changes' : 'Add area'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

/* -------------------------- Localization dialog -------------------------- */

const localizationSchema = z.object({
  name: z.string().min(2, 'Pack name is required'),
  language: z.string().min(2, 'Language is required'),
  timezone: z.string().min(2, 'Time zone is required'),
  currency: z.string().min(1, 'Currency is required'),
  dateFormat: z.string().min(2, 'Date format is required'),
})

type LocalizationValues = z.infer<typeof localizationSchema>

const EMPTY_LOCALIZATION: LocalizationValues = {
  name: '',
  language: '',
  timezone: '',
  currency: '',
  dateFormat: '',
}

function LocalizationDialog({
  open,
  onOpenChange,
  localization,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  localization?: LocalizationSetting | null
  onSave: (draft: LocalizationValues) => void
}) {
  const form = useForm<LocalizationValues>({
    resolver: zodResolver(localizationSchema),
    defaultValues: EMPTY_LOCALIZATION,
  })

  useEffect(() => {
    if (!open) return
    form.reset(
      localization
        ? {
            name: localization.name,
            language: localization.language,
            timezone: localization.timezone,
            currency: localization.currency,
            dateFormat: localization.dateFormat,
          }
        : EMPTY_LOCALIZATION
    )
  }, [open, localization, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[460px]'>
        <DialogHeader>
          <DialogTitle>
            {localization ? 'Edit localization' : 'New localization'}
          </DialogTitle>
          <DialogDescription>
            Language, time zone, currency and date format applied to companies
            and employees mapped to this region.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => {
              onSave(v)
              onOpenChange(false)
            })}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pack name</FormLabel>
                  <FormControl>
                    <Input placeholder='India — English' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='language'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Language</FormLabel>
                    <FormControl>
                      <Input placeholder='English (en-IN)' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='timezone'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time zone</FormLabel>
                    <FormControl>
                      <Input placeholder='Asia/Kolkata (IST)' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='currency'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <FormControl>
                      <Input placeholder='INR ₹' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='dateFormat'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date format</FormLabel>
                    <FormControl>
                      <Input placeholder='DD-MM-YYYY' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>
                {localization ? 'Save changes' : 'Add localization'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

/* --------------------------- Head-office dialog --------------------------- */

const officeSchema = z.object({
  name: z.string().min(2, 'Office name is required'),
  type: z.enum(OFFICE_TYPES),
  industry: z.string().min(2, 'Industry is required'),
  location: z.string().min(2, 'Location is required'),
})

type OfficeValues = z.infer<typeof officeSchema>

const EMPTY_OFFICE: OfficeValues = {
  name: '',
  type: 'Head Office',
  industry: '',
  location: '',
}

function HeadOfficeDialog({
  open,
  onOpenChange,
  office,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  office?: HeadOffice | null
  onSave: (draft: OfficeValues) => void
}) {
  const form = useForm<OfficeValues>({
    resolver: zodResolver(officeSchema),
    defaultValues: EMPTY_OFFICE,
  })

  useEffect(() => {
    if (!open) return
    form.reset(
      office
        ? {
            name: office.name,
            type: office.type,
            industry: office.industry,
            location: office.location,
          }
        : EMPTY_OFFICE
    )
  }, [open, office, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[460px]'>
        <DialogHeader>
          <DialogTitle>
            {office ? 'Edit office record' : 'New office record'}
          </DialogTitle>
          <DialogDescription>
            The head-office organization with its name, type, industry and
            location — used on statutory documents and letterheads.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => {
              onSave(v)
              onOpenChange(false)
            })}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization name</FormLabel>
                  <FormControl>
                    <Input placeholder='Aurora Foods HQ' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='type'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger variant='secondary' className='w-full'>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {OFFICE_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='industry'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry</FormLabel>
                    <FormControl>
                      <Input placeholder='Food & Beverage' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='location'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder='Hyderabad' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>
                {office ? 'Save changes' : 'Add office'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

/* --------------------------- Integration dialog --------------------------- */

const integrationSchema = z.object({
  name: z.string().min(2, 'Connection name is required'),
  system: z.enum(INTEGRATION_SYSTEMS),
  endpoint: z.string().min(5, 'Endpoint URL is required'),
  syncEntities: z.string().min(2, 'List the entities to sync'),
  syncFrequency: z.enum(SYNC_FREQUENCIES),
  enabled: z.boolean(),
})

type IntegrationValues = z.infer<typeof integrationSchema>

const EMPTY_INTEGRATION: IntegrationValues = {
  name: '',
  system: 'Acumatica',
  endpoint: '',
  syncEntities: '',
  syncFrequency: 'Daily',
  enabled: true,
}

function IntegrationDialog({
  open,
  onOpenChange,
  connection,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  connection?: IntegrationConnection | null
  onSave: (draft: IntegrationValues) => void
}) {
  const form = useForm<IntegrationValues>({
    resolver: zodResolver(integrationSchema),
    defaultValues: EMPTY_INTEGRATION,
  })

  useEffect(() => {
    if (!open) return
    form.reset(
      connection
        ? {
            name: connection.name,
            system: connection.system,
            endpoint: connection.endpoint,
            syncEntities: connection.syncEntities,
            syncFrequency: connection.syncFrequency,
            enabled: connection.enabled,
          }
        : EMPTY_INTEGRATION
    )
  }, [open, connection, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[480px]'>
        <DialogHeader>
          <DialogTitle>
            {connection ? 'Edit integration' : 'New integration'}
          </DialogTitle>
          <DialogDescription>
            Connect the HRMS to an external system (Acumatica ERP, Wrike, or a
            custom endpoint) and choose what syncs and how often.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => {
              onSave(v)
              onOpenChange(false)
            })}
            className='space-y-4'
          >
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Connection name</FormLabel>
                    <FormControl>
                      <Input placeholder='Acumatica ERP — Production' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='system'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>System</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {INTEGRATION_SYSTEMS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name='endpoint'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endpoint URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='https://erp.example.com/entity'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='syncEntities'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Entities to sync</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Employees, Cost centres, GL export'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='syncFrequency'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sync frequency</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger variant='secondary' className='w-full'>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SYNC_FREQUENCIES.map((f) => (
                        <SelectItem key={f} value={f}>
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='enabled'
              render={({ field }) => (
                <FormItem className='flex items-center justify-between rounded-md border border-gray-200 px-3 py-2'>
                  <FormLabel className='font-normal'>
                    Integration module enabled
                  </FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
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
              <Button type='submit'>
                {connection ? 'Save changes' : 'Add integration'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

/* ---------------------------- Alert-rule dialog ---------------------------- */

const alertSchema = z.object({
  name: z.string().min(2, 'Alert name is required'),
  event: z.string().min(2, 'Trigger event is required'),
  channels: z.array(z.string()).min(1, 'Pick at least one channel'),
  recipients: z.string().min(2, 'Recipients are required'),
  enabled: z.boolean(),
})

type AlertValues = z.infer<typeof alertSchema>

const EMPTY_ALERT: AlertValues = {
  name: '',
  event: '',
  channels: ['Email'],
  recipients: '',
  enabled: true,
}

function AlertRuleDialog({
  open,
  onOpenChange,
  rule,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  rule?: AlertRule | null
  onSave: (draft: AlertValues) => void
}) {
  const form = useForm<AlertValues>({
    resolver: zodResolver(alertSchema),
    defaultValues: EMPTY_ALERT,
  })

  useEffect(() => {
    if (!open) return
    form.reset(
      rule
        ? {
            name: rule.name,
            event: rule.event,
            channels: rule.channels,
            recipients: rule.recipients,
            enabled: rule.enabled,
          }
        : EMPTY_ALERT
    )
  }, [open, rule, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[460px]'>
        <DialogHeader>
          <DialogTitle>{rule ? 'Edit alert rule' : 'New alert rule'}</DialogTitle>
          <DialogDescription>
            When the trigger event occurs, the alert is delivered on the
            selected channels to the configured recipients.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => {
              onSave(v)
              onOpenChange(false)
            })}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alert name</FormLabel>
                  <FormControl>
                    <Input placeholder='Approval pending reminder' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='event'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trigger event</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Approval pending > 48 business hours'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='channels'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Channels</FormLabel>
                  <div className='flex items-center gap-4 rounded-md border border-gray-200 px-3 py-2'>
                    {ALERT_CHANNELS.map((channel) => (
                      <label
                        key={channel}
                        className='text-neutral-1600 flex items-center gap-2 text-sm'
                      >
                        <Checkbox
                          variant='blue'
                          checked={field.value.includes(channel)}
                          onCheckedChange={(checked) =>
                            field.onChange(
                              checked
                                ? [...field.value, channel]
                                : field.value.filter((c) => c !== channel)
                            )
                          }
                        />
                        {channel}
                      </label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='recipients'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipients</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='HR team, Reporting manager'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='enabled'
              render={({ field }) => (
                <FormItem className='flex items-center justify-between rounded-md border border-gray-200 px-3 py-2'>
                  <FormLabel className='font-normal'>Alert active</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
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
              <Button type='submit'>{rule ? 'Save changes' : 'Add alert'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

/* --------------------------------- The tab -------------------------------- */

interface PendingDelete {
  name: string
  caption: string
  run: () => void
}

/**
 * Configuration hub (CFG-01, CFG-02, CFG-08): the central registry of every
 * HRMS setup area grouped by domain, organization settings (localization
 * packs and head offices), and the integrations & alerts connections.
 */
export function ConfigurationHubTab({
  store,
  canConfigure,
}: {
  store: ConfigurationStore
  canConfigure: boolean
}) {
  const {
    areas,
    saveArea,
    deleteArea,
    toggleArea,
    localizations,
    saveLocalization,
    deleteLocalization,
    setDefaultLocalization,
    headOffices,
    saveHeadOffice,
    deleteHeadOffice,
    setPrimaryHeadOffice,
    integrations,
    saveIntegration,
    deleteIntegration,
    toggleIntegration,
    syncNow,
    alertRules,
    saveAlertRule,
    deleteAlertRule,
    toggleAlertRule,
  } = store

  const [areaFilter, setAreaFilter] = useState('')
  const [areaDialog, setAreaDialog] = useState(false)
  const [editingArea, setEditingArea] = useState<ConfigArea | null>(null)
  const [localizationDialog, setLocalizationDialog] = useState(false)
  const [editingLocalization, setEditingLocalization] =
    useState<LocalizationSetting | null>(null)
  const [officeDialog, setOfficeDialog] = useState(false)
  const [editingOffice, setEditingOffice] = useState<HeadOffice | null>(null)
  const [integrationDialog, setIntegrationDialog] = useState(false)
  const [editingIntegration, setEditingIntegration] =
    useState<IntegrationConnection | null>(null)
  const [alertDialog, setAlertDialog] = useState(false)
  const [editingAlert, setEditingAlert] = useState<AlertRule | null>(null)
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)

  const summary = useMemo(
    () => [
      { label: 'Setup areas', value: areas.length },
      {
        label: 'Areas enabled',
        value: areas.filter((a) => a.enabled).length,
      },
      {
        label: 'Integrations connected',
        value: integrations.filter((i) => i.enabled).length,
      },
      {
        label: 'Alert rules active',
        value: alertRules.filter((r) => r.enabled).length,
      },
    ],
    [areas, integrations, alertRules]
  )

  const groupedAreas = useMemo(() => {
    const q = areaFilter.trim().toLowerCase()
    const matching = areas.filter(
      (a) =>
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.group.toLowerCase().includes(q)
    )
    return CONFIG_GROUPS.map((group) => ({
      group,
      items: matching.filter((a) => a.group === group),
    })).filter((g) => g.items.length > 0)
  }, [areas, areaFilter])

  /* -------------------------- Localization table ------------------------- */

  const localizationColumns: ColumnDef<LocalizationSetting>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <SortableHeader column={column} label='Localization' />
      ),
      cell: ({ row }) => (
        <div className='flex min-w-0 flex-col'>
          <LongText className='text-neutral-1600 font-medium'>
            {row.original.name}
          </LongText>
          <span className='text-paragraph-sm text-neutral-1000 truncate'>
            {row.original.language}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'timezone',
      header: ({ column }) => <SortableHeader column={column} label='Time zone' />,
      cell: ({ row }) => (
        <span className='text-neutral-1900 text-sm'>{row.original.timezone}</span>
      ),
    },
    {
      accessorKey: 'currency',
      header: ({ column }) => <SortableHeader column={column} label='Currency' />,
      cell: ({ row }) => (
        <span className='text-neutral-1900 text-sm'>{row.original.currency}</span>
      ),
    },
    {
      accessorKey: 'dateFormat',
      header: ({ column }) => (
        <SortableHeader column={column} label='Date format' />
      ),
      cell: ({ row }) => (
        <span className='text-neutral-1900 text-sm'>
          {row.original.dateFormat}
        </span>
      ),
    },
    {
      id: 'default',
      header: () => (
        <span className='text-paragraph-sm font-medium'>Default</span>
      ),
      cell: ({ row }) =>
        row.original.isDefault ? (
          <Badge variant='completed'>Default</Badge>
        ) : canConfigure ? (
          <Button
            variant='outline'
            className='h-6 px-2 text-xs'
            onClick={() => setDefaultLocalization(row.original.id)}
          >
            Make default
          </Button>
        ) : (
          <span className='text-neutral-1000 text-sm'>—</span>
        ),
    },
    {
      id: 'actions',
      header: () => null,
      cell: ({ row }) =>
        canConfigure ? (
          <div className='flex items-center gap-1'>
            <Button
              variant='icon2'
              className='text-neutral-1900 h-7 w-7'
              aria-label='Edit localization'
              onClick={() => {
                setEditingLocalization(row.original)
                setLocalizationDialog(true)
              }}
            >
              <PencilSimple size={14} weight='fill' />
            </Button>
            <Button
              variant='icon2'
              className='text-neutral-1900 h-7 w-7'
              aria-label='Delete localization'
              onClick={() =>
                setPendingDelete({
                  name: row.original.name,
                  caption:
                    'Companies mapped to this localization fall back to the default pack.',
                  run: () => deleteLocalization(row.original.id),
                })
              }
            >
              <Trash size={14} weight='bold' />
            </Button>
          </div>
        ) : null,
      size: 80,
    },
  ]

  /* -------------------------- Head-office table -------------------------- */

  const officeColumns: ColumnDef<HeadOffice>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <SortableHeader column={column} label='Organization' />
      ),
      cell: ({ row }) => (
        <div className='flex min-w-0 flex-col'>
          <LongText className='text-neutral-1600 font-medium'>
            {row.original.name}
          </LongText>
          <span className='text-paragraph-sm text-neutral-1000 truncate'>
            {row.original.type}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'industry',
      header: ({ column }) => <SortableHeader column={column} label='Industry' />,
      cell: ({ row }) => (
        <span className='text-neutral-1900 text-sm'>{row.original.industry}</span>
      ),
    },
    {
      accessorKey: 'location',
      header: ({ column }) => <SortableHeader column={column} label='Location' />,
      cell: ({ row }) => (
        <span className='text-neutral-1900 text-sm'>{row.original.location}</span>
      ),
    },
    {
      id: 'primary',
      header: () => (
        <span className='text-paragraph-sm font-medium'>Primary</span>
      ),
      cell: ({ row }) =>
        row.original.isPrimary ? (
          <Badge variant='completed'>Primary</Badge>
        ) : canConfigure ? (
          <Button
            variant='outline'
            className='h-6 px-2 text-xs'
            onClick={() => setPrimaryHeadOffice(row.original.id)}
          >
            Set primary
          </Button>
        ) : (
          <span className='text-neutral-1000 text-sm'>—</span>
        ),
    },
    {
      accessorKey: 'updatedBy',
      header: ({ column }) => (
        <SortableHeader column={column} label='Updated by' />
      ),
      cell: ({ row }) => (
        <span className='text-neutral-1900 text-sm'>
          {row.original.updatedBy}
        </span>
      ),
    },
    {
      id: 'actions',
      header: () => null,
      cell: ({ row }) =>
        canConfigure ? (
          <div className='flex items-center gap-1'>
            <Button
              variant='icon2'
              className='text-neutral-1900 h-7 w-7'
              aria-label='Edit office'
              onClick={() => {
                setEditingOffice(row.original)
                setOfficeDialog(true)
              }}
            >
              <PencilSimple size={14} weight='fill' />
            </Button>
            <Button
              variant='icon2'
              className='text-neutral-1900 h-7 w-7'
              aria-label='Delete office'
              onClick={() =>
                setPendingDelete({
                  name: row.original.name,
                  caption:
                    'The office record is removed from the organization setup.',
                  run: () => deleteHeadOffice(row.original.id),
                })
              }
            >
              <Trash size={14} weight='bold' />
            </Button>
          </div>
        ) : null,
      size: 80,
    },
  ]

  /* -------------------------- Integration table -------------------------- */

  const integrationColumns: ColumnDef<IntegrationConnection>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <SortableHeader column={column} label='Connection' />
      ),
      cell: ({ row }) => (
        <div className='flex min-w-0 flex-col'>
          <LongText className='text-neutral-1600 font-medium'>
            {row.original.name}
          </LongText>
          <span className='text-paragraph-sm text-neutral-1000 truncate'>
            {row.original.system} · {row.original.endpoint}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'syncEntities',
      header: ({ column }) => <SortableHeader column={column} label='Syncs' />,
      cell: ({ row }) => (
        <LongText className='text-neutral-1900 text-sm'>
          {row.original.syncEntities}
        </LongText>
      ),
    },
    {
      accessorKey: 'syncFrequency',
      header: ({ column }) => (
        <SortableHeader column={column} label='Frequency' />
      ),
      cell: ({ row }) => (
        <div className='flex min-w-0 flex-col'>
          <span className='text-neutral-1900 text-sm'>
            {row.original.syncFrequency}
          </span>
          <span className='text-paragraph-sm text-neutral-1000 truncate'>
            Last sync {row.original.lastSyncAt}
          </span>
        </div>
      ),
    },
    {
      id: 'enabled',
      header: () => (
        <span className='text-paragraph-sm font-medium'>Enabled</span>
      ),
      cell: ({ row }) => (
        <Switch
          checked={row.original.enabled}
          disabled={!canConfigure}
          onCheckedChange={() => toggleIntegration(row.original.id)}
          aria-label={`Toggle ${row.original.name}`}
        />
      ),
    },
    {
      id: 'actions',
      header: () => null,
      cell: ({ row }) =>
        canConfigure ? (
          <div className='flex items-center gap-1'>
            <Button
              variant='icon2'
              className='text-neutral-1900 h-7 w-7'
              aria-label='Sync now'
              onClick={() => syncNow(row.original.id)}
            >
              <ArrowsClockwise size={14} weight='bold' />
            </Button>
            <Button
              variant='icon2'
              className='text-neutral-1900 h-7 w-7'
              aria-label='Edit integration'
              onClick={() => {
                setEditingIntegration(row.original)
                setIntegrationDialog(true)
              }}
            >
              <PencilSimple size={14} weight='fill' />
            </Button>
            <Button
              variant='icon2'
              className='text-neutral-1900 h-7 w-7'
              aria-label='Delete integration'
              onClick={() =>
                setPendingDelete({
                  name: row.original.name,
                  caption:
                    'Scheduled syncs for this connection stop immediately.',
                  run: () => deleteIntegration(row.original.id),
                })
              }
            >
              <Trash size={14} weight='bold' />
            </Button>
          </div>
        ) : null,
      size: 110,
    },
  ]

  /* --------------------------- Alert-rule table --------------------------- */

  const alertColumns: ColumnDef<AlertRule>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => <SortableHeader column={column} label='Alert' />,
      cell: ({ row }) => (
        <div className='flex min-w-0 flex-col'>
          <LongText className='text-neutral-1600 font-medium'>
            {row.original.name}
          </LongText>
          <span className='text-paragraph-sm text-neutral-1000 truncate'>
            {row.original.event}
          </span>
        </div>
      ),
    },
    {
      id: 'channels',
      header: () => (
        <span className='text-paragraph-sm font-medium'>Channels</span>
      ),
      cell: ({ row }) => (
        <div className='flex flex-wrap gap-1 p-1'>
          {row.original.channels.map((c) => (
            <Badge key={c} variant='open'>
              {c}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      accessorKey: 'recipients',
      header: ({ column }) => (
        <SortableHeader column={column} label='Recipients' />
      ),
      cell: ({ row }) => (
        <span className='text-neutral-1900 text-sm'>
          {row.original.recipients}
        </span>
      ),
    },
    {
      id: 'enabled',
      header: () => (
        <span className='text-paragraph-sm font-medium'>Active</span>
      ),
      cell: ({ row }) => (
        <Switch
          checked={row.original.enabled}
          disabled={!canConfigure}
          onCheckedChange={() => toggleAlertRule(row.original.id)}
          aria-label={`Toggle ${row.original.name}`}
        />
      ),
    },
    {
      id: 'actions',
      header: () => null,
      cell: ({ row }) =>
        canConfigure ? (
          <div className='flex items-center gap-1'>
            <Button
              variant='icon2'
              className='text-neutral-1900 h-7 w-7'
              aria-label='Edit alert'
              onClick={() => {
                setEditingAlert(row.original)
                setAlertDialog(true)
              }}
            >
              <PencilSimple size={14} weight='fill' />
            </Button>
            <Button
              variant='icon2'
              className='text-neutral-1900 h-7 w-7'
              aria-label='Delete alert'
              onClick={() =>
                setPendingDelete({
                  name: row.original.name,
                  caption: 'This alert stops firing for all recipients.',
                  run: () => deleteAlertRule(row.original.id),
                })
              }
            >
              <Trash size={14} weight='bold' />
            </Button>
          </div>
        ) : null,
      size: 80,
    },
  ]

  return (
    <div className='w-full space-y-8'>
      <div>
        <SummaryCards title='Configuration' items={summary} />

        {/* CFG-01 — central hub grouping every setup area */}
        <SectionToolbar title={`Configuration areas (${areas.length})`}>
          <Input
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            placeholder='Filter areas…'
            className='h-7 w-[200px]'
          />
          {canConfigure && (
            <Button
              variant='red'
              onClick={() => {
                setEditingArea(null)
                setAreaDialog(true)
              }}
              className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
            >
              <Plus size={10} weight='bold' />
              New Area
            </Button>
          )}
        </SectionToolbar>

        {groupedAreas.length === 0 ? (
          <p className='text-neutral-1000 rounded-md border border-gray-200 bg-white p-4 text-sm'>
            No configuration areas match “{areaFilter}”.
          </p>
        ) : (
          <div className='space-y-4'>
            {groupedAreas.map(({ group, items }) => (
              <div key={group}>
                <h3 className='text-neutral-1000 mb-2 text-xs font-semibold tracking-wide uppercase'>
                  {group}
                </h3>
                <div className='grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3'>
                  {items.map((area) => (
                    <div
                      key={area.id}
                      className='flex flex-col rounded-md border border-gray-200 bg-white p-3'
                    >
                      <div className='flex items-start justify-between gap-2'>
                        <p className='text-neutral-1600 text-sm font-medium'>
                          {area.name}
                        </p>
                        <Switch
                          checked={area.enabled}
                          disabled={!canConfigure}
                          onCheckedChange={() => toggleArea(area.id)}
                          aria-label={`Toggle ${area.name}`}
                        />
                      </div>
                      <p className='text-neutral-1000 mt-1 flex-1 text-xs'>
                        {area.description}
                      </p>
                      <div className='mt-2 flex items-center justify-between'>
                        <span className='text-neutral-1000 text-xs'>
                          {area.owner} · {area.updatedAt}
                        </span>
                        {canConfigure && (
                          <div className='flex items-center gap-1'>
                            <Button
                              variant='icon2'
                              className='text-neutral-1900 h-6 w-6'
                              aria-label={`Edit ${area.name}`}
                              onClick={() => {
                                setEditingArea(area)
                                setAreaDialog(true)
                              }}
                            >
                              <PencilSimple size={13} weight='fill' />
                            </Button>
                            <Button
                              variant='icon2'
                              className='text-neutral-1900 h-6 w-6'
                              aria-label={`Delete ${area.name}`}
                              onClick={() =>
                                setPendingDelete({
                                  name: area.name,
                                  caption:
                                    'The setup area disappears from the hub; the underlying module keeps its data.',
                                  run: () => deleteArea(area.id),
                                })
                              }
                            >
                              <Trash size={13} weight='bold' />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CFG-02 — organization settings: localization + head office */}
      <div>
        <SectionToolbar title={`Localization (${localizations.length})`}>
          {canConfigure && (
            <Button
              variant='red'
              onClick={() => {
                setEditingLocalization(null)
                setLocalizationDialog(true)
              }}
              className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
            >
              <Plus size={10} weight='bold' />
              New Localization
            </Button>
          )}
        </SectionToolbar>
        <DataTable
          columns={localizationColumns}
          data={localizations}
          variant='no-status'
        />

        <div className='mt-6'>
          <SectionToolbar title={`Head office & organization (${headOffices.length})`}>
            {canConfigure && (
              <Button
                variant='red'
                onClick={() => {
                  setEditingOffice(null)
                  setOfficeDialog(true)
                }}
                className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
              >
                <Plus size={10} weight='bold' />
                New Office
              </Button>
            )}
          </SectionToolbar>
          <DataTable columns={officeColumns} data={headOffices} variant='no-status' />
          <p className='text-neutral-1000 mt-2 text-xs'>
            Locations, Departments and Roles are managed in their own modules —
            use the hub cards above to see where each one lives.
          </p>
        </div>
      </div>

      {/* CFG-08 — integrations & alerts */}
      <div>
        <SectionToolbar title={`Integrations (${integrations.length})`}>
          {canConfigure && (
            <Button
              variant='red'
              onClick={() => {
                setEditingIntegration(null)
                setIntegrationDialog(true)
              }}
              className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
            >
              <Plus size={10} weight='bold' />
              New Integration
            </Button>
          )}
        </SectionToolbar>
        <DataTable
          columns={integrationColumns}
          data={integrations}
          variant='no-status'
        />

        <div className='mt-6'>
          <SectionToolbar title={`Alert rules (${alertRules.length})`}>
            {canConfigure && (
              <Button
                variant='red'
                onClick={() => {
                  setEditingAlert(null)
                  setAlertDialog(true)
                }}
                className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
              >
                <Plus size={10} weight='bold' />
                New Alert
              </Button>
            )}
          </SectionToolbar>
          <DataTable columns={alertColumns} data={alertRules} variant='no-status' />
        </div>
      </div>

      {/* ------------------------------ Dialogs ------------------------------ */}

      <AreaDialog
        open={areaDialog}
        onOpenChange={(open) => {
          setAreaDialog(open)
          if (!open) setEditingArea(null)
        }}
        area={editingArea}
        onSave={(draft) => saveArea(draft, editingArea?.id)}
      />
      <LocalizationDialog
        open={localizationDialog}
        onOpenChange={(open) => {
          setLocalizationDialog(open)
          if (!open) setEditingLocalization(null)
        }}
        localization={editingLocalization}
        onSave={(draft) => saveLocalization(draft, editingLocalization?.id)}
      />
      <HeadOfficeDialog
        open={officeDialog}
        onOpenChange={(open) => {
          setOfficeDialog(open)
          if (!open) setEditingOffice(null)
        }}
        office={editingOffice}
        onSave={(draft) => saveHeadOffice(draft, editingOffice?.id)}
      />
      <IntegrationDialog
        open={integrationDialog}
        onOpenChange={(open) => {
          setIntegrationDialog(open)
          if (!open) setEditingIntegration(null)
        }}
        connection={editingIntegration}
        onSave={(draft) => saveIntegration(draft, editingIntegration?.id)}
      />
      <AlertRuleDialog
        open={alertDialog}
        onOpenChange={(open) => {
          setAlertDialog(open)
          if (!open) setEditingAlert(null)
        }}
        rule={editingAlert}
        onSave={(draft) => saveAlertRule(draft, editingAlert?.id)}
      />

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove “{pendingDelete?.name}”?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.caption}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                pendingDelete?.run()
                setPendingDelete(null)
              }}
              className='bg-destructive hover:bg-destructive/90 text-white'
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
