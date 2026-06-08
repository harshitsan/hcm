import { useMemo, useState } from 'react'
import {
  SlidersHorizontal, Plus, Pencil, Trash2, Type, Hash, Calendar, ChevronDown,
  ToggleLeft, Paperclip, Info, Lock,
} from 'lucide-react'
import { useApp } from '../app/store'
import { customFields, type CustomField } from '../data/mock'
import {
  Badge, Button, Card, CardBody, CardHeader, CardTitle, EmptyState, Field, Input,
  Modal, PageHeader, Segmented, Select, Switch, Table, Td, Th, Tooltip, Tr, useToast,
} from '../components/ui'
import { cn } from '../lib/cn'

type Entity = CustomField['entity']
type FieldType = CustomField['type']
type Scope = CustomField['scope']
type Tone = 'primary' | 'info' | 'accent' | 'success' | 'warning' | 'neutral'

const ENTITIES: Entity[] = ['Employee', 'Company', 'Department', 'Position']
const FIELD_TYPES: FieldType[] = ['Text', 'Number', 'Date', 'Dropdown', 'Boolean', 'File']

const typeIcon: Record<FieldType, typeof Type> = {
  Text: Type, Number: Hash, Date: Calendar, Dropdown: ChevronDown, Boolean: ToggleLeft, File: Paperclip,
}
const toneFor = (t: FieldType): Tone => {
  const map: Record<FieldType, Tone> = {
    Text: 'primary', Number: 'info', Date: 'accent', Dropdown: 'success', Boolean: 'warning', File: 'neutral',
  }
  return map[t]
}

