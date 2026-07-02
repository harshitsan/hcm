import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { useRole } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { seedJurisdictions } from '../data/tenants'
import {
  placementEmployees,
  POLICY_DIMENSIONS,
  type PolicyDimension,
} from '../data/org-model'
import { type OrgModelStore } from '../hooks/use-org-model'
import { MiniTable, SectionCard, ToneBadge } from './shared'

/** ≥1 department, exactly one position, one jurisdiction from the company's
 * supported set, ≥1 location (SYS-45, 47). */
const placementSchema = z.object({
  employee: z.string().min(1, 'Pick an employee'),
  departmentIds: z
    .array(z.string())
    .min(1, 'An employee must belong to at least one department'),
  positionId: z.string().min(1, 'An employee holds exactly one position'),
  jurisdictionId: z
    .string()
    .min(1, 'An employee belongs to exactly one jurisdiction'),
  locationIds: z
    .array(z.string())
    .min(1, 'Assign one or more operating locations'),
})

type PlacementValues = z.infer<typeof placementSchema>

export function OrgPlacementCard({ store }: { store: OrgModelStore }) {
  const { hasRole } = useRole()
  const canEdit = hasRole('Company Admin', 'Platform Admin')

  const form = useForm<PlacementValues>({
    resolver: zodResolver(placementSchema),
    defaultValues: {
      employee: '',
      departmentIds: [],
      positionId: '',
      jurisdictionId: '',
      locationIds: [],
    },
  })

  const supportedJurisdictions = seedJurisdictions.filter((j) =>
    store.company.jurisdictionIds.includes(j.id)
  )

  function submit(values: PlacementValues) {
    const jur = supportedJurisdictions.find(
      (j) => j.id === values.jurisdictionId
    )
    toast.success(
      `Placement saved for ${values.employee} — rule-pack ${jur?.rulePack ?? ''} governs this employee`
    )
    form.reset()
  }

  return (
    <>
      <SectionCard
        title='Employee organizational placement'
        description='Validates the invariants: ≥1 department, exactly one position, one jurisdiction from the company&apos;s supported set, one or more locations. Invalid saves are rejected.'
        className='mt-4'
      >
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(submit)}
            className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'
          >
            <FormField
              control={form.control}
              name='employee'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className='w-full bg-white'>
                      <SelectValue placeholder='Select employee' />
                    </SelectTrigger>
                    <SelectContent>
                      {placementEmployees.map((e) => (
                        <SelectItem key={e} value={e}>
                          {e}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='positionId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position (exactly one)</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className='w-full bg-white'>
                      <SelectValue placeholder='Select position' />
                    </SelectTrigger>
                    <SelectContent>
                      {store.positions.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='jurisdictionId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Jurisdiction (one, from the company&apos;s supported set)
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className='w-full bg-white'>
                      <SelectValue placeholder='Select jurisdiction' />
                    </SelectTrigger>
                    <SelectContent>
                      {supportedJurisdictions.map((j) => (
                        <SelectItem key={j.id} value={j.id}>
                          {j.name} — {j.rulePack}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='departmentIds'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Departments (one or more)</FormLabel>
                  <div className='border-grey-200 grid max-h-40 gap-2 overflow-y-auto rounded-[6px] border p-3'>
                    {store.departments.map((d) => (
                      <label key={d.id} className='flex items-center gap-2 text-sm'>
                        <Checkbox
                          variant='blue'
                          checked={field.value.includes(d.id)}
                          onCheckedChange={(checked) =>
                            field.onChange(
                              checked
                                ? [...field.value, d.id]
                                : field.value.filter((id) => id !== d.id)
                            )
                          }
                        />
                        {d.name}
                      </label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='locationIds'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Operating locations (one or more)</FormLabel>
                  <div className='border-grey-200 grid gap-2 rounded-[6px] border p-3'>
                    {store.locations.map((l) => (
                      <label key={l.id} className='flex items-center gap-2 text-sm'>
                        <Checkbox
                          variant='blue'
                          checked={field.value.includes(l.id)}
                          onCheckedChange={(checked) =>
                            field.onChange(
                              checked
                                ? [...field.value, l.id]
                                : field.value.filter((id) => id !== l.id)
                            )
                          }
                        />
                        {l.name} — {l.city}
                      </label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='flex items-end'>
              <Button type='submit' disabled={!canEdit}>
                Validate & save placement
              </Button>
            </div>
          </form>
        </Form>
      </SectionCard>

      {/* Policy applicability dimensions (SYS-51) */}
      <SectionCard
        title='Policy applicability'
        description='A policy targets one, several, or all applicability dimensions; resolution stays within the company tenant boundary'
      >
        <MiniTable
          headers={['Policy', 'Applicability dimensions', '']}
          rows={store.policies.map((p) => [
            <span key='n' className='font-medium'>{p.name}</span>,
            p.dimensions.length === 0 ? (
              <ToneBadge key='d' tone='green'>All dimensions</ToneBadge>
            ) : (
              <div key='d' className='flex flex-wrap gap-1'>
                {p.dimensions.map((d) => (
                  <Badge key={d} variant='pending'>
                    {d}
                  </Badge>
                ))}
              </div>
            ),
            <div key='a' className='flex flex-wrap justify-end gap-1'>
              {canEdit &&
                POLICY_DIMENSIONS.map((dim) => {
                  const active = p.dimensions.includes(dim)
                  return (
                    <Button
                      key={dim}
                      variant='outline'
                      className={`h-6 px-1.5 text-[11px] ${active ? 'bg-blue-150' : ''}`}
                      onClick={() =>
                        store.updatePolicyDimensions(
                          p.id,
                          active
                            ? p.dimensions.filter((d) => d !== dim)
                            : ([...p.dimensions, dim] as PolicyDimension[])
                        )
                      }
                    >
                      {dim}
                    </Button>
                  )
                })}
              {canEdit && p.dimensions.length > 0 && (
                <Button
                  variant='outline'
                  className='h-6 px-1.5 text-[11px]'
                  onClick={() => store.updatePolicyDimensions(p.id, [])}
                >
                  All
                </Button>
              )}
            </div>,
          ])}
        />
      </SectionCard>
    </>
  )
}
