import { useMemo, useState } from 'react'
import {
  UserPlus, Check, Clock, CircleDot, Circle, Building2, CalendarDays, MapPin, ListChecks,
} from 'lucide-react'
import { useApp } from '../app/store'
import {
  getEmployee, employees, onboardingTasks, getDepartment,
  type OnboardingTask, type Employee,
} from '../data/mock'
import {
  Avatar, Badge, Button, Card, CardBody, CardHeader, CardTitle, EmptyState,
  PageHeader, ProgressBar, Stepper, useToast,
} from '../components/ui'
import { cn } from '../lib/cn'

const STAGES = ['Offer', 'Documents', 'Assets', 'Induction']

type Status = OnboardingTask['status']

const statusTone: Record<Status, 'success' | 'info' | 'neutral'> = {
  Done: 'success',
  'In progress': 'info',
  Pending: 'neutral',
}

function statusIcon(status: Status) {
  if (status === 'Done') return <Check className="h-3.5 w-3.5" />
  if (status === 'In progress') return <CircleDot className="h-3.5 w-3.5" />
  return <Circle className="h-3.5 w-3.5" />
}

function formatJoin(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Onboarding() {
  const { role } = useApp()
  const { push } = useToast()
  const readOnly = role === 'employee'

  const hire: Employee =
    getEmployee('e14') ?? employees.find((e) => e.status === 'Onboarding') ?? employees[0]
  const dept = getDepartment(hire.departmentId)

  const [tasks, setTasks] = useState<OnboardingTask[]>(onboardingTasks)

  const doneCount = tasks.filter((t) => t.status === 'Done').length
  const completion = Math.round((doneCount / tasks.length) * 100)

  // Current stage = first stage that still has a non-Done task.
  const currentStage = useMemo(() => {
    const idx = STAGES.findIndex((s) =>
      tasks.some((t) => t.stage === s && t.status !== 'Done'),
    )
    return idx === -1 ? STAGES.length : idx
  }, [tasks])

  const toggleDone = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t
        const next: Status = t.status === 'Done' ? 'In progress' : 'Done'
        push({
          title: next === 'Done' ? `Completed · ${t.label}` : `Reopened · ${t.label}`,
          tone: next === 'Done' ? 'success' : 'neutral',
        })
        return { ...t, status: next }
      }),
    )
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Onboarding"
        subtitle={readOnly ? 'Your onboarding checklist and progress.' : 'Welcome your new hire and track every step.'}
        icon={<UserPlus className="h-5 w-5" />}
      />

      {/* Hire header card */}
      <Card className="mb-6">
        <CardBody className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <Avatar name={hire.name} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">{hire.name}</h2>
                <Badge tone="accent" dot>Onboarding</Badge>
              </div>
              <p className="text-sm text-muted-fg">{hire.title}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-fg">
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" /> {dept?.name ?? 'Unassigned'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> {hire.location}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" /> Joins {formatJoin(hire.joinDate)}
                </span>
              </div>
            </div>
          </div>

          <div className="w-full sm:w-56">
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-semibold">Overall progress</span>
              <span className="tnum font-bold text-fg">{completion}%</span>
            </div>
            <ProgressBar value={completion} tone={completion === 100 ? 'success' : 'primary'} />
            <p className="mt-1.5 text-xs text-muted-fg tnum">
              {doneCount} of {tasks.length} tasks complete
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Stepper across the stages */}
      <Card className="mb-6">
        <CardBody>
          <Stepper steps={STAGES} current={currentStage} />
        </CardBody>
      </Card>

      {/* Checklist grouped by stage */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-muted-fg" />
            <CardTitle>Checklist</CardTitle>
          </div>
          <span className="text-2xs font-semibold uppercase tracking-wide text-muted-fg">
            Grouped by stage
          </span>
        </CardHeader>
        <CardBody className="p-0">
          {tasks.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={<Check className="h-5 w-5" />} title="No tasks" description="This onboarding has no checklist items yet." />
            </div>
          ) : (
            STAGES.map((stage) => {
              const group = tasks.filter((t) => t.stage === stage)
              if (group.length === 0) return null
              const stageDone = group.every((t) => t.status === 'Done')
              return (
                <div key={stage} className="border-b border-border last:border-b-0">
                  <div className="flex items-center justify-between bg-surface2/40 px-5 py-2">
                    <span className="text-2xs font-bold uppercase tracking-wide text-muted-fg">{stage}</span>
                    {stageDone ? (
                      <Badge tone="success">Complete</Badge>
                    ) : (
                      <span className="text-2xs font-semibold text-muted-fg tnum">
                        {group.filter((t) => t.status === 'Done').length}/{group.length}
                      </span>
                    )}
                  </div>
                  <ul className="divide-y divide-border">
                    {group.map((t) => {
                      const isDone = t.status === 'Done'
                      return (
                        <li key={t.id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/40">
                          <span
                            className={cn(
                              'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                              statusTone[t.status] === 'success' && 'bg-success/12 text-success',
                              statusTone[t.status] === 'info' && 'bg-info/12 text-info',
                              statusTone[t.status] === 'neutral' && 'bg-muted text-muted-fg',
                            )}
                          >
                            {statusIcon(t.status)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className={cn('truncate text-sm font-semibold', isDone && 'text-muted-fg line-through')}>
                              {t.label}
                            </p>
                            <p className="truncate text-xs text-muted-fg">Owner · {t.owner}</p>
                          </div>
                          <Badge tone={statusTone[t.status]} className="hidden sm:inline-flex">
                            {t.status === 'In progress' && <Clock className="h-3 w-3" />}
                            {t.status}
                          </Badge>
                          {readOnly ? (
                            <Badge tone={statusTone[t.status]} className="sm:hidden">{t.status}</Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant={isDone ? 'ghost' : 'subtle'}
                              onClick={() => toggleDone(t.id)}
                            >
                              <Check className="h-3.5 w-3.5" /> {isDone ? 'Undo' : 'Mark done'}
                            </Button>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })
          )}
        </CardBody>
      </Card>
    </div>
  )
}
