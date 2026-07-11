import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowsClockwise, PencilSimple, Plus } from 'phosphor-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
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
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { type DocumentType } from '../data/masters'
import { MODULES, type ModuleName } from '../data/org'
import { type MastersStore } from '../hooks/use-masters'

const typeFormSchema = z.object({
  name: z.string().min(2, 'Type name is required'),
  description: z.string(),
  modules: z.array(z.string()).min(1, 'Select at least one applicable module'),
})

type TypeFormValues = z.infer<typeof typeFormSchema>

interface TypesTabProps {
  masters: MastersStore
}

/**
 * Kensium Document Types master (DOC-23/24/25): tenant-scoped list showing
 * Type, Description, and Applicable modules with add/edit, a Refresh action,
 * and a "Displaying items" count. Uploads offer only the types applicable to
 * the entity's module.
 */
export function TypesTab({ masters }: TypesTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<DocumentType | null>(null)

  const form = useForm<TypeFormValues>({
    resolver: zodResolver(typeFormSchema),
    defaultValues: { name: '', description: '', modules: [] },
  })

  useEffect(() => {
    if (!dialogOpen) return
    form.reset(
      editing
        ? {
            name: editing.name,
            description: editing.description,
            modules: editing.modules,
          }
        : { name: '', description: '', modules: [] }
    )
  }, [dialogOpen, editing, form])

  function handleSubmit(values: TypeFormValues) {
    const draft = {
      name: values.name,
      description: values.description,
      modules: values.modules as ModuleName[],
    }
    if (editing) masters.updateDocumentType(editing.id, draft)
    else masters.addDocumentType(draft)
    setDialogOpen(false)
    setEditing(null)
  }

  const total = masters.documentTypes.length

  return (
    <div className='w-full'>
      <div className='mb-3 flex items-center justify-between'>
        <div>
          <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
            Document types
          </h2>
          <p className='text-paragraph-sm text-neutral-1000'>
            Tenant-scoped master — uploads only offer types applicable to the
            entity&#39;s module.
          </p>
        </div>
        <div className='flex items-center gap-3'>
          <Button
            variant='icon2'
            className='text-neutral-1900 h-7 w-7'
            aria-label='Refresh'
            onClick={() =>
              toast.success('Document types list refreshed — showing the latest entries')
            }
          >
            <ArrowsClockwise size={16} weight='bold' />
          </Button>
          <Button
            variant='red'
            onClick={() => {
              setEditing(null)
              setDialogOpen(true)
            }}
            className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
          >
            <Plus size={10} weight='bold' />
            New Document Type
          </Button>
        </div>
      </div>

      <div className='rounded-md border bg-white'>
        <Table>
          <TableHeader>
            <TableRow className='bg-gray-50'>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Applicable modules</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {masters.documentTypes.map((type) => (
              <TableRow key={type.id}>
                <TableCell className='text-sm font-medium'>
                  {type.name}
                </TableCell>
                <TableCell className='text-neutral-1000 text-sm'>
                  {type.description || '-'}
                </TableCell>
                <TableCell>
                  <div className='flex flex-wrap gap-1'>
                    {type.modules.map((module) => (
                      <Badge key={module} variant='open'>
                        {module}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className='text-right'>
                  <Button
                    variant='icon2'
                    className='text-neutral-1900 h-7 w-7'
                    aria-label='Edit'
                    onClick={() => {
                      setEditing(type)
                      setDialogOpen(true)
                    }}
                  >
                    <PencilSimple size={16} weight='fill' />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className='border-gray-200 border-t px-3 py-2'>
          <span className='text-paragraph-sm text-neutral-1000'>
            Displaying items 1 - {total} of {total}
          </span>
        </div>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditing(null)
        }}
      >
        <DialogContent className='sm:max-w-[440px]'>
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Edit document type' : 'New document type'}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? 'Existing documents keep their association; new metadata applies going forward.'
                : 'Define a type, its description, and the modules where it is offered.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className='space-y-4'
            >
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type name</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g. Experience Letter' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder='What this type covers' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='modules'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Applicable modules</FormLabel>
                    <div className='flex flex-wrap gap-2'>
                      {MODULES.map((module) => {
                        const selected = field.value.includes(module)
                        return (
                          <button
                            key={module}
                            type='button'
                            onClick={() =>
                              field.onChange(
                                selected
                                  ? field.value.filter((m) => m !== module)
                                  : [...field.value, module]
                              )
                            }
                          >
                            <Badge variant={selected ? 'open' : 'pending'}>
                              {module}
                            </Badge>
                          </button>
                        )
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type='submit'>
                  {editing ? 'Save changes' : 'Add type'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
