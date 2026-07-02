import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { type LetterConfigStore } from '../hooks/use-letter-config'

function AlignBadge({ aligned }: { aligned: boolean }) {
  return (
    <Badge variant={aligned ? 'badge_active' : 'dropped'}>
      {aligned ? 'Aligned' : 'Diverged'}
    </Badge>
  )
}

/**
 * Group Company Admin governance (HLC-15/38): per-company view of template,
 * workflow, retention, and catalog alignment against the group standard, with
 * divergences surfaced and a one-click enforce action.
 */
export function ConfigGovernance({ config }: { config: LetterConfigStore }) {
  return (
    <div className='rounded-[6px] border border-gray-200 bg-white p-4'>
      <h3 className='text-neutral-1600 mb-1 font-medium'>
        Group governance — templates, workflows, retention &amp; catalogs
      </h3>
      <p className='text-paragraph-sm text-neutral-1000 mb-3'>
        Baseline: 8 standard document types, shared merge fields and Template
        Type IDs, approval + signing standards, and the 7-year retention rule.
        Company-level divergences are surfaced here so you can govern
        consistency across the group.
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company</TableHead>
            <TableHead>Templates</TableHead>
            <TableHead>Workflows</TableHead>
            <TableHead>Retention</TableHead>
            <TableHead>Catalogs</TableHead>
            <TableHead>Divergence</TableHead>
            <TableHead className='text-right'>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {config.governance.map((g) => {
            const aligned =
              g.templatesAligned &&
              g.workflowsAligned &&
              g.retentionAligned &&
              g.catalogsAligned
            return (
              <TableRow key={g.company}>
                <TableCell className='font-medium'>{g.company}</TableCell>
                <TableCell><AlignBadge aligned={g.templatesAligned} /></TableCell>
                <TableCell><AlignBadge aligned={g.workflowsAligned} /></TableCell>
                <TableCell><AlignBadge aligned={g.retentionAligned} /></TableCell>
                <TableCell><AlignBadge aligned={g.catalogsAligned} /></TableCell>
                <TableCell className='max-w-64 text-sm'>{g.divergence}</TableCell>
                <TableCell className='text-right'>
                  {aligned ? (
                    <span className='text-neutral-1000 text-xs'>Conforms</span>
                  ) : (
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => config.enforceStandard(g.company)}
                    >
                      Enforce group standard
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
