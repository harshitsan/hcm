import { ArrowDown, ArrowUp } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { type PolicyConfigStore } from '../hooks/use-policy-config'

/**
 * Versioned re-acknowledgment decision table. Enabling, disabling or
 * reordering a trigger bumps its version and effective date — governed
 * change without a deployment; prior evaluations stay reproducible.
 */
export function ConfigDecisionTable({ config }: { config: PolicyConfigStore }) {
  const sorted = [...config.decisionRules].sort((a, b) => a.order - b.order)

  return (
    <div className='space-y-2'>
      <h3 className='text-neutral-1600 text-sm font-semibold'>
        Re-acknowledgment decision table
      </h3>
      <p className='text-paragraph-sm text-neutral-1000'>
        The rules engine evaluates these rows to decide which events force
        re-acknowledgment, for which policies and which employees.
      </p>
      <div className='border-grey-200 rounded-[6px] border bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[60px]'>Order</TableHead>
              <TableHead>Trigger</TableHead>
              <TableHead>Scope of re-acknowledgment</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Enabled</TableHead>
              <TableHead className='text-right'>Reorder</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((r, i) => (
              <TableRow key={r.id}>
                <TableCell className='text-sm'>{r.order}</TableCell>
                <TableCell className='text-sm font-medium'>{r.trigger}</TableCell>
                <TableCell className='text-paragraph-sm max-w-[300px]'>
                  {r.scope}
                </TableCell>
                <TableCell>
                  <Badge variant='pending'>
                    v{r.version} · {r.effectiveFrom}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Switch
                    variant='blue'
                    checked={r.enabled}
                    onCheckedChange={() => config.toggleDecisionRule(r.id)}
                  />
                </TableCell>
                <TableCell className='text-right'>
                  <div className='flex justify-end gap-1'>
                    <Button
                      variant='icon2'
                      className='h-6 w-6'
                      disabled={i === 0}
                      onClick={() => config.moveDecisionRule(r.id, 'up')}
                      aria-label='Move up'
                    >
                      <ArrowUp size={12} weight='bold' />
                    </Button>
                    <Button
                      variant='icon2'
                      className='h-6 w-6'
                      disabled={i === sorted.length - 1}
                      onClick={() => config.moveDecisionRule(r.id, 'down')}
                      aria-label='Move down'
                    >
                      <ArrowDown size={12} weight='bold' />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
