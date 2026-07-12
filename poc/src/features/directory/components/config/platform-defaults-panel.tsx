import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
} from '../../data/directory-config'
import { type DirectoryConfigStore } from '../../hooks/use-directory-config'
import { SensitiveBadge } from '../directory-badges'

/**
 * Platform-wide field eligibility and privacy defaults (DIR-11). Fields set
 * to "Restricted" are treated as sensitive and excluded from every directory
 * surface unless a company explicitly re-permits them.
 */
export function PlatformDefaultsPanel({
  config,
}: {
  config: DirectoryConfigStore
}) {
  return (
    <Card className='border-gray-200'>
      <CardHeader>
        <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
          Platform default field policy
        </CardTitle>
        <p className='text-neutral-1000 text-xs'>
          Governs every tenant that has not overridden a field. Changes apply on
          the next directory render — no code deployment.
        </p>
      </CardHeader>
      <CardContent className='space-y-2'>
        {DIRECTORY_FIELD_KEYS.map((key) => {
          const overridden = config.activeVersion.overrides[key] !== undefined
          const excluded = PHASE1_EXCLUDED_FIELDS.includes(key)
          return (
            <div
              key={key}
              className='flex items-center justify-between gap-3 rounded-md border border-gray-200 px-3 py-2'
            >
              <div className='flex items-center gap-2'>
                <span className='text-neutral-1600 text-sm font-medium'>
                  {FIELD_LABELS[key]}
                </span>
                {!excluded && config.platformRules[key] === 'restricted' && (
                  <SensitiveBadge />
                )}
                {overridden && (
                  <span className='text-neutral-1000 text-xs'>
                    (current company overrides this)
                  </span>
                )}
              </div>
              {excluded ? (
                <Badge variant='badge_inactive'>Never shown — Phase 1</Badge>
              ) : (
                <Select
                  value={config.platformRules[key]}
                  onValueChange={(v) =>
                    config.setPlatformRule(
                      key,
                      v as (typeof FIELD_ACCESS_LEVELS)[number]
                    )
                  }
                >
                  <SelectTrigger
                    variant='secondary'
                    className='h-8 w-[210px] text-xs'
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_ACCESS_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {ACCESS_LABELS[level]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
