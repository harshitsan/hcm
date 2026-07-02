import { useMemo, useState } from 'react'
import { DownloadSimple } from 'phosphor-react'
import { useRole } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { MultiSelectDropdown } from '@/components/ui/multi-select-dropdown'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PORTFOLIO_EMPLOYEES, type PortfolioEmployee } from '../data/employees'
import {
  COMPANY_BY_ID,
  PERSONAS,
  companyName,
  type Company,
} from '../data/portfolios'
import { type PortfolioOpsStore } from '../hooks/use-portfolio-ops'
import { type PortfoliosStore } from '../hooks/use-portfolios'

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

interface ReportingTabProps {
  store: PortfoliosStore
  ops: PortfolioOpsStore
}

/**
 * Portfolio-level reporting (PORT-19): company multi-select filter +
 * consolidated metrics under row-level security, Excel/PDF export (PORT-20)
 * and audited cross-company employee search (PORT-22).
 */
export function ReportingTab({ store, ops }: ReportingTabProps) {
  const { role } = useRole()
  const persona = PERSONAS[role]
  const canReport = role === 'Platform Admin' || role === 'Portfolio Admin'

  const managed = store.portfolios.find(
    (p) => p.id === persona.managedPortfolioId
  )
  const [portfolioId, setPortfolioId] = useState(store.portfolios[0]?.id ?? '')
  const portfolio =
    role === 'Portfolio Admin'
      ? (managed ?? null)
      : (store.portfolios.find((p) => p.id === portfolioId) ??
        store.portfolios[0] ??
        null)

  const [companyIds, setCompanyIds] = useState<string[]>([])
  const [report, setReport] = useState<{
    rows: Company[]
    withheld: number
  } | null>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PortfolioEmployee[] | null>(null)

  const portfolioCompanyIds = useMemo(
    () => portfolio?.companies.map((l) => l.companyId) ?? [],
    [portfolio]
  )

  if (!canReport) {
    return (
      <Card className='gap-2 border-gray-200 py-3'>
        <CardContent className='px-4'>
          <p className='text-paragraph-sm text-neutral-1000'>
            Portfolio-level reporting is available to Platform Admin and
            Portfolio Admin (PORT-19). Switch the mock role to explore
            consolidated metrics, exports and cross-company search.
          </p>
        </CardContent>
      </Card>
    )
  }
  if (!portfolio) return null

  const runReport = () => {
    const selected = companyIds.length > 0 ? companyIds : portfolioCompanyIds
    // Row-level security — only companies the viewer is authorized for.
    const visibleIds = selected.filter((id) =>
      persona.authorizedCompanyIds.includes(id)
    )
    setReport({
      rows: visibleIds.map((id) => COMPANY_BY_ID[id]).filter(Boolean),
      withheld: selected.length - visibleIds.length,
    })
  }

  const runSearch = () => {
    const scopeIds = portfolioCompanyIds.filter((id) =>
      persona.authorizedCompanyIds.includes(id)
    )
    const q = query.trim().toLowerCase()
    const matches = PORTFOLIO_EMPLOYEES.filter(
      (e) =>
        scopeIds.includes(e.companyId) &&
        (q === '' ||
          e.name.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.department.toLowerCase().includes(q) ||
          e.designation.toLowerCase().includes(q))
    )
    setResults(matches)
    ops.logSearch(query.trim(), scopeIds.map(companyName), matches.length)
  }

  const totals = report?.rows.reduce(
    (acc, c) => ({
      headcount: acc.headcount + c.headcount,
      payroll: acc.payroll + c.monthlyPayrollUsd,
      openPositions: acc.openPositions + c.openPositions,
    }),
    { headcount: 0, payroll: 0, openPositions: 0 }
  )

  return (
    <div className='w-full space-y-4'>
      <div className='flex flex-wrap items-center gap-3'>
        <span className='text-paragraph-sm text-neutral-1000'>Portfolio</span>
        {role === 'Platform Admin' ? (
          <Select
            value={portfolio.id}
            onValueChange={(v) => {
              setPortfolioId(v)
              setCompanyIds([])
              setReport(null)
              setResults(null)
            }}
          >
            <SelectTrigger variant='secondary' className='h-8 w-72'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {store.portfolios.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Badge variant='open'>
            {portfolio.code} — {portfolio.name} (your portfolio)
          </Badge>
        )}
      </div>

      <Card className='gap-3 border-gray-200 py-4'>
        <CardHeader className='flex flex-wrap items-center justify-between gap-2 px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Consolidated portfolio report — filter companies, run, export
          </CardTitle>
          <div className='flex items-center gap-2'>
            <MultiSelectDropdown
              items={portfolioCompanyIds.map((id) => ({
                id,
                label: companyName(id),
              }))}
              selectedIds={companyIds}
              onSelectionChange={setCompanyIds}
              placeholder='All portfolio companies'
              className='w-56'
            />
            <Button size='sm' className='h-8' onClick={runReport}>
              Run report
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='outline'
                  size='sm'
                  className='h-8 gap-1'
                  disabled={!report}
                >
                  <DownloadSimple size={14} weight='bold' />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                {(['Excel', 'PDF'] as const).map((format) => (
                  <DropdownMenuItem
                    key={format}
                    onClick={() =>
                      report &&
                      ops.exportReport(
                        format,
                        report.rows.map((c) => c.name)
                      )
                    }
                  >
                    Export to {format}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        {report && (
          <CardContent className='space-y-3 px-4'>
            <div className='flex flex-wrap gap-2'>
              <Badge variant='qualified'>Row-level security applied</Badge>
              {report.withheld > 0 && (
                <Badge variant='overdue'>
                  {report.withheld} compan
                  {report.withheld === 1 ? 'y' : 'ies'} withheld — not in your
                  authorized scope
                </Badge>
              )}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Headcount</TableHead>
                  <TableHead>Monthly payroll (USD)</TableHead>
                  <TableHead>Attrition</TableHead>
                  <TableHead>Open positions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.rows.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className='text-sm font-medium'>
                      {c.name}
                    </TableCell>
                    <TableCell className='text-sm'>
                      {c.headcount.toLocaleString('en-US')}
                    </TableCell>
                    <TableCell className='text-sm'>
                      {usd.format(c.monthlyPayrollUsd)}
                    </TableCell>
                    <TableCell className='text-sm'>{c.attritionPct}%</TableCell>
                    <TableCell className='text-sm'>{c.openPositions}</TableCell>
                  </TableRow>
                ))}
                {totals && report.rows.length > 0 && (
                  <TableRow>
                    <TableCell className='text-sm font-semibold'>
                      Consolidated ({report.rows.length} companies)
                    </TableCell>
                    <TableCell className='text-sm font-semibold'>
                      {totals.headcount.toLocaleString('en-US')}
                    </TableCell>
                    <TableCell className='text-sm font-semibold'>
                      {usd.format(totals.payroll)}
                    </TableCell>
                    <TableCell className='text-sm font-semibold'>
                      {report.rows.length > 0
                        ? (
                            report.rows.reduce(
                              (n, c) => n + c.attritionPct,
                              0
                            ) / report.rows.length
                          ).toFixed(1)
                        : '0'}
                      % avg
                    </TableCell>
                    <TableCell className='text-sm font-semibold'>
                      {totals.openPositions}
                    </TableCell>
                  </TableRow>
                )}
                {report.rows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className='text-neutral-1000 text-center'
                    >
                      No authorized companies in the selected filter
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        )}
      </Card>

      <Card className='gap-3 border-gray-200 py-4'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Cross-company employee search — authorized companies only, audited
            (PORT-22)
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 px-4'>
          <div className='flex flex-wrap items-center gap-3'>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runSearch()}
              placeholder='Search employees by name, email, department or designation…'
              className='h-8 w-96'
            />
            <Button size='sm' className='h-8' onClick={runSearch}>
              Search
            </Button>
            {results && (
              <Badge variant='open'>
                {results.length} result{results.length === 1 ? '' : 's'} across
                your authorized portfolio companies
              </Badge>
            )}
          </div>
          {results && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <div className='flex flex-col'>
                        <span className='text-sm font-medium'>{e.name}</span>
                        <span className='text-paragraph-sm text-neutral-1000'>
                          {e.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className='text-sm'>
                      {companyName(e.companyId)}
                    </TableCell>
                    <TableCell className='text-sm'>{e.department}</TableCell>
                    <TableCell className='text-sm'>{e.designation}</TableCell>
                  </TableRow>
                ))}
                {results.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className='text-neutral-1000 text-center'
                    >
                      No results within your authorized scope
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
