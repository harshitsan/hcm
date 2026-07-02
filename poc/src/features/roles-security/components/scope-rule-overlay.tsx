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
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  COMPANIES,
  DEPARTMENTS,
  WORKFORCE_TYPES,
} from '../data/directory'
import { type ScopeRule } from '../data/scope-rules'
import { type ScopeRuleDraft } from '../hooks/use-scope-rules'

const scopeRuleSchema = z.object({
  name: z.string().min(2, 'Rule name is required'),
  companyIds: z.array(z.string()),
  departments: z.array(z.enum(DEPARTMENTS)),
  workforceTypes: z.array(z.enum(WORKFORCE_TYPES)),
  effectiveFrom: z.string().min(1, 'Effective date is required'),
})

type ScopeRuleValues = z.infer<typeof scopeRuleSchema>

const emptyValues: ScopeRuleValues = {
  name: '',
  companyIds: [],
  departments: [],
  workforceTypes: [],
  effectiveFrom: new Date().toISOString().slice(0, 10),
}

interface ScopeRuleOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rule?: ScopeRule | null
  onSubmit: (draft: ScopeRuleDraft, editingId: string | null) => boolean
}

/**
 * Scope rule editor (RSEC-03, RSEC-19): combine company, department and
 * workforce-type dimensions; leaving a dimension empty means "all". Every
 * configured dimension must match simultaneously for a record to be exposed.
 */
export function ScopeRuleOverlay({
  open,
  onOpenChange,
  rule,
  onSubmit,
}: ScopeRuleOverlayProps) {
  const form = useForm<ScopeRuleValues>({
    resolver: zodResolver(scopeRuleSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (!open) return
    form.reset(
      rule
        ? {
            name: rule.name,
            companyIds: [...rule.companyIds],
            departments: [...rule.departments],
            workforceTypes: [...rule.workforceTypes],
            effectiveFrom: rule.effectiveFrom,
          }
        : emptyValues
    )
  }, [open, rule, form])

  function handleSubmit(values: ScopeRuleValues) {
    const ok = onSubmit(values, rule?.id ?? null)
    if (ok) onOpenChange(false)
  }

  const checkboxGroup = <T extends string>(
    options: readonly T[],
    value: T[],
    onChange: (next: T[]) => void
  ) => (
    <div className='grid grid-cols-2 gap-2 rounded-[6px] border border-gray-200 p-3'>
      {options.map((opt) => (
        <label key={opt} className='flex items-center gap-2 text-sm'>
          <Checkbox
            variant='blue'
            checked={value.includes(opt)}
            onCheckedChange={(checked) =>
              onChange(
                checked ? [...value, opt] : value.filter((v) => v !== opt)
              )
            }
          />
          {opt}
        </label>
      ))}
    </div>
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[460px]'>
        <SheetHeader className='border-grey-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            {rule ? `Edit scope rule (saves as v${rule.version + 1})` : 'New scope rule'}
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
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rule name</FormLabel>
                    <FormControl>
                      <Input placeholder='Aurora — Engineering permanents' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='companyIds'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Companies (empty = all in your authority)</FormLabel>
                    {checkboxGroup(
                      COMPANIES.map((c) => c.id),
                      field.value,
                      field.onChange
                    )}
                    <p className='text-neutral-1000 text-xs'>
                      {COMPANIES.map((c) => `${c.id} = ${c.name}`).join(' · ')}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='departments'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departments (empty = all)</FormLabel>
                    {checkboxGroup(DEPARTMENTS, field.value, field.onChange)}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='workforceTypes'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Workforce types (empty = all)</FormLabel>
                    {checkboxGroup(WORKFORCE_TYPES, field.value, field.onChange)}
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              <p className='text-neutral-1000 text-xs'>
                All configured dimensions must be satisfied simultaneously —
                a record outside any dimension is not visible and actions on
                it are denied.
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
              <Button type='submit'>{rule ? 'Save new version' : 'Save draft'}</Button>
            </div>
          </form>
        </Form>
      </FloatingSheetContent>
    </Sheet>
  )
}
