import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { type LetterConfigStore } from '../hooks/use-letter-config'

/**
 * Platform Admin data-model posture (HLC-16/17): tenant-scoped canonical
 * storage with row-level security, referential-integrity checks within each
 * tenant, and the immutable effective-dated version/audit history that backs
 * the 7-year retention rule.
 */
export function ConfigPlatform({ config }: { config: LetterConfigStore }) {
  return (
    <div className='space-y-4'>
      <div className='rounded-[6px] border border-gray-200 bg-white p-4'>
        <h3 className='text-neutral-1600 mb-1 font-medium'>
          Tenant-scoped canonical data model
        </h3>
        <p className='text-paragraph-sm text-neutral-1000 mb-3'>
          Every document record is stored under its owning company/group scope.
          Row-level security prevents cross-tenant reads; document references
          to employee, template, position, company, and signing authority must
          resolve within the same tenant.
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenant</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead>Templates</TableHead>
              <TableHead>Row-level security</TableHead>
              <TableHead>Integrity constraints</TableHead>
              <TableHead>Audit events</TableHead>
              <TableHead>Oldest retained</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {config.tenantRecords.map((t) => (
              <TableRow key={t.tenant}>
                <TableCell className='font-medium'>{t.tenant}</TableCell>
                <TableCell>{t.documents.toLocaleString('en-US')}</TableCell>
                <TableCell>{t.templates}</TableCell>
                <TableCell>
                  <Badge variant={t.rowLevelSecurity ? 'badge_active' : 'dropped'}>
                    {t.rowLevelSecurity ? 'Enforced' : 'Disabled'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={t.integrity === 'pass' ? 'badge_active' : 'overdue'}>
                    {t.integrity === 'pass' ? 'All pass' : 'Violations flagged'}
                  </Badge>
                </TableCell>
                <TableCell>{t.auditEvents.toLocaleString('en-US')}</TableCell>
                <TableCell>{t.oldestRetained}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className='rounded-[6px] border border-gray-200 bg-white p-4'>
        <h3 className='text-neutral-1600 mb-1 font-medium'>
          Immutable effective-dated version history
        </h3>
        <ul className='text-neutral-1900 list-disc space-y-1 pl-5 text-sm'>
          <li>
            Versions are append-only — a generation or reissue never
            overwrites a prior version, and each records its effective date and
            producing event.
          </li>
          <li>
            Approval, signing, and distribution events are appended to a
            tamper-evident audit trail bound to the document record.
          </li>
          <li>
            Temporal queries reconstruct the exact content and metadata valid
            at any point in time, until the retention policy purges the record
            after {config.settings.retentionYears} years.
          </li>
        </ul>
      </div>
    </div>
  )
}
