import { useMemo, useState } from 'react'
import { ArrowsClockwise, Plus, Trash } from 'phosphor-react'
import { toast } from 'sonner'
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { RoleGate, useRole } from '@/context/role-context'
import { LOCATIONS } from '../../data/employees'
import {
  ACK_TEMPLATE_TYPES,
  type AckTemplateType,
  type AcknowledgementConfig,
  type ClassChangeApproverMapping,
} from '../../data/configuration'
import { type ConfigurationStore } from '../../hooks/use-configuration'
import { FilterSelect, MultiToggle, SectionTitle } from '../shared'

/** People selectable as class-change approvers in the POC. */
const APPROVER_OPTIONS = [
  'Meera Nair (HR Manager)',
  'Farhan Sheikh (HR Executive)',
  'Arjun Rao (Engineering Manager)',
  'Sunita Kulkarni (Operations Lead)',
  'Devika Iyer (Finance Analyst)',
  'Board — Managing Director',
] as const

/**
 * ACK-01..05 — acknowledgement terms per location(s) + template type
 * (Offer / Joining / Appointment / Policy Document), and CCA-01/03/04 —
 * class change approvers configured per location. Both are fully
 * data-manageable on the in-memory configuration store.
 */
export function AckApproversTab({ store }: { store: ConfigurationStore }) {
  return (
    <div className='space-y-8'>
      <AcknowledgementSection store={store} />
      <ClassChangeApproversSection store={store} />
    </div>
  )
}

