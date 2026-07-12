import { useState } from 'react'
import { useRole } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ACCESS_LABELS,
  DIRECTORY_FIELD_KEYS,
  FIELD_ACCESS_LEVELS,
  FIELD_LABELS,
  PHASE1_EXCLUDED_FIELDS,
  type DirectoryFieldKey,
  type FieldAccess,
} from '../../data/directory-config'
import { type DirectoryConfigStore } from '../../hooks/use-directory-config'

/**
 * Company-level override of the platform defaults (DIR-10/19). Publishing
 * creates a new effective-dated version so prior configuration stays
 * auditable; un-overridden fields keep inheriting the platform default.
 */
export function CompanyOverridePanel({
  config,
}: {
  config: DirectoryConfigStore
}) {
  const { role } = useRole()
  const canEdit = role === 'Company Admin'
  const [draft, setDraft] = useState<
    Partial<Record<DirectoryFieldKey, FieldAccess>>
  >({ ...config.activeVersion.overrides })
  const [note, setNote] = useState('')

  const setField = (key: DirectoryFieldKey, value: string) => {
    setDraft((prev) => {
      const next = { ...prev }
      if (value === 'inherit') delete next[key]
      else next[key] = value as FieldAccess
      return next
    })
  }

  const dirty =
    JSON.stringify(draft) !== JSON.stringify(config.activeVersion.overrides)

  return (
    <Card className='border-gray-200'>
      <CardHeader>
        <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
          Company privacy override — active v{config.activeVersion.version}
        </CardTitle>
        <p className='text-neutral-1000 text-xs'>
          Effective from {config.activeVersion.effectiveFrom} · changed by{' '}
          {config.activeVersion.changedBy}. Overrides govern directory views,
          search and exports for this company instead of the platform default.
        </p>
      </CardHeader>
      <CardContent className='space-y-2'>
        {DIRECTORY_FIELD_KEYS.map((key) => {
          const excluded = PHASE1_EXCLUDED_FIELDS.includes(key)
          return (
            <div
              key={key}
              className='flex items-center justify-between gap-3 rounded-md border border-gray-200 px-3 py-2'
            >
              <div className='flex flex-col'>
                <span className='text-neutral-1600 text-sm font-medium'>
                  {FIELD_LABELS[key]}
                </span>
                <span className='text-neutral-1000 text-xs'>
                  {excluded
                    ? 'Structurally excluded — no override can surface this field.'
                    : `Platform default: ${ACCESS_LABELS[config.platformRules[key]]}`}
                </span>
              </div>
              {excluded ? (
                <Badge variant='badge_inactive'>Never shown — Phase 1</Badge>
              ) : (
                <Select
                  value={draft[key] ?? 'inherit'}
                  onValueChange={(v) => setField(key, v)}
                  disabled={!canEdit}
                >
                  <SelectTrigger
                    variant='secondary'
                    className='h-8 w-[220px] text-xs'
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='inherit'>
                      Inherit platform default
                    </SelectItem>
                    {FIELD_ACCESS_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        Override: {ACCESS_LABELS[level]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )
        })}

        {canEdit && (
          <div className='flex flex-wrap items-center gap-2 pt-1'>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder='Change note for the audit trail…'
              className='h-8 min-w-[240px] flex-1 text-xs'
            />
            <Button
              className='h-8 px-3 text-xs'
              disabled={!dirty}
              onClick={() => {
                config.saveCompanyOverrides(draft, note.trim())
                setNote('')
              }}
            >
              Publish as v{config.companyVersions.length + 1}
            </Button>
          </div>
        )}

        <div className='mt-3 rounded-md border border-gray-200 p-2'>
          <p className='text-neutral-1600 mb-1 text-sm font-medium'>
            Version history (effective-dated, auditable)
          </p>
          <div className='space-y-1'>
            {[...config.companyVersions].reverse().map((v) => (
              <div key={v.version} className='text-xs'>
                <span className='text-neutral-1600 font-medium'>
                  v{v.version}
                </span>{' '}
                <span className='text-neutral-1000'>
                  · effective {v.effectiveFrom} · {v.changedBy} — {v.note}{' '}
                  {Object.keys(v.overrides).length > 0
                    ? `(overrides: ${Object.entries(v.overrides)
                        .map(
                          ([k, a]) =>
                            `${FIELD_LABELS[k as DirectoryFieldKey]} → ${ACCESS_LABELS[a as FieldAccess]}`
                        )
                        .join('; ')})`
                    : '(inherits all defaults)'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
