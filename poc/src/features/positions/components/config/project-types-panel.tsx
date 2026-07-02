import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MagnifyingGlass, PencilSimple, Plus } from 'phosphor-react'
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
import { renderSeries, type ProjectType } from '../../data/org-config'
import type { OrgConfigStore } from '../../hooks/use-org-config'

const projectTypeSchema = z.object({
  name: z.string().min(2, 'Type name is required'),
  acronym: z
    .string()
    .min(2, 'Acronym is required')
    .max(5, 'Keep the acronym to 5 characters')
    .regex(/^[A-Za-z]+$/, 'Letters only'),
  description: z.string().min(3, 'Description is required'),
})

type ProjectTypeFormValues = z.infer<typeof projectTypeSchema>

interface ProjectTypesPanelProps {
  companyId: string
  orgConfig: OrgConfigStore
}

/**
 * Project types (POS-24/25/42): name + acronym + description with unique
 * acronyms per company; the acronym prefixes generated project codes.
 * Includes the Search / Reset controls of the Kensium list.
 */
export function ProjectTypesPanel({ companyId, orgConfig }: ProjectTypesPanelProps) {
  const [search, setSearch] = useState('')
  const [applied, setApplied] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ProjectType | null>(null)

  const scoped = orgConfig.projectTypes.filter((t) => t.companyId === companyId)
  const rows = applied
    ? scoped.filter((t) =>
        t.name.toLowerCase().includes(applied.toLowerCase())
      )
    : scoped

  const form = useForm<ProjectTypeFormValues>({
    resolver: zodResolver(projectTypeSchema),
    defaultValues: { name: '', acronym: '', description: '' },
  })

  const openDialog = (projectType: ProjectType | null) => {
    setEditing(projectType)
    form.reset(
      projectType
        ? {
            name: projectType.name,
            acronym: projectType.acronym,
            description: projectType.description,
          }
        : { name: '', acronym: '', description: '' }
    )
    setDialogOpen(true)
  }

  const handleSubmit = (values: ProjectTypeFormValues) => {
    const acronym = values.acronym.toUpperCase()
    // Acronyms prefix project codes, so they must stay unique (POS-24/42).
    const duplicate = scoped.some(
      (t) => t.id !== editing?.id && t.acronym === acronym
    )
    if (duplicate) {
      form.setError('acronym', {
        message: `Acronym ${acronym} is already used — prefixes must stay unique`,
      })
      return
    }
    const draft = { ...values, acronym, companyId }
    if (editing) {
      orgConfig.updateProjectType(editing.id, draft)
    } else {
      orgConfig.addProjectType(draft)
    }
    setDialogOpen(false)
    setEditing(null)
  }

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='flex items-center gap-2'>
          <Input
            placeholder='Search by type name'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='h-8 w-[220px]'
          />
          <Button className='h-8' onClick={() => setApplied(search.trim())}>
            <MagnifyingGlass size={12} weight='bold' />
            Search
          </Button>
          <Button
            variant='outline'
            className='h-8'
            onClick={() => {
              setSearch('')
              setApplied('')
            }}
          >
            Reset
          </Button>
        </div>
        <Button className='h-8' onClick={() => openDialog(null)}>
          <Plus size={12} weight='bold' />
          New project type
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className='text-paragraph-sm text-neutral-1000 border-grey-200 rounded-[6px] border px-3 py-4 text-center'>
          No project types match “{applied}”. Reset the filter to see the full
          list.
        </p>
      ) : (
        <div className='divide-grey-200 border-grey-200 divide-y rounded-[6px] border'>
          {rows.map((t) => (
            <div key={t.id} className='flex items-center justify-between px-3 py-2'>
              <div className='flex min-w-0 flex-col gap-0.5'>
                <div className='flex items-center gap-2'>
                  <span className='text-neutral-1600 text-sm font-medium'>
                    {t.name}
                  </span>
                  <Badge variant='open'>{t.acronym}</Badge>
                </div>
                <span className='text-paragraph-sm text-neutral-1000'>
                  {t.description} · next project code:{' '}
                  <span className='font-mono'>
                    {renderSeries(`${t.acronym}-{####}`, t.nextCodeSeq)}
                  </span>
                </span>
              </div>
              <Button
                variant='icon2'
                className='text-neutral-1900 h-7 w-7'
                aria-label={`Edit ${t.name}`}
                onClick={() => openDialog(t)}
              >
                <PencilSimple size={14} weight='fill' />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='sm:max-w-[420px]'>
          <DialogHeader>
            <DialogTitle>
              {editing ? `Edit ${editing.name}` : 'New project type'}
            </DialogTitle>
            <DialogDescription>
              The acronym prefixes generated project codes; changing it affects
              new projects only — existing codes are unchanged.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-3'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type name</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g. Data Migration' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='acronym'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Acronym (unique)</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g. DMG' {...field} />
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
                      <Input placeholder='What kind of projects use this type' {...field} />
                    </FormControl>
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
                  {editing ? 'Save type' : 'Create type'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
