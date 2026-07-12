import { DEPARTMENTS, type Company } from './report-catalog'

/**
 * Rich report views for the standard catalog: per-report headline KPIs,
 * charts and a domain-specific data table, computed over the viewer's
 * authorized companies only (RPT-12/17/18) so RLS visibly shapes every run.
 *
 * Compensation/payroll reports deliberately have NO insight builder — they
 * stay comp-dark with placeholder values and never render pay figures.
 */

export interface ReportKpi {
  label: string
  value: string
  hint: string
}

export type InsightChart =
  | {
      kind: 'hbar'
      title: string
      subtitle?: string
      data: { label: string; value: number; color?: string }[]
      suffix?: string
      monochrome?: boolean
    }
  | {
      kind: 'column'
      title: string
      subtitle?: string
      data: { label: string; value: number; color?: string }[]
      suffix?: string
    }
  | {
      kind: 'donut'
      title: string
      subtitle?: string
      data: { label: string; value: number; color?: string }[]
      centerLabel: string
      centerValue: string
    }
  | {
      kind: 'trend'
      title: string
      subtitle?: string
      points: { label: string; value: number }[]
      suffix?: string
    }
  | {
      kind: 'stacked'
      title: string
      subtitle?: string
      series: { name: string; color?: string }[]
      categories: { label: string; values: number[] }[]
    }

export interface ReportInsight {
  kpis: ReportKpi[]
  charts: InsightChart[]
  table: { title: string; columns: string[]; rows: string[][] }
}

type Department = (typeof DEPARTMENTS)[number]

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] as const

/* ------------------------------------------------------------------ */
/* Per-company base numbers (plausible mock, deterministic)            */
/* ------------------------------------------------------------------ */

const HEADCOUNT: Record<Company, Record<Department, number>> = {
  'Aurora Software': {
    Engineering: 132,
    Sales: 48,
    'Human Resources': 14,
    Finance: 18,
    Operations: 36,
  },
  'Northwind Retail': {
    Engineering: 22,
    Sales: 96,
    'Human Resources': 12,
    Finance: 15,
    Operations: 141,
  },
  'Zenith Manufacturing': {
    Engineering: 84,
    Sales: 26,
    'Human Resources': 10,
    Finance: 14,
    Operations: 178,
  },
  'Helios Energy': {
    Engineering: 58,
    Sales: 20,
    'Human Resources': 8,
    Finance: 24,
    Operations: 66,
  },
}

const WOMEN_SHARE: Record<Company, number> = {
  'Aurora Software': 0.38,
  'Northwind Retail': 0.47,
  'Zenith Manufacturing': 0.24,
  'Helios Energy': 0.33,
}

/** Jan..Jun joiners / exits per company. */
const MOVEMENT: Record<Company, { joins: number[]; exits: number[] }> = {
  'Aurora Software': { joins: [6, 4, 5, 9, 7, 8], exits: [2, 3, 2, 4, 3, 6] },
  'Northwind Retail': { joins: [8, 6, 7, 10, 9, 7], exits: [5, 4, 6, 5, 7, 6] },
  'Zenith Manufacturing': {
    joins: [4, 5, 3, 6, 5, 4],
    exits: [3, 2, 4, 3, 2, 3],
  },
  'Helios Energy': { joins: [3, 2, 4, 5, 3, 4], exits: [1, 2, 1, 3, 2, 2] },
}

const OPEN_POSITIONS: Record<Company, number> = {
  'Aurora Software': 12,
  'Northwind Retail': 9,
  'Zenith Manufacturing': 7,
  'Helios Energy': 5,
}

const ATTRITION_PCT: Record<Company, number> = {
  'Aurora Software': 4.1,
  'Northwind Retail': 7.8,
  'Zenith Manufacturing': 3.2,
  'Helios Energy': 2.6,
}

/** Org structure: managers, average span, deepest reporting line. */
const ORG: Record<Company, { managers: number; span: number; depth: number }> =
  {
    'Aurora Software': { managers: 31, span: 6.9, depth: 5 },
    'Northwind Retail': { managers: 38, span: 6.5, depth: 6 },
    'Zenith Manufacturing': { managers: 41, span: 6.6, depth: 7 },
    'Helios Energy': { managers: 22, span: 7.0, depth: 5 },
  }

const SPAN_BY_DEPT: Record<Department, number> = {
  Engineering: 6.2,
  Sales: 8.1,
  'Human Resources': 4.5,
  Finance: 5.2,
  Operations: 9.4,
}

/** Recruitment funnel per company: applied → hired. */
const FUNNEL_STAGES = [
  'Applied',
  'Screened',
  'Interviewed',
  'Offered',
  'Hired',
] as const

