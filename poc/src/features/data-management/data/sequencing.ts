import { TIERS, tierIndex, type Tier } from './catalog'
import { type DataJob } from './jobs'

export interface TierGate {
  tier: Tier
  unlocked: boolean
  /** First lower tier still missing a completed import (when locked). */
  missingTier?: Tier
  /** Plain-language explanation shown next to a locked tier. */
  reason?: string
}

/**
 * Dependency sequencing (FR 6.24.3): a tier only opens for import once at
 * least one committed, completed import exists for every tier below it.
 * Sandbox-only runs and rolled-back batches do not unlock anything.
 */
export function completedTiers(jobs: DataJob[]): Set<Tier> {
  const done = new Set<Tier>()
  for (const job of jobs) {
    if (
      job.kind === 'import' &&
      job.status === 'Completed' &&
      !job.staging &&
      !job.rolledBack
    ) {
      done.add(job.tier as Tier)
    }
  }
  return done
}

const LOCK_REASONS: Record<Tier, string> = {
  Foundation: '',
  Organizational:
    'Import Companies before Departments, Locations or Groups — organization records must reference an existing company.',
  Workforce:
    'Import Departments, Locations and Groups before Employees — employee records must reference existing organization masters.',
  Transactional:
    'Import Employees before Leave or Attendance — transactional records must reference existing employees.',
}

/** Gate for every tier, derived from the import history. */
export function tierGates(jobs: DataJob[]): Record<Tier, TierGate> {
  const done = completedTiers(jobs)
  const gates = {} as Record<Tier, TierGate>
  for (const tier of TIERS) {
    const missingTier = TIERS.slice(0, tierIndex(tier)).find(
      (lower) => !done.has(lower)
    )
    gates[tier] = missingTier
      ? {
          tier,
          unlocked: false,
          missingTier,
          reason: `${LOCK_REASONS[tier]} No completed ${missingTier} import exists yet.`,
        }
      : { tier, unlocked: true }
  }
  return gates
}
