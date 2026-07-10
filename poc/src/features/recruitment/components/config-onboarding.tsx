import { useState } from 'react'
import { ArrowDown, ArrowUp, PencilSimple, Plus, Trash } from 'phosphor-react'
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
import { Input } from '@/components/ui/input'
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
import {
  FORMALITY_DEPARTMENTS,
  REHIRE_TABS,
  REQUIRED_DOC_LOCATIONS,
  type ChecklistQuestion,
  type CustomFieldDef,
  type JoiningFormality,
  type RequiredDocument,
} from '../data/config'
import { PIPELINE_STAGES } from '../data/candidates'
import type { RecruitmentConfigStore } from '../hooks/use-recruitment-config'
import { StatusBadge } from './badges'

/**
 * Pre-joining & data configuration — stage-based required documents,
 * checklist questionnaire, rehire carry-over settings and tenant custom
 * fields (TA-26, TA-51, TA-54, TA-55).
 */
export function ConfigOnboarding({
  config,
}: {
  config: RecruitmentConfigStore
}) {
  const [docOpen, setDocOpen] = useState(false)
  const [docDraft, setDocDraft] = useState({
    name: '',
    docType: 'Identity' as RequiredDocument['docType'],
    employeeClass: 'All',
    requiredAtStage: 'offer',
    applicableLocations: ['All'] as string[],
  })

  const toggleDocLocation = (loc: string) => {
    setDocDraft((d) => {
      // 'All' is exclusive of specific locations in either direction.
      if (loc === 'All') return { ...d, applicableLocations: ['All'] }
      const without = d.applicableLocations.filter(
        (l) => l !== 'All' && l !== loc
      )
      return {
        ...d,
        applicableLocations: d.applicableLocations.includes(loc)
          ? without.length
            ? without
            : ['All']
          : [...without, loc],
      }
    })
  }
  const [cqOpen, setCqOpen] = useState(false)
  const [cqDraft, setCqDraft] = useState({
    responseFrom: 'Candidate' as ChecklistQuestion['responseFrom'],
    question: '',
    fieldType: 'Yes/No' as ChecklistQuestion['fieldType'],
    mandatory: true,
  })
  const [rehireTabIdx, setRehireTabIdx] = useState(0)
  const [cfOpen, setCfOpen] = useState(false)
  const [cfDraft, setCfDraft] = useState({
    entity: 'requisition' as CustomFieldDef['entity'],
    label: '',
    fieldType: 'text' as CustomFieldDef['fieldType'],
    mandatory: false,
  })

  const [rehireDraft, setRehireDraft] = useState<string[] | null>(null)

  // Joining formalities checklist — add/edit dialog state
  const [jfOpen, setJfOpen] = useState(false)
  const [editingJf, setEditingJf] = useState<JoiningFormality | null>(null)
  const [jfDraft, setJfDraft] = useState({
    item: '',
    description: '',
    responsibleDepartment: FORMALITY_DEPARTMENTS[0] as string,
    timing: 'before-joining' as JoiningFormality['timing'],
    toBeCompletedByDays: '7',
  })
  const sortedFormalities = [...config.joiningFormalities].sort(
    (a, b) => a.displayOrder - b.displayOrder
  )

  const openJfForm = (jf: JoiningFormality | null) => {
    setEditingJf(jf)
    setJfDraft({
      item: jf?.item ?? '',
      description: jf?.description ?? '',
      responsibleDepartment:
        jf?.responsibleDepartment ?? FORMALITY_DEPARTMENTS[0],
      timing: jf?.timing ?? 'before-joining',
      toBeCompletedByDays: String(jf?.toBeCompletedByDays ?? 7),
    })
    setJfOpen(true)
  }

  const saveJoiningFormality = () => {
    const draft = {
      item: jfDraft.item,
      description: jfDraft.description,
      responsibleDepartment: jfDraft.responsibleDepartment,
      timing: jfDraft.timing,
      toBeCompletedByDays: Number(jfDraft.toBeCompletedByDays) || 0,
    }
    if (editingJf) config.updateJoiningFormality(editingJf.id, draft)
    else config.addJoiningFormality(draft)
    setJfOpen(false)
  }

  const rehireTab = REHIRE_TABS[rehireTabIdx]
  const rehireSelected =
    rehireDraft ?? config.rehireSelections[rehireTab.tab] ?? []

  const toggleRehireField = (field: string) => {
    setRehireDraft(
      rehireSelected.includes(field)
        ? rehireSelected.filter((f) => f !== field)
        : [...rehireSelected, field]
    )
  }

  return (
    <div className='w-full space-y-5'>
      {/* TA-54: stage-based required documents */}
      <section>
        <div className='mb-2 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <h3 className='text-neutral-1600 text-sm font-medium'>
              Required candidate documents ({config.requiredDocuments.length})
            </h3>
            <Switch
              checked={config.requiredDocsEnabled}
              onCheckedChange={config.setRequiredDocsEnabled}
            />
            <span className='text-paragraph-sm text-neutral-1000'>
              {config.requiredDocsEnabled
                ? 'Stage-based documents enabled'
                : 'Disabled — document setup unavailable'}
            </span>
          </div>
          <Button
            variant='outline'
            className='h-7 gap-1 text-xs'
            disabled={!config.requiredDocsEnabled}
            onClick={() => setDocOpen(true)}
          >
            <Plus size={12} /> Add document
          </Button>
        </div>
        {config.requiredDocsEnabled && (
          <div className='rounded-[8px] border border-gray-200 bg-white'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Employee class</TableHead>
                  <TableHead>Locations</TableHead>
                  <TableHead>Required at stage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {config.requiredDocuments.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className='font-medium'>{d.name}</TableCell>
                    <TableCell className='text-sm'>{d.docType}</TableCell>
                    <TableCell className='text-sm'>{d.employeeClass}</TableCell>
                    <TableCell className='text-sm'>
                      {d.applicableLocations.join(', ')}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={d.requiredAtStage} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {/* TA-51: checklist questionnaire */}
      <section>
        <div className='mb-2 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Pre-onboarding checklist questionnaire (
            {config.checklistQuestions.length})
          </h3>
          <Button
            variant='outline'
            className='h-7 gap-1 text-xs'
            onClick={() => setCqOpen(true)}
          >
            <Plus size={12} /> Add question
          </Button>
        </div>
        <div className='rounded-[8px] border border-gray-200 bg-white'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Question</TableHead>
                <TableHead>Response from</TableHead>
                <TableHead>Type / field / display</TableHead>
                <TableHead>Mandatory</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {config.checklistQuestions.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className='font-medium'>{q.question}</TableCell>
                  <TableCell className='text-sm'>{q.responseFrom}</TableCell>
                  <TableCell className='text-sm'>
                    {q.questionType} / {q.fieldType} / {q.displayType}
                  </TableCell>
                  <TableCell>
                    {q.mandatory ? (
                      <StatusBadge status='active' />
                    ) : (
                      <Badge variant='pending'>Optional</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className='text-paragraph-sm text-neutral-1000 mt-1.5'>
          These items form each candidate's pre-onboarding checklist (opened
          from the Hiring Pipeline once a candidate reaches Offer).
        </p>
      </section>

      {/* Joining formalities checklist — ordered, department-owned tasks */}
      <section>
        <div className='mb-2 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Joining formalities checklist ({config.joiningFormalities.length})
          </h3>
          <Button
            variant='outline'
            className='h-7 gap-1 text-xs'
            onClick={() => openJfForm(null)}
          >
            <Plus size={12} /> Add formality
          </Button>
        </div>
        <div className='rounded-[8px] border border-gray-200 bg-white'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-[90px]'>Order</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Responsible department</TableHead>
                <TableHead>Timing</TableHead>
                <TableHead>Complete by</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedFormalities.map((jf, idx) => (
                <TableRow key={jf.id}>
                  <TableCell>
                    <div className='flex items-center gap-1'>
                      <span className='w-4 text-sm'>{idx + 1}</span>
                      <Button
                        variant='outline'
                        className='h-6 w-6 p-0'
                        disabled={idx === 0}
                        onClick={() => config.moveJoiningFormality(jf.id, 'up')}
                      >
                        <ArrowUp size={12} />
                      </Button>
                      <Button
                        variant='outline'
                        className='h-6 w-6 p-0'
                        disabled={idx === sortedFormalities.length - 1}
                        onClick={() =>
                          config.moveJoiningFormality(jf.id, 'down')
                        }
                      >
                        <ArrowDown size={12} />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className='font-medium'>{jf.item}</p>
                    <p className='text-paragraph-sm text-neutral-1000'>
                      {jf.description}
                    </p>
                  </TableCell>
                  <TableCell className='text-sm'>
                    {jf.responsibleDepartment}
                  </TableCell>
                  <TableCell className='text-sm'>
                    {jf.timing === 'before-joining'
                      ? 'Before joining'
                      : 'After joining'}
                  </TableCell>
                  <TableCell className='text-sm'>
                    {jf.toBeCompletedByDays} day
                    {jf.toBeCompletedByDays === 1 ? '' : 's'}{' '}
                    {jf.timing === 'before-joining' ? 'before' : 'after'} DOJ
                  </TableCell>
                  <TableCell className='text-right'>
                    <div className='flex justify-end gap-1'>
                      <Button
                        variant='outline'
                        className='h-6 gap-1 px-2 text-xs'
                        onClick={() => openJfForm(jf)}
                      >
                        <PencilSimple size={12} /> Edit
                      </Button>
                      <Button
                        variant='outline'
                        className='h-6 gap-1 px-2 text-xs'
                        onClick={() => config.removeJoiningFormality(jf.id)}
                      >
                        <Trash size={12} /> Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className='text-paragraph-sm text-neutral-1000 mt-1.5'>
          The responsible department is notified when a candidate reaches the
          joining stage; items are tracked in this order against the date of
          joining.
        </p>
      </section>

      {/* TA-55: rehire carry-over settings */}
      <section className='rounded-[8px] border border-gray-200 bg-white p-4'>
        <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
          Rehire settings — data carry-over
        </h3>
        <div className='mb-3 flex flex-wrap items-center gap-1.5'>
          {REHIRE_TABS.map((t, i) => (
            <Button
              key={t.tab}
              variant={i === rehireTabIdx ? 'default' : 'outline'}
              className='h-7 px-2.5 text-xs'
              onClick={() => {
                setRehireTabIdx(i)
                setRehireDraft(null)
              }}
            >
              {t.tab} ({(config.rehireSelections[t.tab] ?? []).length}/
              {t.fields.length})
            </Button>
          ))}
        </div>
        <div className='space-y-1.5'>
          {rehireTab.fields.map((f) => (
            <label key={f} className='flex items-center gap-2 text-sm'>
              <Checkbox
                variant='blue'
                checked={rehireSelected.includes(f)}
                onCheckedChange={() => toggleRehireField(f)}
              />
              {f}
            </label>
          ))}
        </div>
        <Button
          className='mt-3 h-7 text-xs'
          onClick={() => {
            config.saveRehireTab(rehireTab.tab, rehireSelected)
            setRehireDraft(null)
            setRehireTabIdx((i) => Math.min(i + 1, REHIRE_TABS.length - 1))
          }}
        >
          Save and next
        </Button>
      </section>

      {/* TA-26: custom / UDF field schemas */}
      <section>
        <div className='mb-2 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Custom fields ({config.customFields.length})
          </h3>
          <Button
            variant='outline'
            className='h-7 gap-1 text-xs'
            onClick={() => setCfOpen(true)}
          >
            <Plus size={12} /> Add custom field
          </Button>
        </div>
        <div className='rounded-[8px] border border-gray-200 bg-white'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Field type</TableHead>
                <TableHead>Mandatory</TableHead>
                <TableHead>Version / effective</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {config.customFields.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className='font-medium'>{f.label}</TableCell>
                  <TableCell className='text-sm capitalize'>{f.entity}</TableCell>
                  <TableCell className='text-sm'>{f.fieldType}</TableCell>
                  <TableCell className='text-sm'>
                    {f.mandatory ? 'Yes' : 'No'}
                  </TableCell>
                  <TableCell className='text-sm'>
                    v{f.version} · {f.effectiveFrom}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={f.active ? 'active' : 'inactive'} />
                  </TableCell>
                  <TableCell className='text-right'>
                    {f.active && (
                      <Button
                        variant='outline'
                        className='h-6 px-2 text-xs'
                        onClick={() => config.retireCustomField(f.id)}
                      >
                        Retire
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className='text-paragraph-sm text-neutral-1000 mt-1.5'>
          Active fields render dynamically on the corresponding forms; retired
          fields no longer appear on new records while historical records keep
          their captured values.
        </p>
      </section>

      {/* Add required document dialog */}
      <Dialog open={docOpen} onOpenChange={setDocOpen}>
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader>
            <DialogTitle>Add required document</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <Input
              placeholder='Document name'
              value={docDraft.name}
              onChange={(e) =>
                setDocDraft((d) => ({ ...d, name: e.target.value }))
              }
            />
            <div className='grid grid-cols-2 gap-3'>
              <Select
                value={docDraft.docType}
                onValueChange={(v) =>
                  setDocDraft((d) => ({
                    ...d,
                    docType: v as RequiredDocument['docType'],
                  }))
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    ['Identity', 'Education', 'Employment', 'Compensation'] as const
                  ).map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={docDraft.requiredAtStage}
                onValueChange={(v) =>
                  setDocDraft((d) => ({ ...d, requiredAtStage: v }))
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PIPELINE_STAGES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className='text-paragraph-sm text-neutral-1000 mb-1.5'>
                Applicable locations
              </p>
              <div className='flex flex-wrap gap-1.5'>
                {REQUIRED_DOC_LOCATIONS.map((loc) => {
                  const active = docDraft.applicableLocations.includes(loc)
                  return (
                    <button
                      key={loc}
                      type='button'
                      onClick={() => toggleDocLocation(loc)}
                      className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                        active
                          ? 'border-blue-1200 bg-blue-150 text-blue-1400 font-medium'
                          : 'border-gray-200 bg-white text-neutral-1000 hover:border-gray-300'
                      }`}
                    >
                      {loc}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDocOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!docDraft.name}
              onClick={() => {
                config.addRequiredDocument(docDraft)
                setDocOpen(false)
                setDocDraft((d) => ({ ...d, name: '' }))
              }}
            >
              Save document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add checklist question dialog */}
      <Dialog open={cqOpen} onOpenChange={setCqOpen}>
        <DialogContent className='sm:max-w-[420px]'>
          <DialogHeader>
            <DialogTitle>Add checklist question</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <Input
              placeholder='Question'
              value={cqDraft.question}
              onChange={(e) =>
                setCqDraft((d) => ({ ...d, question: e.target.value }))
              }
            />
            <div className='grid grid-cols-3 gap-3'>
              <Select
                value={cqDraft.responseFrom}
                onValueChange={(v) =>
                  setCqDraft((d) => ({
                    ...d,
                    responseFrom: v as ChecklistQuestion['responseFrom'],
                  }))
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['Candidate', 'HR', 'IT'] as const).map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={cqDraft.fieldType}
                onValueChange={(v) =>
                  setCqDraft((d) => ({
                    ...d,
                    fieldType: v as ChecklistQuestion['fieldType'],
                  }))
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['Text', 'Yes/No', 'Date'] as const).map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={cqDraft.mandatory ? 'yes' : 'no'}
                onValueChange={(v) =>
                  setCqDraft((d) => ({ ...d, mandatory: v === 'yes' }))
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='yes'>Mandatory</SelectItem>
                  <SelectItem value='no'>Optional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setCqOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!cqDraft.question}
              onClick={() => {
                config.addChecklistQuestion({
                  responseFrom: cqDraft.responseFrom,
                  question: cqDraft.question,
                  questionType:
                    cqDraft.fieldType === 'Text' ? 'Subjective' : 'Objective',
                  fieldType: cqDraft.fieldType,
                  displayType:
                    cqDraft.fieldType === 'Yes/No' ? 'Checkbox' : 'Input',
                  value: '',
                  mandatory: cqDraft.mandatory,
                })
                setCqOpen(false)
                setCqDraft((d) => ({ ...d, question: '' }))
              }}
            >
              Save question
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add custom field dialog */}
      <Dialog open={cfOpen} onOpenChange={setCfOpen}>
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader>
            <DialogTitle>Add custom field</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <Input
              placeholder='Field label'
              value={cfDraft.label}
              onChange={(e) =>
                setCfDraft((d) => ({ ...d, label: e.target.value }))
              }
            />
            <div className='grid grid-cols-3 gap-3'>
              <Select
                value={cfDraft.entity}
                onValueChange={(v) =>
                  setCfDraft((d) => ({
                    ...d,
                    entity: v as CustomFieldDef['entity'],
                  }))
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['requisition', 'candidate', 'application'] as const).map(
                    (x) => (
                      <SelectItem key={x} value={x}>
                        {x}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
              <Select
                value={cfDraft.fieldType}
                onValueChange={(v) =>
                  setCfDraft((d) => ({
                    ...d,
                    fieldType: v as CustomFieldDef['fieldType'],
                  }))
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['text', 'number', 'select'] as const).map((x) => (
                    <SelectItem key={x} value={x}>
                      {x}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={cfDraft.mandatory ? 'yes' : 'no'}
                onValueChange={(v) =>
                  setCfDraft((d) => ({ ...d, mandatory: v === 'yes' }))
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='yes'>Mandatory</SelectItem>
                  <SelectItem value='no'>Optional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setCfOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!cfDraft.label}
              onClick={() => {
                config.addCustomField({
                  entity: cfDraft.entity,
                  label: cfDraft.label,
                  fieldType: cfDraft.fieldType,
                  mandatory: cfDraft.mandatory,
                })
                setCfOpen(false)
                setCfDraft((d) => ({ ...d, label: '' }))
              }}
            >
              Publish field
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / edit joining formality dialog */}
      <Dialog open={jfOpen} onOpenChange={setJfOpen}>
        <DialogContent className='sm:max-w-[440px]'>
          <DialogHeader>
            <DialogTitle>
              {editingJf ? 'Edit joining formality' : 'Add joining formality'}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <Input
              placeholder='Formality item'
              value={jfDraft.item}
              onChange={(e) =>
                setJfDraft((d) => ({ ...d, item: e.target.value }))
              }
            />
            <Textarea
              placeholder='Description'
              value={jfDraft.description}
              onChange={(e) =>
                setJfDraft((d) => ({ ...d, description: e.target.value }))
              }
              rows={2}
            />
            <div className='grid grid-cols-2 gap-3'>
              <Select
                value={jfDraft.responsibleDepartment}
                onValueChange={(v) =>
                  setJfDraft((d) => ({ ...d, responsibleDepartment: v }))
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMALITY_DEPARTMENTS.map((x) => (
                    <SelectItem key={x} value={x}>
                      {x}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={jfDraft.timing}
                onValueChange={(v) =>
                  setJfDraft((d) => ({
                    ...d,
                    timing: v as JoiningFormality['timing'],
                  }))
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='before-joining'>Before joining</SelectItem>
                  <SelectItem value='after-joining'>After joining</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='flex items-center gap-2'>
              <span className='text-sm'>To be completed by</span>
              <Input
                type='number'
                min={0}
                className='h-7 w-[90px]'
                value={jfDraft.toBeCompletedByDays}
                onChange={(e) =>
                  setJfDraft((d) => ({
                    ...d,
                    toBeCompletedByDays: e.target.value,
                  }))
                }
              />
              <span className='text-sm'>
                days {jfDraft.timing === 'before-joining' ? 'before' : 'after'}{' '}
                the date of joining
              </span>
            </div>
            <p className='text-paragraph-sm text-neutral-1000'>
              The responsible department is notified of this item for every
              joining candidate.
            </p>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setJfOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!jfDraft.item} onClick={saveJoiningFormality}>
              {editingJf ? 'Save changes' : 'Add formality'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
