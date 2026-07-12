import { useMemo, useState } from 'react'
import { Info } from 'lucide-react'
import {
  DownloadSimple,
  Eye,
  Plus,
  UploadSimple,
  ArrowCounterClockwise,
} from 'phosphor-react'
import { useRole } from '@/context/role-context'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable } from '@/components/common/data-table/table'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { takeRequestedTab } from '@/features/workflows/data/module-nav'
import { ConfigTab } from './components/config-tab'
import { downloadErrorReportCsv } from './components/error-report'
import { ExportOverlay } from './components/export-overlay'
import { ImportLogTab } from './components/import-log-tab'
import { ImportWizard } from './components/import-wizard'
import { JobDetailOverlay } from './components/job-detail-overlay'
import { JobsSummary } from './components/jobs-summary'
import { jobsTableColumns } from './components/jobs-table-columns'
import { MappingsTab } from './components/mappings-tab'
import {
  ADMIN_ROLES,
  actorName,
  allowedCompanies,
  scopeLabel,
} from './components/scope'
import { type DataJob } from './data/jobs'
import { useDataConfig } from './hooks/use-data-config'
import { useDataJobs } from './hooks/use-data-jobs'
import { useMappings } from './hooks/use-mappings'

export function DataManagement() {
  const { role, hasRole } = useRole()
  const { jobs, submitImport, submitExport, rollbackJob, reimportCorrected } =
    useDataJobs()
  const { mappings, addMapping, deleteMapping } = useMappings()
  const configStore = useDataConfig()

  const [selectedRows, setSelectedRows] = useState<DataJob[]>([])
  const [resetSelectionKey, setResetSelectionKey] = useState(0)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [detailJob, setDetailJob] = useState<DataJob | null>(null)
  const [confirmRollback, setConfirmRollback] = useState(false)

  const isAdmin = hasRole(...ADMIN_ROLES)

  // Row-level security: only jobs within the caller's tenant scope are
  // visible (DM-10 / DM-11 / DM-12 / DM-16).
  const visibleJobs = useMemo(() => {
    const allowedIds = new Set(allowedCompanies(role).map((c) => c.id))
    return jobs.filter((j) => allowedIds.has(j.companyId))
  }, [jobs, role])

  // Keep the open detail sheet in sync with live status updates.
  const liveDetailJob = detailJob
    ? (visibleJobs.find((j) => j.id === detailJob.id) ?? null)
    : null

  const clearSelection = () => {
    setSelectedRows([])
    setResetSelectionKey((k) => k + 1)
  }

  const selected = selectedRows.length === 1 ? selectedRows[0] : null
  const selectedLive = selected
    ? (visibleJobs.find((j) => j.id === selected.id) ?? null)
    : null
  const canRollback =
    selectedLive?.kind === 'import' &&
    !selectedLive.rolledBack &&
    selectedLive.failedRecords > 0 &&
    ['Failed', 'Partially completed'].includes(selectedLive.status)

  const onConfirmRollback = () => {
    if (selectedLive) rollbackJob(selectedLive.id, actorName(role))
    setConfirmRollback(false)
    clearSelection()
  }

  if (!isAdmin) {
    return (
      <>
        <CommonHeader title='Data Management' className='bg-blue-150' />
        <Main fluid className='bg-neutral-200'>
          <Alert>
            <Info className='size-4' />
            <AlertTitle>Administrator capability</AlertTitle>
            <AlertDescription>
              Bulk import/export and data migration are available to Company,
              Group Company, Portfolio and Platform administrators. Your current
              role ({role}) has no data-management scope — switch the role from
              the sidebar to explore this module.
            </AlertDescription>
          </Alert>
        </Main>
      </>
    )
  }

  return (
    <>
      <CommonHeader title='Data Management' className='bg-blue-150' />
      <Main fluid className='bg-neutral-200'>
        <div className='w-full'>
          <JobsSummary jobs={visibleJobs} />

          <Tabs defaultValue={takeRequestedTab('/data-management') ?? 'jobs'}>
            <div className='mb-3 flex items-center justify-between'>
              <TabsList className='bg-transparent p-0'>
                <TabsTrigger value='jobs' variant='primary'>
                  Imports & Exports
                </TabsTrigger>
                <TabsTrigger value='log' variant='primary'>
                  Import History
                </TabsTrigger>
                <TabsTrigger value='mappings' variant='primary'>
                  Saved Mappings
                </TabsTrigger>
                <TabsTrigger value='config' variant='primary'>
                  Admin
                </TabsTrigger>
              </TabsList>
              <span className='text-paragraph-sm text-neutral-1000'>
                Scope ({role}): {scopeLabel(role)}
              </span>
            </div>

            <TabsContent value='jobs'>
              <div className='mb-3 flex items-center justify-between'>
                <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
                  Import / Export Jobs ({visibleJobs.length}) — live status
                </h2>
                <div className='flex items-center gap-3'>
                  <Button
                    variant='icon2'
                    onClick={() => selectedLive && setDetailJob(selectedLive)}
                    className='text-neutral-1900 h-7 w-7'
                    disabled={!selectedLive}
                    aria-label='View job details'
                  >
                    <Eye size={16} weight='bold' />
                  </Button>
                  <Button
                    variant='icon2'
                    onClick={() =>
                      selectedLive && downloadErrorReportCsv(selectedLive)
                    }
                    className='text-neutral-1900 h-7 w-7'
                    disabled={!selectedLive || selectedLive.failedRecords === 0}
                    aria-label='Download error report'
                  >
                    <DownloadSimple size={16} weight='bold' />
                  </Button>
                  <Button
                    variant='icon2'
                    onClick={() => setConfirmRollback(true)}
                    className='text-neutral-1900 h-7 w-7'
                    disabled={!canRollback}
                    aria-label='Roll back import'
                  >
                    <ArrowCounterClockwise size={16} weight='bold' />
                  </Button>
                  <Button
                    variant='outline'
                    onClick={() => setExportOpen(true)}
                    className='h-7 gap-1 rounded-[6px] px-2'
                  >
                    <UploadSimple size={12} weight='bold' />
                    Export Data
                  </Button>
                  <Button
                    variant='red'
                    onClick={() => setWizardOpen(true)}
                    className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
                  >
                    <Plus size={10} weight='bold' />
                    New Import
                  </Button>
                </div>
              </div>

              <DataTable
                columns={jobsTableColumns}
                data={visibleJobs}
                variant='no-status'
                resetSelectionKey={resetSelectionKey}
                onSelectionChange={(rows) => setSelectedRows(rows)}
                onRowClick={(job) => setDetailJob(job)}
              />
            </TabsContent>

            <TabsContent value='log'>
              <ImportLogTab
                jobs={visibleJobs}
                onOpenJob={setDetailJob}
                onRollback={(job) => {
                  rollbackJob(job.id, actorName(role))
                  clearSelection()
                }}
              />
            </TabsContent>

            <TabsContent value='mappings'>
              <MappingsTab
                mappings={mappings}
                onDelete={deleteMapping}
                canManage={isAdmin}
              />
            </TabsContent>

            <TabsContent value='config'>
              <ConfigTab store={configStore} />
            </TabsContent>
          </Tabs>
        </div>
      </Main>

      <ImportWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        currentConfig={configStore.currentConfig}
        functionToggles={configStore.functionToggles}
        tierMap={configStore.tierMap}
        mappings={mappings}
        jobs={jobs}
        onSaveMapping={addMapping}
        onSubmitImport={(draft) => {
          submitImport(draft)
          clearSelection()
        }}
      />

      <ExportOverlay
        open={exportOpen}
        onOpenChange={setExportOpen}
        jobs={visibleJobs}
        onSubmitExport={submitExport}
      />

      <JobDetailOverlay
        job={liveDetailJob}
        onOpenChange={(open) => {
          if (!open) setDetailJob(null)
        }}
        onRollback={(id) => {
          rollbackJob(id, actorName(role))
          clearSelection()
        }}
        onReimport={(job) => {
          reimportCorrected(job, actorName(role))
          setDetailJob(null)
          clearSelection()
        }}
      />

      <ConfirmDialog
        open={confirmRollback}
        onOpenChange={setConfirmRollback}
        title={`Roll back ${selectedLive?.id}?`}
        desc={`This removes the ${(selectedLive?.successRecords ?? 0).toLocaleString('en-US')} records created by this import. Master data referenced by later imports cannot be removed — those rows will be reported.`}
        confirmText='Roll back'
        destructive
        handleConfirm={onConfirmRollback}
      />
    </>
  )
}
