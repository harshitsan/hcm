import { useState } from 'react'
import { ListChecks, MagnifyingGlass, PencilSimple, Plus } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { ProjectRole } from '../../data/org-config'
import type { OrgConfigStore } from '../../hooks/use-org-config'

interface ProjectRolesPanelProps {
  companyId: string
  orgConfig: OrgConfigStore
}

/**
 * Project roles (POS-25/26/27/40/41/44): each role maps to any number of
 * applicable project types in one action — an empty mapping is a bench /
 * non-billable role — and carries evaluation questions scored at appraisal.
 */
export function ProjectRolesPanel({ companyId, orgConfig }: ProjectRolesPanelProps) {
  const [search, setSearch] = useState('')
  const [applied, setApplied] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ProjectRole | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [typeIds, setTypeIds] = useState<string[]>([])
  const [questionsTarget, setQuestionsTarget] = useState<ProjectRole | null>(null)
  const [questionsText, setQuestionsText] = useState('')

  const companyTypes = orgConfig.projectTypes.filter(
    (t) => t.companyId === companyId
  )
  const scoped = orgConfig.projectRoles.filter((r) => r.companyId === companyId)
  const rows = applied
    ? scoped.filter((r) => r.name.toLowerCase().includes(applied.toLowerCase()))
    : scoped

  const typeName = (id: string) =>
    companyTypes.find((t) => t.id === id)?.name ?? id

  const openDialog = (role: ProjectRole | null) => {
    setEditing(role)
    setName(role?.name ?? '')
    setDescription(role?.description ?? '')
    setTypeIds(role ? [...role.projectTypeIds] : [])
    setDialogOpen(true)
  }

  const handleSave = () => {
    const draft = {
      companyId,
      name: name.trim(),
      description: description.trim(),
      projectTypeIds: typeIds,
      questions: editing?.questions ?? [],
    }
    if (editing) {
      orgConfig.updateProjectRole(editing.id, draft)
    } else {
      orgConfig.addProjectRole(draft)
    }
    setDialogOpen(false)
    setEditing(null)
  }

  const openQuestions = (role: ProjectRole) => {
    setQuestionsTarget(role)
    setQuestionsText(role.questions.join('\n'))
  }

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='flex items-center gap-2'>
          <Input
            placeholder='Search by role name'
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
          New project role
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className='text-paragraph-sm text-neutral-1000 border-gray-200 rounded-[6px] border px-3 py-4 text-center'>
          No project roles match “{applied}”. Reset the filter to see the full
          list.
        </p>
      ) : (
        <div className='divide-grey-200 border-gray-200 divide-y rounded-[6px] border'>
          {rows.map((r) => (
            <div key={r.id} className='flex items-center justify-between gap-2 px-3 py-2'>
              <div className='flex min-w-0 flex-col gap-1'>
                <div className='flex items-center gap-2'>
                  <span className='text-neutral-1600 text-sm font-medium'>
                    {r.name}
                  </span>
                  {r.projectTypeIds.length === 0 && (
                    <Badge variant='overdue'>Bench / non-billable</Badge>
                  )}
                </div>
                <span className='text-paragraph-sm text-neutral-1000'>
                  {r.description}
                </span>
                <div className='flex flex-wrap items-center gap-1'>
                  {r.projectTypeIds.length === 0 ? (
                    <span className='text-paragraph-sm text-neutral-1000'>
                      No applicable project types — used for unallocated resources
                    </span>
                  ) : (
                    r.projectTypeIds.map((id) => (
                      <Badge key={id} variant='pending'>
                        {typeName(id)}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
              <div className='flex items-center gap-1'>
                <Button
                  variant='icon2'
                  className='text-neutral-1900 h-7 w-7'
                  aria-label={`Questions for ${r.name}`}
                  onClick={() => openQuestions(r)}
                >
                  <ListChecks size={14} weight='bold' />
                </Button>
                <Button
                  variant='icon2'
                  className='text-neutral-1900 h-7 w-7'
                  aria-label={`Edit ${r.name}`}
                  onClick={() => openDialog(r)}
                >
                  <PencilSimple size={14} weight='fill' />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Role editor — multi type mapping in one action (POS-26/44). */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='sm:max-w-[440px]'>
          <DialogHeader>
            <DialogTitle>
              {editing ? `Edit ${editing.name}` : 'New project role'}
            </DialogTitle>
            <DialogDescription>
              Select every applicable project type at once. Leaving all types
              unchecked stores a bench / non-billable role.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1.5'>
              <Label>Role name</Label>
              <Input
                placeholder='e.g. Solution Architect'
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className='space-y-1.5'>
              <Label>Description</Label>
              <Input
                placeholder='What this role does on a project'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className='space-y-1.5'>
              <Label>Applicable project types</Label>
              <div className='border-gray-200 space-y-2 rounded-[6px] border px-3 py-2'>
                {companyTypes.map((t) => (
                  <label key={t.id} className='flex items-center gap-2'>
                    <Checkbox
                      variant='blue'
                      checked={typeIds.includes(t.id)}
                      onCheckedChange={(checked) =>
                        setTypeIds((prev) =>
                          checked
                            ? [...prev, t.id]
                            : prev.filter((id) => id !== t.id)
                        )
                      }
                    />
                    <span className='text-neutral-1900 text-sm'>
                      {t.name} ({t.acronym})
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button disabled={name.trim().length < 2} onClick={handleSave}>
              {editing ? 'Save role' : 'Create role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Evaluation questions editor (POS-27). */}
      <Dialog
        open={questionsTarget !== null}
        onOpenChange={(open) => {
          if (!open) setQuestionsTarget(null)
        }}
      >
        <DialogContent className='sm:max-w-[480px]'>
          <DialogHeader>
            <DialogTitle>
              Evaluation questions — {questionsTarget?.name}
            </DialogTitle>
            <DialogDescription>
              One question per line. Appraisals for resources in this role score
              each question; an empty set completes without scored criteria.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={6}
            placeholder={'Delivers on sprint commitments\nCommunicates blockers early'}
            value={questionsText}
            onChange={(e) => setQuestionsText(e.target.value)}
          />
          <DialogFooter>
            <Button variant='outline' onClick={() => setQuestionsTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (questionsTarget) {
                  orgConfig.setRoleQuestions(
                    questionsTarget.id,
                    questionsText
                      .split('\n')
                      .map((q) => q.trim())
                      .filter(Boolean)
                  )
                }
                setQuestionsTarget(null)
              }}
            >
              Save questions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
