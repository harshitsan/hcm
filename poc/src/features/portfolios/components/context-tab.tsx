import { useState } from 'react'
import { useRole } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { COMPANIES } from '../data/portfolios'
import { type CompanyContextStore } from '../hooks/use-company-context'

interface ContextTabProps {
  context: CompanyContextStore
}

/**
 * Company context detail (PORT-13…PORT-17): authorization rules, the loaded
 * company configuration + security context (new JWT per switch), preserved
 * in-progress session state, bookmarkable company URLs and the
 * switch-company API response.
 */
export function ContextTab({ context }: ContextTabProps) {
  const { role } = useRole()
  const {
    currentCompany,
    authorizedCompanies,
    sessionToken,
    permissions,
    drafts,
    saveDraft,
    switchCompany,
    lastApiResponse,
  } = context
  const [bookmarkTarget, setBookmarkTarget] = useState(COMPANIES[0].id)

  if (!currentCompany) return null

  const bookmarkUrl = `/portfolios?company=${bookmarkTarget}`

  return (
    <div className='w-full space-y-4'>
      {/* PORT-13 — RBAC for context switching */}
      <Card className='gap-2 border-gray-200 py-3'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Context-switch authorization (§7.1 RBAC)
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-2 px-4'>
          <div className='flex flex-wrap gap-2'>
            <Badge variant='open'>
              Switch to Authorized Companies — Platform Admin, Portfolio Admin,
              Group Company Admin
            </Badge>
            <Badge variant='pending'>
              Switch to Any Company — Platform Admin only
            </Badge>
          </div>
          <p className='text-paragraph-sm text-neutral-1000'>
            Acting as {role}, you are authorized for{' '}
            {authorizedCompanies.length} compan
            {authorizedCompanies.length === 1 ? 'y' : 'ies'}. Every switch is
            validated first; an unauthorized target is denied with AUTH_002
            (403), your current context is kept and the attempt is logged.
          </p>
        </CardContent>
      </Card>

      {/* PORT-14 / PORT-18 — configuration + security loaded on switch */}
      <Card className='gap-2 border-gray-200 py-3'>
        <CardHeader className='flex flex-wrap items-center justify-between gap-2 px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Current company context — configuration & security (PORT-14)
          </CardTitle>
          <span className='flex items-center gap-2'>
            <span
              className='h-2.5 w-2.5 rounded-full'
              style={{ backgroundColor: currentCompany.color }}
            />
            <span className='text-sm font-medium'>{currentCompany.name}</span>
          </span>
        </CardHeader>
        <CardContent className='space-y-3 px-4'>
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
            {[
              { label: 'Currency', value: currentCompany.currency },
              { label: 'Time zone', value: currentCompany.timeZone },
              { label: 'Date format', value: currentCompany.dateFormat },
            ].map((item) => (
              <div
                key={item.label}
                className='rounded-md border border-gray-200 bg-white px-3 py-2'
              >
                <p className='text-paragraph-sm text-neutral-1000'>
                  {item.label}
                </p>
                <p className='text-sm font-medium'>{item.value}</p>
              </div>
            ))}
          </div>
          <div className='space-y-1'>
            <p className='text-paragraph-sm text-neutral-1600 font-medium'>
              Navigation permissions refreshed for this company
            </p>
            <div className='flex flex-wrap gap-1.5'>
              {permissions.map((p) => (
                <Badge key={p} variant='pending'>
                  {p}
                </Badge>
              ))}
            </div>
          </div>
          <div className='space-y-1'>
            <p className='text-paragraph-sm text-neutral-1600 font-medium'>
              Session token (new JWT carries the company claim — §7.2)
            </p>
            <p className='overflow-x-auto rounded-md border border-gray-200 bg-neutral-100 px-3 py-2 font-mono text-xs'>
              {sessionToken}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* PORT-15 — session state preserved across switches */}
      <Card className='gap-2 border-gray-200 py-3'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            In-progress HR actions — preserved across context switches (PORT-15)
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 px-4'>
          <p className='text-paragraph-sm text-neutral-1000'>
            Type an unsaved note below, switch company via the header selector,
            then switch back — your draft is still here. Drafts are bound to
            their company, so nothing is ever committed against the wrong
            context.
          </p>
          {authorizedCompanies.map((c) => (
            <div key={c.id} className='space-y-1'>
              <div className='flex items-center gap-2'>
                <span
                  className='h-2 w-2 rounded-full'
                  style={{ backgroundColor: c.color }}
                />
                <span className='text-sm font-medium'>{c.name}</span>
                {c.id === currentCompany.id && (
                  <Badge variant='open'>Current context</Badge>
                )}
                {drafts[c.id] && <Badge variant='overdue'>Unsaved draft</Badge>}
              </div>
              <Textarea
                rows={2}
                placeholder={`Unsaved HR action for ${c.name}…`}
                value={drafts[c.id] ?? ''}
                onChange={(e) => saveDraft(c.id, e.target.value)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* PORT-17 — bookmarkable company-context URLs */}
      <Card className='gap-2 border-gray-200 py-3'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Bookmarkable company URLs (PORT-17)
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 px-4'>
          <div className='flex flex-wrap items-center gap-3'>
            <Select value={bookmarkTarget} onValueChange={setBookmarkTarget}>
              <SelectTrigger variant='secondary' className='h-8 w-64'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPANIES.filter((c) => c.status === 'active').map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <code className='rounded-md border border-gray-200 bg-neutral-100 px-2 py-1 font-mono text-xs'>
              {bookmarkUrl}
            </code>
            <Button
              size='sm'
              className='h-8'
              onClick={() => switchCompany(bookmarkTarget, 'url')}
            >
              Open bookmarked URL
            </Button>
          </div>
          <p className='text-paragraph-sm text-neutral-1000'>
            Opening a company URL you are authorized for switches context
            automatically — no manual selector step. An unauthorized URL is
            denied with AUTH_002 and redirects to the company selector; both
            outcomes are audited per the §7.2 tenant-isolation rule.
          </p>
        </CardContent>
      </Card>

      {/* PORT-16 — switch-company API */}
      <Card className='gap-2 border-gray-200 py-3'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            POST /api/v1/users/switch-company — last response (PORT-16)
          </CardTitle>
        </CardHeader>
        <CardContent className='px-4'>
          {lastApiResponse ? (
            <pre className='overflow-x-auto rounded-md border border-gray-200 bg-neutral-100 p-3 font-mono text-xs whitespace-pre-wrap'>
              {lastApiResponse}
            </pre>
          ) : (
            <p className='text-paragraph-sm text-neutral-1000'>
              No switch performed yet in this session — use the header selector
              or a bookmarked URL to see the 200 (success) or 403 AUTH_002
              response body.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
