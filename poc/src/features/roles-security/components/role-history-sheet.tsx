import { Badge } from '@/components/ui/badge'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { type RoleDef } from '../data/roles'
import { SecurityBadge } from './badges'

interface RoleHistorySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: RoleDef | null
}

/**
 * Versioned governed-config history (RSEC-18): shows what permissions the
 * role granted at any past date and who changed it — prior versions are
 * never lost.
 */
export function RoleHistorySheet({
  open,
  onOpenChange,
  role,
}: RoleHistorySheetProps) {
  if (!role) return null
  const versions = [
    {
      version: role.version,
      effectiveFrom: role.effectiveFrom,
      permissions: role.permissions,
      changedBy: 'Current',
      changedOn: '',
      note: 'Current effective version',
    },
    ...[...role.history].reverse(),
  ]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[440px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            {role.name} — version history
          </SheetTitle>
        </SheetHeader>
        <div className='flex-1 space-y-3 overflow-y-auto px-5 py-5'>
          <p className='text-neutral-1000 text-xs'>
            Permission sets are versioned, effective-dated governed
            configuration. Prior versions remain auditable and are never
            physically deleted.
          </p>
          {versions.map((v) => (
            <div
              key={v.version}
              className='rounded-[8px] border border-gray-200 p-3'
            >
              <div className='mb-1 flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Badge variant='outline'>v{v.version}</Badge>
                  {v.version === role.version && (
                    <SecurityBadge value={role.status} />
                  )}
                </div>
                <span className='text-neutral-1000 text-xs'>
                  effective {v.effectiveFrom}
                </span>
              </div>
              <p className='text-neutral-1900 text-sm'>
                {v.permissions.join(' · ')}
              </p>
              <p className='text-neutral-1000 pt-1 text-xs'>
                {v.changedOn
                  ? `Changed by ${v.changedBy} on ${v.changedOn} — ${v.note}`
                  : v.note}
              </p>
            </div>
          ))}
        </div>
      </FloatingSheetContent>
    </Sheet>
  )
}
