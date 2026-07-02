import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  type Jurisdiction,
  type JurisdictionHistoryEntry,
} from '../data/jurisdictions'

interface JurisdictionHistoryDialogProps {
  jurisdiction: Jurisdiction | null
  history: JurisdictionHistoryEntry[]
  onClose: () => void
}

/**
 * Effective-dated change history of a catalog entry (JUR-12): every prior
 * state is preserved with its effective period, so evaluations as of any
 * date remain auditable.
 */
export function JurisdictionHistoryDialog({
  jurisdiction,
  history,
  onClose,
}: JurisdictionHistoryDialogProps) {
  const entries = jurisdiction
    ? history
        .filter((h) => h.jurisdictionId === jurisdiction.id)
        .sort((a, b) => b.version - a.version)
    : []

  return (
    <Dialog open={jurisdiction !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className='sm:max-w-[640px]'>
        <DialogHeader>
          <DialogTitle>
            {jurisdiction?.name} — effective-dated history
          </DialogTitle>
          <DialogDescription>
            Prior versions are preserved, never overwritten. Engines resolve
            the version effective on the evaluation date.
          </DialogDescription>
        </DialogHeader>
        <div className='max-h-[380px] overflow-y-auto rounded-md border border-gray-200'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Version</TableHead>
                <TableHead>Effective period</TableHead>
                <TableHead>Change summary</TableHead>
                <TableHead>Changed by</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className='text-neutral-1000'>
                    No recorded versions for this entry.
                  </TableCell>
                </TableRow>
              )}
              {entries.map((h) => (
                <TableRow key={h.id}>
                  <TableCell>
                    <Badge variant={h.effectiveTo === null ? 'live' : 'pending'}>
                      v{h.version}
                      {h.effectiveTo === null ? ' · current' : ''}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-neutral-1000 whitespace-nowrap'>
                    {h.effectiveFrom} → {h.effectiveTo ?? 'open'}
                  </TableCell>
                  <TableCell>{h.summary}</TableCell>
                  <TableCell className='text-neutral-1000'>
                    {h.changedBy}
                    <span className='block text-xs'>{h.changedAt}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
