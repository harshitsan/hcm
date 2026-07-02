import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'phosphor-react'
import { toast } from 'sonner'
import { RoleGate } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form } from '@/components/ui/form'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CURRENT_EMPLOYEE, CURRENT_TENANT, type FieldMode } from '../data/profile'
import { type PortalStore } from '../hooks/use-portal'
import { type ProfileStore, type UdfDraft } from '../hooks/use-profile'
import { SelectField, TextField } from './form-fields'
import { formatDate } from './utils'

const FIELD_MODES: FieldMode[] = ['editable', 'view-only', 'hidden']

const udfSchema = z.object({
  label: z.string().min(3, 'Give the field a label'),
  section: z.enum(['Personal', 'Employment']),
  mode: z.enum(['editable', 'view-only', 'hidden']),
  approvalRequired: z.boolean(),
  minLength: z.number().min(0).max(50),
})

const NON_USERS = [
  { name: 'Ramesh Gowda', designation: 'Facility technician', since: '2024-03-11' },
  { name: 'Lakshmi Devi', designation: 'Cafeteria staff', since: '2023-08-02' },
  { name: 'Suresh Babu', designation: 'Field surveyor', since: '2025-01-19' },
]

interface AdminTabProps {
  profile: ProfileStore
  portal: PortalStore
}

/**
 * Administration surface: role/policy section access (ESS-08/11), the
 * profile/UDF field schema (ESS-14), non-user provisioning (ESS-10) and — for
 * Platform Admins — the bitemporal record log and tenant isolation (ESS-12/13).
 */