const FUNNEL: Record<Company, number[]> = {
  'Aurora Software': [186, 112, 54, 21, 16],
  'Northwind Retail': [214, 128, 61, 26, 19],
  'Zenith Manufacturing': [98, 57, 29, 12, 9],
  'Helios Energy': [76, 44, 22, 10, 8],
}

const HIRE_SOURCES = [
  { label: 'Referrals', share: 0.34 },
  { label: 'Job boards', share: 0.29 },
  { label: 'Agency', share: 0.19 },
  { label: 'Careers site', share: 0.12 },
  { label: 'Campus', share: 0.06 },
] as const

/** Leave: allocated vs taken days per department (per company scale). */
const LEAVE_BY_DEPT: Record<Department, { allocated: number; taken: number }> =
  {
    Engineering: { allocated: 24, taken: 13.2 },
    Sales: { allocated: 24, taken: 16.8 },
    'Human Resources': { allocated: 24, taken: 11.5 },
    Finance: { allocated: 24, taken: 10.4 },
    Operations: { allocated: 24, taken: 15.6 },
  }

const LEAVE_MIX = [
  { label: 'Earned leave', share: 0.46 },
  { label: 'Sick leave', share: 0.22 },
  { label: 'Casual leave', share: 0.18 },
  { label: 'Comp-off', share: 0.09 },
  { label: 'Optional holiday', share: 0.05 },
] as const

/** Monthly leave days taken per company (Jan..Jun). */
const LEAVE_TREND: Record<Company, number[]> = {
  'Aurora Software': [88, 74, 96, 132, 118, 141],
  'Northwind Retail': [102, 91, 108, 149, 136, 158],
  'Zenith Manufacturing': [96, 84, 101, 138, 122, 149],
  'Helios Energy': [54, 47, 58, 79, 71, 84],
}

/** Attendance: monthly average attendance % per company (Jan..Jun). */
const ATTENDANCE_TREND: Record<Company, number[]> = {
  'Aurora Software': [94, 95, 93, 92, 94, 95],
  'Northwind Retail': [91, 92, 90, 89, 91, 92],
  'Zenith Manufacturing': [95, 96, 94, 95, 96, 96],
  'Helios Energy': [96, 95, 96, 94, 95, 97],
}

/** Attendance day composition per department (% of scheduled days). */
const DAY_MIX_BY_DEPT: Record<
  Department,
  { office: number; wfh: number; leave: number; absent: number }
> = {
  Engineering: { office: 68, wfh: 24, leave: 6, absent: 2 },
  Sales: { office: 78, wfh: 12, leave: 7, absent: 3 },
  'Human Resources': { office: 82, wfh: 12, leave: 5, absent: 1 },
  Finance: { office: 80, wfh: 14, leave: 5, absent: 1 },
  Operations: { office: 90, wfh: 2, leave: 6, absent: 2 },
}

/** Overtime hours per department per company (June). */
const OT_BY_DEPT: Record<Company, Record<Department, number>> = {
  'Aurora Software': {
    Engineering: 118,
    Sales: 34,
    'Human Resources': 8,
    Finance: 22,
    Operations: 41,
  },
  'Northwind Retail': {
    Engineering: 21,
    Sales: 78,
    'Human Resources': 6,
    Finance: 18,
    Operations: 164,
  },
  'Zenith Manufacturing': {
    Engineering: 92,
    Sales: 12,
    'Human Resources': 4,
    Finance: 14,
    Operations: 236,
  },
  'Helios Energy': {
    Engineering: 44,
    Sales: 9,
    'Human Resources': 3,
    Finance: 19,
    Operations: 58,
  },
}

const OT_TREND: Record<Company, number[]> = {
  'Aurora Software': [186, 174, 201, 214, 198, 223],
  'Northwind Retail': [242, 231, 260, 274, 251, 287],
  'Zenith Manufacturing': [301, 288, 322, 341, 315, 358],
  'Helios Energy': [112, 104, 121, 128, 117, 133],
}

/** Assets by category per company: [assigned, inStock, inRepair]. */
const ASSET_CATEGORIES = [
  'Laptops',
  'Monitors',
  'Mobile phones',
  'Scanners & POS',
  'Vehicles',
] as const

