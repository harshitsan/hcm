import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Megaphone, Pencil, Pin, PinOff, Plus, Trash2 } from 'lucide-react'
import { z } from 'zod'
import { canAccess } from '@/config/module-access'
import { RoleGate, useRole, type Role } from '@/context/role-context'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
import { Textarea } from '@/components/ui/textarea'
import {
  HOME_ANNOUNCEMENT_CATEGORIES,
  type HomeAnnouncement,
} from '../data/home-announcements'
import {
  useHomeAnnouncements,
  type HomeAnnouncementDraft,
} from '../hooks/use-home-announcements'

/** Roles that may post, edit, pin and remove Home-feed announcements. */
const MANAGER_ROLES: Role[] = [
  'Platform Admin',
  'Portfolio Admin',
  'Group Company Admin',
  'Company Admin',
]

const announcementFormSchema = z.object({
  title: z.string().min(3, 'Give the announcement a title'),
  body: z.string().min(10, 'Write at least a sentence of content'),
  category: z.enum(HOME_ANNOUNCEMENT_CATEGORIES),
  audience: z.string().min(2, 'Who is this announcement for?'),
})

type AnnouncementFormValues = z.infer<typeof announcementFormSchema>

const emptyDraft: AnnouncementFormValues = {
  title: '',
  body: '',
  category: 'General',
  audience: 'All employees',
}

