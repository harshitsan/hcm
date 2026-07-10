import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowsClockwise, MagnifyingGlass, Plus } from 'phosphor-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FINANCIAL_YEARS } from '../data/tax'
import {
  type DeductionMaster,
  type TaxCategory,
} from '../data/tax-admin'
import { useTaxAdmin, type TaxAdminStore } from '../hooks/use-tax-admin'
import { SelectField, TextField } from './form-fields'
import { DeleteConfirmButton, EditIconButton, Pager } from './shared'
import { formatInr } from './utils'

/**
 * Tax-planning (Finance) configuration surface: deduction categories with
 * per-FY ceilings (CAT-01..06) and the deduction masters employees declare
 * against (DED-01..03).
 */
export function TaxAdminTab() {
  const store = useTaxAdmin()
  return (
    <Tabs defaultValue='categories' className='w-full'>
      <TabsList className='mb-3 bg-transparent p-0'>
        <TabsTrigger variant='ghost' value='categories'>
          Categories
        </TabsTrigger>
        <TabsTrigger variant='ghost' value='deductions'>
          Deductions
        </TabsTrigger>
      </TabsList>
      <TabsContent value='categories'>
        <CategoriesSection store={store} />
      </TabsContent>
      <TabsContent value='deductions'>
        <DeductionsSection store={store} />
      </TabsContent>
    </Tabs>
  )
}

/* --------------------------- Categories (CAT) ---------------------------- */

const categorySchema = z.object({
  financialYear: z.enum(FINANCIAL_YEARS),
  name: z.string().min(3, 'Enter the category name'),
  maxLimit: z.number().min(0, 'Cannot be negative'),
})

type CategoryForm = z.infer<typeof categorySchema>

const CATEGORIES_PAGE_SIZE = 4

