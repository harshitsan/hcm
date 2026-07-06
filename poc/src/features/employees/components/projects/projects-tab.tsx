import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRole } from '@/context/role-context'
import { useProjects } from '../../hooks/use-projects'
import {
  DayWiseAllocationTab,
  EmployeeAllocationTab,
} from './allocation-tabs'
import { BulkAssignmentsTab } from './bulk-assignments-tab'
import { MyAllocationTab } from './my-allocation-tab'
import { ProjectMasterTab } from './project-master-tab'
import { TaskLibraryTab } from './task-library-tab'

/**
 * Projects & Resource Management surface (Kensium "More / Resource
 * Management" parity):
 * - Managers/admins: Bulk Resource Assignments, Day Wise Resource
 *   Allocation, Employee Project Allocation, Project Master, Task Library.
 * - Employee (User): My Project Allocation with per-section refresh.
 */
export function ProjectsTab() {
  const store = useProjects()
  const { hasRole } = useRole()

  const isEmployee = hasRole('Employee (User)', 'Employee (Non-User)')

  if (hasRole('Employee (Non-User)')) {
    return (
      <div className='rounded-md border border-gray-200 bg-white px-4 py-6'>
        <p className='text-neutral-1600 text-sm font-medium'>
          No self-service login for this employee.
        </p>
        <p className='text-paragraph-sm text-neutral-1000 pt-1'>
          Project allocations for non-user employees are planned by their
          manager via Bulk Resource Assignments and remain fully reportable.
        </p>
      </div>
    )
  }

  if (isEmployee) {
    return (
      <Tabs defaultValue='my-allocation'>
        <TabsList className='mb-2'>
          <TabsTrigger value='my-allocation'>My Project Allocation</TabsTrigger>
        </TabsList>
        <TabsContent value='my-allocation'>
          <MyAllocationTab store={store} />
        </TabsContent>
      </Tabs>
    )
  }

  return (
    <Tabs defaultValue='bulk-assignments'>
      <TabsList className='mb-2'>
        <TabsTrigger value='bulk-assignments'>Bulk Assignments</TabsTrigger>
        <TabsTrigger value='day-wise'>Day Wise Allocation</TabsTrigger>
        <TabsTrigger value='employee-allocation'>
          Employee Allocation
        </TabsTrigger>
        <TabsTrigger value='project-master'>Project Master</TabsTrigger>
        <TabsTrigger value='task-library'>Task Library</TabsTrigger>
      </TabsList>

      <TabsContent value='bulk-assignments'>
        <BulkAssignmentsTab store={store} />
      </TabsContent>
      <TabsContent value='day-wise'>
        <DayWiseAllocationTab store={store} />
      </TabsContent>
      <TabsContent value='employee-allocation'>
        <EmployeeAllocationTab store={store} />
      </TabsContent>
      <TabsContent value='project-master'>
        <ProjectMasterTab store={store} />
      </TabsContent>
      <TabsContent value='task-library'>
        <TaskLibraryTab store={store} />
      </TabsContent>
    </Tabs>
  )
}
