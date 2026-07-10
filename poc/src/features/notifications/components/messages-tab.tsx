import { useMemo, useState } from 'react'
import { Archive, Mail, MailOpen, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { RoleGate } from '@/context/role-context'
import {
  CURRENT_USER,
  DEPARTMENTS_BY_LOCATION,
  EMPLOYEES,
  LOCATIONS,
  POSITIONS_BY_DEPARTMENT,
  type LocationId,
} from '../data/org'
import type { InternalMessage, MessageState } from '../data/messages'
import type { MessageFormValues } from '../hooks/use-messages'

interface MessagesTabProps {
  messages: InternalMessage[]
  addMessage: (values: MessageFormValues) => void
  setState: (ids: string[], state: MessageState) => void
  markReadQuiet: (id: string) => void
  deleteMessages: (ids: string[]) => void
}

type Filter = 'All' | 'Unread' | 'Read' | 'Archived'
type BulkAction = 'read' | 'unread' | 'archived' | 'delete'

const stateVariant: Record<MessageState, 'open' | 'badge_active' | 'badge_inactive'> = {
  unread: 'open',
  read: 'badge_active',
  archived: 'badge_inactive',
}

/**
 * Messages (Kensium General Features — Messages): internal messaging shared
 * with single, multiple or all employees (no email id needed). Recipient list
 * with Action → Details to read the full message, mark Read / Unread /
 * Archive individually or in bulk via checkboxes + action dropdown + Submit,
 * and Delete.
 */
export function MessagesTab({
  messages,
  addMessage,
  setState,
  markReadQuiet,
  deleteMessages,
}: MessagesTabProps) {
  const [filter, setFilter] = useState<Filter>('All')
  const [selected, setSelected] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState<BulkAction>('read')
  const [details, setDetails] = useState<InternalMessage | null>(null)
  const [composing, setComposing] = useState(false)

  const visible = useMemo(
    () =>
      messages.filter((m) => {
        if (filter === 'All') return m.state !== 'archived'
        return m.state === filter.toLowerCase()
      }),
    [messages, filter]
  )

  const counts = useMemo(
    () => ({
      All: messages.filter((m) => m.state !== 'archived').length,
      Unread: messages.filter((m) => m.state === 'unread').length,
      Read: messages.filter((m) => m.state === 'read').length,
      Archived: messages.filter((m) => m.state === 'archived').length,
    }),
    [messages]
  )

  const toggle = (id: string, checked: boolean) =>
    setSelected((prev) =>
      checked ? [...prev, id] : prev.filter((s) => s !== id)
    )

  const submitBulk = () => {
    if (selected.length === 0) {
      toast.error('Select at least one message via the checkboxes.')
      return
    }
    if (bulkAction === 'delete') deleteMessages(selected)
    else setState(selected, bulkAction)
    setSelected([])
  }

  const openDetails = (m: InternalMessage) => {
    markReadQuiet(m.id)
    setDetails(m)
  }

  return (
    <RoleGate
      roles={[
        'Platform Admin',
        'Portfolio Admin',
        'Group Company Admin',
        'Company Admin',
        'Employee (User)',
      ]}
      fallback={
        <Card className='rounded-[8px] border border-gray-200 bg-white py-4'>
          <CardContent className='text-neutral-1000 px-4 text-sm'>
            As an Employee (Non-User) you have no HRMS application access.
            Messages addressed to you are relayed by your reporting manager —
            internal messaging is exactly how the organization reaches
            employees without email ids.
          </CardContent>
        </Card>
      }
    >
      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
        <div className='flex items-center gap-2'>
          {(['All', 'Unread', 'Read', 'Archived'] as Filter[]).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              className='h-7 rounded-[6px] px-2'
              onClick={() => {
                setFilter(f)
                setSelected([])
              }}
            >
              {f} ({counts[f]})
            </Button>
          ))}
        </div>
        <div className='flex items-center gap-2'>
          <Select
            value={bulkAction}
            onValueChange={(v) => setBulkAction(v as BulkAction)}
          >
            <SelectTrigger variant='secondary' className='h-7 w-[170px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='read'>Mark as Read</SelectItem>
              <SelectItem value='unread'>Mark as Unread</SelectItem>
              <SelectItem value='archived'>Archive</SelectItem>
              <SelectItem value='delete'>Delete</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant='outline'
            className='h-7 rounded-[6px] px-2'
            onClick={submitBulk}
          >
            Submit ({selected.length})
          </Button>
          <Button
            className='h-7 gap-1 rounded-[6px] px-2'
            onClick={() => setComposing(true)}
          >
            <Plus className='size-3.5' />
            Add New Message
          </Button>
        </div>
      </div>

      <div className='space-y-2'>
        {visible.length === 0 && (
          <Card className='rounded-[8px] border border-gray-200 bg-white py-6'>
            <CardContent className='text-neutral-1000 text-center text-sm'>
              No {filter === 'All' ? '' : `${filter.toLowerCase()} `}messages.
            </CardContent>
          </Card>
        )}
        {visible.map((m) => (
          <Card
            key={m.id}
            className={`gap-1 rounded-[8px] border border-gray-200 py-3 ${m.state === 'unread' ? 'bg-blue-150' : 'bg-white'}`}
          >
            <CardContent className='flex items-start justify-between gap-3 px-4'>
              <div className='flex items-start gap-3'>
                <Checkbox
                  variant='blue'
                  className='mt-1'
                  checked={selected.includes(m.id)}
                  onCheckedChange={(c) => toggle(m.id, c === true)}
                  aria-label={`Select ${m.message}`}
                />
                <div>
                  <div className='flex flex-wrap items-center gap-2'>
                    <p className='text-neutral-1600 text-sm font-medium'>
                      {m.message}
                    </p>
                    <Badge variant={stateVariant[m.state]} className='capitalize'>
                      {m.state}
                    </Badge>
                  </div>
                  <p className='text-paragraph-sm text-neutral-1000 mt-0.5 line-clamp-1'>
                    {m.comments}
                  </p>
                  <p className='text-paragraph-sm text-neutral-1000 mt-0.5'>
                    From {m.sender} · {m.createdAt} · To{' '}
                    {m.recipients.join(', ')}
                  </p>
                </div>
              </div>
              <div className='flex shrink-0 items-center gap-2'>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='outline' className='h-7 rounded-[6px] px-2'>
                      Action
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='min-w-[180px]'>
                    <DropdownMenuItem onClick={() => openDetails(m)}>
                      <MailOpen className='size-3.5' />
                      Details
                    </DropdownMenuItem>
                    {m.state !== 'read' && (
                      <DropdownMenuItem onClick={() => setState([m.id], 'read')}>
                        <MailOpen className='size-3.5' />
                        Mark as Read
                      </DropdownMenuItem>
                    )}
                    {m.state !== 'unread' && (
                      <DropdownMenuItem
                        onClick={() => setState([m.id], 'unread')}
                      >
                        <Mail className='size-3.5' />
                        Mark as Unread
                      </DropdownMenuItem>
                    )}
                    {m.state !== 'archived' && (
                      <DropdownMenuItem
                        onClick={() => setState([m.id], 'archived')}
                      >
                        <Archive className='size-3.5' />
                        Archive
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      variant='destructive'
                      onClick={() => deleteMessages([m.id])}
                    >
                      <Trash2 className='size-3.5' />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Details — read the full message */}
      <Dialog open={details !== null} onOpenChange={(o) => !o && setDetails(null)}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>{details?.message}</DialogTitle>
            <DialogDescription>
              From {details?.sender} · {details?.createdAt}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-3'>
            <p className='text-paragraph-sm text-neutral-1600 whitespace-pre-wrap'>
              {details?.comments}
            </p>
            <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
              <p className='text-paragraph-sm text-neutral-1000'>
                Recipients: {details?.recipients.join(', ')}
              </p>
              <p className='text-paragraph-sm text-neutral-1000'>
                Locations: {details?.locations.join(', ')} · Departments:{' '}
                {details?.departments.join(', ')} · Positions:{' '}
                {details?.positions.join(', ')}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              className='rounded-[6px]'
              onClick={() => {
                if (details) setState([details.id], 'archived')
                setDetails(null)
              }}
            >
              Archive
            </Button>
            <Button className='rounded-[6px]' onClick={() => setDetails(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ComposeMessageDialog
        open={composing}
        onClose={() => setComposing(false)}
        onSave={addMessage}
      />
    </RoleGate>
  )
}

/** Add New Message form (PDF Screen #2/#3: Message, Comments, cascade, Assign to). */
function ComposeMessageDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean
  onClose: () => void
  onSave: (values: MessageFormValues) => void
}) {
  const [message, setMessage] = useState('')
  const [comments, setComments] = useState('')
  const [locations, setLocations] = useState<string[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [positions, setPositions] = useState<string[]>([])
  const [allEmployees, setAllEmployees] = useState(false)
  const [recipients, setRecipients] = useState<string[]>([])

  const departmentOptions = useMemo(() => {
    const source = locations.length > 0 ? locations : [...LOCATIONS]
    const set = new Set<string>()
    for (const l of source)
      for (const d of DEPARTMENTS_BY_LOCATION[l as LocationId] ?? [])
        set.add(d)
    return [...set]
  }, [locations])

  const positionOptions = useMemo(() => {
    const source = departments.length > 0 ? departments : departmentOptions
    const set = new Set<string>()
    for (const d of source)
      for (const p of POSITIONS_BY_DEPARTMENT[d] ?? []) set.add(p)
    return [...set]
  }, [departments, departmentOptions])

  const employeeOptions = useMemo(
    () =>
      EMPLOYEES.filter(
        (e) =>
          e.name !== CURRENT_USER &&
          (locations.length === 0 || locations.includes(e.location)) &&
          (departments.length === 0 || departments.includes(e.department)) &&
          (positions.length === 0 || positions.includes(e.position))
      ),
    [locations, departments, positions]
  )

  const toggleIn = (
    list: string[],
    set: (v: string[]) => void,
    value: string,
    checked: boolean
  ) => set(checked ? [...list, value] : list.filter((v) => v !== value))

  const reset = () => {
    setMessage('')
    setComments('')
    setLocations([])
    setDepartments([])
    setPositions([])
    setAllEmployees(false)
    setRecipients([])
  }

  const handleSave = () => {
    if (!message.trim()) return void toast.error('Enter the message.')
    if (!allEmployees && recipients.length === 0)
      return void toast.error(
        'Select at least one employee, or choose "All employees".'
      )
    onSave({
      message: message.trim(),
      comments: comments.trim(),
      locations: locations.length > 0 ? locations : [...LOCATIONS],
      departments: departments.length > 0 ? departments : ['All'],
      positions: positions.length > 0 ? positions : ['All'],
      recipients: allEmployees ? ['All employees'] : recipients,
    })
    reset()
    onClose()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          reset()
          onClose()
        }
      }}
    >
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Add New Message</DialogTitle>
          <DialogDescription>
            Share a message with single, multiple or all employees at once —
            recipients are notified even without a specific email id.
          </DialogDescription>
        </DialogHeader>

        <div className='grid gap-4'>
          <div className='grid gap-1.5'>
            <Label htmlFor='msg-title'>Message *</Label>
            <Input
              id='msg-title'
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder='Enter the message'
            />
          </div>
          <div className='grid gap-1.5'>
            <Label htmlFor='msg-comments'>Comments</Label>
            <Textarea
              id='msg-comments'
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder='Enter a brief description of the message with comments'
              rows={3}
            />
          </div>

          <div className='grid gap-1.5'>
            <Label>Applicable locations</Label>
            <div className='flex flex-wrap gap-4'>
              {LOCATIONS.map((l) => (
                <label key={l} className='flex items-center gap-2 text-sm'>
                  <Checkbox
                    variant='blue'
                    checked={locations.includes(l)}
                    onCheckedChange={(c) =>
                      toggleIn(locations, setLocations, l, c === true)
                    }
                  />
                  {l}
                </label>
              ))}
            </div>
          </div>

          <div className='grid gap-1.5'>
            <Label>Applicable departments</Label>
            <div className='flex flex-wrap gap-4'>
              {departmentOptions.map((d) => (
                <label key={d} className='flex items-center gap-2 text-sm'>
                  <Checkbox
                    variant='blue'
                    checked={departments.includes(d)}
                    onCheckedChange={(c) =>
                      toggleIn(departments, setDepartments, d, c === true)
                    }
                  />
                  {d}
                </label>
              ))}
            </div>
          </div>

          <div className='grid gap-1.5'>
            <Label>Applicable positions</Label>
            <div className='flex flex-wrap gap-4'>
              {positionOptions.map((p) => (
                <label key={p} className='flex items-center gap-2 text-sm'>
                  <Checkbox
                    variant='blue'
                    checked={positions.includes(p)}
                    onCheckedChange={(c) =>
                      toggleIn(positions, setPositions, p, c === true)
                    }
                  />
                  {p}
                </label>
              ))}
            </div>
          </div>

          <div className='grid gap-1.5'>
            <Label>Assign to *</Label>
            <label className='flex items-center gap-2 text-sm font-medium'>
              <Checkbox
                variant='blue'
                checked={allEmployees}
                onCheckedChange={(c) => setAllEmployees(c === true)}
              />
              All employees in the organization
            </label>
            {!allEmployees && (
              <div className='grid gap-1.5 rounded-[8px] border border-gray-200 bg-white p-3 sm:grid-cols-2'>
                {employeeOptions.length === 0 && (
                  <p className='text-paragraph-sm text-neutral-1000'>
                    No employees match the selected cascade.
                  </p>
                )}
                {employeeOptions.map((e) => (
                  <label
                    key={e.id}
                    className='flex items-center gap-2 text-sm'
                  >
                    <Checkbox
                      variant='blue'
                      checked={recipients.includes(e.name)}
                      onCheckedChange={(c) =>
                        toggleIn(recipients, setRecipients, e.name, c === true)
                      }
                    />
                    {e.name} — {e.position} ({e.location})
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            className='rounded-[6px]'
            onClick={() => {
              reset()
              onClose()
            }}
          >
            Cancel
          </Button>
          <Button className='rounded-[6px]' onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
