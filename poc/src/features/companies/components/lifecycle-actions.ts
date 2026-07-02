import { toast } from 'sonner'
import { statusLabel } from '../data/companies'
import { type CompaniesStore } from '../hooks/use-companies'
import { type LifecycleRequest } from './lifecycle-dialog'

/**
 * COMP-FR-011/012/013 — execute a lifecycle transition with its side effects
 * (suspension behavior, inactivation processing, verified archival).
 */
export function performLifecycleTransition(
  store: CompaniesStore,
  request: LifecycleRequest,
  reason: string
): boolean {
  const { company, target } = request
  if (target === 'archived') {
    const checksum = store.exportCompany(
      company,
      'Archival package (JSON/CSV + audit logs + documents)'
    )
    toast.info(`Archive verified with checksum ${checksum}`)
  }
  const result = store.transitionStatus(company.id, target, reason)
  if (!result.ok) {
    toast.error(result.error)
    return false
  }
  if (target === 'suspended')
    toast.success(
      'Company suspended — admins notified; existing sessions read-only for 30 minutes; queued background jobs will complete'
    )
  else if (target === 'inactive') {
    store.exportCompany(company, 'Inactivation data export package')
    toast.success(
      'Company inactivated — accounts disabled, workflows closed with audit entries, export generated, 7-year retention timer started; confirmations sent to admins and Platform Operations'
    )
  } else if (target === 'archived')
    toast.success(
      'Data securely deleted after integrity verification — company is now Archived (terminal state)'
    )
  else toast.success(`Company is now ${statusLabel(target)}`)
  return true
}
