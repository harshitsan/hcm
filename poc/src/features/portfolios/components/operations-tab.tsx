import { useMemo, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRole } from '@/context/role-context'
import { UploadModal } from '@/components/common/upload-modal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { MultiSelectDropdown } from '@/components/ui/multi-select-dropdown'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { PERSONAS, STANDARD_POLICIES, companyName } from '../data/portfolios'
import { type PortfolioOpsStore } from '../hooks/use-portfolio-ops'
import { type PortfoliosStore } from '../hooks/use-portfolios'
import { OutcomeBadge } from './portfolio-badges'

const announcementSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(80),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(300, 'Message is limited to 300 characters'),
})

type AnnouncementValues = z.infer<typeof announcementSchema>

interface OperationsTabProps {
  store: PortfoliosStore
  ops: PortfolioOpsStore
}

/**
 * Bulk portfolio operations (PORT-FR-009): per-company employee import
 * (PORT-21), standardized policy deployment with per-company success/failure
 * (PORT-23) and portfolio-wide announcements (PORT-24) — all audited.
 */
export function OperationsTab({ store, ops }: OperationsTabProps) {
  const { role } = useRole()
  const persona = PERSONAS[role]
  const canOperate = role === 'Platform Admin' || role === 'Portfolio Admin'

  const managed = store.portfolios.find(
    (p) => p.id === persona.managedPortfolioId
  )
  const [portfolioId, setPortfolioId] = useState(store.portfolios[0]?.id ?? '')
  const portfolio =
    role === 'Portfolio Admin'
      ? (managed ?? null)
      : (store.portfolios.find((p) => p.id === portfolioId) ??
        store.portfolios[0] ??
        null)

  const portfolioCompanyIds = useMemo(
    () => portfolio?.companies.map((l) => l.companyId) ?? [],
    [portfolio]
  )

  const [importCompanyId, setImportCompanyId] = useState('')
  const [importOpen, setImportOpen] = useState(false)
  const [policy, setPolicy] = useState<string>(STANDARD_POLICIES[0])
  const [policyCompanyIds, setPolicyCompanyIds] = useState<string[]>([])

  const form = useForm<AnnouncementValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: { title: '', message: '' },
  })

  if (!canOperate) {
    return (
      <Card className='gap-2 border-gray-200 py-3'>
        <CardContent className='px-4'>
          <p className='text-paragraph-sm text-neutral-1000'>
            Portfolio operations — bulk imports, policy deployment and
            portfolio-wide announcements — are performed by the Portfolio Admin
            (or Platform Admin). Switch the mock role to try them.
          </p>
        </CardContent>
      </Card>
    )
  }
  if (!portfolio) return null

  const lastDeployment = ops.deployments[0] ?? null

  const publishAnnouncement = (values: AnnouncementValues) => {
    ops.publishAnnouncement(values.title, values.message, portfolioCompanyIds)
    form.reset()
  }

  return (
    <div className='w-full space-y-4'>
      <div className='flex flex-wrap items-center gap-3'>
        <span className='text-paragraph-sm text-neutral-1000'>Portfolio</span>
        {role === 'Platform Admin' ? (
          <Select
            value={portfolio.id}
            onValueChange={(v) => {
              setPortfolioId(v)
              setImportCompanyId('')
              setPolicyCompanyIds([])
            }}
          >
            <SelectTrigger variant='secondary' className='h-8 w-72'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {store.portfolios.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Badge variant='open'>
            {portfolio.code} — {portfolio.name} (your portfolio)
          </Badge>
        )}
      </div>

      {/* PORT-21 — per-company bulk employee import */}
      <Card className='gap-3 border-gray-200 py-4'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Bulk employee import — scoped to one company (PORT-21)
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 px-4'>
          <p className='text-paragraph-sm text-neutral-1000'>
            Uploaded files are staged, every row is validated and the dry-run
            reports row-level errors — only clean rows commit to the target
            company. Every run lands on the audit trail.
          </p>
          <div className='flex flex-wrap items-center gap-3'>
            <Select value={importCompanyId} onValueChange={setImportCompanyId}>
              <SelectTrigger variant='secondary' className='h-8 w-64'>
                <SelectValue placeholder='Target company' />
              </SelectTrigger>
              <SelectContent>
                {portfolioCompanyIds.map((id) => (
                  <SelectItem key={id} value={id}>
                    {companyName(id)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size='sm'
              className='h-8'
              disabled={!importCompanyId}
              onClick={() => setImportOpen(true)}
            >
              Import file
            </Button>
          </div>
          {ops.imports.length > 0 && (
            <div className='space-y-1'>
              {ops.imports.map((run) => (
                <div
                  key={run.id}
                  className='flex flex-wrap items-center justify-between gap-2 rounded-md border border-gray-200 bg-white px-3 py-2'
                >
                  <span className='text-sm'>
                    <span className='font-medium'>
                      {companyName(run.companyId)}
                    </span>{' '}
                    · {run.fileName} — {run.rowsProcessed} rows committed,{' '}
                    {run.rowsSkipped} rejected by dry-run
                  </span>
                  <span className='flex items-center gap-2'>
                    <span className='text-paragraph-sm text-neutral-1000'>
                      {run.timestamp}
                    </span>
                    <OutcomeBadge
                      status={run.rowsSkipped === 0 ? 'success' : 'failure'}
                    />
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* PORT-23 — standardized policy deployment */}
      <Card className='gap-3 border-gray-200 py-4'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Standardized policy deployment — per-company success/failure
            (PORT-23)
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 px-4'>
          <div className='flex flex-wrap items-center gap-3'>
            <Select value={policy} onValueChange={setPolicy}>
              <SelectTrigger variant='secondary' className='h-8 w-72'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STANDARD_POLICIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <MultiSelectDropdown
              items={portfolioCompanyIds.map((id) => ({
                id,
                label: companyName(id),
              }))}
              selectedIds={policyCompanyIds}
              onSelectionChange={setPolicyCompanyIds}
              placeholder='Select target companies'
              className='w-56'
            />
            <Button
              size='sm'
              className='h-8'
              disabled={policyCompanyIds.length === 0}
              onClick={() => ops.deployPolicy(policy, policyCompanyIds)}
            >
              Deploy policy
            </Button>
          </div>
          {lastDeployment && (
            <div className='space-y-1'>
              <p className='text-paragraph-sm text-neutral-1600 font-medium'>
                Last deployment — {lastDeployment.policy} (
                {lastDeployment.timestamp})
              </p>
              {lastDeployment.results.map((r) => (
                <div
                  key={r.companyId}
                  className='flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2'
                >
                  <span className='text-sm'>
                    <span className='font-medium'>
                      {companyName(r.companyId)}
                    </span>{' '}
                    · {r.detail}
                  </span>
                  <OutcomeBadge status={r.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* PORT-24 — portfolio-wide announcement */}
      <Card className='gap-3 border-gray-200 py-4'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Portfolio-wide announcement — broadcast to all{' '}
            {portfolioCompanyIds.length} companies (PORT-24)
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 px-4'>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(publishAnnouncement)}
              className='space-y-3'
            >
              <FormField
                control={form.control}
                name='title'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Payroll cut-off moves to the 24th'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='message'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder='Consistent communication distributed to every company in the portfolio…'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type='submit' size='sm' className='h-8'>
                Publish portfolio-wide
              </Button>
            </form>
          </Form>
          {ops.announcements.length > 0 && (
            <div className='space-y-1'>
              {ops.announcements.map((a) => (
                <div
                  key={a.id}
                  className='rounded-md border border-gray-200 bg-white px-3 py-2'
                >
                  <div className='flex flex-wrap items-center justify-between gap-2'>
                    <span className='text-sm font-medium'>{a.title}</span>
                    <span className='flex items-center gap-2'>
                      <Badge variant='open'>
                        {a.companyIds.length} companies
                      </Badge>
                      <span className='text-paragraph-sm text-neutral-1000'>
                        {a.publishedAt}
                      </span>
                    </span>
                  </div>
                  <p className='text-paragraph-sm text-neutral-1000'>
                    {a.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <UploadModal
        open={importOpen}
        onOpenChange={setImportOpen}
        title={
          importCompanyId
            ? `Bulk employee import — ${companyName(importCompanyId)}`
            : 'Bulk employee import'
        }
        onUpload={(file) => ops.importEmployees(importCompanyId, file)}
      />
    </div>
  )
}