const ASSETS: Record<Company, number[][]> = {
  'Aurora Software': [
    [231, 24, 6],
    [198, 31, 3],
    [64, 9, 1],
    [4, 2, 0],
    [3, 1, 0],
  ],
  'Northwind Retail': [
    [96, 12, 4],
    [88, 10, 2],
    [142, 18, 5],
    [176, 22, 9],
    [14, 3, 2],
  ],
  'Zenith Manufacturing': [
    [104, 15, 5],
    [92, 11, 3],
    [88, 12, 2],
    [61, 8, 4],
    [22, 4, 3],
  ],
  'Helios Energy': [
    [128, 14, 3],
    [96, 9, 2],
    [71, 8, 1],
    [12, 3, 1],
    [31, 5, 2],
  ],
}

/** Policy acknowledgement counts per company: [acked, pending, overdue]. */
const POLICY_ACK: Record<Company, number[]> = {
  'Aurora Software': [214, 22, 12],
  'Northwind Retail': [231, 34, 21],
  'Zenith Manufacturing': [265, 28, 19],
  'Helios Energy': [152, 14, 10],
}

const POLICY_ROWS: {
  policy: string
  audience: string
  ackPct: number
  due: string
}[] = [
  {
    policy: 'Code of Conduct v3',
    audience: 'All employees',
    ackPct: 94,
    due: '2026-05-31',
  },
  {
    policy: 'POSH Policy 2026',
    audience: 'All employees',
    ackPct: 87,
    due: '2026-06-30',
  },
  {
    policy: 'Data Privacy Policy v2',
    audience: 'All employees',
    ackPct: 91,
    due: '2026-06-15',
  },
  {
    policy: 'Remote Work Policy v4',
    audience: 'Eligible roles',
    ackPct: 82,
    due: '2026-07-10',
  },
  {
    policy: 'Plant Safety Handbook',
    audience: 'Operations only',
    ackPct: 96,
    due: '2026-05-20',
  },
]

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const sum = (ns: number[]) => ns.reduce((s, n) => s + n, 0)

const companyHeadcount = (c: Company) =>
  sum(DEPARTMENTS.map((d) => HEADCOUNT[c][d]))

const totalHeadcount = (companies: Company[]) =>
  sum(companies.map(companyHeadcount))

const pct = (n: number) => `${n.toFixed(1)}%`

/* ------------------------------------------------------------------ */
/* Domain insight builders                                             */
/* ------------------------------------------------------------------ */

function workforceInsight(companies: Company[]): ReportInsight {
  const total = totalHeadcount(companies)
  const byDept = DEPARTMENTS.map((d) => ({
    label: d,
    value: sum(companies.map((c) => HEADCOUNT[c][d])),
  }))
  const women = Math.round(
    sum(companies.map((c) => companyHeadcount(c) * WOMEN_SHARE[c]))
  )
  const joinsQtd = sum(
    companies.map((c) => sum(MOVEMENT[c].joins.slice(3)))
  )
  // Headcount trend reconstructed backwards from net monthly movement.
  const netByMonth = MONTHS.map((_, i) =>
    sum(companies.map((c) => MOVEMENT[c].joins[i] - MOVEMENT[c].exits[i]))
  )
  const points: { label: string; value: number }[] = []
  let running = total
  for (let i = MONTHS.length - 1; i >= 0; i--) {
    points.unshift({ label: MONTHS[i], value: running })
    running -= netByMonth[i]
  }
  return {
    kpis: [
      {
        label: 'Total headcount',
        value: total.toLocaleString('en-US'),
        hint: `across ${companies.length} in-scope company(ies)`,
      },
      {
        label: 'Joiners this quarter',
        value: String(joinsQtd),
        hint: 'Apr – Jun 2026',
      },
      {
        label: 'Women in workforce',
        value: pct((women / Math.max(1, total)) * 100),
        hint: `${women} employees`,
      },
      {
        label: 'Open positions',
        value: String(sum(companies.map((c) => OPEN_POSITIONS[c]))),
        hint: 'approved requisitions',
      },
    ],
    charts: [
      {
        kind: 'hbar',
        title: 'Headcount by department',
        subtitle: 'current employees per department, in-scope companies',
        data: byDept,
        monochrome: true,
      },
      {
        kind: 'trend',
        title: 'Headcount trend',
        subtitle: 'month-end headcount, Jan – Jun 2026',
        points,
      },
      {
        kind: 'donut',
        title: 'Headcount by company',
        subtitle: 'share of workforce per in-scope company',
        data: companies.map((c) => ({ label: c, value: companyHeadcount(c) })),
        centerLabel: 'employees',
        centerValue: total.toLocaleString('en-US'),
      },
    ],
    table: {
      title: 'Headcount by company and department',
      columns: ['Company', ...DEPARTMENTS, 'Total'],
      rows: companies.map((c) => [
        c,
        ...DEPARTMENTS.map((d) => String(HEADCOUNT[c][d])),
        String(companyHeadcount(c)),
      ]),
    },
  }
}

