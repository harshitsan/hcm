import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowsClockwise, Plus } from 'phosphor-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form } from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  QUESTION_SECTIONS,
  RESPONSE_TYPES,
  TRAINING_MODES,
  type ExternalTrainer,
  type QuestionSection,
  type QuestionnaireQuestion,
  type TrainingCostApprover,
  type TrainingTopic,
} from '../data/learning-admin'
import {
  useLearningAdmin,
  type LearningAdminStore,
} from '../hooks/use-learning-admin'
import { SelectField, TextField } from './form-fields'
import { DeleteConfirmButton, EditIconButton, Pager } from './shared'
import { formatInr } from './utils'

const STEPS = [
  { id: 'setup', label: 'Setup' },
  { id: 'questionnaire', label: 'Certification Questionnaire' },
  { id: 'trainers', label: 'External Trainers' },
  { id: 'approvers', label: 'Training Cost Approvers' },
  { id: 'topics', label: 'Training Topics' },
] as const

type StepId = (typeof STEPS)[number]['id']

/**
 * Learning-management configuration wizard (Kensium Configuration → Learning
 * Management): module setup (SET-01..03), certification questionnaire
 * (CQ-01..05), external trainers (MET-01..05), training cost approvers
 * (TCA-01..05) and training topics (TT-01..06). Next advances the setup flow;
 * Cancel discards unsaved setup edits.
 */
