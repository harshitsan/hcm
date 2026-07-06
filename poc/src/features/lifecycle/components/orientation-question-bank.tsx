import { useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Eye, PencilSimple, Plus } from 'phosphor-react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { DataTable } from '@/components/common/data-table/table'
import {
  ORIENTATION_TOPICS,
  type OrientationQuestion,
} from '../data/orientation'
import { LOCATIONS } from '../data/shared'
import { type OrientationStore } from '../hooks/use-orientation'
import { SortHeader } from './columns-shared'
import { CheckboxGroup, ChipList } from './config-widgets'
import { PagerBar, RefreshButton, usePager } from './orientation-widgets'

const questionSchema = z
  .object({
    question: z.string().min(10, 'Write the full question (min 10 chars)'),
    option1: z.string().min(1, 'Required'),
    option2: z.string().min(1, 'Required'),
    option3: z.string().min(1, 'Required'),
    option4: z.string().min(1, 'Required'),
    answer: z.string().min(1, 'Mark the correct answer'),
    topic: z.string().min(1),
    locations: z.array(z.string()).min(1, 'Pick at least one location'),
  })
  .refine(
    (v) => [v.option1, v.option2, v.option3, v.option4].includes(v.answer),
    { message: 'The answer must be one of the options', path: ['answer'] }
  )

type QuestionValues = z.infer<typeof questionSchema>

const emptyQuestion: QuestionValues = {
  question: '',
  option1: '',
  option2: '',
  option3: '',
  option4: '',
  answer: '',
  topic: 'Company Overview',
  locations: [],
}

const OPTION_FIELDS = ['option1', 'option2', 'option3', 'option4'] as const

/**
 * Question Bank: MCQ authoring with correct-answer marking, topic/location
 * association, questionnaire preview, paging and refresh.
 */
