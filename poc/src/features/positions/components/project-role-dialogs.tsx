import { useEffect, useMemo, useState } from 'react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Employee } from '../data/employees'
import type { Project, ProjectRole, ProjectType } from '../data/org-config'

interface AssignProjectRoleDialogProps {
  employee: Employee | null
  onOpenChange: (open: boolean) => void
  projects: Project[]
  roles: ProjectRole[]
  projectTypes: ProjectType[]
  onAssign: (projectId: string, roleId: string) => void
}

/**
 * Staff an employee into a project role (POS-28/40): only roles applicable to
 * the chosen project's type are selectable, plus the bench role (no types)
 * for unallocated resources.
 */
export function AssignProjectRoleDialog({
  employee,
  onOpenChange,
  projects,
  roles,
  projectTypes,
  onAssign,
}: AssignProjectRoleDialogProps) {
  const [projectId, setProjectId] = useState('')
  const [roleId, setRoleId] = useState('')

  useEffect(() => {
    setProjectId(employee?.projectAssignment?.projectId ?? '')
    setRoleId(employee?.projectAssignment?.roleId ?? '')
  }, [employee])

  const project = projects.find((p) => p.id === projectId)

  // Applicability guard: a role not mapped to the project's type cannot be
  // assigned (POS-28). Bench roles (no mapped types) stay available (POS-40).
  const applicableRoles = useMemo(
    () =>
      roles.filter(
        (r) =>
          r.projectTypeIds.length === 0 ||
          (project !== undefined && r.projectTypeIds.includes(project.typeId))
      ),
    [roles, project]
  )

  useEffect(() => {
    if (roleId && !applicableRoles.some((r) => r.id === roleId)) setRoleId('')
  }, [applicableRoles, roleId])

  const typeName = (id: string) =>
    projectTypes.find((t) => t.id === id)?.name ?? id

  return (
    <Dialog open={employee !== null} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[440px]'>
        <DialogHeader>
          <DialogTitle>Assign project role — {employee?.name}</DialogTitle>
          <DialogDescription>
            Pick the project first; only roles applicable to that project's
            type are offered. Reassigning replaces the current role.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-3'>
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger variant='secondary' className='w-full'>
              <SelectValue placeholder='Select a project' />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.code} — {p.name} ({typeName(p.typeId)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={roleId} onValueChange={setRoleId} disabled={!project}>
            <SelectTrigger variant='secondary' className='w-full'>
              <SelectValue placeholder='Select an applicable role' />
            </SelectTrigger>
            <SelectContent>
              {applicableRoles.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                  {r.projectTypeIds.length === 0 ? ' (bench / non-billable)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!projectId || !roleId}
            onClick={() => {
              onAssign(projectId, roleId)
              onOpenChange(false)
            }}
          >
            Assign role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface AppraisalDialogProps {
  employee: Employee | null
  onOpenChange: (open: boolean) => void
  roles: ProjectRole[]
  /** Null when the role has no questions — completes without criteria. */
  onSubmit: (rating: number | null) => void
}

const SCORES = ['1', '2', '3', '4', '5'] as const

/**
 * Scores the project role's evaluation questions and records the aggregate
 * rating (POS-27/41). Roles without questions complete without criteria.
 */
export function AppraisalDialog({
  employee,
  onOpenChange,
  roles,
  onSubmit,
}: AppraisalDialogProps) {
  const role = roles.find((r) => r.id === employee?.projectAssignment?.roleId)
  const questions = role?.questions ?? []
  const [scores, setScores] = useState<Record<number, string>>({})

  useEffect(() => setScores({}), [employee])

  const allScored = questions.every((_, i) => scores[i] !== undefined)
  const aggregate =
    questions.length === 0
      ? null
      : questions.reduce((sum, _, i) => sum + Number(scores[i] ?? 0), 0) /
        questions.length

  return (
    <Dialog open={employee !== null} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>
            Appraisal — {employee?.name} as {role?.name ?? '—'}
          </DialogTitle>
          <DialogDescription>
            {questions.length === 0
              ? 'This role has no evaluation questions; the appraisal completes without scored criteria.'
              : "Score each of the role's evaluation questions (1–5). The aggregate rating is recorded against the resource."}
          </DialogDescription>
        </DialogHeader>
        {questions.length > 0 && (
          <div className='max-h-[300px] space-y-3 overflow-y-auto'>
            {questions.map((q, i) => (
              <div key={q} className='flex items-center justify-between gap-3'>
                <span className='text-neutral-1900 text-sm'>{q}</span>
                <Select
                  value={scores[i] ?? ''}
                  onValueChange={(v) => setScores((s) => ({ ...s, [i]: v }))}
                >
                  <SelectTrigger variant='secondary' className='w-[80px]'>
                    <SelectValue placeholder='—' />
                  </SelectTrigger>
                  <SelectContent>
                    {SCORES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
            {allScored && aggregate !== null && (
              <p className='text-paragraph-sm text-neutral-1600 font-medium'>
                Aggregate rating: {aggregate.toFixed(1)}/5
              </p>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={questions.length > 0 && !allScored}
            onClick={() => {
              onSubmit(aggregate)
              onOpenChange(false)
            }}
          >
            Submit appraisal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