function orgStructureInsight(companies: Company[]): ReportInsight {
  const managers = sum(companies.map((c) => ORG[c].managers))
  const total = totalHeadcount(companies)
  const avgSpan =
    sum(companies.map((c) => ORG[c].span * ORG[c].managers)) /
    Math.max(1, managers)
  const maxDepth = Math.max(...companies.map((c) => ORG[c].depth))
  return {
    kpis: [
      {
        label: 'People managers',
        value: String(managers),
        hint: 'employees with direct reports',
      },
      {
        label: 'Avg span of control',
        value: avgSpan.toFixed(1),
        hint: 'direct reports per manager',
      },
      {
        label: 'Deepest reporting line',
        value: `${maxDepth} levels`,
        hint: 'CEO to front line',
      },
      {
        label: 'Individual contributors',
        value: pct(((total - managers) / Math.max(1, total)) * 100),
        hint: `${total - managers} employees`,
      },
    ],
    charts: [
      {
        kind: 'column',
        title: 'Average span of control by department',
        subtitle: 'direct reports per manager',
        data: DEPARTMENTS.map((d) => ({ label: d, value: SPAN_BY_DEPT[d] })),
      },
      {
        kind: 'hbar',
        title: 'Managers by company',
        subtitle: 'people managers per in-scope company',
        data: companies.map((c) => ({ label: c, value: ORG[c].managers })),
        monochrome: true,
      },
    ],
    table: {
      title: 'Structure summary per company',
      columns: [
        'Company',
        'Headcount',
        'Managers',
        'Avg span',
        'Reporting levels',
      ],
      rows: companies.map((c) => [
        c,
        String(companyHeadcount(c)),
        String(ORG[c].managers),
        ORG[c].span.toFixed(1),
        String(ORG[c].depth),
      ]),
    },
  }
}

function recruitmentInsight(companies: Company[]): ReportInsight {
  const stages = FUNNEL_STAGES.map((label, i) => ({
    label,
    value: sum(companies.map((c) => FUNNEL[c][i])),
  }))
  const applied = stages[0].value
  const offered = stages[3].value
  const hired = stages[4].value
  return {
    kpis: [
      {
        label: 'Open requisitions',
        value: String(sum(companies.map((c) => OPEN_POSITIONS[c]))),
        hint: 'currently sourcing',
      },
      {
        label: 'Applicants YTD',
        value: applied.toLocaleString('en-US'),
        hint: 'across all requisitions',
      },
      {
        label: 'Offer acceptance',
        value: pct((hired / Math.max(1, offered)) * 100),
        hint: `${hired} of ${offered} offers accepted`,
      },
      {
        label: 'Median time to fill',
        value: '34 days',
        hint: 'requisition open to offer accepted',
      },
    ],
    charts: [
      {
        kind: 'hbar',
        title: 'Hiring funnel',
        subtitle: 'candidates remaining at each stage',
        data: stages,
        monochrome: true,
      },
      {
        kind: 'donut',
        title: 'Source of hire',
        subtitle: 'where accepted candidates came from',
        data: HIRE_SOURCES.map((s) => ({
          label: s.label,
          value: Math.max(1, Math.round(hired * s.share)),
        })),
        centerLabel: 'hires',
        centerValue: String(hired),
      },
      {
        kind: 'column',
        title: 'Applicants by company',
        subtitle: 'total applications received per company',
        data: companies.map((c) => ({ label: c, value: FUNNEL[c][0] })),
      },
    ],
    table: {
      title: 'Pipeline by company',
      columns: ['Company', ...FUNNEL_STAGES, 'Conversion'],
      rows: companies.map((c) => [
        c,
        ...FUNNEL[c].map(String),
        pct((FUNNEL[c][4] / Math.max(1, FUNNEL[c][0])) * 100),
      ]),
    },
  }
}