export function QuestionBankStep({ store }: { store: OrientationStore }) {
  const [open, setOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const pager = usePager(store.questions, 5)

  const form = useForm<QuestionValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: emptyQuestion,
  })
  const optionValues = form.watch(['option1', 'option2', 'option3', 'option4'])
  const filledOptions = optionValues.filter((o) => o.trim().length > 0)

  const startAdd = () => {
    setEditingId(null)
    form.reset(emptyQuestion)
    setOpen(true)
  }

  const startEdit = (q: OrientationQuestion) => {
    setEditingId(q.id)
    form.reset({
      question: q.question,
      option1: q.options[0] ?? '',
      option2: q.options[1] ?? '',
      option3: q.options[2] ?? '',
      option4: q.options[3] ?? '',
      answer: q.answer,
      topic: q.topic,
      locations: q.locations,
    })
    setOpen(true)
  }

  const columns: ColumnDef<OrientationQuestion>[] = [
    {
      accessorKey: 'question',
      header: ({ column }) => <SortHeader column={column} label='Question' />,
      cell: ({ row }) => (
        <span className='text-neutral-1600 max-w-[320px] text-sm font-medium'>
          {row.original.question}
        </span>
      ),
    },
    {
      accessorKey: 'locations',
      header: () => <span className='text-paragraph-sm font-medium'>Locations</span>,
      cell: ({ row }) => <ChipList items={row.original.locations} />,
    },
    {
      accessorKey: 'options',
      header: () => <span className='text-paragraph-sm font-medium'>Options</span>,
      cell: ({ row }) => (
        <span className='text-neutral-1000 text-xs'>
          {row.original.options.join(' · ')}
        </span>
      ),
    },
    {
      accessorKey: 'answer',
      header: ({ column }) => <SortHeader column={column} label='Answer' />,
      cell: ({ row }) => (
        <Badge variant='completed'>{row.original.answer}</Badge>
      ),
    },
    {
      accessorKey: 'topic',
      header: ({ column }) => <SortHeader column={column} label='Topic' />,
      cell: ({ row }) => <Badge variant='outline'>{row.original.topic}</Badge>,
    },
    {
      id: 'edit',
      header: () => <span className='text-paragraph-sm font-medium'>Edit</span>,
      cell: ({ row }) => (
        <Button
          variant='outline'
          size='sm'
          className='h-6 gap-1 px-1.5'
          onClick={(e) => {
            e.stopPropagation()
            startEdit(row.original)
          }}
        >
          <PencilSimple size={12} />
          Edit
        </Button>
      ),
    },
  ]

  return (
    <div className='w-full'>
      <div className='mb-3 flex items-center justify-between'>
        <div>
          <h3 className='text-neutral-1600 text-sm font-semibold'>
            Question Bank ({store.questions.length})
          </h3>
          <p className='text-neutral-1000 mt-0.5 text-xs'>
            Evaluation questions asked after orientation, scoped by topic and
            location.
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <RefreshButton
            onRefresh={() => store.refresh('questions', 'Question bank')}
            refreshedAt={store.refreshedAt.questions}
          />
          <Button
            variant='outline'
            size='sm'
            className='h-7 gap-1'
            onClick={() => setPreviewOpen(true)}
          >
            <Eye size={12} />
            Preview Questionnaire
          </Button>
          <Button size='sm' className='h-7 gap-1' onClick={startAdd}>
            <Plus size={12} weight='bold' />
            Add Question
          </Button>
        </div>
      </div>

      <DataTable columns={columns} data={pager.slice} variant='no-status' />
      <PagerBar pager={pager} label='questions' />

      {/* Add / edit */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-h-[85vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit question' : 'Add question'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              className='space-y-3'
              onSubmit={form.handleSubmit((values) => {
                store.saveQuestion(
                  {
                    question: values.question,
                    options: [
                      values.option1,
                      values.option2,
                      values.option3,
                      values.option4,
                    ],
                    answer: values.answer,
                    topic: values.topic,
                    locations: values.locations,
                  },
                  editingId ?? undefined
                )
                setOpen(false)
              })}
            >
              <FormField
                control={form.control}
                name='question'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='What should new hires know?'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='grid grid-cols-2 gap-3'>
                {OPTION_FIELDS.map((name, i) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Option {i + 1}</FormLabel>
                        <FormControl>
                          <Input placeholder={`Answer choice ${i + 1}`} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <FormField
                control={form.control}
                name='answer'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correct answer</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={filledOptions.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue
                            placeholder={
                              filledOptions.length === 0
                                ? 'Fill the options first'
                                : 'Mark the correct option'
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filledOptions.map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
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
                name='topic'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Topic</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ORIENTATION_TOPICS.map((t) => (
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
              <FormField
                control={form.control}
                name='locations'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Locations</FormLabel>
                    <CheckboxGroup
                      options={LOCATIONS}
                      value={field.value}
                      onChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type='button' variant='outline' onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type='submit'>
                  {editingId ? 'Save changes' : 'Add question'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Preview as a new hire would see it */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className='max-h-[85vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Questionnaire preview</DialogTitle>
          </DialogHeader>
          <p className='text-neutral-1000 text-xs'>
            This is how the evaluation appears to new hires. Correct answers
            are highlighted for your review only.
          </p>
          <div className='space-y-4'>
            {store.questions.map((q, i) => (
              <div
                key={q.id}
                className='rounded-[6px] border border-gray-200 bg-neutral-100 p-3'
              >
                <div className='mb-2 flex items-start justify-between gap-2'>
                  <p className='text-neutral-1600 text-sm font-medium'>
                    Q{i + 1}. {q.question}
                  </p>
                  <Badge variant='outline' className='shrink-0'>
                    {q.topic}
                  </Badge>
                </div>
                <RadioGroup value={q.answer} className='gap-1.5'>
                  {q.options.map((o) => (
                    <label key={o} className='flex items-center gap-2 text-sm'>
                      <RadioGroupItem value={o} disabled />
                      <span
                        className={
                          o === q.answer
                            ? 'text-green-700 font-medium'
                            : 'text-neutral-1000'
                        }
                      >
                        {o}
                        {o === q.answer ? ' ✓' : ''}
                      </span>
                    </label>
                  ))}
                </RadioGroup>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setPreviewOpen(false)}>
              Close preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