export default function CustomFields() {
  const { role, company } = useApp()
  const { push } = useToast()
  const readOnly = role === 'employee' || role === 'people_manager'
  // Only platform-level admins may create fields that apply across every company.
  const canPlatform = role === 'provider_admin' || role === 'portfolio_manager'

  const [tab, setTab] = useState<Entity>('Employee')
  const [open, setOpen] = useState(false)
  // form state
  const [label, setLabel] = useState('')
  const [type, setType] = useState<FieldType>('Text')
  const [required, setRequired] = useState(false)
  const [scope, setScope] = useState<Scope>('Company')

  const rows = useMemo(() => customFields.filter((f) => f.entity === tab), [tab])

  const reset = () => {
    setLabel('')
    setType('Text')
    setRequired(false)
    setScope('Company')
  }
  const openModal = () => {
    reset()
    setOpen(true)
  }
  const submit = () => {
    if (!label.trim()) {
      push({ title: 'A field label is required', tone: 'warning' })
      return
    }
    push({ title: `Added "${label.trim()}" to ${tab}`, tone: 'success' })
    setOpen(false)
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        icon={<SlidersHorizontal className="h-5 w-5" />}
        title="Custom Fields"
        subtitle={`Extend records with your own fields · ${company.name}`}
        actions={
          !readOnly && (
            <Button onClick={openModal}>
              <Plus className="h-4 w-4" /> Add field
            </Button>
          )
        }
      />

      <div className="mb-5 flex items-center gap-2 overflow-x-auto rounded-xl border border-border bg-surface p-1">
        {ENTITIES.map((e) => {
          const count = customFields.filter((f) => f.entity === e).length
          const active = tab === e
          return (
            <button
              key={e}
              onClick={() => setTab(e)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors cursor-pointer',
                active ? 'bg-primary/10 text-primary' : 'text-muted-fg hover:bg-muted hover:text-fg',
              )}
            >
              {e}
              <span className={cn('tnum rounded-full px-1.5 text-2xs', active ? 'bg-primary/15' : 'bg-muted')}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>{tab} fields</CardTitle>
            <Badge tone="neutral">{rows.length}</Badge>
          </div>
          <span className="hidden text-2xs font-semibold uppercase tracking-wide text-muted-fg sm:inline">
            Applied to every {tab.toLowerCase()} record
          </span>
        </CardHeader>
        <CardBody className="p-0">
          {rows.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={<SlidersHorizontal className="h-5 w-5" />}
                title={`No custom fields on ${tab}`}
                description={
                  readOnly
                    ? 'No additional fields have been defined for this entity yet.'
                    : `Add a field to capture extra ${tab.toLowerCase()} data your team needs.`
                }
                action={
                  !readOnly && (
                    <Button size="sm" onClick={openModal}>
                      <Plus className="h-4 w-4" /> Add field
                    </Button>
                  )
                }
              />
            </div>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Field</Th>
                  <Th>Type</Th>
                  <Th>Required</Th>
                  <Th>Scope</Th>
                  {!readOnly && <Th className="text-right">Actions</Th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((f) => {
                  const Icon = typeIcon[f.type]
                  return (
                    <Tr key={f.id}>
                      <Td>
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-fg">
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="font-semibold text-fg">{f.label}</span>
                        </div>
                      </Td>
                      <Td>
                        <Badge tone={toneFor(f.type)}>{f.type}</Badge>
                      </Td>
                      <Td>
                        {f.required ? (
                          <Badge tone="warning">Required</Badge>
                        ) : (
                          <Badge tone="neutral">Optional</Badge>
                        )}
                      </Td>
                      <Td>
                        <Badge tone={f.scope === 'Platform' ? 'info' : 'primary'}>
                          {f.scope === 'Platform' && <Lock className="h-3 w-3" />} {f.scope}
                        </Badge>
                      </Td>
                      {!readOnly && (
                        <Td className="text-right">
                          <div className="inline-flex items-center gap-1">
                            <Tooltip label="Edit">
                              <Button
                                size="icon"
                                variant="ghost"
                                aria-label="Edit field"
                                onClick={() => push({ title: `Editing "${f.label}"`, tone: 'info' })}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </Tooltip>
                            <Tooltip label="Delete">
                              <Button
                                size="icon"
                                variant="ghost"
                                aria-label="Delete field"
                                onClick={() => push({ title: `Deleted "${f.label}"`, tone: 'neutral' })}
                              >
                                <Trash2 className="h-4 w-4 text-danger" />
                              </Button>
                            </Tooltip>
                          </div>
                        </Td>
                      )}
                    </Tr>
                  )
                })}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-muted-fg">
        <Info className="h-3.5 w-3.5 shrink-0" />
        Custom fields flow into search, workflows, reports, imports, and the API.
      </p>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add custom field"
        description={`This field will appear on every ${tab.toLowerCase()} record.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit}>
              <Plus className="h-4 w-4" /> Add field
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Field label" required hint="Shown to users on the form and in reports.">
            <Input
              placeholder="e.g. Shirt size, Cost center"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              autoFocus
            />
          </Field>

          <Field label="Entity" hint="Set by the active tab.">
            <div className="flex h-9 items-center gap-2 rounded-lg border border-dashed border-border bg-surface2/50 px-3 text-sm font-semibold text-fg">
              <Lock className="h-3.5 w-3.5 text-muted-fg" /> {tab}
            </div>
          </Field>

          <Field label="Type">
            <Select value={type} onChange={(e) => setType(e.target.value as FieldType)}>
              {FIELD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>

          <div className="flex items-center justify-between rounded-lg border border-border bg-surface2/40 px-3.5 py-3">
            <div>
              <p className="text-[13px] font-semibold text-fg">Required</p>
              <p className="text-xs text-muted-fg">Users must fill this before saving.</p>
            </div>
            <Switch checked={required} onChange={setRequired} />
          </div>

          <Field
            label="Scope"
            hint={
              canPlatform
                ? 'Platform fields apply to every company; Company fields are local.'
                : 'Company admins can only add fields scoped to this company.'
            }
          >
            {canPlatform ? (
              <Segmented<Scope>
                value={scope}
                onChange={setScope}
                options={[
                  { value: 'Platform', label: 'Platform' },
                  { value: 'Company', label: 'Company' },
                ]}
              />
            ) : (
              <Badge tone="primary"><Lock className="h-3 w-3" /> Company</Badge>
            )}
          </Field>
        </div>
      </Modal>
    </div>
  )
}
