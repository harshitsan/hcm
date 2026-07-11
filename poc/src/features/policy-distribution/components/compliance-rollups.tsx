import { useMemo } from 'react'
import { useRole } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  COMPANY_GROUPS,
  PORTFOLIO_NAME,
  groupOfCompany,
  type CompanyName,
} from '../data/employees'
import { type Assignment } from '../data/distributions'

interface RollupRow {
  label: string
  indent: boolean
  acknowledged: number
  pending: number
  overdue: number
  criticalOverdue: number
}

function rollup(list: Assignment[]): Omit<RollupRow, 'label' | 'indent'> {
  return {
    acknowledged: list.filter((a) => a.status === 'Acknowledged').length,
    pending: list.filter((a) => a.status === 'Pending').length,
    overdue: list.filter((a) => a.status === 'Overdue').length,
    criticalOverdue: list.filter(
      (a) => a.status === 'Overdue' && a.criticality === 'Critical'
    ).length,
  }
}

function compliancePct(r: Omit<RollupRow, 'label' | 'indent'>): number {
  const total = r.acknowledged + r.pending + r.overdue
  return total === 0 ? 100 : Math.round((r.acknowledged / total) * 100)
}

/**
 * Group Company Admins see per-company rollups with a consolidated total;
 * Portfolio Admins get the extra portfolio → group drill-down with
 * at-risk flags on critical overdue policies.
 */
export function ComplianceRollups({ assignments }: { assignments: Assignment[] }) {
  const { role } = useRole()
  const active = useMemo(
    () => assignments.filter((a) => !a.superseded && a.ackType !== 'Read-Only'),
    [assignments]
  )

  const isPortfolio = role === 'Portfolio Admin'
  const isGroup = role === 'Group Company Admin' || isPortfolio

  const rows = useMemo<RollupRow[]>(() => {
    const out: RollupRow[] = []
    if (isPortfolio) {
      out.push({ label: `${PORTFOLIO_NAME} (portfolio)`, indent: false, ...rollup(active) })
    }
    for (const g of COMPANY_GROUPS) {
      const groupList = active.filter(
        (a) => groupOfCompany(a.company as CompanyName) === g.group
      )
      if (isPortfolio) {
        out.push({ label: g.group, indent: false, ...rollup(groupList) })
      }
      for (const company of g.companies) {
        const companyList = active.filter((a) => a.company === company)
        out.push({
          label: company,
          indent: isPortfolio,
          ...rollup(companyList),
        })
      }
    }
    if (!isPortfolio && isGroup) {
      out.push({
        label: 'Consolidated — all group companies',
        indent: false,
        ...rollup(active),
      })
    }
    return out
  }, [active, isGroup, isPortfolio])

  if (!isGroup) return null

  return (
    <div className='space-y-2'>
      <h3 className='text-neutral-1600 text-sm font-semibold'>
        {isPortfolio
          ? 'Portfolio compliance drill-down'
          : 'Per-company rollup (group-wide)'}
      </h3>
      <div className='border-gray-200 rounded-[6px] border bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Scope</TableHead>
              <TableHead>Acknowledged</TableHead>
              <TableHead>Pending</TableHead>
              <TableHead>Overdue</TableHead>
              <TableHead>Compliance</TableHead>
              <TableHead>Risk</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const pct = compliancePct(r)
              return (
                <TableRow key={r.label}>
                  <TableCell
                    className={`text-sm ${r.indent ? 'pl-8' : 'font-medium'}`}
                  >
                    {r.label}
                  </TableCell>
                  <TableCell className='text-green-1300 text-sm'>
                    {r.acknowledged}
                  </TableCell>
                  <TableCell className='text-sm'>{r.pending}</TableCell>
                  <TableCell
                    className={`text-sm ${r.overdue > 0 ? 'text-red-1400' : ''}`}
                  >
                    {r.overdue}
                  </TableCell>
                  <TableCell className='text-sm'>{pct}%</TableCell>
                  <TableCell>
                    {r.criticalOverdue > 0 ? (
                      <Badge variant='overlay_overdue'>
                        At risk — {r.criticalOverdue} critical overdue
                      </Badge>
                    ) : r.overdue > 0 ? (
                      <Badge variant='overdue'>Watch</Badge>
                    ) : (
                      <Badge variant='completed'>Healthy</Badge>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