function lifecycleInsight(companies: Company[]): ReportInsight {
  const joins = MONTHS.map((_, i) =>
    sum(companies.map((c) => MOVEMENT[c].joins[i]))
  )
  const exits = MONTHS.map((_, i) =>
    sum(companies.map((c) => MOVEMENT[c].exits[i]))
  )
  const joinsTotal = sum(joins)
  const exitsTotal = sum(exits)
  const avgAttrition =
    sum(companies.map((c) => ATTRITION_PCT[c])) / Math.max(1, companies.length)
  return {
    kpis: [
      {
        label: 'Joiners YTD',
        value: String(joinsTotal),
        hint: 'Jan – Jun 2026',
      },
      { label: 'Exits YTD', value: String(exitsTotal), hint: 'Jan – Jun 2026' },
      {
        label: 'Net movement',
        value: `${joinsTotal - exitsTotal >= 0 ? '+' : ''}${joinsTotal - exitsTotal}`,
        hint: 'joiners minus leavers',
      },
      {
        label: 'Avg attrition',
        value: pct(avgAttrition),
        hint: 'annualised, in-scope companies',
      },
    ],
    charts: [
      {
        kind: 'stacked',
        title: 'Joiners vs exits by month',
        subtitle: 'monthly workforce movement, Jan – Jun 2026',
        series: [
          { name: 'Joiners', color: '#31b97e' },
          { name: 'Exits', color: '#f1552f' },
        ],
        categories: MONTHS.map((m, i) => ({
          label: m,
          values: [joins[i], exits[i]],
        })),
      },
      {
        kind: 'trend',
        title: 'Net adds per month',
        subtitle: 'joiners minus exits',
        points: MONTHS.map((m, i) => ({ label: m, value: joins[i] - exits[i] })),
      },
      {
        kind: 'hbar',
        title: 'Attrition by company',
        subtitle: 'annualised attrition rate',
        data: companies.map((c) => ({ label: c, value: ATTRITION_PCT[c] })),
        suffix: '%',
        monochrome: true,
      },
    ],
    table: {
      title: 'Movement by company (YTD)',
      columns: ['Company', 'Joiners', 'Exits', 'Net', 'Attrition'],
      rows: companies.map((c) => {
        const j = sum(MOVEMENT[c].joins)
        const e = sum(MOVEMENT[c].exits)
        return [
          c,
          String(j),
          String(e),
          `${j - e >= 0 ? '+' : ''}${j - e}`,
          pct(ATTRITION_PCT[c]),
        ]
      }),
    },
  }
}

function leaveInsight(companies: Company[]): ReportInsight {
  const scale = companies.length / 4 || 1
  const takenDays = sum(companies.map((c) => sum(LEAVE_TREND[c])))
  const utilisation =
    sum(DEPARTMENTS.map((d) => LEAVE_BY_DEPT[d].taken)) /
    sum(DEPARTMENTS.map((d) => LEAVE_BY_DEPT[d].allocated))
  return {
    kpis: [
      {
        label: 'Leave days taken',
        value: takenDays.toLocaleString('en-US'),
        hint: 'Jan – Jun 2026, in-scope companies',
      },
      {
        label: 'Utilisation',
        value: pct(utilisation * 100),
        hint: 'taken vs annual allocation (pro-rata)',
      },
      {
        label: 'Pending approvals',
        value: String(Math.max(2, Math.round(14 * scale))),
        hint: 'requests awaiting manager action',
      },
      {
        label: 'Avg balance',
        value: '9.6 days',
        hint: 'earned leave per employee',
      },
    ],
    charts: [
      {
        kind: 'hbar',
        title: 'Leave utilisation by department',
        subtitle: '% of allocation used, year to date',
        data: DEPARTMENTS.map((d) => ({
          label: d,
          value:
            Math.round(
              (LEAVE_BY_DEPT[d].taken / LEAVE_BY_DEPT[d].allocated) * 1000
            ) / 10,
        })),
        suffix: '%',
        monochrome: true,
      },
      {
        kind: 'donut',
        title: 'Leave mix by type',
        subtitle: 'share of days taken per leave type',
        data: LEAVE_MIX.map((m) => ({
          label: m.label,
          value: Math.round(takenDays * m.share),
        })),
        centerLabel: 'days taken',
        centerValue: takenDays.toLocaleString('en-US'),
      },
      {
        kind: 'trend',
        title: 'Leave days by month',
        subtitle: 'total days taken, Jan – Jun 2026',
        points: MONTHS.map((m, i) => ({
          label: m,
          value: sum(companies.map((c) => LEAVE_TREND[c][i])),
        })),
      },
    ],
    table: {
      title: 'Utilisation by department',
      columns: [
        'Department',
        'Allocated / head',
        'Taken / head',
        'Utilisation',
      ],
      rows: DEPARTMENTS.map((d) => [
        d,
        `${LEAVE_BY_DEPT[d].allocated} days`,
        `${LEAVE_BY_DEPT[d].taken} days`,
        pct((LEAVE_BY_DEPT[d].taken / LEAVE_BY_DEPT[d].allocated) * 100),
      ]),
    },
  }
}

