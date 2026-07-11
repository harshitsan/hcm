import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PencilSimple, Plus } from 'phosphor-react'
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
import { Switch } from '@/components/ui/switch'
import type { PayGrade } from '../../data/org-config'
import type { OrgConfigStore } from '../../hooks/use-org-config'

const payGradeSchema = z
  .object({
    name: z.string().min(2, 'Grade name is required'),
    level: z.coerce.number<number>().int().min(1, 'Level must be 1 or higher'),
    minimum: z.coerce.number<number>().positive('Minimum must be positive'),
    midpoint: z.coerce.number<number>().positive('Midpoint must be positive'),
    maximum: z.coerce.number<number>().positive('Maximum must be positive'),
  })
  .refine((v) => v.minimum <= v.midpoint && v.midpoint <= v.maximum, {
    message: 'Band must satisfy minimum ≤ midpoint ≤ maximum',
    path: ['midpoint'],
  })

type PayGradeFormValues = z.infer<typeof payGradeSchema>

interface PayGradesPanelProps {
  companyId: string
  orgConfig: OrgConfigStore
}

/**
 * Position Level PayGrade configuration (POS-20/36/37): the "Do you support
 * position level paygrade?" toggle plus salary bands (min/mid/max) mapped to
 * position levels. When off, no band mapping or offer validation applies.
 */
export function PayGradesPanel({ companyId, orgConfig }: PayGradesPanelProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PayGrade | null>(null)

  const grades = orgConfig.payGrades
    .filter((g) => g.companyId === companyId)
    .sort((a, b) => a.level - b.level)

  const form = useForm<PayGradeFormValues>({
    resolver: zodResolver(payGradeSchema),
    defaultValues: { name: '', level: 1, minimum: 0, midpoint: 0, maximum: 0 },
  })

  const openDialog = (grade: PayGrade | null) => {
    setEditing(grade)
    form.reset(
      grade
        ? {
            name: grade.name,
            level: grade.level,
            minimum: grade.minimum,
            midpoint: grade.midpoint,
            maximum: grade.maximum,
          }
        : { name: '', level: 1, minimum: 0, midpoint: 0, maximum: 0 }
    )
    setDialogOpen(true)
  }

  const handleSubmit = (values: PayGradeFormValues) => {
    const draft = { ...values, companyId }
    if (editing) {
      orgConfig.updatePayGrade(editing.id, draft)
    } else {
      orgConfig.addPayGrade(draft)
    }
    setDialogOpen(false)
    setEditing(null)
  }

  return (
    <div className='space-y-4'>
      <div className='border-gray-200 flex items-center justify-between rounded-[6px] border px-3 py-2'>
        <div>
          <p className='text-neutral-1600 text-sm font-medium'>
            Do you support position level paygrade?
          </p>
          <p className='text-paragraph-sm text-neutral-1000'>
            {orgConfig.payGradeEnabled
              ? 'Yes — levels map to salary bands and offers are validated against them.'
              : 'No — positions carry no pay-grade mapping and offers skip band validation.'}
          </p>
        </div>
        <Switch
          checked={orgConfig.payGradeEnabled}
          onCheckedChange={orgConfig.setPayGradeEnabled}
          aria-label='Toggle position level paygrade'
        />
      </div>

      {orgConfig.payGradeEnabled && (
        <>
          <div className='flex items-center justify-between'>
            <h3 className='text-neutral-1600 text-paragraph-sm font-semibold'>
              Salary bands by position level ({grades.length})
            </h3>
            <Button className='h-7' onClick={() => openDialog(null)}>
              <Plus size={12} weight='bold' />
              New pay grade
            </Button>
          </div>
          <div className='divide-grey-200 border-gray-200 divide-y rounded-[6px] border'>
            {grades.map((g) => (
              <div key={g.id} className='flex items-center justify-between px-3 py-2'>
                <div className='flex min-w-0 flex-col'>
                  <span className='text-neutral-1600 text-sm font-medium'>
                    {g.name} → Level {g.level}
                  </span>
                  <span className='text-paragraph-sm text-neutral-1000'>
                    ${g.minimum.toLocaleString()} min · $
                    {g.midpoint.toLocaleString()} mid · $
                    {g.maximum.toLocaleString()} max
                  </span>
                </div>
                <Button
                  variant='icon2'
                  className='text-neutral-1900 h-7 w-7'
                  aria-label={`Edit ${g.name}`}
                  onClick={() => openDialog(g)}
                >
                  <PencilSimple size={14} weight='fill' />
                </Button>
              </div>
            ))}
          </div>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='sm:max-w-[420px]'>
          <DialogHeader>
            <DialogTitle>
              {editing ? `Edit ${editing.name}` : 'New pay grade band'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-3'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade name</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g. Grade D (Level 4)' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='level'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mapped position level</FormLabel>
                    <FormControl>
                      <Input type='number' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='grid grid-cols-3 gap-2'>
                {(['minimum', 'midpoint', 'maximum'] as const).map((key) => (
                  <FormField
                    key={key}
                    control={form.control}
                    name={key}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='capitalize'>{key}</FormLabel>
                        <FormControl>
                          <Input type='number' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type='submit'>
                  {editing ? 'Save band' : 'Create band'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
