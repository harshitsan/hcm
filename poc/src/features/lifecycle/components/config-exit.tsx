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
import { type ExitTypeDef } from '../data/config'
import { DEPARTMENTS, LOCATIONS, POSITION_LEVELS } from '../data/shared'
import { type LifecycleConfigStore } from '../hooks/use-lifecycle-config'
import { ChipList, SectionCard } from './config-widgets'

const CATEGORIES = ['Voluntary', 'Involuntary', 'Retirement'] as const

/** Exit enablement, exit-type catalog, notice rules and layoff gating. */
export function ConfigExit({ config }: { config: LifecycleConfigStore }) {
  const [typeDialog, setTypeDialog] = useState<ExitTypeDef | 'new' | null>(null)
  const [typeName, setTypeName] = useState('')
  const [typeCategory, setTypeCategory] =
    useState<(typeof CATEGORIES)[number]>('Voluntary')
  const [typeClassSpecific, setTypeClassSpecific] = useState(false)

  const [ruleFilterLoc, setRuleFilterLoc] = useState('all')
  const [ruleFilterDept, setRuleFilterDept] = useState('all')
  const [ruleOpen, setRuleOpen] = useState(false)
  const [ruleName, setRuleName] = useState('')
  const [ruleDays, setRuleDays] = useState('30')

  const [layoffCount, setLayoffCount] = useState('')
  const [layoffLocation, setLayoffLocation] = useState('Hyderabad')
  const [layoffApprover, setLayoffApprover] = useState('')

  const rules = config.noticeRules.items.filter(
    (r) =>
      (ruleFilterLoc === 'all' || r.locations.includes(ruleFilterLoc)) &&
      (ruleFilterDept === 'all' || r.departments.includes(ruleFilterDept))
  )

  const openTypeDialog = (t: ExitTypeDef | 'new') => {
    setTypeDialog(t)
    setTypeName(t === 'new' ? '' : t.name)
    setTypeCategory(t === 'new' ? 'Voluntary' : t.category)
    setTypeClassSpecific(t === 'new' ? false : t.employeeClassSpecific)
  }

  const saveType = () => {
    if (!typeName.trim()) {
      toast.error('Exit type name is required')
      return
    }
    if (typeDialog === 'new') {
      config.exitTypes.add(
        {
          name: typeName.trim(),
          category: typeCategory,
          employeeClassSpecific: typeClassSpecific,
        },
        'xt'
      )
      config.logConfigChange('Exit type added', typeName.trim())
      toast.success('Exit type added — selectable on new exit requests')
    } else if (typeDialog) {
      config.exitTypes.update(typeDialog.id, {
        name: typeName.trim(),
        category: typeCategory,
        employeeClassSpecific: typeClassSpecific,
      })
      config.logConfigChange('Exit type updated', typeName.trim())
      toast.success('Exit type saved — applies to subsequent exit requests')
    }
    setTypeDialog(null)
  }

  return (
    <div>
      <SectionCard title='Exit Management setup'>
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <Label>Does your organization support exit management?</Label>
            <Switch
              checked={config.settings.exitManagementEnabled}
              onCheckedChange={(v) =>
                config.updateSettings({ exitManagementEnabled: v }, 'Exit management')
              }
            />
          </div>
          <div className='flex items-center justify-between'>
            <Label>Do you perform exit questionnaire?</Label>
            <Switch
              checked={config.settings.exitQuestionnaireEnabled}
              onCheckedChange={(v) =>
                config.updateSettings({ exitQuestionnaireEnabled: v }, 'Exit questionnaire')
              }
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title='Exit types'
        description='Only configured exit types are selectable when an exit is raised.'
        actions={
          <Button size='sm' onClick={() => openTypeDialog('new')}>
            Add exit type
          </Button>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Employee-class specific</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {config.exitTypes.items.map((t) => (
              <TableRow key={t.id}>
                <TableCell className='font-medium'>{t.name}</TableCell>
                <TableCell>
                  <Badge variant='outline'>{t.category}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={t.employeeClassSpecific ? 'badge_active' : 'badge_inactive'}>
                    {t.employeeClassSpecific ? 'Yes' : 'No'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button size='sm' variant='outline' onClick={() => openTypeDialog(t)}>
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>

      <SectionCard
        title='Notice period rules'
        description='The rule matching an employee’s location, department and position level derives their notice on exit.'
        actions={
          <Button size='sm' onClick={() => setRuleOpen(true)}>
            Add rule
          </Button>
        }
      >
        <div className='mb-3 flex flex-wrap items-center gap-2'>
          <Select value={ruleFilterLoc} onValueChange={setRuleFilterLoc}>
            <SelectTrigger variant='secondary' className='h-7 w-[160px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All locations</SelectItem>
              {LOCATIONS.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={ruleFilterDept} onValueChange={setRuleFilterDept}>
            <SelectTrigger variant='secondary' className='h-7 w-[170px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All departments</SelectItem>
              {DEPARTMENTS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size='sm'
            variant='outline'
            onClick={() => {
              setRuleFilterLoc('all')
              setRuleFilterDept('all')
            }}
          >
            Reset
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rule</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Class specific</TableHead>
              <TableHead>Locations</TableHead>
              <TableHead>Departments</TableHead>
              <TableHead>Position levels</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className='text-neutral-1000 text-center text-sm'>
                  No records found
                </TableCell>
              </TableRow>
            ) : (
              rules.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className='font-medium'>{r.name}</TableCell>
                  <TableCell>{r.durationDays} days</TableCell>
                  <TableCell>{r.employeeClassSpecific ? 'Yes' : 'No'}</TableCell>
                  <TableCell><ChipList items={r.locations} /></TableCell>
                  <TableCell><ChipList items={r.departments} /></TableCell>
                  <TableCell><ChipList items={r.positionLevels} /></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </SectionCard>

      <SectionCard
        title='Layoff threshold & approvers'
        description='Layoffs below the minimum headcount are not processed as layoffs; requests route to the location approver.'
      >
        <div className='mb-3 flex flex-wrap items-end gap-2'>
          <div className='space-y-1'>
            <Label>Minimum employees to initiate a layoff</Label>
            <Input
              type='number'
              className='w-[220px]'
              value={config.settings.layoffMinEmployees}
              onChange={(e) =>
                config.updateSettings(
                  { layoffMinEmployees: Number(e.target.value) || 0 },
                  'Layoff threshold'
                )
              }
            />
          </div>
          <div className='space-y-1'>
            <Label>Simulate: affected employees</Label>
            <Input
              type='number'
              className='w-[180px]'
              value={layoffCount}
              onChange={(e) => setLayoffCount(e.target.value)}
              placeholder='e.g. 6'
            />
          </div>
          <Button
            size='sm'
            onClick={() => {
              const n = Number(layoffCount)
              if (!n || n < config.settings.layoffMinEmployees) {
                toast.error(
                  `Not processed as a layoff — fewer than ${config.settings.layoffMinEmployees} employees`
                )
              } else {
                toast.success('Layoff initiated — routed to the location approvers')
              }
            }}
          >
            Initiate layoff (demo)
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Location</TableHead>
              <TableHead>Approver</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {LOCATIONS.map((loc) => {
              const entries = config.layoffApprovers.items.filter(
                (a) => a.location === loc
              )
              return entries.length === 0 ? (
                <TableRow key={loc}>
                  <TableCell>{loc}</TableCell>
                  <TableCell className='text-neutral-1000 text-xs'>
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.location}</TableCell>
                    <TableCell>{a.approver}</TableCell>
                  </TableRow>
                ))
              )
            })}
          </TableBody>
        </Table>
        <div className='mt-3 flex flex-wrap items-end gap-2'>
          <Select value={layoffLocation} onValueChange={setLayoffLocation}>
            <SelectTrigger variant='secondary' className='h-8 w-[160px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOCATIONS.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            className='w-[200px]'
            placeholder='Approver name'
            value={layoffApprover}
            onChange={(e) => setLayoffApprover(e.target.value)}
          />
          <Button
            size='sm'
            onClick={() => {
              if (!layoffApprover.trim()) {
                toast.error('Approver name is required')
                return
              }
              config.layoffApprovers.add(
                { location: layoffLocation, approver: layoffApprover.trim() },
                'la'
              )
              config.logConfigChange('Layoff approver added', `${layoffLocation} · ${layoffApprover.trim()}`)
              toast.success('Layoff approver added')
              setLayoffApprover('')
            }}
          >
            Add approver
          </Button>
        </div>
      </SectionCard>

      {/* Exit type dialog */}
      <Dialog open={typeDialog !== null} onOpenChange={(o) => !o && setTypeDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {typeDialog === 'new' ? 'Add exit type' : 'Edit exit type'}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1'>
              <Label>Name</Label>
              <Input value={typeName} onChange={(e) => setTypeName(e.target.value)} />
            </div>
            <div className='space-y-1'>
              <Label>Type</Label>
              <Select
                value={typeCategory}
                onValueChange={(v) => setTypeCategory(v as (typeof CATEGORIES)[number])}
              >
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='flex items-center justify-between'>
              <Label>Employee-class specific</Label>
              <Switch checked={typeClassSpecific} onCheckedChange={setTypeClassSpecific} />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setTypeDialog(null)}>
              Cancel
            </Button>
            <Button onClick={saveType}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notice rule dialog */}
      <Dialog open={ruleOpen} onOpenChange={setRuleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add notice period rule</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1'>
              <Label>Rule name</Label>
              <Input value={ruleName} onChange={(e) => setRuleName(e.target.value)} />
            </div>
            <div className='space-y-1'>
              <Label>Duration (days)</Label>
              <Input type='number' value={ruleDays} onChange={(e) => setRuleDays(e.target.value)} />
            </div>
            <p className='text-neutral-1000 text-xs'>
              The rule applies to all locations, departments and position
              levels unless narrowed later.
            </p>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setRuleOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const days = Number(ruleDays)
                if (!ruleName.trim() || !days || days < 0) {
                  toast.error('Name and a positive duration are required')
                  return
                }
                config.noticeRules.add(
                  {
                    name: ruleName.trim(),
                    durationDays: days,
                    employeeClassSpecific: false,
                    locations: [...LOCATIONS],
                    departments: [...DEPARTMENTS],
                    positionLevels: [...POSITION_LEVELS],
                  },
                  'nr'
                )
                config.logConfigChange('Notice period rule added', ruleName.trim())
                toast.success('Notice rule added — applies to subsequent exits')
                setRuleOpen(false)
                setRuleName('')
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