function attendanceInsight(companies: Company[]): ReportInsight {
  const avgPct = (i: number) =>
    sum(companies.map((c) => ATTENDANCE_TREND[c][i])) /
    Math.max(1, companies.length)
  const juneAvg = avgPct(5)
  const otJune = sum(
    companies.map((c) => sum(DEPARTMENTS.map((d) => OT_BY_DEPT[c][d])))
  )
  return {
    kpis: [
      {
        label: 'Avg attendance',
        value: pct(juneAvg),
        hint: 'June 2026, in-scope companies',
      },
      {
        label: 'Overtime hours',
        value: otJune.toLocaleString('en-US'),
        hint: 'June 2026 total',
      },
      {
        label: 'WFH share',
        value: pct(
          sum(DEPARTMENTS.map((d) => DAY_MIX_BY_DEPT[d].wfh)) /
            DEPARTMENTS.length
        ),
        hint: 'of scheduled working days',
      },
      {
        label: 'Attendance defaulters',
        value: String(Math.max(1, 3 * companies.length)),
        hint: '3+ missed punches this month',
      },
    ],
    charts: [
      {
        kind: 'trend',
        title: 'Average attendance by month',
        subtitle: '% of scheduled days attended',
        points: MONTHS.map((m, i) => ({
          label: m,
          value: Math.round(avgPct(i) * 10) / 10,
        })),
        suffix: '%',
      },
      {
        kind: 'stacked',
        title: 'Working-day composition by department',
        subtitle: '% of scheduled days: office, WFH, leave, absent',
        series: [
          { name: 'Office', color: '#1f5adb' },
          { name: 'WFH', color: '#50c9ce' },
          { name: 'Leave', color: '#f2af29' },
          { name: 'Absent', color: '#f1552f' },
        ],
        categories: DEPARTMENTS.map((d) => ({
          label: d,
          values: [
            DAY_MIX_BY_DEPT[d].office,
            DAY_MIX_BY_DEPT[d].wfh,
            DAY_MIX_BY_DEPT[d].leave,
            DAY_MIX_BY_DEPT[d].absent,
          ],
        })),
      },
    ],
    table: {
      title: 'Attendance summary by company (June 2026)',
      columns: ['Company', 'Attendance', 'OT hours', 'Trend vs May'],
      rows: companies.map((c) => {
        const t = ATTENDANCE_TREND[c]
        const delta = t[5] - t[4]
        return [
          c,
          pct(t[5]),
          String(sum(DEPARTMENTS.map((d) => OT_BY_DEPT[c][d]))),
          `${delta >= 0 ? '+' : ''}${delta.toFixed(1)} pts`,
        ]
      }),
    },
  }
}

function overtimeInsight(companies: Company[]): ReportInsight {
  const byDept = DEPARTMENTS.map((d) => ({
    label: d,
    value: sum(companies.map((c) => OT_BY_DEPT[c][d])),
  }))
  const juneTotal = sum(byDept.map((b) => b.value))
  const trend = MONTHS.map((m, i) => ({
    label: m,
    value: sum(companies.map((c) => OT_TREND[c][i])),
  }))
  return {
    kpis: [
      {
        label: 'OT hours (June)',
        value: juneTotal.toLocaleString('en-US'),
        hint: 'in-scope companies',
      },
      {
        label: 'Vs May',
        value: pct(((trend[5].value - trend[4].value) / trend[4].value) * 100),
        hint: 'month-on-month change',
      },
      {
        label: 'Top department',
        value: [...byDept].sort((a, b) => b.value - a.value)[0].label,
        hint: 'highest overtime load',
      },
      {
        label: 'Comp-off earned',
        value: String(Math.round(juneTotal / 8)),
        hint: 'days accrued from overtime',
      },
    ],
    charts: [
      {
        kind: 'column',
        title: 'Overtime hours by department',
        subtitle: 'June 2026',
        data: byDept,
      },
      {
        kind: 'trend',
        title: 'Overtime hours by month',
        subtitle: 'Jan – Jun 2026 total',
        points: trend,
      },
    ],
    table: {
      title: 'Overtime by company and department (June)',
      columns: ['Company', ...DEPARTMENTS, 'Total'],
      rows: companies.map((c) => [
        c,
        ...DEPARTMENTS.map((d) => String(OT_BY_DEPT[c][d])),
        String(sum(DEPARTMENTS.map((d) => OT_BY_DEPT[c][d]))),
      ]),
    },
  }
}

