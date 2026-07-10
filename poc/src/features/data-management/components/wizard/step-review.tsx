import { useState } from 'react'
import { DownloadSimple } from 'phosphor-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TIERS, type ImportFunction, type Tier } from '../../data/catalog'
import { type RecordResult } from '../../data/jobs'
import { OutcomeBadge, TierBadge } from '../badges'
import { type WizardValues } from './schema'

export interface ValidationPreview {
  success: number
  failed: number
  skipped: number
  records: RecordResult[]
}

interface StepReviewProps {
  values: WizardValues
  importFn: ImportFunction
  companyName: string
  entityTier: Tier
  preview: ValidationPreview | null
  onRunValidation: () => void
}

/**
 * Step 5 — dependency-sequencing summary, staging validation preview with
 * record-level results, and the final commit decision
 * (DM-05 / DM-06 / DM-07 / DM-14 / DM-18).
 */
type OutcomeFilter = 'all' | 'success' | 'failed' | 'skipped'

export function StepReview({
  values,
  importFn,
  companyName,
  entityTier,
  preview,
  onRunValidation,
}: StepReviewProps) {
  // Validation-records filter (Kensium modal: All / Valid / Invalid radios).
  const [outcomeFilter, setOutcomeFilter] = useState<OutcomeFilter>('all')
  const summary: [string, string][] = [
    ['Module / Function', `${values.module} / ${importFn.name}`],
    ['Company context', companyName],
    [
      'File',
      `${values.fileName} (${values.fileSizeMb} MB, ${values.totalRecords} records, ${values.fileType} / ${values.format})`,
    ],
    ['Duplicates', values.duplicateHandling],
    ['Process type', values.processType],
    [
      'Staging first',
      values.staging
        ? 'Yes — validate before commit'
        : 'No — direct import (pre-import validation still applies)',
    ],
    [
      'Effective dating',
      values.preserveEffectiveDates
        ? 'Preserved (bitemporal history)'
        : 'Load date used',
    ],
  ]
  if (values.documentsZip) summary.push(['Documents zip', values.documentsZip])

  return (
    <div className='space-y-4'>
      <div>
        <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
          Dependency sequencing
        </h3>
        <div className='flex flex-wrap items-center gap-1.5'>
          {TIERS.map((tier, i) => (
            <span key={tier} className='flex items-center gap-1.5'>
              <span
                className={
                  tier === entityTier
                    ? 'rounded-[6px] ring-2 ring-blue-400'
                    : 'opacity-60'
                }
              >
                <TierBadge tier={tier} />
              </span>
              {i < TIERS.length - 1 && (
                <span className='text-neutral-1000'>→</span>
              )}
            </span>
          ))}
        </div>
        <p className='text-paragraph-sm text-neutral-1000 mt-1.5'>
          This import targets the {entityTier} tier. Records referencing masters
          from earlier tiers that do not yet exist are reported as record-level
          failures rather than silently ingested.
        </p>
      </div>

      <div className='overflow-hidden rounded-[6px] border border-gray-200'>
        {summary.map(([label, value]) => (
          <div
            key={label}
            className='grid grid-cols-[160px_1fr] gap-2 border-b border-gray-100 px-3 py-1.5 text-sm last:border-b-0'
          >
            <span className='text-neutral-1000'>{label}</span>
            <span className='text-neutral-1600'>{value}</span>
          </div>
        ))}
      </div>

      <div className='flex items-center justify-between'>
        <h3 className='text-neutral-1600 text-sm font-medium'>
          Pre-import validation (sandbox — nothing is committed)
        </h3>
        <Button type='button' variant='outline' onClick={onRunValidation}>
          {preview ? 'Re-run validation' : 'Run validation'}
        </Button>
      </div>

      {preview && (
        <div className='space-y-2'>
          <div className='grid grid-cols-4 gap-2 text-center'>
            {(
              [
                ['all', 'All', preview.success + preview.failed + preview.skipped],
                ['success', 'Success', preview.success],
                ['failed', 'Failed', preview.failed],
                ['skipped', 'Skipped', preview.skipped],
              ] as [OutcomeFilter, string, number][]
            ).map(([key, label, value]) => (
              <button
                key={key}
                type='button'
                onClick={() => setOutcomeFilter(key)}
                aria-pressed={outcomeFilter === key}
                className={`rounded-[6px] border px-2 py-1.5 ${
                  outcomeFilter === key
                    ? 'border-blue-400 ring-1 ring-blue-400'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className='text-paragraph-sm text-neutral-1000'>
                  {label}
                </div>
                <div className='text-neutral-1600 text-lg font-medium'>
                  {value}
                </div>
              </button>
            ))}
          </div>

          <div className='flex items-center justify-between'>
            <span className='text-paragraph-sm text-neutral-1000'>
              Validation records
              {outcomeFilter !== 'all' && ` — showing ${outcomeFilter} only`}
            </span>
            <Button
              type='button'
              variant='icon2'
              onClick={() =>
                toast.success('Validation records exported (CSV)')
              }
              className='text-neutral-1900 h-7 w-7'
              aria-label='Export validation records'
            >
              <DownloadSimple size={16} weight='bold' />
            </Button>
          </div>

          <div className='max-h-[220px] overflow-y-auto rounded-[6px] border border-gray-200'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-14'>Row</TableHead>
                  <TableHead>Record key</TableHead>
                  <TableHead className='w-24'>Result</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.records
                  .filter(
                    (r) =>
                      outcomeFilter === 'all' || r.outcome === outcomeFilter
                  )
                  .map((r) => (
                    <TableRow
                      key={r.row}
                      className={r.outcome === 'failed' ? 'bg-red-1300/20' : ''}
                    >
                      <TableCell className='text-sm'>{r.row}</TableCell>
                      <TableCell className='font-mono text-xs'>
                        {r.key}
                      </TableCell>
                      <TableCell>
                        <OutcomeBadge outcome={r.outcome} />
                      </TableCell>
                      <TableCell className='text-paragraph-sm text-neutral-1900'>
                        {r.reason ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
          <p className='text-paragraph-sm text-neutral-1000'>
            Sample of parsed rows. Correct the file and re-run validation, or
            proceed — only validated records are committed under “All valid
            records”; any failure rejects the whole batch under “No records if
            error occurred”.
          </p>
        </div>
      )}
    </div>
  )
}
