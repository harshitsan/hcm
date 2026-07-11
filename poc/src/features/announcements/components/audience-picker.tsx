import { useMemo } from 'react'
import { UsersRound } from 'lucide-react'
import { useRole } from '@/context/role-context'
import { MultiSelectDropdown } from '@/components/ui/multi-select-dropdown'
import {
  companiesForRole,
  DIMENSION_LABELS,
  DIMENSIONS,
  SCOPE_DESCRIPTIONS,
  seedEmployees,
  type Dimension,
  type OrgConfig,
  type Targeting,
} from '../data/org'
import { resolveAudience } from '../utils/audience'

interface AudiencePickerProps {
  value: Targeting
  onChange: (targeting: Targeting) => void
  orgConfig: OrgConfig
  /** Field-level validation message from the form (ANN-02). */
  error?: string
}

/**
 * Six-dimension audience picker (ANN-01..04, ANN-12). Options resolve from
 * the tenant's governed org config (ANN-17), deprecated values are not
 * offered, and companies outside the caller's authorization scope are never
 * selectable (ANN-09/10/11). A live preview shows the reachable audience and
 * the non-user employees excluded from in-system delivery (ANN-13, ANN-22).
 */
export function AudiencePicker({ value, onChange, orgConfig, error }: AudiencePickerProps) {
  const { role } = useRole()
  const allowedCompanies = useMemo(() => companiesForRole(role), [role])

  const optionsFor = (dimension: Dimension) => {
    const values = orgConfig[dimension].filter((v) => !v.deprecated)
    const scoped =
      dimension === 'companies'
        ? values.filter((v) => allowedCompanies.includes(v.value))
        : values
    return scoped.map((v) => ({ id: v.value, label: v.value }))
  }

  const preview = useMemo(() => resolveAudience(value, seedEmployees), [value])

  const setDimension = (dimension: Dimension, selectedIds: string[]) => {
    onChange({ ...value, [dimension]: selectedIds })
  }

  return (
    <div className='space-y-3'>
      <div>
        <p className='text-neutral-1600 text-sm font-medium'>Target audience</p>
        <p className='text-paragraph-sm text-neutral-1000'>
          Authorization scope: {SCOPE_DESCRIPTIONS[role]}. Employees must match
          every selected dimension (any value within a dimension).
        </p>
      </div>

      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
        {DIMENSIONS.map((dimension) => (
          <div key={dimension} className='space-y-1'>
            <p className='text-neutral-1600 text-sm font-medium'>
              {DIMENSION_LABELS[dimension]}
            </p>
            <MultiSelectDropdown
              items={optionsFor(dimension)}
              selectedIds={value[dimension]}
              onSelectionChange={(ids) => setDimension(dimension, ids)}
              placeholder={`Any ${DIMENSION_LABELS[dimension].toLowerCase()}`}
              className='w-full'
            />
          </div>
        ))}
      </div>

      {error && <p className='text-destructive text-sm'>{error}</p>}

      <div className='border-gray-200 flex items-start gap-2 rounded-[6px] border bg-white px-3 py-2'>
        <UsersRound className='text-blue-1400 mt-0.5 size-4 shrink-0' />
        <div className='text-paragraph-sm text-neutral-1600'>
          <span className='font-medium'>
            Reachable audience: {preview.reachable.length} employee
            {preview.reachable.length === 1 ? '' : 's'} with system access
          </span>
          {preview.excludedNonUsers.length > 0 && (
            <span className='text-neutral-1000'>
              {' '}
              · {preview.excludedNonUsers.length} matching employee
              {preview.excludedNonUsers.length === 1 ? '' : 's'} without system
              access excluded from in-system delivery
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
