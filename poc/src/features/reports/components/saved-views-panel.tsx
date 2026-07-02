import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { type SavedView } from '../data/builder'
import { type SavedViewsStore } from '../hooks/use-saved-views'

const renameSchema = z.object({
  name: z.string().min(2, 'View name is required'),
})

type RenameValues = z.infer<typeof renameSchema>

interface SavedViewsPanelProps {
  store: SavedViewsStore
  /** Reopen a view — reconstructs the builder from its config (RPT-08). */
  onOpenView: (view: SavedView) => void
  /** Overwrite a view with the current builder configuration. */
  onUpdateView: (id: string) => void
}

/** Saved ad hoc views: reopen, re-run, rename, update and delete (RPT-08). */
export function SavedViewsPanel({
  store,
  onOpenView,
  onUpdateView,
}: SavedViewsPanelProps) {
  const [renaming, setRenaming] = useState<SavedView | null>(null)

  const form = useForm<RenameValues>({
    resolver: zodResolver(renameSchema),
    defaultValues: { name: '' },
  })

  const startRename = (view: SavedView) => {
    form.reset({ name: view.name })
    setRenaming(view)
  }

  const submitRename = (values: RenameValues) => {
    if (renaming) store.renameView(renaming.id, values.name)
    setRenaming(null)
  }

  return (
    <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
      <p className='text-neutral-1600 mb-2 text-sm font-semibold'>
        Saved views ({store.views.length})
      </p>
      {store.views.length === 0 ? (
        <p className='text-neutral-1000 text-sm'>
          No saved views yet — configure fields, filters and grouping, then save
          the setup for reuse.
        </p>
      ) : (
        <table className='w-full text-sm'>
          <thead>
            <tr className='text-neutral-1000 border-b text-left text-xs'>
              <th className='py-2 pr-3 font-medium'>View</th>
              <th className='px-2 font-medium'>Configuration</th>
              <th className='px-2 font-medium'>Updated</th>
              <th className='px-2 text-right font-medium'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {store.views.map((v) => (
              <tr key={v.id} className='border-b last:border-0'>
                <td className='py-2 pr-3 font-medium'>{v.name}</td>
                <td className='text-neutral-1000 px-2 text-xs'>
                  {v.fields.length} fields · dept {v.departmentFilter} · status{' '}
                  {v.statusFilter} · group by {v.groupBy}
                </td>
                <td className='text-neutral-1000 px-2 text-xs'>
                  {v.updatedOn}
                </td>
                <td className='px-2'>
                  <div className='flex justify-end gap-1'>
                    <Button
                      variant='outline'
                      className='h-6 px-2 text-xs'
                      onClick={() => onOpenView(v)}
                    >
                      Open & run
                    </Button>
                    <Button
                      variant='outline'
                      className='h-6 px-2 text-xs'
                      onClick={() => onUpdateView(v.id)}
                    >
                      Update
                    </Button>
                    <Button
                      variant='outline'
                      className='h-6 px-2 text-xs'
                      onClick={() => startRename(v)}
                    >
                      Rename
                    </Button>
                    <Button
                      variant='outline'
                      className='text-red-1400 h-6 px-2 text-xs'
                      onClick={() => store.deleteView(v.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Dialog
        open={renaming !== null}
        onOpenChange={(open) => !open && setRenaming(null)}
      >
        <DialogContent className='sm:max-w-[380px]'>
          <DialogHeader>
            <DialogTitle>Rename view</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(submitRename)}
              className='space-y-4'
            >
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>View name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setRenaming(null)}
                >
                  Cancel
                </Button>
                <Button type='submit'>Save</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