/** ACK-01..05 — acknowledgement configuration list + add/edit/delete. */
function AcknowledgementSection({ store }: { store: ConfigurationStore }) {
  const { hasRole } = useRole()
  const canEdit = hasRole('Company Admin', 'Platform Admin')

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AcknowledgementConfig | null>(null)
  const [deleting, setDeleting] = useState<AcknowledgementConfig | null>(null)
  const [locations, setLocations] = useState<string[]>([])
  const [templateType, setTemplateType] = useState<AckTemplateType>(
    ACK_TEMPLATE_TYPES[0]
  )
  const [terms, setTerms] = useState('')

  const openFor = (config: AcknowledgementConfig | null) => {
    setEditing(config)
    setLocations(config?.locations ?? [])
    setTemplateType(config?.templateType ?? ACK_TEMPLATE_TYPES[0])
    setTerms(config?.terms ?? '')
    setOpen(true)
  }

  const valid = locations.length > 0 && terms.trim() !== ''

  const submit = () => {
    if (!valid) return
    store.saveAcknowledgement(
      {
        locations,
        templateType,
        terms: terms.trim(),
        active: editing?.active ?? true,
      },
      editing?.id
    )
    setOpen(false)
  }

  return (
    <div className='space-y-3'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <SectionTitle>Acknowledgement configurations</SectionTitle>
        <div className='flex items-center gap-2'>
          <Button
            variant='icon2'
            className='text-neutral-1900 h-7 w-7'
            aria-label='Refresh acknowledgement list'
            onClick={() =>
              toast.success(
                'Acknowledgement list refreshed — showing the latest configurations'
              )
            }
          >
            <ArrowsClockwise size={16} weight='bold' />
          </Button>
          <RoleGate roles={['Company Admin', 'Platform Admin']}>
            <Button size='sm' onClick={() => openFor(null)}>
              <Plus size={12} weight='bold' />
              Add acknowledgement
            </Button>
          </RoleGate>
        </div>
      </div>

      <div className='rounded-md border border-gray-200 bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Location(s)</TableHead>
              <TableHead>Template type</TableHead>
              <TableHead>Acknowledgement terms</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className='w-[160px]' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {store.acknowledgements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className='text-neutral-1000'>
                  No acknowledgement configurations yet.
                </TableCell>
              </TableRow>
            ) : (
              store.acknowledgements.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <div className='flex flex-wrap gap-1'>
                      {a.locations.length === LOCATIONS.length ? (
                        <Badge variant='open'>All locations</Badge>
                      ) : (
                        a.locations.map((l) => (
                          <Badge key={l} variant='open'>
                            {l}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell className='font-medium'>
                    {a.templateType}
                  </TableCell>
                  <TableCell className='text-neutral-1000 max-w-[280px] truncate'>
                    {a.terms}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={a.active}
                      disabled={!canEdit}
                      onCheckedChange={() => store.toggleAcknowledgement(a.id)}
                      aria-label={`Toggle acknowledgement for ${a.templateType}`}
                    />
                  </TableCell>
                  <TableCell>
                    <RoleGate roles={['Company Admin', 'Platform Admin']}>
                      <div className='flex justify-end gap-1'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => openFor(a)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant='icon2'
                          className='text-neutral-1900 h-7 w-7'
                          aria-label={`Delete acknowledgement for ${a.templateType}`}
                          onClick={() => setDeleting(a)}
                        >
                          <Trash size={14} weight='bold' />
                        </Button>
                      </div>
                    </RoleGate>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <p className='text-paragraph-sm text-neutral-1000'>
        Employees at the mapped locations must acknowledge the corresponding
        document template type (Offer, Joining, Appointment or Policy
        Document letters) before it is treated as accepted.
      </p>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='sm:max-w-[460px]'>
          <DialogHeader>
            <DialogTitle>
              {editing
                ? 'Edit acknowledgement configuration'
                : 'New acknowledgement configuration'}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1'>
              <Label>Location(s)</Label>
              <MultiToggle
                options={LOCATIONS}
                value={locations}
                onChange={setLocations}
              />
            </div>
            <div className='space-y-1'>
              <Label>Template type</Label>
              <Select
                value={templateType}
                onValueChange={(v) => setTemplateType(v as AckTemplateType)}
              >
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACK_TEMPLATE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-1'>
              <Label>Acknowledgement terms</Label>
              <Textarea
                rows={3}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder='Text the employee agrees to when acknowledging'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={!valid}>
              {editing ? 'Save configuration' : 'Add configuration'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(o) => {
          if (!o) setDeleting(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete acknowledgement configuration?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.templateType} documents will no longer require
              acknowledgement at {deleting?.locations.join(', ')}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleting) store.deleteAcknowledgement(deleting.id)
                setDeleting(null)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/** CCA-01/03/04 — class change approvers by location with add/edit/delete. */
function ClassChangeApproversSection({
  store,
}: {
  store: ConfigurationStore
}) {
  const [locationFilter, setLocationFilter] = useState('all')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ClassChangeApproverMapping | null>(
    null
  )
  const [deleting, setDeleting] = useState<ClassChangeApproverMapping | null>(
    null
  )
  const [location, setLocation] = useState<string>(LOCATIONS[0])
  const [approvers, setApprovers] = useState<string[]>([])

  const filtered = useMemo(
    () =>
      store.classChangeApprovers.filter(
        (m) => locationFilter === 'all' || m.location === locationFilter
      ),
    [store.classChangeApprovers, locationFilter]
  )

  const openFor = (mapping: ClassChangeApproverMapping | null) => {
    setEditing(mapping)
    setLocation(mapping?.location ?? LOCATIONS[0])
    setApprovers(mapping?.approvers ?? [])
    setOpen(true)
  }

  const submit = () => {
    if (approvers.length === 0) return
    store.saveClassChangeApprover({ location, approvers }, editing?.id)
    setOpen(false)
  }

  return (
    <div className='space-y-3'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <SectionTitle>Class change approvers</SectionTitle>
        <div className='flex items-center gap-2'>
          <FilterSelect
            label='Location'
            value={locationFilter}
            onChange={setLocationFilter}
            options={LOCATIONS}
          />
          <RoleGate roles={['Company Admin', 'Platform Admin']}>
            <Button size='sm' onClick={() => openFor(null)}>
              <Plus size={12} weight='bold' />
              Add approvers
            </Button>
          </RoleGate>
        </div>
      </div>

      <div className='rounded-md border border-gray-200 bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Location</TableHead>
              <TableHead>Approvers</TableHead>
              <TableHead className='w-[160px]' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className='text-neutral-1000'>
                  No class-change approver mappings for this location.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className='font-medium'>{m.location}</TableCell>
                  <TableCell>
                    <div className='flex flex-wrap gap-1'>
                      {m.approvers.map((a) => (
                        <Badge key={a} variant='qualified'>
                          {a}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <RoleGate roles={['Company Admin', 'Platform Admin']}>
                      <div className='flex justify-end gap-1'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => openFor(m)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant='icon2'
                          className='text-neutral-1900 h-7 w-7'
                          aria-label={`Delete approvers for ${m.location}`}
                          onClick={() => setDeleting(m)}
                        >
                          <Trash size={14} weight='bold' />
                        </Button>
                      </div>
                    </RoleGate>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <p className='text-paragraph-sm text-neutral-1000'>
        Employee class changes raised at a location are routed to its
        configured approvers before taking effect.
      </p>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='sm:max-w-[460px]'>
          <DialogHeader>
            <DialogTitle>
              {editing
                ? 'Edit class change approvers'
                : 'New class change approvers'}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1'>
              <Label>Location</Label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-1'>
              <Label>Approvers</Label>
              <MultiToggle
                options={APPROVER_OPTIONS}
                value={approvers}
                onChange={setApprovers}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={approvers.length === 0}>
              {editing ? 'Save mapping' : 'Add mapping'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(o) => {
          if (!o) setDeleting(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete approver mapping?</AlertDialogTitle>
            <AlertDialogDescription>
              Class changes at {deleting?.location} will no longer route to
              the configured approvers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleting) store.deleteClassChangeApprover(deleting.id)
                setDeleting(null)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
