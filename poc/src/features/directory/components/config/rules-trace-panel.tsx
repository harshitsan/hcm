import { useState } from 'react'
import { CheckCircle, EyeSlash } from 'phosphor-react'
import { ROLES, useRole, type Role } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type DirectoryConfigStore } from '../../hooks/use-directory-config'
import { evaluateAll } from '../../utils/privacy'

/**
 * Rules-engine inspector (DIR-21): evaluates the governed privacy
 * configuration against any role and shows the per-field decision the engine
 * applies identically across list, card, compact, org chart, search and
 * exports.
 */
export function RulesTracePanel({ config }: { config: DirectoryConfigStore }) {
  const { role } = useRole()
  const [traceRole, setTraceRole] = useState<Role>(role)

  const decisions = evaluateAll(traceRole, config.privacyConfig)

  return (
    <Card className='border-gray-200'>
      <CardHeader>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Rules engine — visibility evaluation
          </CardTitle>
          <Select
            value={traceRole}
            onValueChange={(v) => setTraceRole(v as Role)}
          >
            <SelectTrigger
              variant='secondary'
              className='h-8 w-[220px] text-xs'
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  Evaluate as: {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className='text-neutral-1000 text-xs'>
          One evaluation, every surface: a field the engine restricts here is
          omitted from list, card and compact views, the org chart, search
          results and exports. Configuration changes apply on the next
          evaluation — no code change.
        </p>
      </CardHeader>
      <CardContent className='space-y-1.5'>
        {decisions.map((d) => (
          <div
            key={d.key}
            className='flex items-start justify-between gap-3 rounded-md border border-gray-200 px-3 py-2'
          >
            <div className='flex min-w-0 flex-col'>
              <span className='flex items-center gap-1.5'>
                <span className='text-neutral-1600 text-sm font-medium'>
                  {d.label}
                </span>
                <Badge variant='secondary'>
                  {d.source === 'company-override'
                    ? 'Company override'
                    : 'Platform default'}
                </Badge>
              </span>
              <span className='text-neutral-1000 text-xs'>{d.reason}</span>
            </div>
            {d.visible ? (
              <Badge variant='badge_active'>
                <CheckCircle size={12} weight='bold' /> Visible
              </Badge>
            ) : (
              <Badge variant='badge_inactive'>
                <EyeSlash size={12} weight='bold' /> Omitted
              </Badge>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
