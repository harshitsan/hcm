import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type CustodianMapping, type DocumentType } from '../data/masters'
import {
  CUSTODIAN_POSITIONS,
  DEPARTMENTS,
  EMPLOYEE_CLASSES,
  LOCATIONS,
} from '../data/org'
import { type CustodianDraft } from '../hooks/use-masters'

const custodianFormSchema = z.object({
  documentTypeName: z.string().min(1, 'Select a document type'),
  custodianPosition: z.string().min(1, 'Select a custodian position'),
  location: z.string().min(1),
  department: z.string().min(1),
  position: z.string().min(1),
  employeeClass: z.string().min(1),
  company: z.string().min(1, 'Select a company'),
})

type CustodianFormValues = z.infer<typeof custodianFormSchema>

interface CustodianDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: CustodianMapping | null
  documentTypes: DocumentType[]
  companies: string[]
  onSubmit: (draft: CustodianDraft) => void
}

/**
 * Create/edit a custodian mapping (DOC-28) with applicability scoped by
 * Location, Department, Position, and Employee class (DOC-29).
 */
export function CustodianDialog({
  open,
  onOpenChange,
  editing,
  documentTypes,
  companies,
  onSubmit,
}: CustodianDialogProps) {
  const form = useForm<CustodianFormValues>({
    resolver: zodResolver(custodianFormSchema),
    defaultValues: {
      documentTypeName: '',
      custodianPosition: '',
      location: 'All',
      department: 'All',
      position: 'All',
      employeeClass: 'All',
      company: companies[0] ?? '',
    },
  })

  useEffect(() => {
    if (!open) return
    form.reset(
      editing ?? {
        documentTypeName: '',
        custodianPosition: '',
        location: 'All',
        department: 'All',
        position: 'All',
        employeeClass: 'All',
        company: companies[0] ?? '',
      }
    )
  }, [open, editing, form, companies])

  function handleSubmit(values: CustodianFormValues) {
    onSubmit(values)
    onOpenChange(false)
  }

  const scopeSelect = (
    name: 'location' | 'department' | 'position' | 'employeeClass',
    label: string,
    options: readonly string[]
  ) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger variant='secondary' className='w-full'>
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value='All'>All</SelectItem>
              {options.map((o) => (
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
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[460px]'>
        <DialogHeader>
          <DialogTitle>
            {editing ? 'Edit custodian mapping' : 'New custodian mapping'}
          </DialogTitle>
          <DialogDescription>
            The mapping matching an employee&#39;s org context governs who is
            accountable for the document type.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='documentTypeName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger variant='secondary' className='w-full'>
                        <SelectValue placeholder='Select type' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {documentTypes.map((t) => (
                        <SelectItem key={t.id} value={t.name}>
                          {t.name}
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
              name='custodianPosition'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custodian position</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger variant='secondary' className='w-full'>
                        <SelectValue placeholder='Select position' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CUSTODIAN_POSITIONS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='grid grid-cols-2 gap-3'>
              {scopeSelect('location', 'Location', LOCATIONS)}
              {scopeSelect('department', 'Department', DEPARTMENTS)}
              {scopeSelect('position', 'Position', CUSTODIAN_POSITIONS)}
              {scopeSelect('employeeClass', 'Employee class', EMPLOYEE_CLASSES)}
            </div>
            <FormField
              control={form.control}
              name='company'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger variant='secondary' className='w-full'>
                        <SelectValue placeholder='Select company' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {companies.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>
                {editing ? 'Save changes' : 'Assign custodian'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
