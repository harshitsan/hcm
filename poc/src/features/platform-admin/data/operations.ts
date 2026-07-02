/**
 * Platform Administration — operations & SLA domain (SYS-23, 24, 53-64).
 * Performance targets vs measured values, availability tiers, RTO/RPO,
 * backup tiers, DR test cadence and maintenance windows.
 */

export interface PerfMetric {
  id: string
  name: string
  target: string
  measured: string
  met: boolean
}

export interface AvailabilityTier {
  tier: string
  target: string
  measured: string
  met: boolean
}

export interface RecoveryObjective {
  tier: string
  rto: string
  rpo: string
}

export interface BackupTier {
  name: string
  cadence: string
  retention: string
}

export const DR_TEST_KINDS = [
  'Tabletop exercise',
  'Failover test',
  'Backup restore test',
] as const
export type DrTestKind = (typeof DR_TEST_KINDS)[number]

export interface DrTest {
  id: string
  kind: DrTestKind
  cadence: string
  lastRun: string
  result: 'passed' | 'passed with notes'
}

export interface MaintenanceWindow {
  id: string
  date: string
  window: string
  durationHours: number
  noticeSentOn: string
  status: 'announced' | 'completed'
}

export const seedPerfMetrics: PerfMetric[] = [
  { id: 'pm-01', name: 'Standard interactions (pages, forms, search, nav)', target: '< 2 s', measured: '1.2 s p95', met: true },
  { id: 'pm-02', name: 'Interactions at 1000-employee tenant scale', target: '< 2 s', measured: '1.6 s p95', met: true },
  { id: 'pm-03', name: 'Standard report (≤ 1,000 records)', target: '≤ 30 s', measured: '18 s', met: true },
  { id: 'pm-04', name: 'Large report (1,000–10,000 records)', target: '≤ 2 min', measured: '1 min 24 s', met: true },
  { id: 'pm-05', name: 'Import / export (≤ 1,000 records)', target: '≤ 1 min', measured: '41 s', met: true },
  { id: 'pm-06', name: 'Import / export (≤ 10,000 records)', target: '≤ 5 min', measured: '5 min 12 s', met: false },
  { id: 'pm-07', name: 'Peak concurrency (20% of employees)', target: 'Responsive', measured: '18.4% peak, responsive', met: true },
  { id: 'pm-08', name: 'Burst load handling', target: 'Up to 2× normal', measured: '1.7× sustained, no data loss', met: true },
  { id: 'pm-09', name: 'Users per company / companies per portfolio', target: 'No fixed platform limit', measured: 'Largest tenant: 910 employees', met: true },
]

export const seedAvailabilityTiers: AvailabilityTier[] = [
  { tier: 'Critical services', target: '99.99%', measured: '99.994%', met: true },
  { tier: 'Standard services', target: '99.95%', measured: '99.972%', met: true },
  { tier: 'Background services', target: '99.9%', measured: '99.91%', met: true },
]

export const recoveryObjectives: RecoveryObjective[] = [
  { tier: 'Critical services', rto: '4 hours', rpo: '15 minutes' },
  { tier: 'Standard services', rto: '8 hours', rpo: '1 hour' },
]

export const backupTiers: BackupTier[] = [
  { name: 'Transaction log streaming', cadence: 'Continuous', retention: 'Rolling' },
  { name: 'Incremental backup', cadence: 'Hourly', retention: '30 days' },
  { name: 'Full backup', cadence: 'Daily', retention: '30 days' },
  { name: 'System backup', cadence: 'Weekly', retention: '90 days' },
  { name: 'Archival backup', cadence: 'Monthly', retention: '7 years' },
]

export const seedDrTests: DrTest[] = [
  { id: 'dr-01', kind: 'Tabletop exercise', cadence: 'Quarterly', lastRun: '2026-05-14', result: 'passed' },
  { id: 'dr-02', kind: 'Failover test', cadence: 'Bi-annual', lastRun: '2026-03-08', result: 'passed with notes' },
  { id: 'dr-03', kind: 'Backup restore test', cadence: 'Monthly (automated)', lastRun: '2026-06-01', result: 'passed' },
]

export const seedMaintenanceWindows: MaintenanceWindow[] = [
  { id: 'mw-01', date: '2026-06-07', window: 'Sun 02:00–05:30 IST', durationHours: 3.5, noticeSentOn: '2026-05-29', status: 'completed' },
  { id: 'mw-02', date: '2026-07-05', window: 'Sun 02:00–06:00 IST', durationHours: 4, noticeSentOn: '2026-06-26', status: 'announced' },
]

export const failoverPosture = {
  architecture: 'Active-passive multi-region',
  failoverTarget: 'Within 5 minutes',
  replication: 'Asynchronous cross-region',
  lastFailover: '2026-03-08 (test) — 3 min 41 s',
} as const
