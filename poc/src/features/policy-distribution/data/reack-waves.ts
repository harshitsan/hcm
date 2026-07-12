/**
 * Re-acknowledgment wave bridge — a module-level store owned by the Policy
 * Distribution module (which owns acknowledgment tracking).
 *
 * The Policy Management library announces a wave here when a new version of
 * a policy is published (content change / regulatory update); this module
 * consumes the queue and resets the affected employees to Pending. Keeping
 * the store here lets both feature pages stay mounted independently: an
 * announcement made while the distribution page is closed is applied the
 * next time it opens.
 */

export type AnnouncedWaveTrigger = 'Content change' | 'Regulatory update'

export interface ReAckWaveAnnouncement {
  id: string
  /** Policy name as known to the policy library. */
  policyName: string
  /** Named edition that was published, e.g. "Employee Manual 2027". */
  editionName: string
  trigger: AnnouncedWaveTrigger
  /** Regulatory updates are treated as priority waves. */
  priority: boolean
  announcedBy: string
  /** ISO datetime of the publish that raised the wave. */
  announcedAt: string
}

let queue: ReAckWaveAnnouncement[] = []
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

export function subscribeReAckWaves(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Snapshot for useSyncExternalStore — replaced (not mutated) on change. */
export function getPendingReAckWaves(): ReAckWaveAnnouncement[] {
  return queue
}

/** Called by the policy library when a published version requires re-acknowledgment. */
export function announceReAckWave(
  input: Omit<ReAckWaveAnnouncement, 'id' | 'announcedAt'>
): ReAckWaveAnnouncement {
  const wave: ReAckWaveAnnouncement = {
    ...input,
    id: `wave-${crypto.randomUUID().slice(0, 8)}`,
    announcedAt: new Date().toISOString(),
  }
  queue = [...queue, wave]
  emit()
  return wave
}

/**
 * Atomically removes a wave from the queue. Returns true only for the caller
 * that actually dequeued it, so a wave is applied exactly once even if the
 * consuming effect runs twice.
 */
export function consumeReAckWave(id: string): boolean {
  const exists = queue.some((w) => w.id === id)
  if (!exists) return false
  queue = queue.filter((w) => w.id !== id)
  emit()
  return true
}
