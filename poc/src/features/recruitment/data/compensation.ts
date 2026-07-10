/**
 * Compensation slabs & salary components (Kensium PDF — Configuration →
 * Compensation). Slabs are matched by offered CTC range + applicable
 * state/department; the offer flow derives the salary-component breakup
 * from the matched slab. Offer-compensation only — payroll processing is
 * out of scope for this POC.
 */

export const COMPONENT_TYPES = [
  'Earning',
  'Deduction',
  'Variable Pay',
  'Employer Contribution',
] as const
export type ComponentType = (typeof COMPONENT_TYPES)[number]

export const COMPONENT_MODES = ['percent-of-gross', 'fixed'] as const
export type ComponentMode = (typeof COMPONENT_MODES)[number]

export const PAY_PERIODS = ['Monthly', 'Quarterly', 'Annual'] as const
export type PayPeriod = (typeof PAY_PERIODS)[number]

export const APPLICABLE_STATES = [
  'Karnataka',
  'Telangana',
  'Maharashtra',
  'Tamil Nadu',
] as const

export interface SalaryComponent {
  id: string
  name: string
  type: ComponentType
  mode: ComponentMode
  /** Percent (0–100) when mode = percent-of-gross, annual ₹ when fixed. */
  value: number
  payPeriod: PayPeriod
  notes: string
  remarks: string
  considerForLeaveEncashment: boolean
  /** Balancing earning absorbs the remainder so earnings total = gross. */
  balancing?: boolean
}

/** CTC slab (pay stub) — matched on offered CTC + state + department. */
export interface CompensationSlab {
  id: string
  name: string
  ctcFrom: number
  ctcTo: number
  applicableStates: string[]
  applicableDepartments: string[]
  components: SalaryComponent[]
}

let cid = 0
const comp = (
  name: string,
  type: ComponentType,
  mode: ComponentMode,
  value: number,
  extra: Partial<SalaryComponent> = {}
): SalaryComponent => ({
  id: `comp-${++cid}`,
  name,
  type,
  mode,
  value,
  payPeriod: 'Monthly',
  notes: '',
  remarks: '',
  considerForLeaveEncashment: false,
  ...extra,
})

const standardComponents = (): SalaryComponent[] => [
  comp('Basic', 'Earning', 'percent-of-gross', 40, {
    considerForLeaveEncashment: true,
    notes: 'Basis for PF and gratuity',
  }),
  comp('House Rent Allowance', 'Earning', 'percent-of-gross', 20),
  comp('Conveyance Allowance', 'Earning', 'fixed', 24000),
  comp('Special Allowance', 'Earning', 'fixed', 0, {
    balancing: true,
    notes: 'Balancing component — absorbs the remainder of gross',
  }),
  comp('Provident Fund (Employee)', 'Deduction', 'percent-of-gross', 4.8),
  comp('Professional Tax', 'Deduction', 'fixed', 2400),
  comp('Provident Fund (Employer)', 'Employer Contribution', 'percent-of-gross', 4.8, {
    payPeriod: 'Annual',
  }),
  comp('Performance Bonus', 'Variable Pay', 'percent-of-gross', 8, {
    payPeriod: 'Annual',
  }),
]

export const seedCompensationSlabs: CompensationSlab[] = [
  {
    id: 'slab-1',
    name: 'Engineering Slab A (8–20 LPA)',
    ctcFrom: 800000,
    ctcTo: 2000000,
    applicableStates: ['Karnataka', 'Telangana'],
    applicableDepartments: ['Engineering', 'Product'],
    components: standardComponents(),
  },
  {
    id: 'slab-2',
    name: 'Engineering Slab B (20–48 LPA)',
    ctcFrom: 2000000,
    ctcTo: 4800000,
    applicableStates: ['Karnataka', 'Telangana', 'Maharashtra'],
    applicableDepartments: ['Engineering', 'Product'],
    components: standardComponents(),
  },
  {
    id: 'slab-3',
    name: 'Corporate Slab (6–30 LPA)',
    ctcFrom: 600000,
    ctcTo: 3000000,
    applicableStates: ['Maharashtra', 'Tamil Nadu', 'Karnataka'],
    applicableDepartments: ['Finance', 'Human Resources', 'Sales', 'Customer Support'],
    components: standardComponents(),
  },
]