function CategoriesSection({ store }: { store: TaxAdminStore }) {
  const [fyFilter, setFyFilter] = useState<string>('All')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<TaxCategory | null>(null)

  const filtered = useMemo(
    () =>
      store.categories.filter(
        (c) => fyFilter === 'All' || c.financialYear === fyFilter
      ),
    [store.categories, fyFilter]
  )
  const pageCount = Math.max(
    1,
    Math.ceil(filtered.length / CATEGORIES_PAGE_SIZE)
  )
  const safePage = Math.min(page, pageCount)
  const paged = filtered.slice(
    (safePage - 1) * CATEGORIES_PAGE_SIZE,
    safePage * CATEGORIES_PAGE_SIZE
  )

  const form = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: { financialYear: FINANCIAL_YEARS[0], name: '', maxLimit: 0 },
  })

  useEffect(() => {
    if (!open) return
    form.reset(
      editing
        ? {
            financialYear: editing.financialYear,
            name: editing.name,
            maxLimit: editing.maxLimit,
          }
        : { financialYear: FINANCIAL_YEARS[0], name: '', maxLimit: 0 }
    )
  }, [open, editing, form])

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='flex items-center gap-2'>
          <span className='text-paragraph-sm text-neutral-1000'>
            Financial year
          </span>
          <Select
            value={fyFilter}
            onValueChange={(fy) => {
              setFyFilter(fy)
              setPage(1)
            }}
          >
            <SelectTrigger className='h-8 w-[140px] bg-white'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='All'>All years</SelectItem>
              {FINANCIAL_YEARS.map((fy) => (
                <SelectItem key={fy} value={fy}>
                  {fy}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            className='h-7 gap-1 rounded-[6px] px-2'
            onClick={store.refreshCategories}
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
            Add category
          </Button>
        </div>
      </div>
      <div className='rounded-md border bg-white'>
        <Table>
          <TableHeader>
            <TableRow className='bg-gray-50'>
              <TableHead>Category</TableHead>
              <TableHead>Financial year</TableHead>
              <TableHead>Maximum allowable limit</TableHead>
              <TableHead className='w-[90px]'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((category) => (
              <TableRow key={category.id}>
                <TableCell className='font-medium'>{category.name}</TableCell>
                <TableCell>{category.financialYear}</TableCell>
                <TableCell>
                  {category.maxLimit === 0
                    ? 'No ceiling'
                    : formatInr(category.maxLimit)}
                </TableCell>
                <TableCell>
                  <div className='flex items-center gap-1.5'>
                    <EditIconButton
                      label={`Edit category ${category.name}`}
                      onClick={() => {
                        setEditing(category)
                        setOpen(true)
                      }}
                    />
                    <DeleteConfirmButton
                      title='category'
                      description={`"${category.name}" (FY ${category.financialYear}) will no longer be available for investment declarations.`}
                      onConfirm={() => store.removeCategory(category.id)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className='text-paragraph-sm text-neutral-1000 py-6 text-center'
                >
                  No categories for the selected financial year.
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
              {editing ? 'Edit deduction category' : 'Add deduction category'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => {
                if (editing) store.updateCategory(editing.id, values)
                else store.addCategory(values)
                setOpen(false)
              })}
              className='space-y-3'
            >
              <TextField
                control={form.control}
                name='name'
                label='Category name'
              />
              <div className='grid grid-cols-2 gap-3'>
                <SelectField
                  control={form.control}
                  name='financialYear'
                  label='Financial year'
                  options={FINANCIAL_YEARS}
                />
                <TextField
                  control={form.control}
                  name='maxLimit'
                  label='Maximum limit (₹, 0 = no ceiling)'
                  type='number'
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
                  {editing ? 'Save changes' : 'Add category'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* --------------------------- Deductions (DED) ---------------------------- */

const deductionSchema = z.object({
  name: z.string().min(3, 'Enter the deduction name'),
  category: z.string().min(2, 'Pick a category'),
  maxLimit: z.number().min(0, 'Cannot be negative'),
  remarks: z.string(),
})

type DeductionForm = z.infer<typeof deductionSchema>

function DeductionsSection({ store }: { store: TaxAdminStore }) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<DeductionMaster | null>(null)

  const categoryNames = useMemo(() => {
    const names = new Set(store.categories.map((c) => c.name))
    return [...names]
  }, [store.categories])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return store.deductions
    return store.deductions.filter(
      (d) =>
        d.name.toLowerCase().includes(term) ||
        d.category.toLowerCase().includes(term) ||
        d.remarks.toLowerCase().includes(term)
    )
  }, [store.deductions, search])

  const form = useForm<DeductionForm>({
    resolver: zodResolver(deductionSchema),
    defaultValues: {
      name: '',
      category: categoryNames[0] ?? '',
      maxLimit: 0,
      remarks: '',
    },
  })

  useEffect(() => {
    if (!open) return
    form.reset(
      editing
        ? {
            name: editing.name,
            category: editing.category,
            maxLimit: editing.maxLimit,
            remarks: editing.remarks,
          }
        : {
            name: '',
            category: categoryNames[0] ?? '',
            maxLimit: 0,
            remarks: '',
          }
    )
  }, [open, editing, categoryNames, form])

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='relative'>
          <MagnifyingGlass
            size={14}
            className='text-neutral-1000 absolute top-1/2 left-2.5 -translate-y-1/2'
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Search deductions…'
            aria-label='Search deductions'
            className='h-8 w-[260px] bg-white pl-8'
          />
        </div>
        <Button
          variant='red'
          onClick={() => {
            setEditing(null)
            setOpen(true)
          }}
          className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
        >
          <Plus size={10} weight='bold' />
          Add deduction
        </Button>
      </div>
      <div className='rounded-md border bg-white'>
        <Table>
          <TableHeader>
            <TableRow className='bg-gray-50'>
              <TableHead>Deduction</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Maximum limit</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead className='w-[90px]'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((deduction) => (
              <TableRow key={deduction.id}>
                <TableCell className='font-medium'>{deduction.name}</TableCell>
                <TableCell>{deduction.category}</TableCell>
                <TableCell>
                  {deduction.maxLimit === 0
                    ? 'No ceiling'
                    : formatInr(deduction.maxLimit)}
                </TableCell>
                <TableCell className='max-w-[260px] whitespace-normal'>
                  {deduction.remarks}
                </TableCell>
                <TableCell>
                  <div className='flex items-center gap-1.5'>
                    <EditIconButton
                      label={`Edit deduction ${deduction.name}`}
                      onClick={() => {
                        setEditing(deduction)
                        setOpen(true)
                      }}
                    />
                    <DeleteConfirmButton
                      title='deduction'
                      description={`"${deduction.name}" will no longer be available for employee investment declarations.`}
                      onConfirm={() => store.removeDeduction(deduction.id)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className='text-paragraph-sm text-neutral-1000 py-6 text-center'
                >
                  No deductions match “{search}”.
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
              {editing ? 'Edit deduction' : 'Add deduction'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => {
                if (editing) store.updateDeduction(editing.id, values)
                else store.addDeduction(values)
                setOpen(false)
              })}
              className='space-y-3'
            >
              <TextField
                control={form.control}
                name='name'
                label='Deduction name'
              />
              <SelectField
                control={form.control}
                name='category'
                label='Category'
                options={categoryNames}
              />
              <TextField
                control={form.control}
                name='maxLimit'
                label='Maximum limit (₹, 0 = no ceiling)'
                type='number'
              />
              <TextField
                control={form.control}
                name='remarks'
                label='Remarks'
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
                  {editing ? 'Save changes' : 'Add deduction'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
