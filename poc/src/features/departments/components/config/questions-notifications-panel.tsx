import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { type Department } from '../../data/departments'
import { type DepartmentConfigStore } from '../../hooks/use-department-config'
import { VersionBadge } from '../department-badges'
import { InterviewQuestionsPanel } from './interview-questions-panel'

interface PanelProps {
  config: DepartmentConfigStore
  departments: Department[]
}

/**
 * Interview assessment question management — CRUD, required flags, rating
 * sets, checklist order and preview (IAQ-02/03/05/06/07, DEPT-32) — plus
 * tenant-scoped, versioned notification templates for department events
 * (DEPT-20).
 */
export function QuestionsNotificationsPanel({ config, departments }: PanelProps) {
  const [editingBody, setEditingBody] = useState<Record<string, string>>({})

  return (
    <div className='space-y-4'>
      <InterviewQuestionsPanel config={config} departments={departments} />

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
