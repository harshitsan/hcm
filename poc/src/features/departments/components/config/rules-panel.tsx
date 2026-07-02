import { useState } from 'react'
import { Plus, Trash } from 'phosphor-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import { type Department } from '../../data/departments'
import { type DepartmentConfigStore } from '../../hooks/use-department-config'
import { FlaggedBadge, VersionBadge } from '../department-badges'

interface RulesPanelProps {
  config: DepartmentConfigStore
  departments: Department[]
}

/**
 * Department-keyed approver graphs and role/policy applicability decision
 * tables (DEPT-07/15): governed, versioned config the workflow and rules
 * engines read — no code changes needed.
 */
export function RulesPanel({ config, departments }: RulesPanelProps) {
  const [kind, setKind] = useState<'role' | 'policy'>('policy')
  const [name, setName] = useState('')
  const [deptId, setDeptId] = useState('')
  const [cascade, setCascade] = useState(true)

  const deptName = (id: string) =>
    departments.find((d) => d.id === id)?.name ?? `${id} (deleted)`

  const handleAddRule = () => {
    if (name.trim().length < 2) {
      toast.error('Enter a role or policy name')
      return
    }
    if (!deptId) {
      toast.error('Pick the department the rule is keyed on')
      return
    }
    config.addScopeRule({ kind, name: name.trim(), departmentId: deptId, cascade })
    setName('')
    setDeptId('')
    setCascade(true)
  }

  return (
    <div className='space-y-4'>
      <Card className='border-gray-200'>
        <CardHeader>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Approver graphs (workflow engine)
          </CardTitle>
          <p className='text-neutral-1000 text-xs'>
            Each save creates a new effective-dated version — in-flight approvals keep the
            version that applied when they started.
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Graph</TableHead>
                <TableHead>Keyed on department</TableHead>
                <TableHead>Uses department head</TableHead>
                <TableHead>Cascades to parents</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {config.approverGraphs.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className='text-neutral-1600 text-sm font-medium'>
                    {g.name}
                  </TableCell>
                  <TableCell className='text-neutral-1900 text-sm'>
                    {deptName(g.keyDepartmentId)}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={g.useDepartmentHead}
                      onCheckedChange={(checked) =>
                        config.updateApproverGraph(g.id, { useDepartmentHead: checked })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={g.cascadeToParents}
                      onCheckedChange={(checked) =>
                        config.updateApproverGraph(g.id, { cascadeToParents: checked })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <VersionBadge version={g.version} />
                    <span className='text-neutral-1000 ml-1 text-xs'>
                      eff. {g.effectiveFrom}
                    </span>
                  </TableCell>
                  <TableCell>{g.flagged ? <FlaggedBadge /> : <Badge variant='badge_active'>OK</Badge>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className='border-gray-200'>
        <CardHeader>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Role & policy applicability decision table (rules engine)
          </CardTitle>
          <p className='text-neutral-1000 text-xs'>
            Rows match on a department (optionally cascading through its children).
            Applicability always reflects current effective membership.
          </p>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex flex-wrap items-center gap-2'>
            <Select value={kind} onValueChange={(v) => setKind(v as 'role' | 'policy')}>
              <SelectTrigger variant='secondary' className='w-[110px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='policy'>Policy</SelectItem>
                <SelectItem value='role'>Role</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={kind === 'policy' ? 'Policy name' : 'Role name'}
              className='w-[200px]'
            />
            <Select value={deptId} onValueChange={setDeptId}>
              <SelectTrigger variant='secondary' className='w-[220px]'>
                <SelectValue placeholder='Keyed on department' />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <label className='flex items-center gap-2 text-sm'>
              <Switch checked={cascade} onCheckedChange={setCascade} />
              <span className='text-neutral-1900'>Cascade to child departments</span>
            </label>
            <Button onClick={handleAddRule} className='h-8'>
              <Plus size={12} weight='bold' />
              Add row
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kind</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Cascade</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className='w-[60px]' />
              </TableRow>
            </TableHeader>
            <TableBody>
              {config.scopeRules.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Badge variant={r.kind === 'role' ? 'open' : 'secondary'}>
                      {r.kind === 'role' ? 'Role scope' : 'Policy'}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-neutral-1600 text-sm font-medium'>
                    {r.name}
                  </TableCell>
                  <TableCell className='text-neutral-1900 text-sm'>
                    {deptName(r.departmentId)}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={r.cascade}
                      onCheckedChange={() => config.toggleScopeCascade(r.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <VersionBadge version={r.version} />
                  </TableCell>
                  <TableCell>
                    {r.flagged ? <FlaggedBadge /> : <Badge variant='badge_active'>OK</Badge>}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant='icon2'
                      className='text-neutral-1900 h-7 w-7'
                      aria-label={`Remove rule ${r.name}`}
                      onClick={() => config.removeScopeRule(r.id)}
                    >
                      <Trash size={14} weight='bold' />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
