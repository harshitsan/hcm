import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  PROJECT_TYPES,
  type ProjectRole,
} from '../data/roles'
import { type ProjectRoleDraft, type RolesStore } from '../hooks/use-roles'

const projectRoleSchema = z.object({
  name: z.string().min(2, 'Project role name is required'),
  projectTypes: z
    .array(z.enum(PROJECT_TYPES))
    .min(1, 'Select at least one applicable project type'),
  questions: z.string(),
})

type ProjectRoleValues = z.infer<typeof projectRoleSchema>

/**
 * Project role catalog mapped to applicable project types with associated
 * evaluation questions, plus search with reset (RSEC-36).
 */
export function ProjectRolesPanel({ store }: { store: RolesStore }) {
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ProjectRole | null>(null)

  const form = useForm<ProjectRoleValues>({
    resolver: zodResolver(projectRoleSchema),
    defaultValues: { name: '', projectTypes: [], questions: '' },
  })

  const filtered = store.projectRoles.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const openDialog = (role: ProjectRole | null) => {
    setEditing(role)
    form.reset(
      role
        ? {
            name: role.name,
            projectTypes: [...role.projectTypes],
            questions: role.questions.join('\n'),
          }
        : { name: '', projectTypes: [], questions: '' }
    )
    setDialogOpen(true)
  }

  const handleSubmit = (values: ProjectRoleValues) => {
    const draft: ProjectRoleDraft = {
      name: values.name,
      projectTypes: values.projectTypes,
      questions: values.questions
        .split('\n')
        .map((q) => q.trim())
        .filter(Boolean),
    }
    if (editing) store.updateProjectRole(editing.id, draft)
    else store.addProjectRole(draft)
    setDialogOpen(false)
  }

  return (
    <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
      <div className='mb-3 flex items-center justify-between'>
        <h3 className='text-neutral-1600 text-sm font-medium'>
          Project Roles
          <span className='text-neutral-1000 ml-2 text-xs'>
            mapped to applicable project types with evaluation questions
          </span>
        </h3>
        <div className='flex items-center gap-2'>
          <Input
            placeholder='Search project roles'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='h-7 w-52'
          />
          <Button
            variant='outline'
            className='h-7'
            onClick={() => setSearch('')}
          >
            Reset
          </Button>
          <Button className='h-7' onClick={() => openDialog(null)}>
            New Project Role
          </Button>
        </div>
      </div>
      <table className='w-full text-sm'>
        <thead>
          <tr className='text-neutral-1000 border-b text-left text-xs'>
            <th className='py-2 pr-3 font-medium'>Project role</th>
            <th className='px-2 font-medium'>Applicable project types</th>
            <th className='px-2 font-medium'>Evaluation questions</th>
            <th className='px-2 font-medium'>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((p) => (
            <tr key={p.id} className='border-b last:border-0'>
              <td className='text-neutral-1600 py-2 pr-3 font-medium'>
                {p.name}
              </td>
              <td className='px-2'>
                <div className='flex flex-wrap gap-1'>
                  {p.projectTypes.map((t) => (
                    <Badge key={t} variant='outline'>
                      {t}
                    </Badge>
                  ))}
                </div>
              </td>
              <td className='text-neutral-1000 px-2'>
                {p.questions.length > 0 ? (
                  <ul className='list-disc pl-4'>
                    {p.questions.map((q) => (
                      <li key={q}>{q}</li>
                    ))}
                  </ul>
                ) : (
                  '—'
                )}
              </td>
              <td className='px-2'>
                <Button
                  variant='outline'
                  className='h-6 text-xs'
                  onClick={() => openDialog(p)}
                >
                  Edit
                </Button>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={4} className='text-neutral-1000 py-4 text-center'>
                No project roles match “{search}”
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='sm:max-w-[440px]'>
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Edit project role' : 'New project role'}
            </DialogTitle>
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
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder='Tech Lead' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='projectTypes'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Applicable project types</FormLabel>
                    <div className='grid grid-cols-2 gap-2 rounded-[6px] border border-gray-200 p-3'>
                      {PROJECT_TYPES.map((t) => (
                        <label
                          key={t}
                          className='flex items-center gap-2 text-sm'
                        >
                          <Checkbox
                            variant='blue'
                            checked={field.value.includes(t)}
                            onCheckedChange={(checked) =>
                              field.onChange(
                                checked
                                  ? [...field.value, t]
                                  : field.value.filter((x) => x !== t)
                              )
                            }
                          />
                          {t}
                        </label>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='questions'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Evaluation questions (one per line)</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder='Does the resource have delivery ownership experience?'
                        {...field}
                      />
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
                <Button type='submit'>{editing ? 'Save' : 'Add'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
