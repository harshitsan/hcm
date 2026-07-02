import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { Plus } from 'phosphor-react'
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
import { type LeaveType } from '../data/leave-types'
import { POSITION_LEVELS } from '../data/shared'
import { type LeaveConfigStore, type LeaveTypeDraft } from '../hooks/use-leave-config'
import { StatusBadge } from './badges'

const typeSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  category: z.enum(['paid', 'unpaid']),
  unit: z.enum(['days', 'hours']),
  allotted: z
    .string()
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, 'Enter a valid number'),
  fmla: z.boolean(),
  applicability: z.string().min(2, 'Applicability is required'),
})

type TypeValues = z.infer<typeof typeSchema>

/**
 * Paid/Unpaid Time Off catalog (LVE-02/35): tracking unit, allotted count,
 * FMLA flag, applicability and excluded position levels — plus display
 * ordering (LVE-36) and activate/deactivate.
 */
export function ConfigTypes({ config }: { config: LeaveConfigStore }) {
  const [formOpen, setFormOpen] = useState(false)
  const [organizeOpen, setOrganizeOpen] = useState(false)
  const [editing, setEditing] = useState<LeaveType | null>(null)
  const [excluded, setExcluded] = useState<string[]>([])

  const form = useForm<TypeValues>({
    resolver: zodResolver(typeSchema),
    defaultValues: {
      name: '',
      category: 'paid',
      unit: 'days',
      allotted: '0',
      fmla: false,
      applicability: 'All employees',
    },
  })

  const openForm = (t: LeaveType | null) => {
    setEditing(t)
    setExcluded(t?.excludedLevels ?? [])
    form.reset(
      t
        ? {
            name: t.name,
            category: t.category,
            unit: t.unit,
            allotted: String(t.allotted),
            fmla: t.fmla,
            applicability: t.applicability,
          }
        : {
            name: '',
            category: 'paid',
            unit: 'days',
            allotted: '0',
            fmla: false,
            applicability: 'All employees',
          }
    )
    setFormOpen(true)
  }

  const submit = (v: TypeValues) => {
    const draft: LeaveTypeDraft = {
      name: v.name,
      category: v.category,
      unit: v.unit,
      allotted: Number(v.allotted),
      fmla: v.fmla,
      applicability: v.applicability,
      excludedLevels: excluded,
    }
    if (editing) config.updateLeaveType(editing.id, draft)
    else config.addLeaveType(draft)
    setFormOpen(false)
  }

  return (
    <div className='w-full'>
      <div className='mb-3 flex items-center justify-between'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          Time Off Types ({config.leaveTypes.length})
        </h2>
        <div className='flex items-center gap-2'>
          <Button variant='outline' className='h-7' onClick={() => setOrganizeOpen(true)}>
            Organize Leave Type
          </Button>
          <Button
            variant='red'
            onClick={() => openForm(null)}
            className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
          >
            <Plus size={10} weight='bold' />
            New Type
          </Button>
        </div>
      </div>

      <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='text-neutral-1000 border-b text-left text-xs'>
              <th className='py-2 pr-3 font-medium'>#</th>
              <th className='pr-3 font-medium'>Leave type</th>
              <th className='px-2 font-medium'>Paid / Unpaid</th>
              <th className='px-2 font-medium'>Allotted</th>
              <th className='px-2 font-medium'>Unit</th>
              <th className='px-2 font-medium'>FMLA</th>
              <th className='px-2 font-medium'>Applicability</th>
              <th className='px-2 font-medium'>Excluded levels</th>
              <th className='px-2 font-medium'>Active</th>
              <th className='px-2 text-right font-medium'>Edit</th>
            </tr>
          </thead>
          <tbody>
            {config.orderedTypes.map((t) => (
              <tr key={t.id} className='border-b last:border-0'>
                <td className='text-neutral-1000 py-2 pr-3'>{t.order}</td>
                <td className='pr-3 font-medium'>{t.name}</td>
                <td className='px-2'>
                  <StatusBadge status={t.category} />
                </td>
                <td className='px-2'>{t.allotted || '—'}</td>
                <td className='px-2'>{t.unit}</td>
                <td className='px-2'>{t.fmla ? <Badge variant='open'>FMLA</Badge> : '—'}</td>
                <td className='text-neutral-1000 max-w-[180px] truncate px-2'>{t.applicability}</td>
                <td className='text-neutral-1000 px-2 text-xs'>
                  {t.excludedLevels.length ? t.excludedLevels.join(', ') : '—'}
                </td>
                <td className='px-2'>
                  <Switch
                    checked={t.active}
                    onCheckedChange={() => config.toggleLeaveType(t.id)}
                  />
                </td>
                <td className='px-2 text-right'>
                  <Button variant='outline' className='h-6 px-2 text-xs' onClick={() => openForm(t)}>
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* LVE-36: Organize display order */}
      <Dialog open={organizeOpen} onOpenChange={setOrganizeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Organize Leave Type</DialogTitle>
            <DialogDescription>
              The saved order is the sequence employees see in the apply
              dropdown.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-1'>
            {config.orderedTypes.map((t, i) => (
              <div
                key={t.id}
                className='flex items-center justify-between rounded-[6px] border border-gray-200 px-3 py-1.5 text-sm'
              >
                <span>
                  {t.order}. {t.name}
                </span>
                <span className='flex gap-1'>
                  <Button
                    variant='icon2'
                    className='h-6 w-6'
                    disabled={i === 0}
                    onClick={() => config.moveLeaveType(t.id, -1)}
                    aria-label='Move up'
                  >
                    <ArrowUp className='size-3.5' />
                  </Button>
                  <Button
                    variant='icon2'
                    className='h-6 w-6'
                    disabled={i === config.orderedTypes.length - 1}
                    onClick={() => config.moveLeaveType(t.id, 1)}
                    aria-label='Move down'
                  >
                    <ArrowDown className='size-3.5' />
                  </Button>
                </span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setOrganizeOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Type add/edit form */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit leave type' : 'New leave type'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(submit)} className='space-y-3'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='grid grid-cols-3 gap-3'>
                <FormField
                  control={form.control}
                  name='category'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger variant='secondary' className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='paid'>Paid</SelectItem>
                          <SelectItem value='unpaid'>Unpaid</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='unit'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tracking unit</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger variant='secondary' className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='days'>Days</SelectItem>
                          <SelectItem value='hours'>Hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='allotted'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>No. of time-offs</FormLabel>
                      <FormControl>
                        <Input type='number' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name='applicability'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Applicability</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g. All employees / US employees' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='fmla'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center gap-2'>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(v) => field.onChange(!!v)}
                        variant='blue'
                      />
                    </FormControl>
                    <FormLabel className='mb-0'>
                      FMLA time-off type (routes via FMLA approvers)
                    </FormLabel>
                  </FormItem>
                )}
              />
              <div>
                <FormLabel className='mb-1 block'>Excluded position levels</FormLabel>
                <div className='grid grid-cols-2 gap-1'>
                  {POSITION_LEVELS.map((lvl) => (
                    <label key={lvl} className='flex items-center gap-2 text-sm'>
                      <Checkbox
                        checked={excluded.includes(lvl)}
                        onCheckedChange={(v) =>
                          setExcluded((prev) =>
                            v ? [...prev, lvl] : prev.filter((x) => x !== lvl)
                          )
                        }
                        variant='blue'
                      />
                      {lvl}
                    </label>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button type='button' variant='outline' onClick={() => setFormOpen(false)}>
                  Cancel
                </Button>
                <Button type='submit'>{editing ? 'Save changes' : 'Add type'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
