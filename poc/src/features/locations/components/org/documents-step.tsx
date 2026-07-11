import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PencilSimple, Plus, Trash } from 'phosphor-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { DOCUMENT_TYPES, type OrgDocument } from '../../data/organization'
import type { OrganizationStore } from '../../hooks/use-organization'
import { formatDate, todayISO } from '../../utils/format'
import { DocumentStatusBadge } from '../location-badges'
import type { StepNavProps } from '../organization-tab'

const documentSchema = z
  .object({
    type: z.enum(DOCUMENT_TYPES),
    number: z.string().min(3, 'Document number is required'),
    effectiveFrom: z.string().min(10, 'Effective-from date is required'),
    effectiveTill: z.string().min(10, 'Effective-till date is required'),
  })
  .refine((v) => v.effectiveTill > v.effectiveFrom, {
    message: 'Effective-till must be after effective-from',
    path: ['effectiveTill'],
  })

type DocumentValues = z.infer<typeof documentSchema>

const emptyDoc: DocumentValues = {
  type: 'PAN',
  number: '',
  effectiveFrom: '',
  effectiveTill: '',
}

interface DocumentsStepProps extends StepNavProps {
  org: OrganizationStore
}

/** Compliance documents with effective dating + expiry (LOC-24). */
export function DocumentsStep({ org, onNext, onBack, isLast }: DocumentsStepProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<OrgDocument | null>(null)
  const today = todayISO()
  const dateFormat = org.localization.dateFormat

  const form = useForm<DocumentValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: emptyDoc,
  })

  useEffect(() => {
    if (!dialogOpen) return
    form.reset(
      editing
        ? {
            type: editing.type,
            number: editing.number,
            effectiveFrom: editing.effectiveFrom,
            effectiveTill: editing.effectiveTill,
          }
        : emptyDoc
    )
  }, [dialogOpen, editing, form])

  function handleSubmit(values: DocumentValues) {
    if (editing) {
      org.updateDocument(editing.id, values)
    } else {
      org.addDocument(values)
    }
    setDialogOpen(false)
    setEditing(null)
  }

  return (
    <Card className='gap-2 border-none bg-white py-3'>
      <CardHeader className='flex items-center justify-between px-4'>
        <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
          Organization documents ({org.documents.length})
        </CardTitle>
        <Button
          variant='red'
          onClick={() => {
            setEditing(null)
            setDialogOpen(true)
          }}
          className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
        >
          <Plus size={10} weight='bold' />
          Add New Document
        </Button>
      </CardHeader>
      <CardContent className='px-4'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document type</TableHead>
              <TableHead>Number</TableHead>
              <TableHead>Effective from</TableHead>
              <TableHead>Effective till</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {org.documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className='text-neutral-1600 font-medium'>
                  {doc.type}
                </TableCell>
                <TableCell className='font-mono text-xs'>{doc.number}</TableCell>
                <TableCell className='text-sm'>
                  {formatDate(doc.effectiveFrom, dateFormat)}
                </TableCell>
                <TableCell className='text-sm'>
                  {formatDate(doc.effectiveTill, dateFormat)}
                </TableCell>
                <TableCell>
                  <DocumentStatusBadge effectiveTill={doc.effectiveTill} today={today} />
                </TableCell>
                <TableCell>
                  <div className='flex items-center justify-end gap-2'>
                    <Button
                      variant='icon2'
                      className='text-neutral-1900 h-7 w-7'
                      aria-label='Edit document'
                      onClick={() => {
                        setEditing(doc)
                        setDialogOpen(true)
                      }}
                    >
                      <PencilSimple size={16} weight='fill' />
                    </Button>
                    <Button
                      variant='icon2'
                      className='text-red-1400 h-7 w-7'
                      aria-label='Delete document'
                      onClick={() => org.deleteDocument(doc.id)}
                    >
                      <Trash size={16} weight='bold' />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className='flex justify-end gap-3 pt-4'>
          <Button type='button' variant='outline' onClick={onBack}>
            Back
          </Button>
          <Button type='button' onClick={onNext}>
            {isLast ? 'Finish Setup' : 'Save & Next'}
          </Button>
        </div>
      </CardContent>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditing(null)
        }}
      >
        <DialogContent className='sm:max-w-[420px]'>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit document' : 'Add new document'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-4'>
              <FormField
                control={form.control}
                name='type'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DOCUMENT_TYPES.map((t) => (
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
                name='number'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document number</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g. AAECO4821F' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='grid grid-cols-2 gap-3'>
                <FormField
                  control={form.control}
                  name='effectiveFrom'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Effective from</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='effectiveTill'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Effective till</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type='submit'>{editing ? 'Save changes' : 'Add document'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
