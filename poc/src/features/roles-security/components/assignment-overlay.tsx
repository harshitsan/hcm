import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useRole } from '@/context/role-context'
import { authorizedCompanyIds } from '../data/authority'
import { COMPANIES, PEOPLE, companyName } from '../data/directory'
import { type RoleDef } from '../data/roles'
import { type AssignmentDraft } from '../hooks/use-assignments'

const assignmentSchema = z
  .object({
    personId: z.string().min(1, 'Select a user'),
    roleId: z.string().min(1, 'Select a role'),
    companyId: z.string().min(1, 'Select the company the role applies in'),
    effectiveFrom: z.string().min(1, 'Effective-from date is required'),
    effectiveTo: z.string(),
  })
  .refine(
    (v) => !v.effectiveTo || v.effectiveTo >= v.effectiveFrom,
    {
      message: 'Effective-to must be on or after effective-from',
      path: ['effectiveTo'],
    }
  )

type AssignmentValues = z.infer<typeof assignmentSchema>

const emptyValues: AssignmentValues = {
  personId: '',
  roleId: '',
  companyId: '',
  effectiveFrom: new Date().toISOString().slice(0, 10),
  effectiveTo: '',
}

interface AssignmentOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  roles: RoleDef[]
  onSubmit: (draft: AssignmentDraft) => boolean
}

/**
 * New effective-dated role assignment (RSEC-15). The role is granted for a
 * specific company (RSEC-02) and only companies within the persona's
 * authority are selectable (RSEC-11); future dates schedule the change to
 * activate automatically.
 */
export function AssignmentOverlay({
  open,
  onOpenChange,
  roles,
  onSubmit,
}: AssignmentOverlayProps) {
  const { role: actorRole } = useRole()
  const form = useForm<AssignmentValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) form.reset(emptyValues)
  }, [open, form])

  const authorized = authorizedCompanyIds(actorRole)
  const users = PEOPLE.filter((p) => p.isUser)

  function handleSubmit(values: AssignmentValues) {
    const ok = onSubmit({
      personId: values.personId,
      roleId: values.roleId,
      companyId: values.companyId,
      effectiveFrom: values.effectiveFrom,
      effectiveTo: values.effectiveTo || null,
    })
    if (ok) onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[460px]'>
        <SheetHeader className='border-grey-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            New role assignment
          </SheetTitle>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='flex min-h-0 flex-1 flex-col'
          >
            <div className='flex-1 space-y-4 overflow-y-auto px-5 py-5'>
              <FormField
                control={form.control}
                name='personId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue placeholder='Select user' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} · {companyName(p.companyId)}
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
                name='companyId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Company the role applies in (per-company roles)
                    </FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue placeholder='Select company' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COMPANIES.filter((c) => authorized.includes(c.id)).map(
                          (c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='roleId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue placeholder='Select role' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name} ({r.scopeLevel})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='grid grid-cols-2 gap-3'>
                <FormField
                  control={form.control}
                  name='effectiveFrom'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Effective from</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='effectiveTo'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Effective to (optional)</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <p className='text-neutral-1000 text-xs'>
                A future effective-from date schedules the assignment; it
                becomes active automatically on that date without losing any
                prior version. Assignments never overwrite history.
              </p>
            </div>
            <div className='border-grey-200 flex items-center justify-end gap-3 border-t px-5 py-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>Assign role</Button>
            </div>
          </form>
        </Form>
      </FloatingSheetContent>
    </Sheet>
  )
}
