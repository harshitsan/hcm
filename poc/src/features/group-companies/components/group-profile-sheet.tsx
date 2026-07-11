import { type ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import { Sheet, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { activeMemberships, type GroupCompany } from '../data/group-companies'
import { type GroupCompaniesStore } from '../hooks/use-group-companies'
import {
  CompanyStatusBadge,
  GroupStatusBadge,
  GroupTypeBadge,
  ScenarioBadges,
} from './group-badges'

interface GroupProfileSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: GroupCompany | null
  store: GroupCompaniesStore
}

function ProfileField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className='flex flex-col gap-0.5'>
      <span className='text-paragraph-sm text-neutral-1000'>{label}</span>
      <span className='text-neutral-1600 text-sm'>{children}</span>
    </div>
  )
}

/**
 * Read-only construct profile opened from a row click on the groups table
 * (US-GRV-14/16). Shows the company identifiers and the full effective-dated
 * membership timeline — including ended memberships — without exposing any
 * management action.
 */
export function GroupProfileSheet({
  open,
  onOpenChange,
  group,
  store,
}: GroupProfileSheetProps) {
  if (!group) return null

  const memberships = [...group.memberships].sort((a, b) =>
    a.effectiveFrom.localeCompare(b.effectiveFrom)
  )
  const active = activeMemberships(group)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[560px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            {group.code} — {group.name}
          </SheetTitle>
          <SheetDescription className='text-paragraph-sm text-neutral-1000'>
            Read-only profile · membership changes are managed from the Groups
            & Members panel by the group administrator
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 space-y-5 overflow-y-auto px-5 py-5'>
          <div className='grid grid-cols-2 gap-x-4 gap-y-3'>
            <ProfileField label='Group code'>
              <span className='font-mono text-xs font-medium'>{group.code}</span>
            </ProfileField>
            <ProfileField label='Type'>
              <GroupTypeBadge type={group.type} />
            </ProfileField>
            <ProfileField label='Status'>
              <GroupStatusBadge group={group} companies={store.companies} />
            </ProfileField>
            <ProfileField label='Parent company'>
              {group.type === 'Holding'
                ? store.companyName(group.parentCompanyId)
                : 'N/A'}
            </ProfileField>
            <ProfileField label='Group administrator'>
              {group.administratorName}
              <span className='text-neutral-1000 block text-xs'>
                {group.administratorEmail}
              </span>
            </ProfileField>
            <ProfileField label='Tenant'>{group.tenantId}</ProfileField>
            <ProfileField label='Created on'>{group.createdOn}</ProfileField>
            <ProfileField label='Created by'>
              <span className='text-xs'>{group.createdBy}</span>
            </ProfileField>
          </div>

          <div className='flex flex-col gap-1.5'>
            <span className='text-paragraph-sm text-neutral-1000'>
              Shared scenarios (governed configuration)
            </span>
            <ScenarioBadges group={group} />
          </div>

          <div className='flex flex-col gap-2'>
            <div className='flex items-center justify-between'>
              <span className='text-neutral-1600 text-sm font-medium'>
                Effective-dated memberships
              </span>
              <Badge variant='open'>
                {active.length} active · {memberships.length - active.length} ended
              </Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Relationship</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Effective from</TableHead>
                  <TableHead>Effective to</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memberships.map((m) => {
                  const company = store.companies.find((c) => c.id === m.companyId)
                  return (
                    <TableRow key={m.id} className={m.effectiveTo ? 'opacity-60' : ''}>
                      <TableCell className='text-sm font-medium'>
                        {store.companyName(m.companyId)}
                        {group.parentCompanyId === m.companyId && (
                          <Badge variant='open' className='ml-2'>
                            Parent
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className='text-sm'>{m.relationshipType}</TableCell>
                      <TableCell>
                        {company ? <CompanyStatusBadge status={company.status} /> : '—'}
                      </TableCell>
                      <TableCell className='text-sm'>{m.effectiveFrom}</TableCell>
                      <TableCell className='text-sm'>
                        {m.effectiveTo ?? <Badge variant='completed'>Open</Badge>}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            <p className='text-paragraph-sm text-neutral-1000'>
              Ended memberships are retained as history (GRP-12). Use the
              as-of query in the Members panel to inspect past composition.
            </p>
          </div>
        </div>
      </FloatingSheetContent>
    </Sheet>
  )
}