function formatPostedOn(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Announcements on the Home landing page (HOME-01): every role sees the
 * company feed the moment they land; admin roles can post, edit, pin and
 * remove entries without leaving Home. The full approval/scheduling
 * lifecycle stays in the Announcements module.
 */
export function HomeAnnouncements() {
  const { role } = useRole()
  const store = useHomeAnnouncements()

  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<HomeAnnouncement | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<HomeAnnouncement | null>(null)

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementFormSchema),
    defaultValues: emptyDraft,
  })

  useEffect(() => {
    if (!dialogOpen) return
    form.reset(
      editing
        ? {
            title: editing.title,
            body: editing.body,
            category: editing.category,
            audience: editing.audience,
          }
        : emptyDraft
    )
  }, [dialogOpen, editing, form])

  const feed = useMemo(() => {
    const rows =
      categoryFilter === 'all'
        ? store.announcements
        : store.announcements.filter((a) => a.category === categoryFilter)
    return [...rows].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return b.postedOn.localeCompare(a.postedOn)
    })
  }, [store.announcements, categoryFilter])

  const canManage = MANAGER_ROLES.includes(role)

  const handleSubmit = (values: AnnouncementFormValues) => {
    const draft: HomeAnnouncementDraft = values
    if (editing) store.updateAnnouncement(editing.id, draft)
    else store.addAnnouncement(draft)
    setDialogOpen(false)
    setEditing(null)
  }

  return (
    <section className='flex flex-col gap-3'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='flex items-center gap-2'>
          <h3 className='text-paragraph-md text-neutral-1200 font-medium'>
            Announcements
          </h3>
          {store.unreadCount > 0 && (
            <Badge variant='open'>{store.unreadCount} unread</Badge>
          )}
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className='h-7 w-[160px]' variant='secondary'>
              <SelectValue placeholder='All categories' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All categories</SelectItem>
              {HOME_ANNOUNCEMENT_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {store.unreadCount > 0 && (
            <Button
              variant='outline'
              className='h-7 rounded-[6px] px-2 text-xs'
              onClick={store.markAllRead}
            >
              Mark all read
            </Button>
          )}
          <RoleGate roles={MANAGER_ROLES}>
            <Button
              variant='red'
              onClick={() => {
                setEditing(null)
                setDialogOpen(true)
              }}
              className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
            >
              <Plus className='size-3' />
              New announcement
            </Button>
          </RoleGate>
          {canAccess(role, '/announcements') && (
            <Link
              to='/announcements'
              className='text-paragraph-sm text-blue-1200 flex items-center gap-1 font-medium hover:underline'
            >
              Open module <ArrowRight className='size-3.5' />
            </Link>
          )}
        </div>
      </div>

      {feed.length === 0 ? (
        <Card className='flex flex-row items-center gap-3 p-4'>
          <Megaphone className='text-neutral-800 size-5 shrink-0' />
          <p className='text-paragraph-md text-neutral-1000'>
            {categoryFilter === 'all'
              ? 'No announcements right now — company updates will appear here.'
              : `No ${categoryFilter} announcements right now.`}
          </p>
        </Card>
      ) : (
        <div className='grid grid-cols-1 gap-3 lg:grid-cols-2'>
          {feed.map((a) => (
            <Card key={a.id} className='flex flex-col gap-2 p-4'>
              <div className='flex items-start justify-between gap-2'>
                <div className='flex min-w-0 items-center gap-2'>
                  {a.pinned && (
                    <Pin className='text-orange-1200 size-4 shrink-0' />
                  )}
                  <span className='text-paragraph-md text-neutral-1600 truncate font-medium'>
                    {a.title}
                  </span>
                  {!a.read && <Badge variant='open'>New</Badge>}
                </div>
                <div className='flex shrink-0 items-center gap-1'>
                  <Badge variant='badge_inactive'>{a.category}</Badge>
                  {canManage && (
                    <>
                      <Button
                        variant='icon2'
                        className='text-neutral-1900 h-7 w-7'
                        aria-label={a.pinned ? 'Unpin announcement' : 'Pin announcement'}
                        onClick={() => store.togglePinned(a.id)}
                      >
                        {a.pinned ? (
                          <PinOff className='size-3.5' />
                        ) : (
                          <Pin className='size-3.5' />
                        )}
                      </Button>
                      <Button
                        variant='icon2'
                        className='text-neutral-1900 h-7 w-7'
                        aria-label='Edit announcement'
                        onClick={() => {
                          setEditing(a)
                          setDialogOpen(true)
                        }}
                      >
                        <Pencil className='size-3.5' />
                      </Button>
                      <Button
                        variant='icon2'
                        className='text-neutral-1900 h-7 w-7'
                        aria-label='Delete announcement'
                        onClick={() => setConfirmDelete(a)}
                      >
                        <Trash2 className='size-3.5' />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <p className='text-paragraph-sm text-neutral-1000 leading-relaxed'>
                {a.body}
              </p>
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <span className='text-paragraph-sm text-neutral-1000'>
                  {a.audience} · {a.postedBy} · {formatPostedOn(a.postedOn)}
                </span>
                {!a.read && (
                  <Button
                    variant='outline'
                    className='h-6 rounded-[6px] px-2 text-xs'
                    onClick={() => store.markRead(a.id)}
                  >
                    Mark read
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditing(null)
        }}
      >
        <DialogContent className='sm:max-w-[480px]'>
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Edit announcement' : 'New announcement'}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? 'Update the post shown on everyone’s Home feed.'
                : 'Post an update straight to the Home feed. Approval-routed announcements live in the Announcements module.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className='flex flex-col gap-4'
            >
              <FormField
                control={form.control}
                name='title'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g. Office closed on 15 August' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='body'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='What should everyone know?'
                        className='min-h-24'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='grid grid-cols-2 gap-3'>
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
                          {HOME_ANNOUNCEMENT_CATEGORIES.map((c) => (
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
                <FormField
                  control={form.control}
                  name='audience'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Audience</FormLabel>
                      <FormControl>
                        <Input placeholder='e.g. All employees' {...field} />
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
                <Button type='submit'>
                  {editing ? 'Save changes' : 'Post announcement'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirmDelete !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{confirmDelete?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              The announcement is removed from everyone’s Home feed immediately.
              This can’t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDelete) store.deleteAnnouncement(confirmDelete.id)
                setConfirmDelete(null)
              }}
              className='bg-destructive hover:bg-destructive/90 text-white'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
