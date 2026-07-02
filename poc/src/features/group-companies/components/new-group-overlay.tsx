import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  ADMIN_CANDIDATES,
  activeMemberships,
  GROUP_TYPES,
  type GroupCompany,
  type MemberCompany,
} from '../data/group-companies'
import { type GroupDraft } from '../hooks/use-group-companies'

const groupFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, 'Group Name must be 3–100 characters')
      .max(100, 'Group Name must be 3–100 characters'),
    type: z.enum(GROUP_TYPES),
    parentCompanyId: z.string(),
    administratorEmail: z.string().min(1, 'Select a Group Administrator'),
    memberIds: z.array(z.string()).min(2, 'A group requires at least 2 active member companies'),
  })
  .superRefine((v, ctx) => {
    if (v.type === 'Holding' && !v.parentCompanyId) {
      ctx.addIssue({
        code: 'custom',
        path: ['parentCompanyId'],
        message: 'A parent company is required for Holding structures',
      })
    }
    if (v.type === 'Holding' && v.parentCompanyId && !v.memberIds.includes(v.parentCompanyId)) {
      ctx.addIssue({
        code: 'custom',
        path: ['parentCompanyId'],
        message: 'The parent must be one of the active member companies',
      })
    }
  })

type GroupFormValues = z.infer<typeof groupFormSchema>

const emptyDraft: GroupFormValues = {
  name: '',
  type: 'Holding',
  parentCompanyId: '',
  administratorEmail: ADMIN_CANDIDATES[0].email,
  memberIds: [],
}

interface NewGroupOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When set, the sheet edits this construct; membership is managed in the panel. */
  group?: GroupCompany | null
  companies: MemberCompany[]
  /** Group name lookup used to explain GROUP_001 eligibility inline. */
  groupOfCompany: (companyId: string, ignoreGroupId?: string) => GroupCompany | undefined
  onSubmit: (draft: GroupDraft) => boolean
}

/**
 * Metadata-driven create/edit form for a group-company construct
 * (GRP-16/17/18/20). Uniqueness, GROUP_001 and GROUP_002 are enforced by the
 * store on submit so the toasts match the documented error codes.
 */
export function NewGroupOverlay({
  open,
  onOpenChange,
  group,
  companies,
  groupOfCompany,
  onSubmit,
}: NewGroupOverlayProps) {
  const isEdit = Boolean(group)
  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: emptyDraft,
  })

  useEffect(() => {
    if (!open) return
    form.reset(
      group
        ? {
            name: group.name,
            type: group.type,
            parentCompanyId: group.parentCompanyId ?? '',
            administratorEmail: group.administratorEmail,
            memberIds: activeMemberships(group).map((m) => m.companyId),
          }
        : emptyDraft
    )
  }, [open, group, form])

  const type = form.watch('type')
  const memberIds = form.watch('memberIds')

  function handleSubmit(values: GroupFormValues) {
    const ok = onSubmit({
      name: values.name,
      type: values.type,
      parentCompanyId: values.parentCompanyId || null,
      administratorEmail: values.administratorEmail,
      memberIds: values.memberIds,
    })
    if (ok) onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[500px]'>
        <SheetHeader className='border-grey-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            {isEdit ? `Edit ${group?.code}` : 'New group-company structure'}
          </SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='flex min-h-0 flex-1 flex-col'
          >
            <div className='flex-1 space-y-4 overflow-y-auto px-5 py-5'>
              {!isEdit && (
                <p className='text-paragraph-sm text-neutral-1000'>
                  GroupCode is auto-generated as GROUP-YYYY-NNN on save; status
                  starts Active and all shared scenarios start disabled.
                </p>
              )}

              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group name (unique, 3–100 chars)</FormLabel>
                    <FormControl>
                      <Input placeholder='Meridian Group' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='type'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='Holding'>Holding — parent-subsidiary</SelectItem>
                        <SelectItem value='Sister'>Sister — related, same level, no parent</SelectItem>
                        <SelectItem value='JointVenture'>JointVenture — partnership</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='memberIds'
                render={() => (
                  <FormItem>
                    <FormLabel>
                      Member companies (min 2 active{isEdit ? ' — manage in the Members panel' : ''})
                    </FormLabel>
                    <div className='space-y-1.5 rounded-md border border-gray-200 bg-white p-3'>
                      {companies.map((c) => {
                        const other = groupOfCompany(c.id, group?.id)
                        const inactive = c.status !== 'Active'
                        return (
                          <label
                            key={c.id}
                            className='flex items-center gap-2 text-sm'
                          >
                            <Checkbox
                              variant='blue'
                              disabled={isEdit || inactive}
                              checked={memberIds.includes(c.id)}
                              onCheckedChange={(checked) => {
                                const next = checked
                                  ? [...memberIds, c.id]
                                  : memberIds.filter((id) => id !== c.id)
                                form.setValue('memberIds', next, {
                                  shouldValidate: true,
                                })
                              }}
                            />
                            <span className={inactive ? 'text-neutral-1000' : 'text-neutral-1600'}>
                              {c.name}
                            </span>
                            {inactive && (
                              <span className='text-paragraph-sm text-red-1400'>
                                {c.status} — ineligible
                              </span>
                            )}
                            {!inactive && other && (
                              <span className='text-paragraph-sm text-neutral-1000'>
                                in {other.name} (GROUP_001 on submit)
                              </span>
                            )}
                          </label>
                        )
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {type === 'Holding' && (
                <FormField
                  control={form.control}
                  name='parentCompanyId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent company (required for Holding)</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger variant='secondary' className='w-full'>
                            <SelectValue placeholder='Select from member companies' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {companies
                            .filter((c) => memberIds.includes(c.id))
                            .map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name='administratorEmail'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group administrator (holds Group Company Administrator role)</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ADMIN_CANDIDATES.map((a) => (
                          <SelectItem key={a.email} value={a.email}>
                            {a.name} — {a.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='border-grey-200 flex items-center justify-end gap-3 border-t px-5 py-4'>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type='submit'>{isEdit ? 'Save changes' : 'Create group'}</Button>
            </div>
          </form>
        </Form>
      </FloatingSheetContent>
    </Sheet>
  )
}