function assetInsight(companies: Company[]): ReportInsight {
  const perCategory = ASSET_CATEGORIES.map((label, i) => {
    const assigned = sum(companies.map((c) => ASSETS[c][i][0]))
    const inStock = sum(companies.map((c) => ASSETS[c][i][1]))
    const inRepair = sum(companies.map((c) => ASSETS[c][i][2]))
    return { label, assigned, inStock, inRepair }
  })
  const assigned = sum(perCategory.map((p) => p.assigned))
  const inStock = sum(perCategory.map((p) => p.inStock))
  const inRepair = sum(perCategory.map((p) => p.inRepair))
  const total = assigned + inStock + inRepair
  return {
    kpis: [
      {
        label: 'Total assets',
        value: total.toLocaleString('en-US'),
        hint: 'tracked in the register',
      },
      {
        label: 'Assigned',
        value: pct((assigned / Math.max(1, total)) * 100),
        hint: `${assigned} with custodians`,
      },
      { label: 'In stock', value: String(inStock), hint: 'ready to allocate' },
      {
        label: 'Under repair',
        value: String(inRepair),
        hint: 'with service vendors',
      },
    ],
    charts: [
      {
        kind: 'donut',
        title: 'Assets by category',
        subtitle: 'all statuses',
        data: perCategory.map((p) => ({
          label: p.label,
          value: p.assigned + p.inStock + p.inRepair,
        })),
        centerLabel: 'assets',
        centerValue: total.toLocaleString('en-US'),
      },
      {
        kind: 'stacked',
        title: 'Allocation status by category',
        subtitle: 'assigned vs in stock vs under repair',
        series: [
          { name: 'Assigned', color: '#1f5adb' },
          { name: 'In stock', color: '#31b97e' },
          { name: 'Under repair', color: '#f2af29' },
        ],
        categories: perCategory.map((p) => ({
          label: p.label,
          values: [p.assigned, p.inStock, p.inRepair],
        })),
      },
      {
        kind: 'hbar',
        title: 'Assets by company',
        subtitle: 'total tracked assets per in-scope company',
        data: companies.map((c) => ({
          label: c,
          value: sum(ASSETS[c].map((row) => sum(row))),
        })),
        monochrome: true,
      },
    ],
    table: {
      title: 'Register by category',
      columns: ['Category', 'Assigned', 'In stock', 'Under repair', 'Total'],
      rows: perCategory.map((p) => [
        p.label,
        String(p.assigned),
        String(p.inStock),
        String(p.inRepair),
        String(p.assigned + p.inStock + p.inRepair),
      ]),
    },
  }
}

function policyComplianceInsight(companies: Company[]): ReportInsight {
  const acked = sum(companies.map((c) => POLICY_ACK[c][0]))
  const pending = sum(companies.map((c) => POLICY_ACK[c][1]))
  const overdue = sum(companies.map((c) => POLICY_ACK[c][2]))
  const total = acked + pending + overdue
  return {
    kpis: [
      {
        label: 'Overall ack rate',
        value: pct((acked / Math.max(1, total)) * 100),
        hint: `${acked} of ${total} required acknowledgements`,
      },
      {
        label: 'Active policies',
        value: String(POLICY_ROWS.length),
        hint: 'currently requiring acknowledgement',
      },
      {
        label: 'Overdue',
        value: String(overdue),
        hint: 'past their acknowledgement deadline',
      },
      {
        label: 'Paper acks (non-users)',
        value: String(Math.max(1, Math.round(total * 0.04))),
        hint: 'recorded on behalf of non-login employees',
      },
    ],
    charts: [
      {
        kind: 'donut',
        title: 'Acknowledgement status',
        subtitle: 'all in-scope employees × active policies',
        data: [
          { label: 'Acknowledged', value: acked, color: '#31b97e' },
          { label: 'Pending', value: pending, color: '#f2af29' },
          { label: 'Overdue', value: overdue, color: '#f1552f' },
        ],
        centerLabel: 'ack rate',
        centerValue: `${Math.round((acked / Math.max(1, total)) * 100)}%`,
      },
      {
        kind: 'hbar',
        title: 'Acknowledgement rate by company',
        subtitle: '% of required acknowledgements completed',
        data: companies.map((c) => {
          const [a, p, o] = POLICY_ACK[c]
          return {
            label: c,
            value: Math.round((a / Math.max(1, a + p + o)) * 1000) / 10,
          }
        }),
        suffix: '%',
        monochrome: true,
      },
      {
        kind: 'column',
        title: 'Acknowledgement rate by policy',
        subtitle: 'active policies, all in-scope companies',
        data: POLICY_ROWS.map((p) => ({ label: p.policy, value: p.ackPct })),
        suffix: '%',
      },
    ],
    table: {
      title: 'Active policies',
      columns: ['Policy', 'Audience', 'Ack rate', 'Deadline'],
      rows: POLICY_ROWS.map((p) => [
        p.policy,
        p.audience,
        `${p.ackPct}%`,
        p.due,
      ]),
    },
  }
}

