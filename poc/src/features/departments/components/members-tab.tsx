import { useMemo, useState } from 'react'
import { Plus, X } from 'phosphor-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CURRENT_COMPANY_ID } from '../data/departments'
import { type DepartmentsStore } from '../hooks/use-departments'
import { NonUserBadge } from './department-badges'

interface MembersTabProps {
  store: DepartmentsStore
}

/**
 * Employee ↔ department membership management: every employee must keep at
 * least one department (DEPT-05), may belong to several (DEPT-06), and
 * non-portal employees appear in the roster like everyone else (DEPT-12).
 */
export function MembersTab({ store }: MembersTabProps) {
  const [newName, setNewName] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newDeptId, setNewDeptId] = useState('')
  const [newIsPortalUser, setNewIsPortalUser] = useState(true)

  const companyEmployees = useMemo(
    () => store.employees.filter((e) => e.companyId === CURRENT_COMPANY_ID),
    [store.employees]
  )
  const activeDepartments = useMemo(
    () =>
      store.departments.filter(
        (d) => d.companyId === CURRENT_COMPANY_ID && d.status === 'active'
      ),
    [store.departments]
  )

  const handleAddEmployee = () => {
    if (newName.trim().length < 2) {
      toast.error('Enter the employee name')
      return
    }
    // At-least-one-department rule: the record cannot be finalized without one.
    if (!newDeptId) {
      toast.error('At least one department is required before the record can be finalized')
      return
    }
    store.addEmployee(newName.trim(), newTitle.trim() || 'Employee', newDeptId, newIsPortalUser)
    setNewName('')
    setNewTitle('')
    setNewDeptId('')
    setNewIsPortalUser(true)
  }

  return (
    <div className='space-y-4'>
      <Card className='border-gray-200'>
        <CardHeader>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            New employee record
          </CardTitle>
          <p className='text-neutral-1000 text-xs'>
            Every employee — portal user or not — must be assigned to at least one
            department before the record is finalized.
          </p>
        </CardHeader>
        <CardContent className='flex flex-wrap items-center gap-2'>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder='Full name'
            className='w-[180px]'
          />
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder='Job title'
            className='w-[180px]'
          />
          <Select value={newDeptId} onValueChange={setNewDeptId}>
            <SelectTrigger variant='secondary' className='w-[220px]'>
              <SelectValue placeholder='Department (required)' />
            </SelectTrigger>
            <SelectContent>
              {activeDepartments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name} ({d.acronym || d.id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className='flex items-center gap-2 text-sm'>
            <Checkbox
              variant='blue'
              checked={newIsPortalUser}
              onCheckedChange={(checked) => setNewIsPortalUser(!!checked)}
            />
            <span className='text-neutral-1900'>Portal user</span>
          </label>
          <Button onClick={handleAddEmployee} className='h-8'>
            <Plus size={12} weight='bold' />
            Add employee
          </Button>
        </CardContent>
      </Card>

      <Card className='border-gray-200'>
        <CardHeader>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Department roster ({companyEmployees.length} employees)
          </CardTitle>
          <p className='text-neutral-1000 text-xs'>
            Non-User employees have no login but are fully represented in rosters,
            reporting and policy applicability.
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Department memberships</TableHead>
                <TableHead className='w-[140px]'>Add membership</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companyEmployees.map((emp) => {
                const available = activeDepartments.filter(
                  (d) => !emp.departmentIds.includes(d.id)
                )
                return (
                  <TableRow key={emp.id}>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <span className='text-neutral-1600 text-sm font-medium'>
                          {emp.name}
                        </span>
                        {!emp.isPortalUser && <NonUserBadge />}
                      </div>
                    </TableCell>
                    <TableCell className='text-neutral-1900 text-sm'>{emp.title}</TableCell>
                    <TableCell>
                      <div className='flex flex-wrap gap-1.5'>
                        {emp.departmentIds.map((deptId) => {
                          const dep = store.deptById.get(deptId)
                          return (
                            <Badge key={deptId} variant='open' className='gap-1'>
                              {dep?.name ?? deptId}
                              <button
                                type='button'
                                aria-label={`Remove from ${dep?.name ?? deptId}`}
                                onClick={() => store.removeMembership(emp.id, deptId)}
                                className='hover:text-red-1400'
                              >
                                <X size={10} weight='bold' />
                              </button>
                            </Badge>
                          )
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant='outline'
                            className='h-7 px-2 text-xs'
                            disabled={available.length === 0}
                          >
                            <Plus size={10} weight='bold' />
                            Add
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end' className='min-w-[200px]'>
                          {available.map((d) => (
                            <DropdownMenuItem
                              key={d.id}
                              onClick={() => store.addMembership(emp.id, d.id)}
                            >
                              {d.name} ({d.acronym || d.id})
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
