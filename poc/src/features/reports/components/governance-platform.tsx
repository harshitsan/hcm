import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { decisionRules, type TemplateVersion } from '../data/compliance'
import { type ReportConfigStore } from '../hooks/use-report-config'
import { StatusBadge } from './badges'

const publishSchema = z.object({
  note: z.string().min(5, 'Describe what changed in this version'),
})

type PublishValues = z.infer<typeof publishSchema>

/**
 * Platform-admin panels: RLS access grants (RPT-20, RPT-12), governed
 * statutory template versions (RPT-21) and the shared engines (RPT-24/25).
 */
export function GovernancePlatformPanels({
  config,
}: {
  config: ReportConfigStore
}) {
  const [publishing, setPublishing] = useState<
    TemplateVersion['register'] | null
  >(null)

  const form = useForm<PublishValues>({
    resolver: zodResolver(publishSchema),
    defaultValues: { note: '' },
  })

  const submitPublish = (values: PublishValues) => {
    if (publishing) config.publishTemplate(publishing, values.note)
    setPublishing(null)
    form.reset({ note: '' })
  }

  const registers: TemplateVersion['register'][] = [
    'Wage Register',
    'Attendance Register',
    'Leave Register',
    'PF/ESIC Format',
  ]

  return (
    <>
      {/* Row-level security grants (RPT-20) */}
      <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
        <p className='text-neutral-1600 mb-1 text-sm font-semibold'>
          Row-level security grants
        </p>
        <p className='text-neutral-1000 mb-2 text-xs'>
          Every standard, ad hoc, dashboard, scheduled and compliance query is
          filtered at the data layer to these grants — ad hoc field or filter
          tricks cannot widen scope. Revoking a grant removes those rows from
          all subsequent runs.
        </p>
        <table className='w-full text-sm'>
          <thead>
            <tr className='text-neutral-1000 border-b text-left text-xs'>
              <th className='py-2 pr-3 font-medium'>Grantee</th>
              <th className='px-2 font-medium'>Role</th>
              <th className='px-2 font-medium'>Authorized companies</th>
              <th className='px-2 font-medium'>Status</th>
              <th className='px-2 text-right font-medium'>Action</th>
            </tr>
          </thead>
          <tbody>
            {config.grants.map((g) => (
              <tr key={g.id} className='border-b last:border-0'>
                <td className='py-2 pr-3 font-medium'>{g.grantee}</td>
                <td className='px-2'>{g.role}</td>
                <td className='text-neutral-1000 px-2 text-xs'>
                  {g.companies.join(', ')}
                </td>
                <td className='px-2'>
                  <StatusBadge status={g.status} />
                </td>
                <td className='px-2 text-right'>
                  <Button
                    variant='outline'
                    className='h-6 px-2 text-xs'
                    onClick={() =>
                      config.setGrantStatus(
                        g.id,
                        g.status === 'active' ? 'revoked' : 'active'
                      )
                    }
                  >
                    {g.status === 'active' ? 'Revoke' : 'Restore'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Statutory template governance (RPT-21) */}
      <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
        <p className='text-neutral-1600 mb-1 text-sm font-semibold'>
          Statutory report & register templates
        </p>
        <p className='text-neutral-1000 mb-2 text-xs'>
          Per-tenant governed config — versioned and effective-dated. Reports
          pick the version in effect for their period; prior versions are
          retained.
        </p>
        <div className='mb-3 flex flex-wrap gap-2'>
          {registers.map((r) => (
            <Button
              key={r}
              variant='outline'
              className='h-7 text-xs'
              onClick={() => setPublishing(r)}
            >
              Publish new {r} version
            </Button>
          ))}
        </div>
        <table className='w-full text-sm'>
          <thead>
            <tr className='text-neutral-1000 border-b text-left text-xs'>
              <th className='py-2 pr-3 font-medium'>Register</th>
              <th className='px-2 font-medium'>Version</th>
              <th className='px-2 font-medium'>Effective from</th>
              <th className='px-2 font-medium'>Status</th>
              <th className='px-2 font-medium'>Note</th>
            </tr>
          </thead>
          <tbody>
            {config.templates.map((t) => (
              <tr key={t.id} className='border-b last:border-0'>
                <td className='py-2 pr-3 font-medium'>{t.register}</td>
                <td className='px-2'>v{t.version}</td>
                <td className='px-2'>{t.effectiveFrom}</td>
                <td className='px-2'>
                  <StatusBadge status={t.status} />
                </td>
                <td className='text-neutral-1000 max-w-[280px] truncate px-2 text-xs'>
                  {t.note}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Shared engines (RPT-24, RPT-25) */}
      <div className='grid grid-cols-1 gap-3 lg:grid-cols-2'>
        <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
          <p className='text-neutral-1600 mb-1 text-sm font-semibold'>
            Notification / Template engine
          </p>
          <ul className='text-neutral-1000 space-y-1 text-xs'>
            <li>Reads schedule config and dispatches email deliveries</li>
            <li>Renders with configured notification templates</li>
            <li>Honors the sender's company access scope</li>
            <li>Failure handling: 3 attempts, 5 min backoff, outcome logged</li>
          </ul>
        </div>
        <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
          <p className='text-neutral-1600 mb-1 text-sm font-semibold'>
            Rules engine · decision tables
          </p>
          <table className='w-full text-xs'>
            <tbody>
              {decisionRules.map((r) => (
                <tr key={r.id} className='border-b last:border-0'>
                  <td className='text-neutral-1600 py-1.5 pr-2 font-medium'>
                    {r.table} {r.version}
                  </td>
                  <td className='text-neutral-1000 px-1'>
                    {r.condition} → {r.outcome}
                  </td>
                  <td className='text-neutral-1000 px-1 whitespace-nowrap'>
                    eff. {r.effectiveFrom}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog
        open={publishing !== null}
        onOpenChange={(open) => !open && setPublishing(null)}
      >
        <DialogContent className='sm:max-w-[420px]'>
          <DialogHeader>
            <DialogTitle>Publish new {publishing} version</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(submitPublish)}
              className='space-y-4'
            >
              <FormField
                control={form.control}
                name='note'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Change note</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='e.g. Jurisdiction rule-pack update — new columns'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <p className='text-neutral-1000 text-xs'>
                The new version becomes effective today; the current active
                version is retained as superseded history.
              </p>
              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setPublishing(null)}
                >
                  Cancel
                </Button>
                <Button type='submit'>Publish</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}
