import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { type Department } from '../../data/departments'
import { type DepartmentConfigStore } from '../../hooks/use-department-config'
import { FlaggedBadge, VersionBadge } from '../department-badges'

interface PanelProps {
  config: DepartmentConfigStore
  departments: Department[]
}

/**
 * Interview-question department applicability (DEPT-32) and tenant-scoped,
 * versioned notification templates for department events (DEPT-20).
 */
export function QuestionsNotificationsPanel({ config, departments }: PanelProps) {
  const [editingBody, setEditingBody] = useState<Record<string, string>>({})

  const deptName = (id: string) =>
    departments.find((d) => d.id === id)?.name ?? `${id} (deleted)`

  return (
    <div className='space-y-4'>
      <Card className='border-gray-200'>
        <CardHeader>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Interview assessment questions — department applicability
          </CardTitle>
          <p className='text-neutral-1000 text-xs'>
            Questions appear only for interviews tied to the selected departments and
            render in checklist order.
          </p>
        </CardHeader>
        <CardContent className='space-y-3'>
          {[...config.interviewQuestions]
            .sort((a, b) => a.order - b.order)
            .map((q) => (
              <div key={q.id} className='rounded-md border border-gray-200 p-3'>
                <div className='flex flex-wrap items-center gap-2'>
                  <Badge variant='secondary'>#{q.order}</Badge>
                  <span className='text-neutral-1600 text-sm font-medium'>{q.question}</span>
                  {q.flagged && <FlaggedBadge />}
                </div>
                <div className='mt-2 flex flex-wrap items-center gap-1.5'>
                  <span className='text-neutral-1000 text-xs'>Applies to:</span>
                  {q.departmentIds.map((id) => (
                    <Badge key={id} variant='open'>
                      {deptName(id)}
                    </Badge>
                  ))}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='outline' className='h-6 px-2 text-xs'>
                        Edit departments
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='start' className='min-w-[240px] p-2'>
                      {departments.map((d) => (
                        <label
                          key={d.id}
                          className='flex items-center gap-2 rounded-sm px-1 py-1 text-sm hover:bg-neutral-200'
                        >
                          <Checkbox
                            variant='blue'
                            checked={q.departmentIds.includes(d.id)}
                            onCheckedChange={() =>
                              config.toggleQuestionDepartment(q.id, d.id)
                            }
                          />
                          <span className='text-neutral-1900'>{d.name}</span>
                        </label>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
        </CardContent>
      </Card>

      <Card className='border-gray-200'>
        <CardHeader>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Notification templates — department events
          </CardTitle>
          <p className='text-neutral-1000 text-xs'>
            Templates are tenant-scoped and versioned. Edits apply to this company only;
            in-flight notifications keep the version effective when they were triggered.
          </p>
        </CardHeader>
        <CardContent className='space-y-3'>
          {config.notificationTemplates.map((t) => (
            <div key={t.id} className='rounded-md border border-gray-200 p-3'>
              <div className='mb-2 flex flex-wrap items-center gap-2'>
                <span className='text-neutral-1600 text-sm font-medium'>{t.name}</span>
                <Badge variant='secondary'>{t.event}</Badge>
                <VersionBadge version={t.version} />
              </div>
              <Textarea
                rows={2}
                value={editingBody[t.id] ?? t.body}
                onChange={(e) =>
                  setEditingBody((prev) => ({ ...prev, [t.id]: e.target.value }))
                }
              />
              <div className='mt-2 flex justify-end'>
                <Button
                  variant='outline'
                  className='h-7 px-2 text-xs'
                  disabled={(editingBody[t.id] ?? t.body) === t.body}
                  onClick={() => {
                    config.saveTemplateBody(t.id, editingBody[t.id] ?? t.body)
                    setEditingBody((prev) => {
                      const next = { ...prev }
                      delete next[t.id]
                      return next
                    })
                  }}
                >
                  Save as v{t.version + 1}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
