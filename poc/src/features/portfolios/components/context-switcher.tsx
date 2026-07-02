import { useState } from 'react'
import { CaretDown, Check, Lock } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { COMPANIES, type Company } from '../data/portfolios'
import { type CompanyContextStore } from '../hooks/use-company-context'

function CompanyDot({ company }: { company: Company }) {
  return (
    <span
      className='h-2.5 w-2.5 shrink-0 rounded-full'
      style={{ backgroundColor: company.color }}
    />
  )
}

/**
 * Header company-context selector (PORT-12) + context indicator (PORT-18).
 * Lists only the user's authorized companies with the current one marked,
 * plus "View All Companies…". Hidden (indicator only) for single-company
 * users. Unauthorized targets are denied with AUTH_002 and audited (PORT-13).
 */
export function CompanyContextSwitcher({
  context,
}: {
  context: CompanyContextStore
}) {
  const [allOpen, setAllOpen] = useState(false)
  const { currentCompany, authorizedCompanies, switchCompany } = context
  const isMultiCompany = authorizedCompanies.length > 1

  if (!currentCompany) return null

  const indicator = (
    <span className='flex items-center gap-2'>
      <CompanyDot company={currentCompany} />
      <span className='text-neutral-1600 text-sm font-medium'>
        {currentCompany.name}
      </span>
    </span>
  )

  // PORT-12: the selector is hidden for single-company users — the context
  // indicator (PORT-18) still shows where they operate.
  if (!isMultiCompany) {
    return (
      <div className='rounded-md border border-gray-200 bg-white px-3 py-1.5'>
        {indicator}
      </div>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='outline' className='h-8 gap-2 rounded-md px-3'>
            {indicator}
            <CaretDown size={12} weight='bold' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='min-w-[250px]'>
          {authorizedCompanies.map((c) => (
            <DropdownMenuItem
              key={c.id}
              onClick={() => switchCompany(c.id, 'selector')}
            >
              <span className='flex w-full items-center justify-between gap-2'>
                <span className='flex items-center gap-2'>
                  <CompanyDot company={c} />
                  {c.name}
                </span>
                {c.id === currentCompany.id && (
                  <Check size={14} weight='bold' />
                )}
              </span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setAllOpen(true)}>
            View All Companies…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={allOpen} onOpenChange={setAllOpen}>
        <DialogContent className='sm:max-w-[500px]'>
          <DialogHeader>
            <DialogTitle>All companies</DialogTitle>
            <DialogDescription>
              Switching into a company you are not authorized for is denied with
              AUTH_002 (403) and the attempt is audited — try one to see the
              tenant-isolation rule in action (PORT-13, §7.2).
            </DialogDescription>
          </DialogHeader>
          <div className='max-h-[50vh] space-y-1 overflow-y-auto'>
            {COMPANIES.filter((c) => c.status === 'active').map((c) => {
              const authorized = authorizedCompanies.some((a) => a.id === c.id)
              const isCurrent = c.id === currentCompany.id
              return (
                <button
                  key={c.id}
                  type='button'
                  onClick={() => {
                    if (switchCompany(c.id, 'selector')) setAllOpen(false)
                  }}
                  className='flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2 text-left hover:bg-neutral-100'
                >
                  <span className='flex items-center gap-2'>
                    <CompanyDot company={c} />
                    <span className='text-sm'>{c.name}</span>
                  </span>
                  {isCurrent ? (
                    <Badge variant='open'>Current</Badge>
                  ) : authorized ? (
                    <Badge variant='completed'>Authorized</Badge>
                  ) : (
                    <Badge variant='pending'>
                      <Lock size={10} weight='bold' />
                      Not authorized
                    </Badge>
                  )}
                </button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