export function AdminTab({ profile, portal }: AdminTabProps) {
  const [udfOpen, setUdfOpen] = useState(false)

  const form = useForm<z.infer<typeof udfSchema>>({
    resolver: zodResolver(udfSchema),
    defaultValues: {
      label: '',
      section: 'Personal',
      mode: 'editable',
      approvalRequired: false,
      minLength: 1,
    },
  })

  useEffect(() => {
    if (udfOpen) form.reset()
  }, [udfOpen, form])

  return (
    <Tabs defaultValue='access' className='w-full'>
      <TabsList className='mb-3 bg-transparent p-0'>
        <TabsTrigger variant='primary' value='access'>
          Access Policy
        </TabsTrigger>
        <TabsTrigger variant='primary' value='fields'>
          Field Schema & UDFs
        </TabsTrigger>
        <TabsTrigger variant='primary' value='nonusers'>
          Non-User Employees
        </TabsTrigger>
        <RoleGate roles={['Platform Admin']}>
          <TabsTrigger variant='primary' value='data'>
            Data & Tenancy
          </TabsTrigger>
        </RoleGate>
      </TabsList>

      <TabsContent value='access'>
        <p className='text-paragraph-sm text-neutral-1000 mb-3'>
          Read and edit permissions are enforced per section. Removing view
          access hides the section for employees on their next session; manage
          access controls whether they can act.
        </p>
        <div className='rounded-md border bg-white'>
          <Table>
            <TableHeader>
              <TableRow className='bg-gray-50'>
                <TableHead>Self-service section</TableHead>
                <TableHead>Employees can view</TableHead>
                <TableHead>Employees can manage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {portal.policies.map((policy) => (
                <TableRow key={policy.id}>
                  <TableCell className='font-medium'>{policy.label}</TableCell>
                  <TableCell>
                    <Switch
                      checked={policy.view}
                      onCheckedChange={(view) =>
                        portal.setPolicy(policy.id, { view })
                      }
                      aria-label={`View access for ${policy.label}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={policy.manage}
                      disabled={!policy.view}
                      onCheckedChange={(manage) =>
                        portal.setPolicy(policy.id, { manage })
                      }
                      aria-label={`Manage access for ${policy.label}`}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </TabsContent>

      <TabsContent value='fields'>
        <div className='mb-3 flex items-center justify-between'>
          <p className='text-paragraph-sm text-neutral-1000'>
            The forms engine renders self-service screens from this versioned,
            effective-dated schema — publish changes without a code release.
          </p>
          <Button
            variant='red'
            onClick={() => setUdfOpen(true)}
            className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
          >
            <Plus size={10} weight='bold' />
            Add UDF
          </Button>
        </div>
        <div className='rounded-md border bg-white'>
          <Table>
            <TableHeader>
              <TableRow className='bg-gray-50'>
                <TableHead>Field</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Approval required</TableHead>
                <TableHead>Validation</TableHead>
                <TableHead>Effective from</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profile.fields.map((field) => (
                <TableRow key={field.id}>
                  <TableCell className='font-medium'>
                    <span className='flex items-center gap-2'>
                      {field.label}
                      {field.isUdf && <Badge variant='open'>UDF</Badge>}
                    </span>
                  </TableCell>
                  <TableCell>{field.section}</TableCell>
                  <TableCell>
                    <Select
                      value={field.mode}
                      onValueChange={(mode) =>
                        profile.setFieldMode(field.id, mode as FieldMode)
                      }
                    >
                      <SelectTrigger className='h-7 w-[130px]'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_MODES.map((mode) => (
                          <SelectItem key={mode} value={mode}>
                            {mode}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={field.approvalRequired}
                      onCheckedChange={() =>
                        profile.toggleApprovalRequired(field.id)
                      }
                      aria-label={`Approval required for ${field.label}`}
                    />
                  </TableCell>
                  <TableCell className='text-paragraph-sm text-neutral-1000'>
                    {field.inputType}
                    {field.minLength ? ` · min ${field.minLength}` : ''}
                    {field.pattern ? ' · pattern' : ''}
                  </TableCell>
                  <TableCell>{formatDate(field.effectiveFrom)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </TabsContent>

      <TabsContent value='nonusers'>
        <p className='text-paragraph-sm text-neutral-1000 mb-3'>
          Non-user employees hold no self-service login; HR performs their
          transactions on their behalf. Converting one to a user grants
          role/policy-controlled access like any other user.
        </p>
        <div className='space-y-2'>
          {NON_USERS.map((person) => (
            <div
              key={person.name}
              className='flex items-center justify-between rounded-[6px] border border-gray-200 bg-white px-4 py-2'
            >
              <div>
                <p className='text-sm font-medium'>{person.name}</p>
                <p className='text-paragraph-sm text-neutral-1000'>
                  {person.designation} · non-user since {formatDate(person.since)}
                </p>
              </div>
              <div className='flex items-center gap-3'>
                <Badge variant='badge_inactive'>No portal login</Badge>
                <Button
                  variant='outline'
                  className='h-7 rounded-[6px] px-2'
                  onClick={() =>
                    toast.success(
                      `${person.name} converted to a user — role/policy-scoped self-service access provisioned`
                    )
                  }
                >
                  Convert to user
                </Button>
              </div>
            </div>
          ))}
        </div>
      </TabsContent>

      <RoleGate roles={['Platform Admin']}>
        <TabsContent value='data'>
          <div className='mb-4 grid grid-cols-1 gap-3 lg:grid-cols-2'>
            <div className='rounded-[6px] border border-gray-200 bg-white px-4 py-3'>
              <h3 className='text-sm font-medium'>Tenant-scoped isolation</h3>
              <p className='text-paragraph-sm text-neutral-1000 mt-1'>
                Row-level security confines every self-service read and write
                to the employee&apos;s own record within their tenant,
                regardless of the requesting UI or API.
              </p>
              <div className='text-paragraph-sm mt-2 space-y-1'>
                <p>
                  Tenant scope: <span className='font-medium'>{CURRENT_TENANT}</span>
                </p>
                <p>
                  Employee scope:{' '}
                  <span className='font-medium'>{CURRENT_EMPLOYEE}</span>
                </p>
                <p>
                  Cross-tenant / cross-employee requests:{' '}
                  <Badge variant='disqualified'>Denied at persistence layer</Badge>
                </p>
                <p>
                  Access logging: attributed to tenant + employee{' '}
                  <Badge variant='qualified'>Enabled</Badge>
                </p>
              </div>
            </div>
            <div className='rounded-[6px] border border-gray-200 bg-white px-4 py-3'>
              <h3 className='text-sm font-medium'>Bitemporal canonical record</h3>
              <p className='text-paragraph-sm text-neutral-1000 mt-1'>
                Every applied self-service change writes a new effective-dated
                version. Valid-time and transaction-time are both retained, so
                the record can be reconstructed as-of any date; corrections
                never physically delete the original entry.
              </p>
            </div>
          </div>

          <div className='rounded-md border bg-white'>
            <Table>
              <TableHeader>
                <TableRow className='bg-gray-50'>
                  <TableHead>Field</TableHead>
                  <TableHead>Previous value</TableHead>
                  <TableHead>New value</TableHead>
                  <TableHead>Valid from</TableHead>
                  <TableHead>Recorded at (txn time)</TableHead>
                  <TableHead>Changed by</TableHead>
                  <TableHead>Kind</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profile.versions.map((version) => (
                  <TableRow key={version.id}>
                    <TableCell className='font-medium'>
                      {version.fieldLabel}
                    </TableCell>
                    <TableCell className='max-w-[200px] truncate'>
                      {version.previousValue}
                    </TableCell>
                    <TableCell className='max-w-[200px] truncate'>
                      {version.value}
                    </TableCell>
                    <TableCell>{formatDate(version.validFrom)}</TableCell>
                    <TableCell>{version.recordedAt}</TableCell>
                    <TableCell>{version.changedBy}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          version.kind === 'correction' ? 'overdue' : 'open'
                        }
                      >
                        {version.kind}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </RoleGate>

      <Dialog open={udfOpen} onOpenChange={setUdfOpen}>
        <DialogContent className='sm:max-w-[440px]'>
          <DialogHeader>
            <DialogTitle>Add user-defined field</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => {
                profile.addUdf(values as UdfDraft)
                setUdfOpen(false)
              })}
              className='space-y-3'
            >
              <TextField control={form.control} name='label' label='Field label' />
              <div className='grid grid-cols-2 gap-3'>
                <SelectField
                  control={form.control}
                  name='section'
                  label='Section'
                  options={['Personal', 'Employment']}
                />
                <SelectField
                  control={form.control}
                  name='mode'
                  label='Mode'
                  options={FIELD_MODES}
                />
              </div>
              <TextField
                control={form.control}
                name='minLength'
                label='Minimum length (validation rule)'
                type='number'
              />
              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setUdfOpen(false)}
                >
                  Cancel
                </Button>
                <Button type='submit'>Add field</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Tabs>
  )
}
