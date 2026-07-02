import { useMemo } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { type WorkflowTask } from '../data/acknowledgements'
import { formatDate, todayIso } from '../data/org'
import { type AssetsStore } from '../hooks/use-assets'

interface WorkflowsTabProps {
  store: AssetsStore
}

function statusBadge(status: WorkflowTask['status']) {
  const variant = status === 'Completed' ? 'completed' : status === 'Blocked' ? 'dropped' : 'pending'
  return <Badge variant={variant}>{status}</Badge>
}

/**
 * Workflow-engine asset steps (ASM-09, ASM-25): onboarding issuance tasks and
 * exit recovery tasks instantiated per employee. Outstanding assets are
 * surfaced and hold exit clearance; completing a linked transaction updates
 * the step status automatically.
 */
export function WorkflowsTab({ store }: WorkflowsTabProps) {
  const today = todayIso()

  const outstandingFor = useMemo(
    () => (employeeId: string) => store.assets.filter((a) => a.holderId === employeeId),
    [store.assets]
  )

  const sections: { title: string; blurb: string; tasks: WorkflowTask[] }[] = [
    {
      title: 'Onboarding — asset issuance steps',
      blurb:
        'Instantiated by the onboarding workflow: issuing an asset to the employee marks the step complete and links the transaction.',
      tasks: store.workflowTasks.filter((t) => t.workflow === 'Onboarding'),
    },
    {
      title: 'Exit — asset recovery steps',
      blurb:
        'Instantiated by the exit workflow: unrecovered assets are surfaced and hold exit clearance until recovery posts.',
      tasks: store.workflowTasks.filter((t) => t.workflow === 'Exit'),
    },
  ]

  const quickIssue = (task: WorkflowTask) => {
    const unit = store.assets.find(
      (a) => a.state === 'Available' && a.category === 'IT Equipment' && a.company === 'Aster Digital'
    )
    if (!unit) {
      toast.error('No Available IT Equipment in stock — record an arrival first')
      return
    }
    store.runTransaction(unit.id, 'issue', {
      employeeId: task.employeeId,
      effectiveDate: today,
      note: `Issued via onboarding workflow step “${task.step}”`,
    })
  }

  const quickRecover = (task: WorkflowTask, assetId: string) => {
    store.runTransaction(assetId, 'recover', {
      effectiveDate: today,
      note: `Recovered via exit workflow step “${task.step}”`,
    })
  }

  return (
    <div className='w-full space-y-5'>
      {sections.map((section) => (
        <div key={section.title}>
          <h2 className='text-neutral-1600 text-paragraph-md font-medium'>{section.title}</h2>
          <p className='text-paragraph-sm text-neutral-1000 mb-2'>{section.blurb}</p>
          <div className='border-grey-200 overflow-hidden rounded-[6px] border bg-white'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Workflow step</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Linked transaction / clearance</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {section.tasks.map((task) => {
                  const outstanding =
                    task.workflow === 'Exit' ? outstandingFor(task.employeeId) : []
                  return (
                    <TableRow key={task.id}>
                      <TableCell className='text-sm font-medium'>{task.employeeName}</TableCell>
                      <TableCell>
                        <div className='flex flex-col'>
                          <span className='text-sm'>{task.step}</span>
                          <span className='text-paragraph-sm text-neutral-1000'>
                            {task.assetHint}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className='text-sm'>{formatDate(task.dueDate)}</TableCell>
                      <TableCell>{statusBadge(task.status)}</TableCell>
                      <TableCell>
                        {task.linkedTxn ? (
                          <span className='text-paragraph-sm'>{task.linkedTxn}</span>
                        ) : task.workflow === 'Exit' && outstanding.length > 0 ? (
                          <div className='flex flex-col gap-0.5'>
                            <span className='text-paragraph-sm text-red-1400 font-medium'>
                              Exit clearance held — {outstanding.length} asset(s) outstanding
                            </span>
                            {outstanding.map((a) => (
                              <span key={a.id} className='text-paragraph-sm text-neutral-1000'>
                                {a.assetTag} · {a.name}
                              </span>
                            ))}
                          </div>
                        ) : task.workflow === 'Exit' ? (
                          <span className='text-paragraph-sm text-green-1300'>
                            No outstanding assets — clearance can proceed
                          </span>
                        ) : (
                          <span className='text-paragraph-sm text-neutral-1000'>—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {task.status !== 'Completed' && task.workflow === 'Onboarding' && (
                          <Button
                            className='h-7 rounded-[6px] px-2.5'
                            onClick={() => quickIssue(task)}
                          >
                            Issue asset
                          </Button>
                        )}
                        {task.status !== 'Completed' &&
                          task.workflow === 'Exit' &&
                          outstanding.length > 0 && (
                            <div className='flex flex-col gap-1'>
                              {outstanding.map((a) => (
                                <Button
                                  key={a.id}
                                  variant='outline'
                                  className='h-7 rounded-[6px] px-2.5'
                                  onClick={() => quickRecover(task, a.id)}
                                >
                                  Recover {a.assetTag}
                                </Button>
                              ))}
                            </div>
                          )}
                        {task.status === 'Completed' && (
                          <span className='text-paragraph-sm text-neutral-1000'>Done</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}
    </div>
  )
}
