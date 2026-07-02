import { useState } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type OrgGroup, type PolicyDef } from '../data/groups'

interface DeleteGroupsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  count: number
  onConfirm: () => void
}

/** Delete confirmation — child groups and policy references are protected. */
export function DeleteGroupsDialog({
  open,
  onOpenChange,
  count,
  onConfirm,
}: DeleteGroupsDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete {count === 1 ? 'group' : `${count} groups`}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Groups with child groups or groups referenced by active policies
            are protected and will be blocked with a warning. This can’t be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className='bg-destructive hover:bg-destructive/90 text-white'
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

interface MergeGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  source: OrgGroup | null
  targets: OrgGroup[]
  sourcePolicies: PolicyDef[]
  onConfirm: (targetId: string) => void
}

/** Merge one group into another (GRP-40) with a policy re-point warning. */
export function MergeGroupDialog({
  open,
  onOpenChange,
  source,
  targets,
  sourcePolicies,
  onConfirm,
}: MergeGroupDialogProps) {
  const [target, setTarget] = useState('')

  return (
    <AlertDialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) setTarget('')
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Merge “{source?.name}” into…</AlertDialogTitle>
          <AlertDialogDescription>
            All members move to the target without duplication; the source is
            retired (set inactive) and its history preserved.
            {sourcePolicies.length > 0 && (
              <>
                {' '}
                Warning: the source is referenced by{' '}
                {sourcePolicies.map((p) => p.name).join(', ')} — re-point those
                policies after merging.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Select value={target} onValueChange={setTarget}>
          <SelectTrigger variant='secondary' className='w-full'>
            <SelectValue placeholder='Select target group' />
          </SelectTrigger>
          <SelectContent>
            {targets.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.name} ({g.acronym})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={!target}
            onClick={() => onConfirm(target)}
          >
            Merge
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