/** Location → state, so slabs can be matched from a vacancy's location. */
export const LOCATION_STATE: Record<string, string> = {
  Bengaluru: 'Karnataka',
  Hyderabad: 'Telangana',
  Pune: 'Maharashtra',
  Mumbai: 'Maharashtra',
  'Remote — India': 'Karnataka',
}

/** First slab whose CTC range, state and department all match (PDF: system
 * matches the pay stub based on CTC, location and department). */
export function findSlab(
  slabs: CompensationSlab[],
  ctc: number,
  location: string,
  department: string
): CompensationSlab | null {
  const state = LOCATION_STATE[location] ?? location
  return (
    slabs.find(
      (s) =>
        ctc >= s.ctcFrom &&
        ctc <= s.ctcTo &&
        (s.applicableStates.length === 0 || s.applicableStates.includes(state)) &&
        (s.applicableDepartments.length === 0 ||
          s.applicableDepartments.includes(department))
    ) ?? null
  )
}

export interface BreakupRow {
  name: string
  type: ComponentType
  mode: ComponentMode
  value: number
  payPeriod: PayPeriod
  /** Annualised ₹ amount derived from the offered CTC. */
  amount: number
  considerForLeaveEncashment: boolean
}

/**
 * Derive the annual breakup for an offered CTC. Gross = CTC − employer
 * contribution − variable pay; percent components resolve against gross;
 * the balancing earning absorbs the remainder so earnings total = gross
 * (PDF validation: earnings sum to Gross; Gross + employer contribution
 * + variable pay = CTC).
 */
export function computeBreakup(
  slab: CompensationSlab,
  ctc: number
): BreakupRow[] {
  const rows: BreakupRow[] = slab.components.map((c) => ({
    name: c.name,
    type: c.type,
    mode: c.mode,
    value: c.value,
    payPeriod: c.payPeriod,
    amount: c.mode === 'fixed' ? c.value : 0,
    considerForLeaveEncashment: c.considerForLeaveEncashment,
  }))

  // Employer contribution + variable pay come off the top of CTC. Percent
  // values for these resolve against CTC directly to avoid circularity.
  let offTop = 0
  rows.forEach((r, i) => {
    if (r.type === 'Employer Contribution' || r.type === 'Variable Pay') {
      const amt =
        slab.components[i].mode === 'fixed'
          ? slab.components[i].value
          : Math.round((ctc * slab.components[i].value) / 100)
      r.amount = amt
      offTop += amt
    }
  })
  const gross = ctc - offTop

  // Percent-of-gross earnings and deductions.
  rows.forEach((r, i) => {
    const c = slab.components[i]
    if (
      (r.type === 'Earning' || r.type === 'Deduction') &&
      c.mode === 'percent-of-gross'
    ) {
      r.amount = Math.round((gross * c.value) / 100)
    }
  })

  // Balancing earning absorbs the remainder so earnings total = gross.
  const balIdx = slab.components.findIndex((c) => c.balancing)
  if (balIdx >= 0) {
    const otherEarnings = rows
      .filter((r, i) => r.type === 'Earning' && i !== balIdx)
      .reduce((s, r) => s + r.amount, 0)
    rows[balIdx].amount = Math.max(0, gross - otherEarnings)
  }

  return rows
}

/** Gross for an offered CTC under a slab (CTC − employer contrib − variable). */
export function grossFor(slab: CompensationSlab, ctc: number): number {
  return computeBreakup(slab, ctc)
    .filter((r) => r.type === 'Earning')
    .reduce((s, r) => s + r.amount, 0)
}