export function LearningAdminTab() {
  const store = useLearningAdmin()
  const [step, setStep] = useState<StepId>('setup')
  const [setupDraft, setSetupDraft] = useState(store.setup)

  useEffect(() => {
    setSetupDraft(store.setup)
  }, [store.setup])

  const stepIndex = STEPS.findIndex((s) => s.id === step)
  const isLast = stepIndex === STEPS.length - 1

  /** Save-and-next on the setup step (SET-02); plain Next elsewhere (CQ-04, MET-05, TCA-05, TT-06). */
  const handleNext = () => {
    if (step === 'setup') store.saveSetup(setupDraft)
    if (isLast) {
      toast.success('Learning management configuration complete')
      setStep('setup')
      return
    }
    setStep(STEPS[stepIndex + 1].id)
  }

  /** Exits the flow without saving unapplied setup edits (SET-03, CQ-05). */
  const handleCancel = () => {
    setSetupDraft(store.setup)
    setStep('setup')
    toast.info('Configuration changes discarded — nothing was saved')
  }

  return (
    <div className='flex w-full flex-col gap-3'>
      <div className='flex flex-wrap items-center gap-1'>
        {STEPS.map((s, i) => (
          <Button
            key={s.id}
            variant='ghost'
            onClick={() => setStep(s.id)}
            className={`h-7 gap-1.5 rounded-[6px] px-2 ${
              s.id === step ? 'bg-white font-medium shadow-sm' : ''
            }`}
          >
            <span
              className={`flex h-4.5 w-4.5 items-center justify-center rounded-full text-[10px] font-semibold ${
                s.id === step
                  ? 'bg-orange-1200 text-white'
                  : 'bg-neutral-300 text-neutral-1600'
              }`}
            >
              {i + 1}
            </span>
            {s.label}
          </Button>
        ))}
      </div>

      {step === 'setup' && (
        <SetupStep draft={setupDraft} onChange={setSetupDraft} />
      )}
      {step === 'questionnaire' && <QuestionnaireStep store={store} />}
      {step === 'trainers' && <TrainersStep store={store} />}
      {step === 'approvers' && <CostApproversStep store={store} />}
      {step === 'topics' && <TopicsStep store={store} />}

      <div className='flex items-center justify-between rounded-[6px] border border-gray-200 bg-white px-3 py-2'>
        <Button
          variant='outline'
          className='h-8 rounded-[6px] px-3'
          onClick={handleCancel}
        >
          Cancel
        </Button>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            className='h-8 rounded-[6px] px-3'
            disabled={stepIndex === 0}
            onClick={() => setStep(STEPS[stepIndex - 1].id)}
          >
            Back
          </Button>
          <Button className='h-8 rounded-[6px] px-3' onClick={handleNext}>
            {step === 'setup' ? 'Save & Next' : isLast ? 'Finish' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------ Setup (SET) ------------------------------ */

function SetupStep({
  draft,
  onChange,
}: {
  draft: LearningAdminStore['setup']
  onChange: (next: LearningAdminStore['setup']) => void
}) {
  const rows: Array<{
    key: keyof LearningAdminStore['setup']
    label: string
    hint: string
  }> = [
    {
      key: 'moduleEnabled',
      label: 'Learning management module',
      hint: 'Turn training, certifications and trainer administration on or off for the organization',
    },
    {
      key: 'selfNomination',
      label: 'Employee self-nomination',
      hint: 'Let employees nominate themselves to published training topics',
    },
    {
      key: 'managerApprovalRequired',
      label: 'Manager approval required',
      hint: 'Route every training / certification request through the reporting manager',
    },
  ]
  return (
    <div className='rounded-[6px] border border-gray-200 bg-white'>
      <div className='flex items-center justify-between border-b border-gray-200 px-4 py-2'>
        <p className='text-sm font-medium'>Module setup</p>
        <Badge variant={draft.moduleEnabled ? 'badge_active' : 'badge_inactive'}>
          {draft.moduleEnabled ? 'Module enabled' : 'Module disabled'}
        </Badge>
      </div>
      <div className='divide-y divide-gray-100'>
        {rows.map((row) => (
          <div
            key={row.key}
            className='flex items-center justify-between gap-4 px-4 py-3'
          >
            <div>
              <p className='text-sm font-medium'>{row.label}</p>
              <p className='text-paragraph-sm text-neutral-1000'>{row.hint}</p>
            </div>
            <Switch
              checked={draft[row.key]}
              disabled={row.key !== 'moduleEnabled' && !draft.moduleEnabled}
              onCheckedChange={(checked) =>
                onChange({ ...draft, [row.key]: checked })
              }
              aria-label={row.label}
            />
          </div>
        ))}
      </div>
      <p className='text-paragraph-sm text-neutral-1000 border-t border-gray-100 px-4 py-2'>
        Use <span className='font-medium'>Save &amp; Next</span> to apply the
        setup and continue, or <span className='font-medium'>Cancel</span> to
        leave without applying changes.
      </p>
    </div>
  )
}

/* ------------------------- Questionnaire (CQ) ---------------------------- */

const MANDATORY_OPTIONS = ['Mandatory', 'Optional'] as const

const questionSchema = z.object({
  section: z.enum(QUESTION_SECTIONS),
  question: z.string().min(5, 'Enter the question text'),
  responseType: z.enum(RESPONSE_TYPES),
  mandatory: z.enum(MANDATORY_OPTIONS),
})

type QuestionForm = z.infer<typeof questionSchema>

function QuestionnaireStep({ store }: { store: LearningAdminStore }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<QuestionnaireQuestion | null>(null)
  const [presetSection, setPresetSection] =
    useState<QuestionSection>('Sponsorship')

  const form = useForm<QuestionForm>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      section: 'Sponsorship',
      question: '',
      responseType: 'Free text',
      mandatory: 'Mandatory',
    },
  })

  useEffect(() => {
    if (!open) return
    form.reset(
      editing
        ? {
            section: editing.section,
            question: editing.question,
            responseType: editing.responseType,
            mandatory: editing.mandatory ? 'Mandatory' : 'Optional',
          }
        : {
            section: presetSection,
            question: '',
            responseType: 'Free text',
            mandatory: 'Mandatory',
          }
    )
  }, [open, editing, presetSection, form])

  const openAdd = (section: QuestionSection) => {
    setEditing(null)
    setPresetSection(section)
    setOpen(true)
  }

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex items-center justify-between'>
        <p className='text-paragraph-sm text-neutral-1000'>
          Questions employees answer when requesting certification sponsorship
          or reimbursement.
        </p>
        <Button
          variant='outline'
          className='h-7 gap-1 rounded-[6px] px-2'
          onClick={store.refreshQuestions}
        >
          <ArrowsClockwise size={13} weight='bold' />
          Refresh
        </Button>
      </div>
      {QUESTION_SECTIONS.map((section) => (
        <div key={section} className='rounded-[6px] border border-gray-200 bg-white'>
          <div className='flex items-center justify-between border-b border-gray-200 px-4 py-2'>
            <p className='text-sm font-medium'>{section} questions</p>
            <Button
              variant='red'
              onClick={() => openAdd(section)}
              className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
            >
              <Plus size={10} weight='bold' />
              Add question
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow className='bg-gray-50'>
                <TableHead>Question</TableHead>
                <TableHead>Response type</TableHead>
                <TableHead>Mandatory</TableHead>
                <TableHead className='w-[90px]'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {store.questions
                .filter((q) => q.section === section)
                .map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className='max-w-[420px] font-medium whitespace-normal'>
                      {q.question}
                    </TableCell>
                    <TableCell>{q.responseType}</TableCell>
                    <TableCell>
                      <Badge variant={q.mandatory ? 'open' : 'badge_inactive'}>
                        {q.mandatory ? 'Mandatory' : 'Optional'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-1.5'>
                        <EditIconButton
                          label={`Edit question ${q.question}`}
                          onClick={() => {
                            setEditing(q)
                            setOpen(true)
                          }}
                        />
                        <DeleteConfirmButton
                          title='question'
                          description={`"${q.question}" will be removed from the ${q.section.toLowerCase()} questionnaire.`}
                          onConfirm={() => store.removeQuestion(q.id)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              {store.questions.filter((q) => q.section === section).length ===
                0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className='text-paragraph-sm text-neutral-1000 py-6 text-center'
                  >
                    No {section.toLowerCase()} questions configured yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      ))}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='sm:max-w-[440px]'>
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Edit questionnaire question' : 'Add questionnaire question'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => {
                const draft = {
                  section: values.section,
                  question: values.question,
                  responseType: values.responseType,
                  mandatory: values.mandatory === 'Mandatory',
                }
                if (editing) store.updateQuestion(editing.id, draft)
                else store.addQuestion(draft)
                setOpen(false)
              })}
              className='space-y-3'
            >
              <SelectField
                control={form.control}
                name='section'
                label='Section'
                options={QUESTION_SECTIONS}
              />
              <TextField
                control={form.control}
                name='question'
                label='Question'
              />
              <div className='grid grid-cols-2 gap-3'>
                <SelectField
                  control={form.control}
                  name='responseType'
                  label='Response type'
                  options={RESPONSE_TYPES}
                />
                <SelectField
                  control={form.control}
                  name='mandatory'
                  label='Answer requirement'
                  options={MANDATORY_OPTIONS}
                />
              </div>
              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type='submit'>
                  {editing ? 'Save changes' : 'Add question'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* --------------------------- Trainers (MET) ------------------------------ */

const trainerSchema = z.object({
  name: z.string().min(2, 'Enter the trainer name'),
  company: z.string().min(2, 'Enter the company'),
  email: z.email('Enter a valid email'),
  skill: z.string().min(2, 'Enter the skill / expertise'),
  trainingsConducted: z.number().min(0, 'Cannot be negative'),
})

type TrainerForm = z.infer<typeof trainerSchema>

const EMPTY_TRAINER: TrainerForm = {
  name: '',
  company: '',
  email: '',
  skill: '',
  trainingsConducted: 0,
}

function TrainersStep({ store }: { store: LearningAdminStore }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ExternalTrainer | null>(null)

  const form = useForm<TrainerForm>({
    resolver: zodResolver(trainerSchema),
    defaultValues: EMPTY_TRAINER,
  })

  useEffect(() => {
    if (!open) return
    form.reset(
      editing
        ? {
            name: editing.name,
            company: editing.company,
            email: editing.email,
            skill: editing.skill,
            trainingsConducted: editing.trainingsConducted,
          }
        : EMPTY_TRAINER
    )
  }, [open, editing, form])

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex items-center justify-between'>
        <p className='text-paragraph-sm text-neutral-1000'>
          Outside trainers who can be assigned to training topics.
        </p>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            className='h-7 gap-1 rounded-[6px] px-2'
            onClick={store.refreshTrainers}
          >
            <ArrowsClockwise size={13} weight='bold' />
            Refresh
          </Button>
          <Button
            variant='red'
            onClick={() => {
              setEditing(null)
              setOpen(true)
            }}
            className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
          >
            <Plus size={10} weight='bold' />
            Add trainer
          </Button>
        </div>
      </div>
      <div className='rounded-md border bg-white'>
        <Table>
          <TableHeader>
            <TableRow className='bg-gray-50'>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Skill</TableHead>
              <TableHead>Trainings conducted</TableHead>
              <TableHead className='w-[90px]'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {store.trainers.map((t) => (
              <TableRow key={t.id}>
                <TableCell className='font-medium'>{t.name}</TableCell>
                <TableCell>{t.company}</TableCell>
                <TableCell>{t.email}</TableCell>
                <TableCell>{t.skill}</TableCell>
                <TableCell>{t.trainingsConducted}</TableCell>
                <TableCell>
                  <div className='flex items-center gap-1.5'>
                    <EditIconButton
                      label={`Edit trainer ${t.name}`}
                      onClick={() => {
                        setEditing(t)
                        setOpen(true)
                      }}
                    />
                    <DeleteConfirmButton
                      title='external trainer'
                      description={`${t.name} (${t.company}) will be removed and can no longer be assigned to training topics.`}
                      onConfirm={() => store.removeTrainer(t.id)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {store.trainers.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className='text-paragraph-sm text-neutral-1000 py-6 text-center'
                >
                  No external trainers added yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='sm:max-w-[440px]'>
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Edit external trainer' : 'Add external trainer'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => {
                if (editing) store.updateTrainer(editing.id, values)
                else store.addTrainer(values)
                setOpen(false)
              })}
              className='space-y-3'
            >
              <TextField control={form.control} name='name' label='Trainer name' />
              <div className='grid grid-cols-2 gap-3'>
                <TextField control={form.control} name='company' label='Company' />
                <TextField control={form.control} name='email' label='Email' />
              </div>
              <TextField
                control={form.control}
                name='skill'
                label='Skill / expertise'
              />
              <TextField
                control={form.control}
                name='trainingsConducted'
                label='Trainings conducted'
                type='number'
              />
              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type='submit'>
                  {editing ? 'Save changes' : 'Add trainer'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ------------------------ Cost approvers (TCA) --------------------------- */

const costApproverSchema = z
  .object({
    costFrom: z.number().min(0, 'Cannot be negative'),
    costTo: z.number().min(1, 'Enter the upper limit'),
    locations: z.string().min(2, 'Enter the locations covered'),
    approvers: z.string().min(2, 'Enter the approvers'),
  })
  .refine((v) => v.costTo > v.costFrom, {
    message: 'Upper limit must be greater than the lower limit',
    path: ['costTo'],
  })

type CostApproverForm = z.infer<typeof costApproverSchema>

const EMPTY_COST_APPROVER: CostApproverForm = {
  costFrom: 0,
  costTo: 0,
  locations: '',
  approvers: '',
}

function CostApproversStep({ store }: { store: LearningAdminStore }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<TrainingCostApprover | null>(null)

  const form = useForm<CostApproverForm>({
    resolver: zodResolver(costApproverSchema),
    defaultValues: EMPTY_COST_APPROVER,
  })

  useEffect(() => {
    if (!open) return
    form.reset(
      editing
        ? {
            costFrom: editing.costFrom,
            costTo: editing.costTo,
            locations: editing.locations,
            approvers: editing.approvers,
          }
        : EMPTY_COST_APPROVER
    )
  }, [open, editing, form])

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex items-center justify-between'>
        <p className='text-paragraph-sm text-neutral-1000'>
          Training expenses are routed to the approvers configured for the
          matching cost range and location.
        </p>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            className='h-7 gap-1 rounded-[6px] px-2'
            onClick={store.refreshCostApprovers}
          >
            <ArrowsClockwise size={13} weight='bold' />
            Refresh
          </Button>
          <Button
            variant='red'
            onClick={() => {
              setEditing(null)
              setOpen(true)
            }}
            className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
          >
            <Plus size={10} weight='bold' />
            Add approver rule
          </Button>
        </div>
      </div>
      <div className='rounded-md border bg-white'>
        <Table>
          <TableHeader>
            <TableRow className='bg-gray-50'>
              <TableHead>Cost range</TableHead>
              <TableHead>Locations</TableHead>
              <TableHead>Approvers</TableHead>
              <TableHead className='w-[90px]'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {store.costApprovers.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell className='font-medium'>
                  {formatInr(rule.costFrom)} – {formatInr(rule.costTo)}
                </TableCell>
                <TableCell>{rule.locations}</TableCell>
                <TableCell>{rule.approvers}</TableCell>
                <TableCell>
                  <div className='flex items-center gap-1.5'>
                    <EditIconButton
                      label={`Edit cost approver rule ${rule.id}`}
                      onClick={() => {
                        setEditing(rule)
                        setOpen(true)
                      }}
                    />
                    <DeleteConfirmButton
                      title='cost approver rule'
                      description={`Approvals for ${formatInr(rule.costFrom)} – ${formatInr(rule.costTo)} (${rule.locations}) will no longer be routed to ${rule.approvers}.`}
                      onConfirm={() => store.removeCostApprover(rule.id)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {store.costApprovers.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className='text-paragraph-sm text-neutral-1000 py-6 text-center'
                >
                  No cost approver rules configured yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='sm:max-w-[440px]'>
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Edit cost approver rule' : 'Add cost approver rule'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => {
                if (editing) store.updateCostApprover(editing.id, values)
                else store.addCostApprover(values)
                setOpen(false)
              })}
              className='space-y-3'
            >
              <div className='grid grid-cols-2 gap-3'>
                <TextField
                  control={form.control}
                  name='costFrom'
                  label='Cost from (₹)'
                  type='number'
                />
                <TextField
                  control={form.control}
                  name='costTo'
                  label='Cost to (₹)'
                  type='number'
                />
              </div>
              <TextField
                control={form.control}
                name='locations'
                label='Locations (comma separated)'
              />
              <TextField
                control={form.control}
                name='approvers'
                label='Approvers (comma separated)'
              />
              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type='submit'>
                  {editing ? 'Save changes' : 'Add rule'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* -------------------------- Training topics (TT) ------------------------- */

const topicSchema = z.object({
  name: z.string().min(3, 'Enter the topic name'),
  description: z.string().min(3, 'Enter a short description'),
  mode: z.enum(TRAINING_MODES),
  durationHours: z.number().min(1, 'Duration must be at least 1 hour'),
  trainers: z.string().min(2, 'Enter the assigned trainers'),
})

type TopicForm = z.infer<typeof topicSchema>

const EMPTY_TOPIC: TopicForm = {
  name: '',
  description: '',
  mode: 'Online',
  durationHours: 8,
  trainers: '',
}

const TOPICS_PAGE_SIZE = 4

function TopicsStep({ store }: { store: LearningAdminStore }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<TrainingTopic | null>(null)
  const [page, setPage] = useState(1)

  const pageCount = Math.max(
    1,
    Math.ceil(store.topics.length / TOPICS_PAGE_SIZE)
  )
  const safePage = Math.min(page, pageCount)
  const pagedTopics = useMemo(
    () =>
      store.topics.slice(
        (safePage - 1) * TOPICS_PAGE_SIZE,
        safePage * TOPICS_PAGE_SIZE
      ),
    [store.topics, safePage]
  )

  const form = useForm<TopicForm>({
    resolver: zodResolver(topicSchema),
    defaultValues: EMPTY_TOPIC,
  })

  useEffect(() => {
    if (!open) return
    form.reset(
      editing
        ? {
            name: editing.name,
            description: editing.description,
            mode: editing.mode,
            durationHours: editing.durationHours,
            trainers: editing.trainers,
          }
        : EMPTY_TOPIC
    )
  }, [open, editing, form])

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex items-center justify-between'>
        <p className='text-paragraph-sm text-neutral-1000'>
          Catalog of subjects employees can be trained on.
        </p>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            className='h-7 gap-1 rounded-[6px] px-2'
            onClick={store.refreshTopics}
          >
            <ArrowsClockwise size={13} weight='bold' />
            Refresh
          </Button>
          <Button
            variant='red'
            onClick={() => {
              setEditing(null)
              setOpen(true)
            }}
            className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
          >
            <Plus size={10} weight='bold' />
            Add topic
          </Button>
        </div>
      </div>
      <div className='rounded-md border bg-white'>
        <Table>
          <TableHeader>
            <TableRow className='bg-gray-50'>
              <TableHead>Topic</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Trainers</TableHead>
              <TableHead className='w-[90px]'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedTopics.map((topic) => {
              const trainerNames = topic.trainers
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean)
              return (
                <TableRow key={topic.id}>
                  <TableCell className='font-medium'>{topic.name}</TableCell>
                  <TableCell className='max-w-[280px] whitespace-normal'>
                    {topic.description}
                  </TableCell>
                  <TableCell>{topic.mode}</TableCell>
                  <TableCell>{topic.durationHours} hrs</TableCell>
                  <TableCell>
                    <span className='flex items-center gap-2'>
                      <Badge variant='open'>{trainerNames.length}</Badge>
                      <span className='text-paragraph-sm text-neutral-1000'>
                        {topic.trainers}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-1.5'>
                      <EditIconButton
                        label={`Edit topic ${topic.name}`}
                        onClick={() => {
                          setEditing(topic)
                          setOpen(true)
                        }}
                      />
                      <DeleteConfirmButton
                        title='training topic'
                        description={`"${topic.name}" will be removed from the training catalog.`}
                        onConfirm={() => store.removeTopic(topic.id)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
            {store.topics.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className='text-paragraph-sm text-neutral-1000 py-6 text-center'
                >
                  No training topics configured yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <Pager page={safePage} pageCount={pageCount} onChange={setPage} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='sm:max-w-[440px]'>
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Edit training topic' : 'Add training topic'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => {
                if (editing) store.updateTopic(editing.id, values)
                else store.addTopic(values)
                setOpen(false)
              })}
              className='space-y-3'
            >
              <TextField control={form.control} name='name' label='Topic name' />
              <TextField
                control={form.control}
                name='description'
                label='Description'
              />
              <div className='grid grid-cols-2 gap-3'>
                <SelectField
                  control={form.control}
                  name='mode'
                  label='Mode'
                  options={TRAINING_MODES}
                />
                <TextField
                  control={form.control}
                  name='durationHours'
                  label='Duration (hours)'
                  type='number'
                />
              </div>
              <TextField
                control={form.control}
                name='trainers'
                label='Trainers (comma separated)'
              />
              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type='submit'>
                  {editing ? 'Save changes' : 'Add topic'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
