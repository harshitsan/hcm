import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  EXIT_QUESTION_VISIBILITY_NOTE,
  type ClearanceApproverChain,
  type ExitApproverGroup,
  type ExitQuestionDef,
  type ExitTaskDef,
} from '../data/config'
import { type LifecycleConfigStore } from '../hooks/use-lifecycle-config'
import {
  ExitApproverGroupDialog,
  ExitQuestionDialog,
  ExitQuestionnairePreviewDialog,
  ExitTaskDialog,
} from './config-exit-flow-dialogs'
import {
  ChipList,
  ConfirmDeleteDialog,
  ListPagination,
  SectionCard,
  pageSlice,
} from './config-widgets'

const GROUP_PAGE_SIZE = 2

/** Exit approver groups, clearance chains, questionnaire and exit tasks. */
export function ConfigExitFlow({ config }: { config: LifecycleConfigStore }) {
  const [groupOpen, setGroupOpen] = useState(false)
  const [groupEditing, setGroupEditing] = useState<ExitApproverGroup | null>(null)
  const [groupDeleting, setGroupDeleting] = useState<ExitApproverGroup | null>(null)
  const [groupPage, setGroupPage] = useState(1)

  const [chainEdit, setChainEdit] = useState<string | null>(null)
  const [chainValue, setChainValue] = useState('')
  const [chainAddOpen, setChainAddOpen] = useState(false)
  const [chainName, setChainName] = useState('')
  const [chainHierarchy, setChainHierarchy] = useState('')
  const [chainDeleting, setChainDeleting] =
    useState<ClearanceApproverChain | null>(null)

  const [questionOpen, setQuestionOpen] = useState(false)
  const [questionEditing, setQuestionEditing] = useState<ExitQuestionDef | null>(null)
  const [questionDeleting, setQuestionDeleting] =
    useState<ExitQuestionDef | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const [taskOpen, setTaskOpen] = useState(false)
  const [taskEditing, setTaskEditing] = useState<ExitTaskDef | null>(null)
  const [taskDeleting, setTaskDeleting] = useState<ExitTaskDef | null>(null)

  const groupTotal = config.exitApproverGroups.items.length
  const groupPageSafe = Math.min(
    groupPage,
    Math.max(1, Math.ceil(groupTotal / GROUP_PAGE_SIZE))
  )
  const groupRows = pageSlice(
    config.exitApproverGroups.items,
    groupPageSafe,
    GROUP_PAGE_SIZE
  )

  const openGroupDialog = (g: ExitApproverGroup | null) => {
    setGroupEditing(g)
    setGroupOpen(true)
  }

  const openQuestionDialog = (q: ExitQuestionDef | null) => {
    setQuestionEditing(q)
    setQuestionOpen(true)
  }

  const openTaskDialog = (t: ExitTaskDef | null) => {
    setTaskEditing(t)
    setTaskOpen(true)
  }

  return (
    <div>
      <SectionCard
        title='Exit approver groups'
        description='An exit routes to the group whose exit type, location, department and position scope match the employee. Approver 1 is always the reporting manager hierarchy. Edits apply to new exits; in-flight exits keep their original routing.'
        actions={
          <>
            <Button
              size='sm'
              variant='outline'
              onClick={() =>
                toast.success('Exit approver groups refreshed — latest set shown')
              }
            >
              Refresh
            </Button>
            <Button size='sm' onClick={() => openGroupDialog(null)}>
              Add group
            </Button>
          </>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Group</TableHead>
              <TableHead>Exit type</TableHead>
              <TableHead>Locations</TableHead>
              <TableHead>Departments</TableHead>
              <TableHead>Position levels</TableHead>
              <TableHead>Approver 1 (RM levels)</TableHead>
              <TableHead>Additional approvers (ordered)</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groupRows.map((g) => (
              <TableRow key={g.id}>
                <TableCell className='font-medium'>{g.name}</TableCell>
                <TableCell>
                  <Badge variant='outline'>{g.exitType}</Badge>
                </TableCell>
                <TableCell><ChipList items={g.locations} /></TableCell>
                <TableCell><ChipList items={g.departments} /></TableCell>
                <TableCell><ChipList items={g.positionLevels ?? []} /></TableCell>
                <TableCell className='text-xs'>
                  {g.reportingManagerFromLevel !== undefined
                    ? `Level ${g.reportingManagerFromLevel} → ${g.reportingManagerToLevel ?? g.reportingManagerFromLevel}`
                    : '—'}
                </TableCell>
                <TableCell>{g.approvers.join(' → ')}</TableCell>
                <TableCell>
                  <div className='flex gap-2'>
                    <Button size='sm' variant='outline' onClick={() => openGroupDialog(g)}>
                      Edit
                    </Button>
                    <Button size='sm' variant='outline' onClick={() => setGroupDeleting(g)}>
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <ListPagination
          total={groupTotal}
          page={groupPageSafe}
          pageSize={GROUP_PAGE_SIZE}
          onPageChange={setGroupPage}
        />
      </SectionCard>

      <SectionCard
        title='Exit clearance functions & approver hierarchy'
        description='Clearance tasks are generated per configured function; each sign-off routes through the configured chain.'
        actions={
          <Button
            size='sm'
            onClick={() => {
              setChainName('')
              setChainHierarchy('')
              setChainAddOpen(true)
            }}
          >
            Add clearance approver
          </Button>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Function</TableHead>
              <TableHead>Sign-off hierarchy</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {config.clearanceChains.items.map((c) => (
              <TableRow key={c.id}>
                <TableCell className='font-medium'>{c.functionName}</TableCell>
                <TableCell>{c.hierarchy.join(' → ')}</TableCell>
                <TableCell>
                  <div className='flex gap-2'>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => {
                        setChainEdit(c.id)
                        setChainValue(c.hierarchy.join(', '))
                      }}
                    >
                      Edit hierarchy
                    </Button>
                    <Button size='sm' variant='outline' onClick={() => setChainDeleting(c)}>
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>

      <SectionCard
        title='Exit questionnaire'
        description={
          config.settings.exitQuestionnaireEnabled
            ? `Questions apply per exit type, stage, responder and scope; mandatory questions block submission until answered. ${EXIT_QUESTION_VISIBILITY_NOTE}`
            : 'Questionnaire process is disabled in Exit Management setup.'
        }
        actions={
          <>
            <Button size='sm' variant='outline' onClick={() => setPreviewOpen(true)}>
              Preview exit questionnaire
            </Button>
            <Button size='sm' onClick={() => openQuestionDialog(null)}>
              Add question
            </Button>
          </>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Question</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Exit types</TableHead>
              <TableHead>Stages</TableHead>
              <TableHead>Responded by</TableHead>
              <TableHead>Mandatory</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {config.exitQuestions.items.map((q) => (
              <TableRow key={q.id}>
                <TableCell className='max-w-[280px]'>{q.text}</TableCell>
                <TableCell>
                  {q.questionFormat
                    ? q.questionFormat === 'objective'
                      ? 'Objective'
                      : 'Subjective'
                    : q.type}
                </TableCell>
                <TableCell><ChipList items={q.exitTypes} /></TableCell>
                <TableCell>
                  <ChipList
                    items={(q.applicableStages ?? ['pre-exit']).map((s) =>
                      s === 'pre-exit' ? 'Pre-exit' : 'Post-exit'
                    )}
                  />
                </TableCell>
                <TableCell>{q.respondedBy ?? q.responder}</TableCell>
                <TableCell>
                  <Badge variant={q.mandatory ? 'badge_active' : 'badge_inactive'}>
                    {q.mandatory ? 'Yes' : 'No'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className='flex gap-2'>
                    <Button size='sm' variant='outline' onClick={() => openQuestionDialog(q)}>
                      Edit
                    </Button>
                    <Button size='sm' variant='outline' onClick={() => setQuestionDeleting(q)}>
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>

      <SectionCard
        title='Exit tasks (offboarding checklist)'
        description='Each task has a responsible owner (role, employee or reporting manager), a creation trigger and a time frame relative to the last working day.'
        actions={
          <Button size='sm' onClick={() => openTaskDialog(null)}>
            Add task
          </Button>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Exit types</TableHead>
              <TableHead>Responsible</TableHead>
              <TableHead>Created on</TableHead>
              <TableHead>Days allowed</TableHead>
              <TableHead>Time frame</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {config.exitTaskDefs.items.map((t) => (
              <TableRow key={t.id}>
                <TableCell className='font-medium'>{t.name}</TableCell>
                <TableCell><ChipList items={t.exitTypes} /></TableCell>
                <TableCell>
                  {t.responsible}
                  {t.responsibleType && (
                    <span className='text-neutral-1000 block text-xs'>
                      {t.responsibleType === 'Employee'
                        ? `${t.responsibleDepartment} · ${t.responsiblePosition}`
                        : t.responsibleType}
                    </span>
                  )}
                </TableCell>
                <TableCell className='text-xs'>
                  {t.taskCreatedOn
                    ? t.taskCreatedOn === 'on-exit-approval'
                      ? 'On exit approval'
                      : 'Before LWD'
                    : '—'}
                </TableCell>
                <TableCell>
                  {t.daysAllowedAfterApproval !== undefined
                    ? `${t.daysAllowedAfterApproval} day(s)`
                    : '—'}
                </TableCell>
                <TableCell>{t.timing}</TableCell>
                <TableCell>
                  <div className='flex gap-2'>
                    <Button size='sm' variant='outline' onClick={() => openTaskDialog(t)}>
                      Edit
                    </Button>
                    <Button size='sm' variant='outline' onClick={() => setTaskDeleting(t)}>
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>

      {/* Add / edit approver group */}
      <ExitApproverGroupDialog
        open={groupOpen}
        onOpenChange={setGroupOpen}
        config={config}
        editing={groupEditing}
      />

      {/* Delete approver group */}
      <ConfirmDeleteDialog
        open={groupDeleting !== null}
        onOpenChange={(o) => !o && setGroupDeleting(null)}
        title='Delete exit approver group?'
        description={`"${groupDeleting?.name ?? ''}" will no longer route new exits. In-flight exits keep their original routing.`}
        onConfirm={() => {
          if (groupDeleting) {
            config.exitApproverGroups.remove(groupDeleting.id)
            config.logConfigChange('Exit approver group deleted', groupDeleting.name)
            toast.success('Approver group deleted')
          }
          setGroupDeleting(null)
        }}
      />

      {/* Add clearance function */}
      <Dialog open={chainAddOpen} onOpenChange={setChainAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add exit clearance approver</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1'>
              <Label>Clearance function</Label>
              <Input
                value={chainName}
                onChange={(e) => setChainName(e.target.value)}
                placeholder='e.g. Facilities'
              />
            </div>
            <div className='space-y-1'>
              <Label>Sign-off hierarchy (comma separated, in order)</Label>
              <Input
                value={chainHierarchy}
                onChange={(e) => setChainHierarchy(e.target.value)}
                placeholder='Sunil Patil, Anita Desai'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setChainAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const hierarchy = chainHierarchy.split(',').map((h) => h.trim()).filter(Boolean)
                if (!chainName.trim() || hierarchy.length === 0) {
                  toast.error('Function name and at least one approver are required')
                  return
                }
                config.clearanceChains.add(
                  { functionName: chainName.trim(), hierarchy },
                  'cc'
                )
                config.logConfigChange(
                  'Exit clearance approver added',
                  `${chainName.trim()} · ${hierarchy.join(' → ')}`
                )
                toast.success('Clearance approver added — future exits generate its task')
                setChainAddOpen(false)
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit clearance chain */}
      <Dialog open={chainEdit !== null} onOpenChange={(o) => !o && setChainEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit clearance sign-off hierarchy</DialogTitle>
          </DialogHeader>
          <div className='space-y-1'>
            <Label>Hierarchy (comma separated, in order)</Label>
            <Input value={chainValue} onChange={(e) => setChainValue(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setChainEdit(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const hierarchy = chainValue.split(',').map((h) => h.trim()).filter(Boolean)
                if (hierarchy.length === 0) {
                  toast.error('At least one approver is required')
                  return
                }
                if (chainEdit) {
                  config.clearanceChains.update(chainEdit, { hierarchy })
                  config.logConfigChange('Clearance approver hierarchy updated', hierarchy.join(' → '))
                  toast.success('Updated chain applies to subsequent clearances')
                }
                setChainEdit(null)
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete clearance function */}
      <ConfirmDeleteDialog
        open={chainDeleting !== null}
        onOpenChange={(o) => !o && setChainDeleting(null)}
        title='Delete clearance function?'
        description={`"${chainDeleting?.functionName ?? ''}" clearance will no longer be generated for future exits.`}
        onConfirm={() => {
          if (chainDeleting) {
            config.clearanceChains.remove(chainDeleting.id)
            config.logConfigChange(
              'Exit clearance function deleted',
              chainDeleting.functionName
            )
            toast.success('Clearance function deleted')
          }
          setChainDeleting(null)
        }}
      />

      {/* Add / edit exit question */}
      <ExitQuestionDialog
        open={questionOpen}
        onOpenChange={setQuestionOpen}
        config={config}
        editing={questionEditing}
      />

      {/* Delete exit question */}
      <ConfirmDeleteDialog
        open={questionDeleting !== null}
        onOpenChange={(o) => !o && setQuestionDeleting(null)}
        title='Delete exit question?'
        description={`"${questionDeleting?.text ?? ''}" will be removed from future exit questionnaires.`}
        onConfirm={() => {
          if (questionDeleting) {
            config.exitQuestions.remove(questionDeleting.id)
            config.logConfigChange('Exit question deleted', questionDeleting.text)
            toast.success('Question deleted')
          }
          setQuestionDeleting(null)
        }}
      />

      {/* Questionnaire preview */}
      <ExitQuestionnairePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        config={config}
      />

      {/* Add / edit exit task */}
      <ExitTaskDialog
        open={taskOpen}
        onOpenChange={setTaskOpen}
        config={config}
        editing={taskEditing}
      />

      {/* Delete exit task */}
      <ConfirmDeleteDialog
        open={taskDeleting !== null}
        onOpenChange={(o) => !o && setTaskDeleting(null)}
        title='Delete exit task?'
        description={`"${taskDeleting?.name ?? ''}" will be removed from the offboarding checklist for future exits.`}
        onConfirm={() => {
          if (taskDeleting) {
            config.exitTaskDefs.remove(taskDeleting.id)
            config.logConfigChange('Exit task deleted', taskDeleting.name)
            toast.success('Exit task deleted')
          }
          setTaskDeleting(null)
        }}
      />
    </div>
  )
}
