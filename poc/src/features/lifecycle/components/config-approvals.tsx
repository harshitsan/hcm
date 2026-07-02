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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { type ApproverGraph } from '../data/config'
import { LOCATIONS, fmtDate } from '../data/shared'
import { type LifecycleConfigStore } from '../hooks/use-lifecycle-config'
import { CheckboxGroup, ChipList, SectionCard } from './config-widgets'

const STEP_ROLES = ['Manager', 'Department Head', 'HR', 'Group Admin']

/** Approver graphs per lifecycle workflow + disciplinary location approvers. */
export function ConfigApprovals({ config }: { config: LifecycleConfigStore }) {
  const [stepFor, setStepFor] = useState<ApproverGraph['workflow'] | null>(null)
  const [stepRole, setStepRole] = useState('HR')
  const [stepParallel, setStepParallel] = useState(false)
  const [stepCondition, setStepCondition] = useState('')

  const [daOpen, setDaOpen] = useState(false)
  const [daLocs, setDaLocs] = useState<string[]>([])
  const [daApprovers, setDaApprovers] = useState('')
  const [daEditing, setDaEditing] = useState<string | null>(null)

  return (
    <div>
      <SectionCard
        title='Approver graphs (workflow routing)'
        description='Ordered / parallel approvers by role with conditions. Publishing a change versions the graph; in-flight approvals keep their original graph.'
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Workflow</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Effective from</TableHead>
              <TableHead>Steps</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {config.approverGraphs.map((g) => (
              <TableRow key={g.id}>
                <TableCell className='font-medium'>{g.workflow}</TableCell>
                <TableCell>{g.version}</TableCell>
                <TableCell>{fmtDate(g.effectiveFrom)}</TableCell>
                <TableCell>
                  <div className='flex flex-wrap items-center gap-1'>
                    {g.steps.map((s) => (
                      <Badge key={s.order} variant='outline' className='text-[11px]'>
                        {s.order}. {s.role}
                        {s.parallel && ' (parallel)'}
                        {s.condition && ` — ${s.condition}`}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => {
                      setStepFor(g.workflow)
                      setStepRole('HR')
                      setStepParallel(false)
                      setStepCondition('')
                    }}
                  >
                    Add step
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>

      <SectionCard
        title='Disciplinary action approvers'
        description='Disciplinary actions route to the approver configured for the employee’s location.'
        actions={
          <Button
            size='sm'
            onClick={() => {
              setDaEditing(null)
              setDaLocs([])
              setDaApprovers('')
              setDaOpen(true)
            }}
          >
            Add approver group
          </Button>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Group ID</TableHead>
              <TableHead>Locations</TableHead>
              <TableHead>Approvers</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {config.disciplinaryApprovers.items.map((g) => (
              <TableRow key={g.id}>
                <TableCell className='font-medium'>{g.groupCode}</TableCell>
                <TableCell><ChipList items={g.locations} /></TableCell>
                <TableCell><ChipList items={g.approvers} /></TableCell>
                <TableCell>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => {
                      setDaEditing(g.id)
                      setDaLocs(g.locations)
                      setDaApprovers(g.approvers.join(', '))
                      setDaOpen(true)
                    }}
                  >
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>

      {/* Add graph step */}
      <Dialog open={stepFor !== null} onOpenChange={(o) => !o && setStepFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add approver step → publish new graph version ({stepFor})</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1'>
              <Label>Approver role</Label>
              <Select value={stepRole} onValueChange={setStepRole}>
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STEP_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='flex items-center justify-between'>
              <Label>Parallel with previous step</Label>
              <Switch checked={stepParallel} onCheckedChange={setStepParallel} />
            </div>
            <div className='space-y-1'>
              <Label>Condition (optional)</Label>
              <Input
                value={stepCondition}
                onChange={(e) => setStepCondition(e.target.value)}
                placeholder='e.g. Only for Inter-Company transfers'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setStepFor(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (stepFor) {
                  config.addGraphStep(stepFor, {
                    role: stepRole,
                    parallel: stepParallel,
                    condition: stepCondition.trim() || null,
                  })
                }
                setStepFor(null)
              }}
            >
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disciplinary approver group */}
      <Dialog open={daOpen} onOpenChange={setDaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {daEditing ? 'Edit disciplinary approver group' : 'Add disciplinary approver group'}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1'>
              <Label>Locations</Label>
              <CheckboxGroup options={LOCATIONS} value={daLocs} onChange={setDaLocs} />
            </div>
            <div className='space-y-1'>
              <Label>Approvers (comma separated)</Label>
              <Input
                value={daApprovers}
                onChange={(e) => setDaApprovers(e.target.value)}
                placeholder='Vikram Shah'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDaOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const approvers = daApprovers.split(',').map((a) => a.trim()).filter(Boolean)
                if (daLocs.length === 0 || approvers.length === 0) {
                  toast.error('At least one location and one approver are required')
                  return
                }
                if (daEditing) {
                  config.disciplinaryApprovers.update(daEditing, {
                    locations: daLocs,
                    approvers,
                  })
                  config.logConfigChange('Disciplinary approver group updated', daLocs.join(', '))
                  toast.success('Approver group saved')
                } else {
                  config.disciplinaryApprovers.add(
                    {
                      groupCode: `DA-${daLocs[0].slice(0, 3).toUpperCase()}`,
                      locations: daLocs,
                      approvers,
                    },
                    'da'
                  )
                  config.logConfigChange('Disciplinary approver group added', daLocs.join(', '))
                  toast.success('Approver group added')
                }
                setDaOpen(false)
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
