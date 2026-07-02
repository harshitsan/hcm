import { useState } from 'react'
import {
  DownloadSimple,
  PencilSimple,
  Plus,
  Trash,
  UploadSimple,
} from 'phosphor-react'
import { toast } from 'sonner'
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
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DataTable } from '@/components/common/data-table/table'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { NewUserOverlay } from './components/new-user-overlay'
import { UsersSummary } from './components/users-summary'
import { usersTableColumns } from './components/users-table-columns'
import { type User } from './data/users'
import { useUsers, type UserDraft } from './hooks/use-users'

export function Users() {
  const { users, addUser, updateUser, deleteUser } = useUsers()

  const [selectedRows, setSelectedRows] = useState<User[]>([])
  const [resetSelectionKey, setResetSelectionKey] = useState(0)
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const clearSelection = () => {
    setSelectedRows([])
    setResetSelectionKey((prev) => prev + 1)
  }

  const handleNew = () => {
    setEditingUser(null)
    setOverlayOpen(true)
  }

  const handleEdit = () => {
    if (selectedRows.length !== 1) return
    setEditingUser(selectedRows[0])
    setOverlayOpen(true)
  }

  const handleSubmit = (draft: UserDraft) => {
    if (editingUser) {
      updateUser(editingUser.id, draft)
      toast.success(`${draft.name} updated`)
    } else {
      addUser(draft)
      toast.success(`${draft.name} added`)
    }
    clearSelection()
  }

  const onConfirmDelete = () => {
    const count = selectedRows.length
    selectedRows.forEach((u) => deleteUser(u.id))
    toast.success(count === 1 ? 'Member removed' : `${count} members removed`)
    setConfirmDelete(false)
    clearSelection()
  }

  return (
    <>
      <CommonHeader title='Users' className='bg-blue-150' />
      <Main fluid className='bg-neutral-200'>
        <div className='w-full'>
          {/* Summary cards */}
          <UsersSummary users={users} />

          {/* Section header + action toolbar */}
          <div className='mb-3 flex items-center justify-between'>
            <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
              Users ({users.length})
            </h2>
            <div className='flex items-center gap-3'>
              <Button
                variant='icon2'
                onClick={() =>
                  toast.info('Bulk upload isn’t available in this demo')
                }
                className='text-neutral-1900 h-7 w-7'
                aria-label='Upload'
              >
                <UploadSimple size={16} weight='bold' />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='icon2'
                    className='text-neutral-1900 h-7 w-7'
                    aria-label='Download'
                  >
                    <DownloadSimple size={16} weight='bold' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='min-w-[180px]'>
                  <DropdownMenuItem
                    onClick={() =>
                      toast.info('Export isn’t available in this demo')
                    }
                  >
                    Download Data
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className='my-0' />
                  <DropdownMenuItem
                    onClick={() =>
                      toast.info('Template isn’t available in this demo')
                    }
                  >
                    Download Template
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant='icon2'
                onClick={handleEdit}
                className='text-neutral-1900 h-7 w-7'
                disabled={selectedRows.length !== 1}
                aria-label='Edit'
              >
                <PencilSimple size={16} weight='fill' />
              </Button>
              <Button
                variant='icon2'
                onClick={() => setConfirmDelete(true)}
                className='text-neutral-1900 h-7 w-7'
                disabled={selectedRows.length === 0}
                aria-label='Delete'
              >
                <Trash size={16} weight='bold' />
              </Button>
              <Button
                variant='red'
                onClick={handleNew}
                className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
              >
                <Plus size={10} weight='bold' />
                New Member
              </Button>
            </div>
          </div>

          {/* Data Table */}
          <DataTable
            columns={usersTableColumns}
            data={users}
            variant='no-status'
            resetSelectionKey={resetSelectionKey}
            onSelectionChange={(rows) => setSelectedRows(rows)}
          />
        </div>
      </Main>

      <NewUserOverlay
        open={overlayOpen}
        onOpenChange={(open) => {
          setOverlayOpen(open)
          if (!open) setEditingUser(null)
        }}
        user={editingUser}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove {selectedRows.length === 1 ? 'member' : 'members'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedRows.length === 1
                ? `${selectedRows[0]?.name} will lose access to MLS Apartments.`
                : `${selectedRows.length} members will lose access to MLS Apartments.`}{' '}
              This can’t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirmDelete}
              className='bg-destructive hover:bg-destructive/90 text-white'
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
