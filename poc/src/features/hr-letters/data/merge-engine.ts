/**
 * Merge-field resolution engine (F8). Resolves {{...}} tokens in a template
 * body against employee, position, company and custom-field data. A letter is
 * never rendered with a blank merge slot — every unresolvable token becomes a
 * plain-language gap ("Employee bank branch — add it on the employee profile")
 * and generation stays blocked until every gap is fixed.
 */
import { seedFieldDefinitions } from '@/features/custom-fields/data/custom-fields'
import {
  COMPANY_ADDRESS,
  COMPANY_LEGAL_NAME,
  COMPANY_NAME,
  EMPLOYEES,
  todayIso,
  type Employee,
} from './hr-letters'

const TOKEN_PATTERN = /\{\{\s*([a-zA-Z0-9._-]+)\s*\}\}/g

export interface MergeResult {
  /** Body with every token replaced — gaps show a visible marker, never a blank. */
  rendered: string
  /** Plain-language list of missing information; empty means ready to generate. */
  gaps: string[]
}

/** Friendly labels for the custom-field keys used across seed templates. */
const CUSTOM_LABELS: Record<string, string> = {
  noticePeriod: 'Notice period',
  grade: 'Grade',
  bankBranch: 'Employee bank branch',
  badgeId: 'Badge ID',
}

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})

function camelCase(label: string): string {
  return label
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((word, i) =>
      i === 0
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join('')
}

/** Stable small number derived from an employee id — keeps mocks deterministic. */
function seedNumber(employeeId: string): number {
  let n = 0
  for (const ch of employeeId) n = (n * 31 + ch.charCodeAt(0)) % 9973
  return n
}

/**
 * Deterministic mock value for a configured custom field the employee has no
 * stored value for — derived from the field definition (Custom Fields module)
 * plus the employee id, so previews stay stable between renders.
 */
function mockCustomValue(key: string, employee: Employee): string | undefined {
  const def = seedFieldDefinitions.find(
    (d) => d.entity === 'Employees' && camelCase(d.name) === key
  )
  if (!def) return undefined
  const n = seedNumber(employee.id)
  switch (def.type) {
    case 'single-select':
      return def.options.length > 0 ? def.options[n % def.options.length] : undefined
    case 'multi-select': {
      if (def.options.length === 0) return undefined
      const first = def.options[n % def.options.length]
      const second = def.options[(n + 3) % def.options.length]
      return first === second ? first : `${first}, ${second}`
    }
    case 'single-line-text': {
      if (def.mask) {
        let digit = n
        return def.mask.replace(/#/g, () => {
          digit = (digit * 7 + 3) % 10
          return String(digit)
        })
      }
      return undefined
    }
    case 'phone':
      return `+91 98${String(40000000 + (n % 9999999)).padStart(8, '0')}`
    case 'number':
      return String(10 + (n % 90))
    case 'date': {
      const d = new Date('2027-01-01')
      d.setDate(d.getDate() + (n % 300))
      return d.toISOString().slice(0, 10)
    }
    case 'boolean':
      return n % 2 === 0 ? 'Yes' : 'No'
    default:
      return undefined
  }
}

function labelForCustom(key: string): string {
  if (CUSTOM_LABELS[key]) return CUSTOM_LABELS[key]
  // e.g. "tShirtSize" → "T shirt size"
  const spaced = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase()
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

interface Resolution {
  value?: string
  /** Set when the value can't be found — becomes a gap entry. */
  gap?: string
  /** Short label shown inside the letter body where the value would sit. */
  marker?: string
}

function resolveToken(key: string, employee: Employee): Resolution {
  const [prefix, ...rest] = key.split('.')
  const field = rest.join('.')

  if (prefix === 'employee') {
    switch (field) {
      case 'name':
      case 'fullName':
        return { value: employee.name }
      case 'email':
        return { value: employee.email }
      case 'id':
        return { value: employee.id }
      default:
        return {
          gap: `"${key}" isn't a recognised merge field — fix it in the template`,
          marker: `[${key} — not recognised]`,
        }
    }
  }

  if (prefix === 'position') {
    // Vikram-style incomplete records have no reliable position data.
    if (employee.recordIncomplete) {
      const label = field === 'department' ? 'Department' : 'Position title'
      return {
        gap: `${label} for ${employee.name} — complete the position record first`,
        marker: `[${label} — not on file]`,
      }
    }
    switch (field) {
      case 'title':
        return { value: employee.position }
      case 'department':
        return { value: employee.department }
      default:
        return {
          gap: `"${key}" isn't a recognised merge field — fix it in the template`,
          marker: `[${key} — not recognised]`,
        }
    }
  }

  if (prefix === 'company') {
    switch (field) {
      case 'name':
        return { value: employee.company || COMPANY_NAME }
      case 'legalName':
        return { value: COMPANY_LEGAL_NAME }
      case 'address':
        return { value: COMPANY_ADDRESS }
      default:
        return {
          gap: `"${key}" isn't a recognised merge field — fix it in the template`,
          marker: `[${key} — not recognised]`,
        }
    }
  }

  if (prefix === 'letter') {
    if (field === 'date') return { value: dateFmt.format(new Date(todayIso())) }
    return {
      gap: `"${key}" isn't a recognised merge field — fix it in the template`,
      marker: `[${key} — not recognised]`,
    }
  }

  if (prefix === 'custom') {
    const stored = employee.customFields[field]
    if (stored) return { value: stored }
    const mocked = mockCustomValue(field, employee)
    if (mocked) return { value: mocked }
    const label = labelForCustom(field)
    return {
      gap: `${label} — add it on the employee profile`,
      marker: `[${label} — not on file]`,
    }
  }

  return {
    gap: `"${key}" isn't a recognised merge field — fix it in the template`,
    marker: `[${key} — not recognised]`,
  }
}

/**
 * Resolve every merge token in a template body for one employee. Returns the
 * fully rendered text plus a plain-language gap list — when gaps exist,
 * generation must stay blocked and the rendered text carries visible
 * "not on file" markers instead of blanks.
 */
export function resolveMergeFields(
  templateBody: string,
  employeeId: string
): MergeResult {
  const employee = EMPLOYEES.find((e) => e.id === employeeId)
  if (!employee) {
    return {
      rendered: templateBody,
      gaps: ['Employee record not found — pick an employee from the list'],
    }
  }

  const gaps: string[] = []
  const rendered = templateBody.replace(TOKEN_PATTERN, (_match, key: string) => {
    const res = resolveToken(key, employee)
    if (res.value !== undefined) return res.value
    if (res.gap && !gaps.includes(res.gap)) gaps.push(res.gap)
    return res.marker ?? '[missing information]'
  })

  return { rendered, gaps }
}

/** Convenience: how many gaps block generation for this employee/template. */
export function gapCount(templateBody: string, employeeId: string): number {
  return resolveMergeFields(templateBody, employeeId).gaps.length
}
