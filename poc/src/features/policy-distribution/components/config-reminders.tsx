import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { type EscalationPath } from '../data/config'
import { type PolicyConfigStore } from '../hooks/use-policy-config'
import { CriticalityBadge } from './status-badges'

/** Parses '50, 75, 100' into validated SLA percentages. */
function parseMilestones(raw: string): number[] | null {
  const parts = raw
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
  if (parts.length === 0) return null
  const nums = parts.map(Number)
  if (nums.some((n) => Number.isNaN(n) || n <= 0 || n > 100)) return null
  return [...new Set(nums)]
}

/**
 * Platform-governed reminder SLA milestones (default 50/75/100, adjustable
 * per criticality) and criticality-mapped escalation paths executed by the
 * workflow engine on overdue acknowledgments.
 */
export function ConfigReminders({
  config,
  readOnly,
}: {
  config: PolicyConfigStore
  readOnly: boolean
}) {
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [editingPath, setEditingPath] = useState<EscalationPath | null>(null)
  const [routeDraft, setRouteDraft] = useState('')
  const [hoursDraft, setHoursDraft] = useState('')

  const openPathEditor = (p: EscalationPath) => {
    setEditingPath(p)
    setRouteDraft(p.route.join(', '))
    setHoursDraft(String(p.slaHoursToAct))
  }

  const savePath = () => {
    if (!editingPath) return
    const route = routeDraft
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean)
    const hours = Number(hoursDraft)
    if (route.length === 0 || Number.isNaN(hours) || hours <= 0) {
      toast.warning('Provide at least one notified party and a positive SLA')
      return
    }
    config.updateEscalationRoute(editingPath.id, route, hours)
    setEditingPath(null)
  }

  return (
    <div className='space-y-5'>
      {/* Reminder milestones per criticality */}
      <div className='space-y-2'>
        <h3 className='text-neutral-1600 text-sm font-semibold'>
          Reminder SLA milestones
        </h3>
        <p className='text-paragraph-sm text-neutral-1000'>
          Reminders default to 50%, 75% and 100% of the SLA and are adjustable
          per criticality. Optional and Read-Only policies never receive
          enforcement reminders. New policies inherit these rules automatically.
        </p>
        <div className='border-gray-200 rounded-[6px] border bg-white'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Criticality</TableHead>
                <TableHead>Milestones (% of SLA)</TableHead>
                <TableHead>Enabled</TableHead>
                {!readOnly && <TableHead className='text-right'>Save</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {config.reminderRules.map((r) => {
                const draft = drafts[r.criticality] ?? r.milestones.join(', ')
                return (
                  <TableRow key={r.criticality}>
                    <TableCell>
                      <CriticalityBadge level={r.criticality} />
                    </TableCell>
                    <TableCell>
                      {readOnly ? (
                        <span className='text-sm'>
                          {r.milestones.map((m) => `${m}%`).join(' · ')}
                        </span>
                      ) : (
                        <Input
                          value={draft}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [r.criticality]: e.target.value,
                            }))
                          }
                          className='h-8 max-w-[200px]'
                          placeholder='50, 75, 100'
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        variant='blue'
                        checked={r.enabled}
                        disabled={readOnly}
                        onCheckedChange={() =>
                          config.toggleReminderRule(r.criticality)
                        }
                      />
                    </TableCell>
                    {!readOnly && (
                      <TableCell className='text-right'>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => {
                            const parsed = parseMilestones(draft)
                            if (!parsed) {
                              toast.warning(
                                'Milestones must be percentages between 1 and 100'
                              )
                              return
                            }
                            config.updateMilestones(r.criticality, parsed)
                          }}
                        >
                          Save
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Escalation paths per criticality */}
      <div className='space-y-2'>
        <h3 className='text-neutral-1600 text-sm font-semibold'>
          Escalation paths (criticality-mapped)
        </h3>
        <p className='text-paragraph-sm text-neutral-1000'>
          When an acknowledgment passes 100% of its SLA, the workflow engine
          runs the path mapped to the policy&rsquo;s criticality. Escalations
          close automatically when the employee acknowledges.
        </p>
        <div className='border-gray-200 rounded-[6px] border bg-white'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Criticality</TableHead>
                <TableHead>Escalation route (in order)</TableHead>
                <TableHead>SLA to act</TableHead>
                {!readOnly && <TableHead className='text-right'>Edit</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {config.escalationPaths.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <CriticalityBadge level={p.criticality} />
                  </TableCell>
                  <TableCell>
                    <div className='flex flex-wrap gap-1'>
                      {p.route.map((step, i) => (
                        <Badge key={step} variant='pending'>
                          {i + 1}. {step}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className='text-sm'>{p.slaHoursToAct}h</TableCell>
                  {!readOnly && (
                    <TableCell className='text-right'>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => openPathEditor(p)}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog
        open={Boolean(editingPath)}
        onOpenChange={(open) => {
          if (!open) setEditingPath(null)
        }}
      >
        <DialogContent className='sm:max-w-[440px]'>
          <DialogHeader>
            <DialogTitle>Edit {editingPath?.name}</DialogTitle>
            <DialogDescription>
              The workflow engine notifies these parties, in order, when a{' '}
              {editingPath?.criticality} policy becomes overdue.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1.5'>
              <Label htmlFor='esc-route'>
                Notified parties (comma-separated, in order)
              </Label>
              <Input
                id='esc-route'
                value={routeDraft}
                onChange={(e) => setRouteDraft(e.target.value)}
                placeholder='Direct manager, Company Admin'
              />
            </div>
            <div className='space-y-1.5'>
              <Label htmlFor='esc-hours'>Hours to act after escalation</Label>
              <Input
                id='esc-hours'
                inputMode='numeric'
                value={hoursDraft}
                onChange={(e) => setHoursDraft(e.target.value)}
                placeholder='24'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setEditingPath(null)}>
              Cancel
            </Button>
            <Button onClick={savePath}>Save path</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
