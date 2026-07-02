import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Switch } from '@/components/ui/switch'
import { type DirectoryConfigStore } from '../../hooks/use-directory-config'
import { SensitiveBadge } from '../directory-badges'

const customFieldSchema = z.object({
  label: z.string().min(2, 'Field label is required'),
  type: z.enum(['text', 'select']),
  options: z.string(),
})

type CustomFieldFormValues = z.infer<typeof customFieldSchema>

/**
 * Custom-field (UDF) schema governance (DIR-20/22): choose which fields show
 * in directory views, which are searchable filters and which are sensitive.
 * Every change bumps the version and is effective-dated — no code deploy.
 */
export function CustomFieldsPanel({
  config,
}: {
  config: DirectoryConfigStore
}) {
  const [addOpen, setAddOpen] = useState(false)
  const form = useForm<CustomFieldFormValues>({
    resolver: zodResolver(customFieldSchema),
    defaultValues: { label: '', type: 'text', options: '' },
  })

  function handleAdd(values: CustomFieldFormValues) {
    config.addCustomField({
      label: values.label.trim(),
      type: values.type,
      options:
        values.type === 'select'
          ? values.options
              .split(',')
              .map((o) => o.trim())
              .filter(Boolean)
          : undefined,
      showInDirectory: true,
      searchable: false,
      sensitive: false,
    })
    form.reset()
    setAddOpen(false)
  }

  return (
    <Card className='border-gray-200'>
      <CardHeader className='flex flex-row items-center justify-between'>
        <div>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Custom fields in directory & search
          </CardTitle>
          <p className='text-neutral-1000 text-xs'>
            Sensitive custom fields inherit the privacy rules — excluded from
            views, search and exports unless explicitly permitted.
          </p>
        </div>
        <Button
          className='h-7 gap-1 px-2 text-xs'
          onClick={() => setAddOpen(true)}
        >
          <Plus size={11} weight='bold' />
          New field
        </Button>
      </CardHeader>
      <CardContent className='space-y-2'>
        {config.customFields.map((f) => (
          <div
            key={f.id}
            className='flex flex-wrap items-center justify-between gap-3 rounded-md border border-gray-200 px-3 py-2'
          >
            <div className='flex min-w-[180px] flex-col'>
              <span className='flex items-center gap-1.5'>
                <span className='text-neutral-1600 text-sm font-medium'>
                  {f.label}
                </span>
                <Badge variant='secondary'>{f.type}</Badge>
                {f.sensitive && <SensitiveBadge />}
              </span>
              <span className='text-neutral-1000 text-xs'>
                v{f.version} · effective {f.effectiveFrom}
              </span>
            </div>
            <div className='flex items-center gap-4'>
              <label className='flex items-center gap-1.5 text-xs'>
                <Switch
                  checked={f.showInDirectory}
                  disabled={f.sensitive}
                  onCheckedChange={(checked) =>
                    config.updateCustomField(f.id, { showInDirectory: checked })
                  }
                />
                Show in directory
              </label>
              <label className='flex items-center gap-1.5 text-xs'>
                <Switch
                  checked={f.searchable}
                  disabled={f.sensitive}
                  onCheckedChange={(checked) =>
                    config.updateCustomField(f.id, { searchable: checked })
                  }
                />
                Searchable filter
              </label>
              <label className='flex items-center gap-1.5 text-xs'>
                <Switch
                  checked={f.sensitive}
                  onCheckedChange={(checked) =>
                    config.updateCustomField(
                      f.id,
                      checked
                        ? {
                            sensitive: true,
                            showInDirectory: false,
                            searchable: false,
                          }
                        : { sensitive: false }
                    )
                  }
                />
                Sensitive
              </label>
            </div>
          </div>
        ))}
      </CardContent>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className='sm:max-w-[420px]'>
          <DialogHeader>
            <DialogTitle>New custom field</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAdd)} className='space-y-4'>
              <FormField
                control={form.control}
                name='label'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field label</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g. Certification' {...field} />
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
                    <FormLabel>Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='text'>Text</SelectItem>
                        <SelectItem value='select'>Select (options)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.watch('type') === 'select' && (
                <FormField
                  control={form.control}
                  name='options'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Options (comma-separated)</FormLabel>
                      <FormControl>
                        <Input placeholder='e.g. PMP, CPA, AWS SA' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <div className='flex justify-end gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setAddOpen(false)}
                >
                  Cancel
                </Button>
                <Button type='submit'>Add field</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
