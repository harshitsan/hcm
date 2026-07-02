import { useMemo, useState } from 'react'
import { Info } from 'lucide-react'
import {
  DownloadSimple,
  Eye,
  Plus,
  UploadSimple,
  ArrowCounterClockwise,
} from 'phosphor-react'
import { toast } from 'sonner'
import { useRole } from '@/context/role-context'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTable } from '@/components/common/data-table/table'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { ConfigTab } from './components/config-tab'
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
    if (selectedLive) rollbackJob(selectedLive.id)
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

          <Tabs defaultValue='jobs'>
            <div className='mb-3 flex items-center justify-between'>
              <TabsList className='bg-transparent p-0'>
                <TabsTrigger value='jobs' variant='primary'>
                  Job Dashboard
                </TabsTrigger>
                <TabsTrigger value='log' variant='primary'>
                  Import Data Log
                </TabsTrigger>
                <TabsTrigger value='mappings' variant='primary'>
                  Saved Mappings
                </TabsTrigger>
                <TabsTrigger value='config' variant='primary'>
                  Configuration
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
                      toast.success(
                        `Record-level error report for ${selectedLive?.id} downloaded (CSV)`
                      )
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
              <ImportLogTab jobs={visibleJobs} onOpenJob={setDetailJob} />
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
        functionToggles={configStore.functionToggles}
        tierMap={configStore.tierMap}
        mappings={mappings}
        onSaveMapping={addMapping}
        onSubmitImport={(draft) => {
          submitImport(draft)
          clearSelection()
        }}
      />

      <ExportOverlay
        open={exportOpen}
        onOpenChange={setExportOpen}
        onSubmitExport={submitExport}
      />

      <JobDetailOverlay
        job={liveDetailJob}
        onOpenChange={(open) => {
          if (!open) setDetailJob(null)
        }}
        onRollback={(id) => {
          rollbackJob(id)
          clearSelection()
        }}
        onReimport={(job) => {
          reimportCorrected(job, actorName(role))
          setDetailJob(null)
          clearSelection()
        }}
      />

      <AlertDialog open={confirmRollback} onOpenChange={setConfirmRollback}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Roll back {selectedLive?.id}?</AlertDialogTitle>
            <AlertDialogDescription>
              All changes from this import will be reverted transactionally and{' '}
              {selectedLive?.companyName} will reflect the exact state prior to
              the import.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirmRollback}
              className='bg-destructive hover:bg-destructive/90 text-white'
            >
              Roll back
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
