import { useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  ArrowsClockwise,
  Eye,
  PencilSimple,
  Plus,
  Trash,
} from 'phosphor-react'
import { toast } from 'sonner'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
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
  APPROVER_DIRECTORY,
  PAY_GRADES,
  RECRUITMENT_POSITIONS,
  type ExpenseHead,
  type PositionLevelPaygrade,
  type RecruitmentEmailTemplate,
  type RecruitmentRoleAssignment,
} from '../data/config'
import {
  REF_FIELD_TYPES,
  REF_QUESTION_TYPES,
  type ReferenceQuestion,
} from '../data/reference-questions'
import { DEPARTMENTS, LOCATIONS, RECRUITERS } from '../data/requisitions'
import { POSITION_LEVELS } from '../data/vacancies'
import type { RecruitmentConfigStore } from '../hooks/use-recruitment-config'
import { StatusBadge } from './badges'

/** Recruiters + approvers form the assignable employee directory. */
const EMPLOYEE_DIRECTORY = [
  ...new Set([...RECRUITERS, ...APPROVER_DIRECTORY]),
]

/** Toggle-chip multi-pick where 'All' is exclusive of specific values. */
function ChipPicker({
  label,
  options,
  selected,
  onChange,
}: {
  label: string
  options: readonly string[]
  selected: string[]
  onChange: (next: string[]) => void
}) {
  const toggle = (opt: string) => {
    if (opt === 'All') return onChange(['All'])
    const without = selected.filter((s) => s !== 'All' && s !== opt)
    onChange(
      selected.includes(opt)
        ? without.length
          ? without
          : ['All']
        : [...without, opt]
    )
  }
  return (
    <div>
      <p className='text-paragraph-sm text-neutral-1000 mb-1.5'>{label}</p>
      <div className='flex flex-wrap gap-1.5'>
        {['All', ...options].map((opt) => {
          const active = selected.includes(opt)
          return (
            <button
              key={opt}
              type='button'
              onClick={() => toggle(opt)}
              className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                active
                  ? 'border-blue-1200 bg-blue-150 text-blue-1400 font-medium'
                  : 'border-gray-200 bg-white text-neutral-1000 hover:border-gray-300'
              }`}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const EMAIL_PAGE_SIZE = 8

const EMAIL_TYPES = [
  'Requisition',
  'Posting',
  'Application',
  'Interview',
  'Reference',
  'Offer',
  'Onboarding',
  'Portal',
] as const

/** Small refresh control shared by the lists on this tab (EMT-03, EXH-03). */
function RefreshButton({ listName }: { listName: string }) {
  return (
    <Button
      variant='outline'
      className='h-7 gap-1 text-xs'
      onClick={() =>
        toast.success(`${listName} refreshed — showing the latest entries`)
      }
    >
      <ArrowsClockwise size={12} weight='bold' /> Refresh
    </Button>
  )
}

/**
 * Recruitment setup & templates — module master switch (SET-01), the
 * reference-check → position-level-paygrade save-and-continue sequence
 * (RFC-01…RFC-03, PLP-01/02), the recruitment email template catalogue
 * (EMT-01…EMT-03) and expense heads (EXH-01…EXH-03).
 */
export function ConfigSetup({ config }: { config: RecruitmentConfigStore }) {
  // RFC/PLP save-and-continue sequence
  const [setupStep, setSetupStep] = useState(0)
  const [rcDraft, setRcDraft] = useState(config.referenceCheck)

  // PLP mapping dialogs
  const [plpOpen, setPlpOpen] = useState(false)
  const [editingPlp, setEditingPlp] = useState<PositionLevelPaygrade | null>(
    null
  )
  const [plpDraft, setPlpDraft] = useState({
    positionLevel: 'Junior',
    payGrade: PAY_GRADES[0] as string,
    minCtcLpa: '4',
    maxCtcLpa: '8',
  })
  const [deletePlp, setDeletePlp] = useState<PositionLevelPaygrade | null>(null)

  // EMT list state
  const [emailPage, setEmailPage] = useState(0)
  const [viewEmail, setViewEmail] = useState<RecruitmentEmailTemplate | null>(
    null
  )
  const [emailFormOpen, setEmailFormOpen] = useState(false)
  const [editingEmail, setEditingEmail] =
    useState<RecruitmentEmailTemplate | null>(null)
  const [emailDraft, setEmailDraft] = useState({
    name: '',
    emailType: 'Application' as string,
    description: '',
    subject: '',
    body: '',
  })
  const [deleteEmail, setDeleteEmail] =
    useState<RecruitmentEmailTemplate | null>(null)

  // EXH state
  const [headFormOpen, setHeadFormOpen] = useState(false)
  const [editingHead, setEditingHead] = useState<ExpenseHead | null>(null)
  const [headDraft, setHeadDraft] = useState({ name: '', description: '' })
  const [deleteHead, setDeleteHead] = useState<ExpenseHead | null>(null)

  // Recruiter & HR role assignment state
  const [roleOpen, setRoleOpen] = useState(false)
  const [editingRole, setEditingRole] =
    useState<RecruitmentRoleAssignment | null>(null)
  const [roleDraft, setRoleDraft] = useState({
    roleName: '',
    roleType: 'Recruiter' as RecruitmentRoleAssignment['roleType'],
    description: '',
    applicableLocations: ['All'] as string[],
    applicableDepartments: ['All'] as string[],
    applicablePositions: ['All'] as string[],
    assignedEmployee: EMPLOYEE_DIRECTORY[0],
  })

  // Reference-check questionnaire state
  const [refqOpen, setRefqOpen] = useState(false)
  const [editingRefq, setEditingRefq] = useState<ReferenceQuestion | null>(null)
  const [refqDraft, setRefqDraft] = useState({
    question: '',
    questionType: 'Subjective' as ReferenceQuestion['questionType'],
    fieldType: 'Radio' as NonNullable<ReferenceQuestion['fieldType']>,
    options: [] as string[],
    applyAll: true,
    positions: [] as string[],
  })
  const [refPreviewOpen, setRefPreviewOpen] = useState(false)

  const sortedRefQuestions = [...config.refQuestions].sort(
    (a, b) => a.displayOrder - b.displayOrder
  )

  const openRoleForm = (r: RecruitmentRoleAssignment | null) => {
    setEditingRole(r)
    setRoleDraft(
      r
        ? {
            roleName: r.roleName,
            roleType: r.roleType,
            description: r.description,
            applicableLocations: r.applicableLocations,
            applicableDepartments: r.applicableDepartments,
            applicablePositions: r.applicablePositions,
            assignedEmployee: r.assignedEmployee,
          }
        : {
            roleName: '',
            roleType: 'Recruiter',
            description: '',
            applicableLocations: ['All'],
            applicableDepartments: ['All'],
            applicablePositions: ['All'],
            assignedEmployee: EMPLOYEE_DIRECTORY[0],
          }
    )
    setRoleOpen(true)
  }

  const openRefqForm = (q: ReferenceQuestion | null) => {
    setEditingRefq(q)
    setRefqDraft(
      q
        ? {
            question: q.question,
            questionType: q.questionType,
            fieldType: q.fieldType ?? 'Radio',
            options: q.options,
            applyAll: q.applicablePositions === 'all',
            positions:
              q.applicablePositions === 'all' ? [] : q.applicablePositions,
          }
        : {
            question: '',
            questionType: 'Subjective',
            fieldType: 'Radio',
            options: [],
            applyAll: true,
            positions: [],
          }
    )
    setRefqOpen(true)
  }

  const saveRefQuestion = () => {
    const payload = {
      question: refqDraft.question,
      questionType: refqDraft.questionType,
      fieldType:
        refqDraft.questionType === 'Objective' ? refqDraft.fieldType : null,
      options:
        refqDraft.questionType === 'Objective'
          ? refqDraft.options.filter(Boolean)
          : [],
      applicablePositions: refqDraft.applyAll
        ? ('all' as const)
        : refqDraft.positions,
      active: editingRefq?.active ?? true,
    }
    if (editingRefq) config.updateRefQuestion(editingRefq.id, payload)
    else config.addRefQuestion(payload)
    setRefqOpen(false)
  }

  const emailPageCount = Math.max(
    1,
    Math.ceil(config.emailTemplates.length / EMAIL_PAGE_SIZE)
  )
  const safeEmailPage = Math.min(emailPage, emailPageCount - 1)
  const emailRows = config.emailTemplates.slice(
    safeEmailPage * EMAIL_PAGE_SIZE,
    (safeEmailPage + 1) * EMAIL_PAGE_SIZE
  )

  const openEmailForm = (t: RecruitmentEmailTemplate | null) => {
    setEditingEmail(t)
    setEmailDraft(
      t
        ? {
            name: t.name,
            emailType: t.emailType,
            description: t.description,
            subject: t.subject,
            body: t.body,
          }
        : {
            name: '',
            emailType: 'Application',
            description: '',
            subject: '',
            body: '',
          }
    )
    setEmailFormOpen(true)
  }

  const openHeadForm = (h: ExpenseHead | null) => {
    setEditingHead(h)
    setHeadDraft(
      h
        ? { name: h.name, description: h.description }
        : { name: '', description: '' }
    )
    setHeadFormOpen(true)
  }

  const openPlpForm = (m: PositionLevelPaygrade | null) => {
    setEditingPlp(m)
    setPlpDraft(
      m
        ? {
            positionLevel: m.positionLevel,
            payGrade: m.payGrade,
            minCtcLpa: String(m.minCtcLpa),
            maxCtcLpa: String(m.maxCtcLpa),
          }
        : {
            positionLevel: 'Junior',
            payGrade: PAY_GRADES[0],
            minCtcLpa: '4',
            maxCtcLpa: '8',
          }
    )
    setPlpOpen(true)
  }

  return (
    <div className='w-full space-y-5'>
      {/* SET-01: recruitment module master switch */}
      <section className='rounded-[8px] border border-gray-200 bg-white p-4'>
        <div className='flex items-center justify-between'>
          <div>
            <h3 className='text-neutral-1600 text-sm font-medium'>
              Recruitment module
            </h3>
            <p className='text-paragraph-sm text-neutral-1000'>
              {config.moduleEnabled
                ? 'Enabled — requisitions, postings, pipeline and offers are available to the organisation.'
                : 'Disabled — recruitment features are hidden until the module is re-enabled.'}
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <StatusBadge status={config.moduleEnabled ? 'active' : 'inactive'} />
            <Switch
              checked={config.moduleEnabled}
              onCheckedChange={config.setModuleEnabled}
            />
          </div>
        </div>
      </section>

      {/* Recruiter Role & HR Role assignment (Kensium: Configuration → Roles) */}
      <section>
        <div className='mb-2 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Recruiter &amp; HR roles ({config.roleAssignments.length})
          </h3>
          <Button
            variant='outline'
            className='h-7 gap-1 text-xs'
            onClick={() => openRoleForm(null)}
          >
            <Plus size={12} /> Add role
          </Button>
        </div>
        <div className='rounded-[8px] border border-gray-200 bg-white'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Assigned employee</TableHead>
                <TableHead>Locations / Depts / Positions</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {config.roleAssignments.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <p className='font-medium'>{r.roleName}</p>
                    <p className='text-paragraph-sm text-neutral-1000'>
                      {r.description}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant='pending'>{r.roleType}</Badge>
                  </TableCell>
                  <TableCell className='text-sm'>{r.assignedEmployee}</TableCell>
                  <TableCell className='text-paragraph-sm text-neutral-1000'>
                    {r.applicableLocations.join(', ')} /{' '}
                    {r.applicableDepartments.join(', ')} /{' '}
                    {r.applicablePositions.join(', ')}
                  </TableCell>
                  <TableCell className='text-right'>
                    <div className='flex justify-end gap-1'>
                      <Button
                        variant='outline'
                        className='h-6 gap-1 px-2 text-xs'
                        onClick={() => openRoleForm(r)}
                      >
                        <PencilSimple size={12} /> Edit
                      </Button>
                      <Button
                        variant='outline'
                        className='h-6 gap-1 px-2 text-xs text-red-600'
                        onClick={() => config.removeRoleAssignment(r.id)}
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
          Recruiter roles pick up vacancies matching their applicability; HR
          roles receive joining formalities and pre-joining approvals.
        </p>
      </section>

      {/* RFC-01…03 + PLP-01/02: save-and-continue setup sequence */}
      <section className='rounded-[8px] border border-gray-200 bg-white p-4'>
        <div className='mb-3 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Setup sequence — Reference Check → Position Level PayGrade
          </h3>
          <Badge variant='pending'>
            {setupStep >= 2 ? 'Sequence complete' : `Step ${setupStep + 1} of 2`}
          </Badge>
        </div>

        {/* Step 1: Reference check (RFC-01, RFC-02, RFC-03) */}
        <div
          className={`rounded-[8px] border p-3 ${
            setupStep === 0 ? 'border-blue-300' : 'border-gray-200'
          }`}
        >
          <h4 className='mb-2 text-sm font-medium'>1. Reference check</h4>
          <div className='grid gap-2 md:grid-cols-3'>
            <label className='flex items-center gap-2 text-sm'>
              <Switch
                checked={rcDraft.inHouse}
                onCheckedChange={(v) =>
                  setRcDraft((d) => ({ ...d, inHouse: v }))
                }
              />
              Reference checks performed in house
            </label>
            <label className='flex items-center gap-2 text-sm'>
              <Switch
                checked={rcDraft.viaEmail}
                onCheckedChange={(v) =>
                  setRcDraft((d) => ({ ...d, viaEmail: v }))
                }
              />
              Collect references through emails
            </label>
            <div className='flex items-center gap-2 text-sm'>
              Minimum references
              <Input
                type='number'
                className='h-7 w-[70px]'
                value={rcDraft.minReferences}
                onChange={(e) =>
                  setRcDraft((d) => ({
                    ...d,
                    minReferences: Number(e.target.value),
                  }))
                }
              />
            </div>
          </div>

          {/* Reference-check questionnaire — ordered questions the referee answers */}
          <div className='mt-3'>
            <div className='mb-2 flex items-center justify-between'>
              <p className='text-sm font-medium'>
                Questionnaire ({sortedRefQuestions.length})
              </p>
              <div className='flex gap-1'>
                <Button
                  variant='outline'
                  className='h-7 gap-1 text-xs'
                  onClick={() => setRefPreviewOpen(true)}
                >
                  <Eye size={12} /> Preview
                </Button>
                <Button
                  variant='outline'
                  className='h-7 gap-1 text-xs'
                  onClick={() => openRefqForm(null)}
                >
                  <Plus size={12} /> Add question
                </Button>
              </div>
            </div>
            <div className='rounded-[8px] border border-gray-200'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-[70px]'>Order</TableHead>
                    <TableHead>Question</TableHead>
                    <TableHead>Type / field</TableHead>
                    <TableHead>Options</TableHead>
                    <TableHead>Applies to</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedRefQuestions.map((q, i) => (
                    <TableRow key={q.id}>
                      <TableCell>
                        <div className='flex items-center gap-0.5'>
                          <span className='w-4 text-sm'>{i + 1}</span>
                          <Button
                            variant='outline'
                            className='h-5 w-5 p-0'
                            disabled={i === 0}
                            onClick={() => config.moveRefQuestion(q.id, 'up')}
                          >
                            <ArrowUp size={10} />
                          </Button>
                          <Button
                            variant='outline'
                            className='h-5 w-5 p-0'
                            disabled={i === sortedRefQuestions.length - 1}
                            onClick={() => config.moveRefQuestion(q.id, 'down')}
                          >
                            <ArrowDown size={10} />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className='font-medium'>{q.question}</TableCell>
                      <TableCell className='text-sm'>
                        {q.questionType}
                        {q.fieldType ? ` / ${q.fieldType}` : ''}
                      </TableCell>
                      <TableCell className='text-paragraph-sm text-neutral-1000'>
                        {q.options.length ? q.options.join(', ') : '—'}
                      </TableCell>
                      <TableCell className='text-paragraph-sm text-neutral-1000'>
                        {q.applicablePositions === 'all'
                          ? 'All positions'
                          : q.applicablePositions.join(', ')}
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className='flex justify-end gap-1'>
                          <Button
                            variant='outline'
                            className='h-6 gap-1 px-2 text-xs'
                            onClick={() => openRefqForm(q)}
                          >
                            <PencilSimple size={12} /> Edit
                          </Button>
                          <Button
                            variant='outline'
                            className='h-6 gap-1 px-2 text-xs text-red-600'
                            onClick={() => config.removeRefQuestion(q.id)}
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
          </div>

          <Button
            className='mt-3 h-7 text-xs'
            onClick={() => {
              config.saveReferenceCheck(rcDraft)
              setSetupStep(1)
            }}
          >
            Save &amp; continue
          </Button>
        </div>

        {/* Step 2: Position level paygrade (PLP-01, PLP-02) */}
        <div
          className={`mt-3 rounded-[8px] border p-3 ${
            setupStep === 1 ? 'border-blue-300' : 'border-gray-200'
          }`}
        >
          <div className='mb-2 flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <h4 className='text-sm font-medium'>
                2. Position level paygrade
              </h4>
              <Switch
                checked={config.paygradeEnabled}
                onCheckedChange={config.setPaygradeEnabled}
              />
              <span className='text-paragraph-sm text-neutral-1000'>
                {config.paygradeEnabled
                  ? 'Pay grades are tied to position levels during recruitment'
                  : 'Disabled — offers are not constrained by pay grade'}
              </span>
            </div>
            <Button
              variant='outline'
              className='h-7 gap-1 text-xs'
              disabled={!config.paygradeEnabled}
              onClick={() => openPlpForm(null)}
            >
              <Plus size={12} /> Add mapping
            </Button>
          </div>
          {config.paygradeEnabled && (
            <div className='rounded-[8px] border border-gray-200'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Position level</TableHead>
                    <TableHead>Pay grade</TableHead>
                    <TableHead>CTC band (LPA)</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {config.paygradeMappings.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className='font-medium'>
                        {m.positionLevel}
                      </TableCell>
                      <TableCell className='text-sm'>{m.payGrade}</TableCell>
                      <TableCell className='text-sm'>
                        ₹{m.minCtcLpa}L – ₹{m.maxCtcLpa}L
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className='flex justify-end gap-1'>
                          <Button
                            variant='outline'
                            className='h-6 gap-1 px-2 text-xs'
                            onClick={() => openPlpForm(m)}
                          >
                            <PencilSimple size={12} /> Edit
                          </Button>
                          <Button
                            variant='outline'
                            className='h-6 gap-1 px-2 text-xs text-red-600'
                            onClick={() => setDeletePlp(m)}
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
          )}
          <Button
            className='mt-3 h-7 text-xs'
            onClick={() => {
              setSetupStep(2)
              toast.success(
                'Position level paygrade saved — setup sequence complete'
              )
            }}
          >
            Save &amp; continue
          </Button>
        </div>
      </section>

      {/* EMT-01…03: recruitment email templates */}
      <section>
        <div className='mb-2 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Recruitment email templates ({config.emailTemplates.length})
          </h3>
          <div className='flex items-center gap-2'>
            <RefreshButton listName='Email template list' />
            <Button
              variant='outline'
              className='h-7 gap-1 text-xs'
              onClick={() => openEmailForm(null)}
            >
              <Plus size={12} /> New template
            </Button>
          </div>
        </div>
        <div className='rounded-[8px] border border-gray-200 bg-white'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {emailRows.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className='font-medium'>{t.name}</TableCell>
                  <TableCell className='text-sm'>{t.emailType}</TableCell>
                  <TableCell className='text-paragraph-sm text-neutral-1000'>
                    {t.description}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={t.active}
                      onCheckedChange={() => config.toggleEmailTemplate(t.id)}
                    />
                  </TableCell>
                  <TableCell className='text-right'>
                    <div className='flex justify-end gap-1'>
                      <Button
                        variant='outline'
                        className='h-6 px-2 text-xs'
                        onClick={() => setViewEmail(t)}
                      >
                        View
                      </Button>
                      <Button
                        variant='outline'
                        className='h-6 gap-1 px-2 text-xs'
                        onClick={() => openEmailForm(t)}
                      >
                        <PencilSimple size={12} /> Edit
                      </Button>
                      <Button
                        variant='outline'
                        className='h-6 gap-1 px-2 text-xs text-red-600'
                        onClick={() => setDeleteEmail(t)}
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
        <div className='mt-2 flex items-center justify-between'>
          <p className='text-paragraph-sm text-neutral-1000'>
            Page {safeEmailPage + 1} of {emailPageCount} ·{' '}
            {config.emailTemplates.length} templates
          </p>
          <div className='flex gap-1'>
            <Button
              variant='outline'
              className='h-7 px-2 text-xs'
              disabled={safeEmailPage === 0}
              onClick={() => setEmailPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant='outline'
              className='h-7 px-2 text-xs'
              disabled={safeEmailPage >= emailPageCount - 1}
              onClick={() =>
                setEmailPage((p) => Math.min(emailPageCount - 1, p + 1))
              }
            >
              Next
            </Button>
          </div>
        </div>
      </section>

      {/* EXH-01…03: expense heads */}
      <section>
        <div className='mb-2 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Expense heads ({config.expenseHeads.length})
          </h3>
          <div className='flex items-center gap-2'>
            <RefreshButton listName='Expense head list' />
            <Button
              variant='outline'
              className='h-7 gap-1 text-xs'
              onClick={() => openHeadForm(null)}
            >
              <Plus size={12} /> Add expense head
            </Button>
          </div>
        </div>
        <div className='rounded-[8px] border border-gray-200 bg-white'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {config.expenseHeads.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className='font-medium'>{h.name}</TableCell>
                  <TableCell className='text-sm'>{h.description}</TableCell>
                  <TableCell className='text-right'>
                    <div className='flex justify-end gap-1'>
                      <Button
                        variant='outline'
                        className='h-6 gap-1 px-2 text-xs'
                        onClick={() => openHeadForm(h)}
                      >
                        <PencilSimple size={12} /> Edit
                      </Button>
                      <Button
                        variant='outline'
                        className='h-6 gap-1 px-2 text-xs text-red-600'
                        onClick={() => setDeleteHead(h)}
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
          Expense heads categorise recruitment spend (job boards, agencies,
          candidate travel) for reporting.
        </p>
      </section>

      {/* Add / edit paygrade mapping */}
      <Dialog open={plpOpen} onOpenChange={setPlpOpen}>
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader>
            <DialogTitle>
              {editingPlp ? 'Edit pay grade mapping' : 'Add pay grade mapping'}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='grid grid-cols-2 gap-3'>
              <Select
                value={plpDraft.positionLevel}
                onValueChange={(v) =>
                  setPlpDraft((d) => ({ ...d, positionLevel: v }))
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POSITION_LEVELS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={plpDraft.payGrade}
                onValueChange={(v) =>
                  setPlpDraft((d) => ({ ...d, payGrade: v }))
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAY_GRADES.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <Input
                type='number'
                placeholder='Min CTC (LPA)'
                value={plpDraft.minCtcLpa}
                onChange={(e) =>
                  setPlpDraft((d) => ({ ...d, minCtcLpa: e.target.value }))
                }
              />
              <Input
                type='number'
                placeholder='Max CTC (LPA)'
                value={plpDraft.maxCtcLpa}
                onChange={(e) =>
                  setPlpDraft((d) => ({ ...d, maxCtcLpa: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setPlpOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const payload = {
                  positionLevel: plpDraft.positionLevel,
                  payGrade: plpDraft.payGrade,
                  minCtcLpa: Number(plpDraft.minCtcLpa),
                  maxCtcLpa: Number(plpDraft.maxCtcLpa),
                }
                if (editingPlp)
                  config.updatePaygradeMapping(editingPlp.id, payload)
                else config.addPaygradeMapping(payload)
                setPlpOpen(false)
              }}
            >
              {editingPlp ? 'Save changes' : 'Save mapping'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete paygrade mapping confirm */}
      <Dialog
        open={deletePlp !== null}
        onOpenChange={(o) => !o && setDeletePlp(null)}
      >
        <DialogContent className='sm:max-w-[380px]'>
          <DialogHeader>
            <DialogTitle>Delete pay grade mapping?</DialogTitle>
          </DialogHeader>
          <p className='text-sm'>
            The {deletePlp?.positionLevel} → {deletePlp?.payGrade} mapping will
            be removed. Existing offers keep the band they were created under.
          </p>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeletePlp(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (deletePlp) config.deletePaygradeMapping(deletePlp.id)
                setDeletePlp(null)
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View email template (EMT-02) */}
      <Dialog
        open={viewEmail !== null}
        onOpenChange={(o) => !o && setViewEmail(null)}
      >
        <DialogContent className='sm:max-w-[480px]'>
          <DialogHeader>
            <DialogTitle>
              {viewEmail?.name} ({viewEmail?.emailType})
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-2'>
            <p className='text-sm'>
              <span className='font-medium'>Subject:</span> {viewEmail?.subject}
            </p>
            <div className='rounded-[8px] border border-gray-200 bg-neutral-100 p-3'>
              <p className='text-sm whitespace-pre-wrap'>{viewEmail?.body}</p>
            </div>
            <p className='text-paragraph-sm text-neutral-1000'>
              {viewEmail?.description}
            </p>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setViewEmail(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / edit email template */}
      <Dialog open={emailFormOpen} onOpenChange={setEmailFormOpen}>
        <DialogContent className='sm:max-w-[480px]'>
          <DialogHeader>
            <DialogTitle>
              {editingEmail ? 'Edit email template' : 'New email template'}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='grid grid-cols-2 gap-3'>
              <Input
                placeholder='Template name'
                value={emailDraft.name}
                onChange={(e) =>
                  setEmailDraft((d) => ({ ...d, name: e.target.value }))
                }
              />
              <Select
                value={emailDraft.emailType}
                onValueChange={(v) =>
                  setEmailDraft((d) => ({ ...d, emailType: v }))
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMAIL_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              placeholder='Description'
              value={emailDraft.description}
              onChange={(e) =>
                setEmailDraft((d) => ({ ...d, description: e.target.value }))
              }
            />
            <Input
              placeholder='Subject'
              value={emailDraft.subject}
              onChange={(e) =>
                setEmailDraft((d) => ({ ...d, subject: e.target.value }))
              }
            />
            <Textarea
              placeholder='Body — merge fields like {{candidate_name}} supported'
              rows={5}
              value={emailDraft.body}
              onChange={(e) =>
                setEmailDraft((d) => ({ ...d, body: e.target.value }))
              }
            />
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setEmailFormOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!emailDraft.name || !emailDraft.subject}
              onClick={() => {
                if (editingEmail)
                  config.updateEmailTemplate(editingEmail.id, emailDraft)
                else config.addEmailTemplate(emailDraft)
                setEmailFormOpen(false)
              }}
            >
              {editingEmail ? 'Save changes' : 'Save template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete email template confirm */}
      <Dialog
        open={deleteEmail !== null}
        onOpenChange={(o) => !o && setDeleteEmail(null)}
      >
        <DialogContent className='sm:max-w-[380px]'>
          <DialogHeader>
            <DialogTitle>Delete email template?</DialogTitle>
          </DialogHeader>
          <p className='text-sm'>
            "{deleteEmail?.name}" will be removed and can no longer be used by
            the notification engine.
          </p>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteEmail(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (deleteEmail) config.deleteEmailTemplate(deleteEmail.id)
                setDeleteEmail(null)
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / edit expense head */}
      <Dialog open={headFormOpen} onOpenChange={setHeadFormOpen}>
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader>
            <DialogTitle>
              {editingHead ? 'Edit expense head' : 'Add expense head'}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <Input
              placeholder='Expense head name'
              value={headDraft.name}
              onChange={(e) =>
                setHeadDraft((d) => ({ ...d, name: e.target.value }))
              }
            />
            <Textarea
              placeholder='Description'
              rows={3}
              value={headDraft.description}
              onChange={(e) =>
                setHeadDraft((d) => ({ ...d, description: e.target.value }))
              }
            />
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setHeadFormOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!headDraft.name}
              onClick={() => {
                if (editingHead)
                  config.updateExpenseHead(editingHead.id, headDraft)
                else config.addExpenseHead(headDraft)
                setHeadFormOpen(false)
              }}
            >
              {editingHead ? 'Save changes' : 'Save expense head'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete expense head confirm */}
      <Dialog
        open={deleteHead !== null}
        onOpenChange={(o) => !o && setDeleteHead(null)}
      >
        <DialogContent className='sm:max-w-[380px]'>
          <DialogHeader>
            <DialogTitle>Delete expense head?</DialogTitle>
          </DialogHeader>
          <p className='text-sm'>
            "{deleteHead?.name}" will be removed. Recorded expenses keep their
            historical categorisation.
          </p>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteHead(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (deleteHead) config.deleteExpenseHead(deleteHead.id)
                setDeleteHead(null)
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / edit recruiter or HR role assignment */}
      <Dialog open={roleOpen} onOpenChange={setRoleOpen}>
        <DialogContent className='sm:max-w-[480px]'>
          <DialogHeader>
            <DialogTitle>
              {editingRole ? 'Edit role assignment' : 'Add role assignment'}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='grid grid-cols-2 gap-3'>
              <Input
                placeholder='Role name'
                value={roleDraft.roleName}
                onChange={(e) =>
                  setRoleDraft((d) => ({ ...d, roleName: e.target.value }))
                }
              />
              <Select
                value={roleDraft.roleType}
                onValueChange={(v) =>
                  setRoleDraft((d) => ({
                    ...d,
                    roleType: v as RecruitmentRoleAssignment['roleType'],
                  }))
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['Recruiter', 'HR'] as const).map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              placeholder='Description'
              value={roleDraft.description}
              onChange={(e) =>
                setRoleDraft((d) => ({ ...d, description: e.target.value }))
              }
            />
            <ChipPicker
              label='Applicable locations'
              options={LOCATIONS}
              selected={roleDraft.applicableLocations}
              onChange={(next) =>
                setRoleDraft((d) => ({ ...d, applicableLocations: next }))
              }
            />
            <ChipPicker
              label='Applicable departments'
              options={DEPARTMENTS}
              selected={roleDraft.applicableDepartments}
              onChange={(next) =>
                setRoleDraft((d) => ({ ...d, applicableDepartments: next }))
              }
            />
            <ChipPicker
              label='Applicable positions'
              options={RECRUITMENT_POSITIONS}
              selected={roleDraft.applicablePositions}
              onChange={(next) =>
                setRoleDraft((d) => ({ ...d, applicablePositions: next }))
              }
            />
            <div>
              <p className='text-paragraph-sm text-neutral-1000 mb-1.5'>
                Assigned employee
              </p>
              <Select
                value={roleDraft.assignedEmployee}
                onValueChange={(v) =>
                  setRoleDraft((d) => ({ ...d, assignedEmployee: v }))
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYEE_DIRECTORY.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setRoleOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!roleDraft.roleName}
              onClick={() => {
                if (editingRole)
                  config.updateRoleAssignment(editingRole.id, roleDraft)
                else config.addRoleAssignment(roleDraft)
                setRoleOpen(false)
              }}
            >
              {editingRole ? 'Save changes' : 'Save role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / edit reference-check question */}
      <Dialog open={refqOpen} onOpenChange={setRefqOpen}>
        <DialogContent className='sm:max-w-[480px]'>
          <DialogHeader>
            <DialogTitle>
              {editingRefq
                ? 'Edit reference question'
                : 'Add reference question'}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <Textarea
              placeholder='Question the referee will answer'
              rows={2}
              value={refqDraft.question}
              onChange={(e) =>
                setRefqDraft((d) => ({ ...d, question: e.target.value }))
              }
            />
            <div className='grid grid-cols-2 gap-3'>
              <Select
                value={refqDraft.questionType}
                onValueChange={(v) =>
                  setRefqDraft((d) => ({
                    ...d,
                    questionType: v as ReferenceQuestion['questionType'],
                  }))
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REF_QUESTION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {refqDraft.questionType === 'Objective' && (
                <Select
                  value={refqDraft.fieldType}
                  onValueChange={(v) =>
                    setRefqDraft((d) => ({
                      ...d,
                      fieldType: v as NonNullable<
                        ReferenceQuestion['fieldType']
                      >,
                    }))
                  }
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REF_FIELD_TYPES.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            {/* Options editor — objective questions only */}
            {refqDraft.questionType === 'Objective' && (
              <div className='space-y-1.5'>
                <p className='text-paragraph-sm text-neutral-1000'>Options</p>
                {refqDraft.options.map((opt, i) => (
                  <div key={i} className='flex items-center gap-1.5'>
                    <Input
                      className='h-7'
                      placeholder={`Option ${i + 1}`}
                      value={opt}
                      onChange={(e) =>
                        setRefqDraft((d) => ({
                          ...d,
                          options: d.options.map((x, xi) =>
                            xi === i ? e.target.value : x
                          ),
                        }))
                      }
                    />
                    <Button
                      variant='outline'
                      className='h-7 w-7 p-0 text-red-600'
                      onClick={() =>
                        setRefqDraft((d) => ({
                          ...d,
                          options: d.options.filter((_, xi) => xi !== i),
                        }))
                      }
                    >
                      <Trash size={12} />
                    </Button>
                  </div>
                ))}
                <Button
                  variant='outline'
                  className='h-7 text-xs'
                  onClick={() =>
                    setRefqDraft((d) => ({ ...d, options: [...d.options, ''] }))
                  }
                >
                  + Add option
                </Button>
              </div>
            )}
            <label className='flex items-center gap-2 text-sm'>
              <Switch
                checked={refqDraft.applyAll}
                onCheckedChange={(v) =>
                  setRefqDraft((d) => ({ ...d, applyAll: v }))
                }
              />
              Applies to all positions
            </label>
            {!refqDraft.applyAll && (
              <div className='flex flex-wrap gap-1.5'>
                {RECRUITMENT_POSITIONS.map((p) => {
                  const active = refqDraft.positions.includes(p)
                  return (
                    <button
                      key={p}
                      type='button'
                      onClick={() =>
                        setRefqDraft((d) => ({
                          ...d,
                          positions: active
                            ? d.positions.filter((x) => x !== p)
                            : [...d.positions, p],
                        }))
                      }
                      className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                        active
                          ? 'border-blue-1200 bg-blue-150 text-blue-1400 font-medium'
                          : 'border-gray-200 bg-white text-neutral-1000 hover:border-gray-300'
                      }`}
                    >
                      {p}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setRefqOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={
                !refqDraft.question ||
                (refqDraft.questionType === 'Objective' &&
                  refqDraft.options.filter(Boolean).length < 2)
              }
              onClick={saveRefQuestion}
            >
              {editingRefq ? 'Save changes' : 'Save question'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reference questionnaire preview — as the referee sees it */}
      <Dialog open={refPreviewOpen} onOpenChange={setRefPreviewOpen}>
        <DialogContent className='sm:max-w-[520px]'>
          <DialogHeader>
            <DialogTitle>Reference questionnaire preview</DialogTitle>
          </DialogHeader>
          <div className='max-h-[420px] space-y-4 overflow-y-auto rounded-[8px] border border-gray-200 bg-neutral-100 p-3'>
            {sortedRefQuestions
              .filter((q) => q.active)
              .map((q, i) => (
                <div key={q.id}>
                  <p className='mb-1.5 text-sm font-medium'>
                    {i + 1}. {q.question}
                  </p>
                  {q.questionType === 'Subjective' ? (
                    <Textarea
                      rows={2}
                      placeholder='Referee types their answer here'
                      disabled
                      className='bg-white'
                    />
                  ) : q.fieldType === 'Radio' ? (
                    <RadioGroup className='space-y-1'>
                      {q.options.map((opt) => (
                        <div key={opt} className='flex items-center gap-2'>
                          <RadioGroupItem value={opt} id={`${q.id}-${opt}`} />
                          <span className='text-sm'>{opt}</span>
                        </div>
                      ))}
                    </RadioGroup>
                  ) : (
                    <div className='space-y-1'>
                      {q.options.map((opt) => (
                        <label
                          key={opt}
                          className='flex items-center gap-2 text-sm'
                        >
                          <Checkbox variant='blue' />
                          {opt}
                        </label>
                      ))}
                    </div>
                  )}
                  {q.applicablePositions !== 'all' && (
                    <p className='text-paragraph-sm text-neutral-1000 mt-1'>
                      Only asked for: {q.applicablePositions.join(', ')}
                    </p>
                  )}
                </div>
              ))}
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setRefPreviewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