function portfolioConsolidatedInsight(companies: Company[]): ReportInsight {
  const base = workforceInsight(companies)
  const lifecycle = lifecycleInsight(companies)
  return {
    kpis: [
      {
        label: 'Companies in scope',
        value: String(companies.length),
        hint: 'per your row-level security grants',
      },
      base.kpis[0],
      lifecycle.kpis[3],
      base.kpis[3],
    ],
    charts: [
      {
        kind: 'stacked',
        title: 'Headcount by company and department',
        subtitle: 'consolidated across your authorized companies',
        series: DEPARTMENTS.map((d) => ({ name: d })),
        categories: companies.map((c) => ({
          label: c,
          values: DEPARTMENTS.map((d) => HEADCOUNT[c][d]),
        })),
      },
      {
        kind: 'hbar',
        title: 'Attrition by company',
        subtitle: 'annualised attrition, side-by-side',
        data: companies.map((c) => ({ label: c, value: ATTRITION_PCT[c] })),
        suffix: '%',
        monochrome: true,
      },
      {
        kind: 'trend',
        title: 'Consolidated net adds per month',
        subtitle: 'joiners minus exits across the portfolio/group',
        points: MONTHS.map((m, i) => ({
          label: m,
          value: sum(
            companies.map((c) => MOVEMENT[c].joins[i] - MOVEMENT[c].exits[i])
          ),
        })),
      },
    ],
    table: {
      title: 'Company scorecard',
      columns: [
        'Company',
        'Headcount',
        'Joiners YTD',
        'Exits YTD',
        'Attrition',
        'Open positions',
      ],
      rows: companies.map((c) => [
        c,
        String(companyHeadcount(c)),
        String(sum(MOVEMENT[c].joins)),
        String(sum(MOVEMENT[c].exits)),
        pct(ATTRITION_PCT[c]),
        String(OPEN_POSITIONS[c]),
      ]),
    },
  }
}

function groupComplianceRollupInsight(companies: Company[]): ReportInsight {
  const policy = policyComplianceInsight(companies)
  return {
    kpis: [
      {
        label: 'Companies in scope',
        value: String(companies.length),
        hint: 'per your row-level security grants',
      },
      policy.kpis[0],
      policy.kpis[2],
      {
        label: 'Statutory registers',
        value: '4 current',
        hint: 'PF / ESIC / gratuity / bonus templates in force',
      },
    ],
    charts: [
      policy.charts[1],
      policy.charts[0],
    ],
    table: {
      title: 'Compliance rollup by company',
      columns: ['Company', 'Acknowledged', 'Pending', 'Overdue', 'Ack rate'],
      rows: companies.map((c) => {
        const [a, p, o] = POLICY_ACK[c]
        return [
          c,
          String(a),
          String(p),
          String(o),
          pct((a / Math.max(1, a + p + o)) * 100),
        ]
      }),
    },
  }
}

/* ------------------------------------------------------------------ */
/* Registry                                                            */
/* ------------------------------------------------------------------ */

const BUILDERS: Record<string, (companies: Company[]) => ReportInsight> = {
  // Workforce / employee management
  'rep-01': workforceInsight,
  // Organization structure
  'rep-10': orgStructureInsight,
  // Talent acquisition
  'rep-11': recruitmentInsight,
  // Lifecycle: joiners vs leavers (and attrition/retention share the view)
  'rep-13': lifecycleInsight,
  'rep-14': lifecycleInsight,
  'rep-15': lifecycleInsight,
  // Attendance & overtime
  'rep-20': attendanceInsight,
  'rep-26': overtimeInsight,
  'rep-27': overtimeInsight,
  // Leave utilisation
  'rep-30': leaveInsight,
  'rep-31': leaveInsight,
  // Assets
  'rep-57': assetInsight,
  'rep-58': assetInsight,
  // Policy compliance
  'rep-62': policyComplianceInsight,
  // Consolidated portfolio/group reports
  'rep-63': portfolioConsolidatedInsight,
  'rep-64': groupComplianceRollupInsight,
}

/**
 * Full report view (KPIs + charts + table) for a standard report, computed
 * over the in-scope companies only. Returns null for reports without a
 * dedicated view — the run sheet then shows the record preview alone.
 */
export function reportInsight(
  reportId: string,
  companies: Company[]
): ReportInsight | null {
  if (companies.length === 0) return null
  const builder = BUILDERS[reportId]
  return builder ? builder(companies) : null
}
