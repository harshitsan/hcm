import { useMemo, useState } from 'react'
import { Trash } from 'phosphor-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import { MultiSelectDropdown } from '@/components/ui/multi-select-dropdown'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { COMPANIES, companyName, type Portfolio } from '../data/portfolios'
import { type PortfoliosStore } from '../hooks/use-portfolios'

interface ManageCompaniesOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  portfolio: Portfolio | null
  store: PortfoliosStore
  /** Add/Remove is limited to Platform Admin and the portfolio's own admin. */
  canManage: boolean
}

/**
 * Manage Companies (PORT-06/07): add active, unassigned companies via
 * PortfolioCompany junction records; remove with a confirmation dialog,
 * blocked when fewer than one company would remain (PORT-05).
 */
export function ManageCompaniesOverlay({
  open,
  onOpenChange,
  portfolio,
  store,
  canManage,
}: ManageCompaniesOverlayProps) {
  const [toAdd, setToAdd] = useState<string[]>([])
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)

  // Live copy — the store mutates while the sheet stays open.
  const current = store.portfolios.find((p) => p.id === portfolio?.id) ?? null

  // Selector only offers active companies not already in another portfolio
  // (PORT-03 / PORT-06).
  const available = useMemo(
    () =>
      COMPANIES.filter(
        (c) => c.status === 'active' && !store.companyAssignment.has(c.id)
      ).map((c) => ({ id: c.id, label: c.name })),
    [store.companyAssignment]
  )

  if (!current) return null

  const atMinimum = current.companies.length <= 1

  const handleAdd = () => {
    if (toAdd.length === 0) return
    if (store.addCompanies(current.id, toAdd)) setToAdd([])
  }

  const handleConfirmRemove = () => {
    if (confirmRemove) store.removeCompany(current.id, confirmRemove)
    setConfirmRemove(null)
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[560px]'>
          <SheetHeader className='border-grey-200 border-b px-5 py-4'>
            <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
              Manage Companies — {current.name}
            </SheetTitle>
          </SheetHeader>

          <div className='flex-1 space-y-5 overflow-y-auto px-5 py-5'>
            {canManage ? (
              <div className='space-y-2'>
                <p className='text-paragraph-sm text-neutral-1600 font-medium'>
                  Add companies
                </p>
                <div className='flex items-center gap-2'>
                  <MultiSelectDropdown
                    items={available}
                    selectedIds={toAdd}
                    onSelectionChange={setToAdd}
                    placeholder={
                      available.length === 0
                        ? 'No unassigned active companies'
                        : 'Select companies to add'
                    }
                    disabled={available.length === 0}
                    className='flex-1'
                  />
                  <Button
                    onClick={handleAdd}
                    disabled={toAdd.length === 0}
                    className='h-9'
                  >
                    Add
                  </Button>
                </div>
                <p className='text-paragraph-sm text-neutral-1000'>
                  Companies already held by another portfolio are excluded
                  (PORT_002 — one portfolio per company).
                </p>
              </div>
            ) : (
              <p className='text-paragraph-sm text-neutral-1000 rounded-md border border-gray-200 px-3 py-2'>
                Add/Remove Companies is permitted for Platform Admin and this
                portfolio&apos;s own Portfolio Admin only (§7.1 RBAC).
              </p>
            )}

            <div className='space-y-2'>
              <div className='flex items-center gap-2'>
                <p className='text-paragraph-sm text-neutral-1600 font-medium'>
                  Current companies
                </p>
                <Badge variant='open'>{current.companies.length}</Badge>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Added date</TableHead>
                    <TableHead>Added by</TableHead>
                    <TableHead className='w-12' />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {current.companies.map((link) => (
                    <TableRow key={link.companyId}>
                      <TableCell className='text-sm font-medium'>
                        {companyName(link.companyId)}
                      </TableCell>
                      <TableCell className='text-sm'>
                        {link.addedDate}
                      </TableCell>
                      <TableCell className='text-paragraph-sm text-neutral-1000'>
                        {link.addedBy}
                      </TableCell>
                      <TableCell>
                        {canManage && (
                          <Button
                            variant='icon2'
                            className='text-neutral-1900 h-7 w-7'
                            aria-label={`Remove ${companyName(link.companyId)}`}
                            disabled={atMinimum}
                            onClick={() => setConfirmRemove(link.companyId)}
                          >
                            <Trash size={14} weight='bold' />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {atMinimum && (
                <p className='text-paragraph-sm text-neutral-1000'>
                  Removal is blocked — a portfolio must always contain at least
                  one company (PORT-05).
                </p>
              )}
            </div>
          </div>

          <div className='border-grey-200 flex items-center justify-end border-t px-5 py-4'>
            <Button variant='outline' onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </FloatingSheetContent>
      </Sheet>

      <AlertDialog
        open={confirmRemove !== null}
        onOpenChange={(o) => !o && setConfirmRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove company from portfolio?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmRemove ? companyName(confirmRemove) : ''} will be detached
              from {current.name}. The PortfolioCompany junction record is
              deleted and the change is written to the audit trail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemove}
              className='bg-destructive hover:bg-destructive/90 text-white'
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
