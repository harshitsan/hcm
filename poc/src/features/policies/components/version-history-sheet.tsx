import { useState } from 'react'
import { Paperclip } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { TENANT, type Policy, type PolicyVersion } from '../data/policies'
import { formatDate, scopeSummary, todayIso, versionCovers } from '../data/policy-utils'
import { PolicyPreviewDialog } from './policy-preview-dialog'

interface VersionHistorySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  policy: Policy | null
}

function versionState(policy: Policy, v: PolicyVersion): {
  label: string
  variant: 'badge_active' | 'open' | 'pending' | 'badge_inactive'
} {
  if (v.status === 'draft') return { label: 'Draft', variant: 'pending' }
  if (!policy.retired && versionCovers(v, todayIso()))
    return { label: 'In force', variant: 'badge_active' }
  if (v.effectiveFrom > todayIso()) return { label: 'Scheduled', variant: 'open' }
  return { label: 'Superseded', variant: 'badge_inactive' }
}

/**
 * Full effective-dated lineage of a policy (POL-04/14/32): every named edition
 * with its validity window, change note and original file, viewable read-only —
 * plus the versioned applicability configuration lineage (POL-16).
 */
export function VersionHistorySheet({ open, onOpenChange, policy }: VersionHistorySheetProps) {
  const [previewVersion, setPreviewVersion] = useState<PolicyVersion | null>(null)

  if (!policy) return null
  const versions = [...policy.versions].sort((a, b) => b.version - a.version)
  const configs = [...policy.scopeConfigVersions].sort((a, b) => b.version - a.version)

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[560px]'>
          <SheetHeader className='border-gray-200 border-b px-5 py-4'>
            <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
              {policy.name} — version history
            </SheetTitle>
            <p className='text-paragraph-sm text-neutral-1000'>
              Tenant-scoped record ({TENANT}) · effective-dated history retained
              without overwriting prior states.
            </p>
          </SheetHeader>

          <div className='flex-1 space-y-4 overflow-y-auto px-5 py-5'>
            <div className='space-y-3'>
              {versions.map((v) => {
                const state = versionState(policy, v)
                return (
                  <div
                    key={v.version}
                    className='border-gray-200 space-y-1.5 rounded-[6px] border p-3'
                  >
                    <div className='flex items-center justify-between gap-2'>
                      <div className='flex items-center gap-2'>
                        <span className='text-neutral-1600 text-sm font-medium'>
                          v{v.version} · {v.editionName}
                        </span>
                        <Badge variant={state.variant}>{state.label}</Badge>
                      </div>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setPreviewVersion(v)}
                      >
                        View read-only
                      </Button>
                    </div>
                    <p className='text-paragraph-sm text-neutral-1000'>
                      {formatDate(v.effectiveFrom)} →{' '}
                      {v.effectiveTill ? formatDate(v.effectiveTill) : 'Open-ended'} ·
                      created {formatDate(v.createdOn)} by {v.createdBy}
                    </p>
                    <p className='text-paragraph-sm text-neutral-1900'>
                      {v.changeNote}
                    </p>
                    {v.attachment && (
                      <p className='text-paragraph-sm text-neutral-1000 flex items-center gap-1'>
                        <Paperclip className='size-3.5' />
                        {v.attachment.fileName} (retained with this version)
                      </p>
                    )}
                  </div>
                )
              })}
            </div>

            <div>
              <p className='text-neutral-1600 mb-2 text-sm font-medium'>
                Applicability configuration lineage
              </p>
              <div className='space-y-2'>
                {configs.map((c) => (
                  <div
                    key={c.version}
                    className='border-gray-200 rounded-[6px] border p-3'
                  >
                    <div className='flex items-center gap-2'>
                      <span className='text-neutral-1600 text-sm font-medium'>
                        Config v{c.version}
                      </span>
                      {c.version === configs[0].version && (
                        <Badge variant='badge_active'>In force</Badge>
                      )}
                    </div>
                    <p className='text-paragraph-sm text-neutral-1000'>
                      Effective {formatDate(c.effectiveFrom)} · changed by {c.changedBy}{' '}
                      · {c.note}
                    </p>
                    <p className='text-paragraph-sm text-neutral-1900 mt-1'>
                      {scopeSummary(c.scope)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FloatingSheetContent>
      </Sheet>

      <PolicyPreviewDialog
        open={previewVersion !== null}
        onOpenChange={(o) => {
          if (!o) setPreviewVersion(null)
        }}
        policy={policy}
        version={previewVersion}
      />
    </>
  )
}
