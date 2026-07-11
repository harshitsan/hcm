import { useState } from 'react'
import { Mail, Pencil, Plus, Trash2 } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import {
  SURVEY_APPROVER_CATALOG,
  SURVEY_LOCATIONS,
  type SurveyApproverMapping,
} from '../data/surveys'
import { type SurveysStore } from '../hooks/use-surveys'

interface SurveyApproversStepProps {
  store: SurveysStore
  /** Jump straight to the Email Templates step (SAP-04). */
  onEmailTemplates: () => void
  onNext: () => void
}

interface DraftState {
  groupId: string
  location: string
  approvers: string[]
}

const EMPTY_DRAFT: DraftState = { groupId: '', location: '', approvers: [] }

/**
 * Survey Approvers step (SAP-01..05): the group/location/approver mapping
 * table with add, edit and delete, a shortcut to Email Templates, and
 * Next/Cancel workflow controls — mirroring the Kensium screen.
 */
export function SurveyApproversStep({
  store,
  onEmailTemplates,
  onNext,
}: SurveyApproversStepProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<SurveyApproverMapping | null>(null)
  const [draft, setDraft] = useState<DraftState>(EMPTY_DRAFT)
  const [deleteTarget, setDeleteTarget] = useState<SurveyApproverMapping | null>(null)

  const openAdd = () => {
    setEditing(null)
    setDraft({
      ...EMPTY_DRAFT,
      groupId: `GRP-${String(store.approvers.length + 1).padStart(3, '0')}`,
    })
    setFormOpen(true)
  }

  const openEdit = (mapping: SurveyApproverMapping) => {
    setEditing(mapping)
    setDraft({
      groupId: mapping.groupId,
      location: mapping.location,
      approvers: [...mapping.approvers],
    })
    setFormOpen(true)
  }

  const toggleApprover = (name: string) => {
    setDraft((d) => ({
      ...d,
      approvers: d.approvers.includes(name)
        ? d.approvers.filter((a) => a !== name)
        : [...d.approvers, name],
    }))
  }

  const submit = () => {
    if (!draft.groupId.trim()) {
      toast.error('Group ID is required')
      return
    }
    if (!draft.location) {
      toast.error('Select a location to map')
      return
    }
    if (draft.approvers.length === 0) {
      toast.error('Select at least one approver for the location')
      return
    }
    const payload = {
      groupId: draft.groupId.trim(),
      location: draft.location,
      approvers: draft.approvers,
    }
    const ok = editing
      ? store.updateApprover(editing.id, payload)
      : store.addApprover(payload)
    if (ok) setFormOpen(false)
  }

  return (
    <div className='flex w-full flex-col gap-4'>
      <Card className='gap-3 border-none bg-white py-4'>
        <CardHeader className='px-4'>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
                Survey Approvers ({store.approvers.length})
              </CardTitle>
              <p className='text-paragraph-sm text-neutral-1000'>
                Map approvers to specific locations so the correct people
                approve surveys targeting each site.
              </p>
            </div>
            <div className='flex items-center gap-2'>
              <Button variant='outline' onClick={onEmailTemplates} className='h-8 gap-1'>
                <Mail className='size-3.5' /> Email Templates
              </Button>
              <Button onClick={openAdd} className='h-8 gap-1'>
                <Plus className='size-3.5' /> Add approver
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className='px-4'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group ID</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Approvers</TableHead>
                <TableHead className='w-24 text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {store.approvers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className='text-neutral-1000 py-6 text-center text-sm'>
                    No survey approvers configured yet — add one to route
                    survey approvals.
                  </TableCell>
                </TableRow>
              )}
              {store.approvers.map((mapping) => (
                <TableRow key={mapping.id}>
                  <TableCell className='text-sm font-medium'>{mapping.groupId}</TableCell>
                  <TableCell className='text-sm'>{mapping.location}</TableCell>
                  <TableCell>
                    <div className='flex flex-wrap gap-1'>
                      {mapping.approvers.map((a) => (
                        <Badge key={a} variant='open'>
                          {a}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className='text-right'>
                    <div className='flex items-center justify-end gap-1'>
                      <Button
                        variant='icon2'
                        className='text-neutral-1900 h-7 w-7'
                        aria-label={`Edit ${mapping.groupId}`}
                        onClick={() => openEdit(mapping)}
                      >
                        <Pencil className='size-4' />
                      </Button>
                      <Button
                        variant='icon2'
                        className='text-red-1400 h-7 w-7'
                        aria-label={`Delete ${mapping.groupId}`}
                        onClick={() => setDeleteTarget(mapping)}
                      >
                        <Trash2 className='size-4' />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className='flex items-center justify-end gap-3'>
        <Button
          variant='outline'
          onClick={() => toast.info('Survey Approvers step closed without changes')}
        >
          Cancel
        </Button>
        <Button onClick={onNext}>Next</Button>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className='sm:max-w-[440px]'>
          <DialogHeader>
            <DialogTitle>
              {editing ? `Edit approver group ${editing.groupId}` : 'Add survey approver'}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <Label className='text-sm'>Group ID</Label>
              <Input
                value={draft.groupId}
                onChange={(e) => setDraft((d) => ({ ...d, groupId: e.target.value }))}
                placeholder='e.g. GRP-004'
                className='mt-1'
              />
            </div>
            <div>
              <Label className='text-sm'>Location</Label>
              <Select
                value={draft.location}
                onValueChange={(location) => setDraft((d) => ({ ...d, location }))}
              >
                <SelectTrigger variant='secondary' className='mt-1 w-full'>
                  <SelectValue placeholder='Select a location' />
                </SelectTrigger>
                <SelectContent>
                  {SURVEY_LOCATIONS.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className='text-sm'>Approvers for this location</Label>
              <div className='border-gray-200 mt-1 space-y-2 rounded-[6px] border px-3 py-2'>
                {SURVEY_APPROVER_CATALOG.map((name) => (
                  <div key={name} className='flex items-center gap-2'>
                    <Checkbox
                      id={`approver-${name}`}
                      checked={draft.approvers.includes(name)}
                      onCheckedChange={() => toggleApprover(name)}
                    />
                    <Label htmlFor={`approver-${name}`} className='text-sm font-normal'>
                      {name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit}>{editing ? 'Save changes' : 'Add approver'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete approver mapping?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `Surveys for ${deleteTarget.location} (${deleteTarget.groupId}) will no longer route to ${deleteTarget.approvers.join(', ')}.`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) store.removeApprover(deleteTarget.id)
                setDeleteTarget(null)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
