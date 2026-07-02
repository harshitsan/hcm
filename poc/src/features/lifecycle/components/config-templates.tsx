import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
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
import { type LetterTemplate } from '../data/config'
import { type LifecycleConfigStore } from '../hooks/use-lifecycle-config'
import { SectionCard } from './config-widgets'

const CATEGORIES: LetterTemplate['category'][] = [
  'Exit',
  'Confirmation',
  'Disciplinary',
]

/** Letter / email / notification templates used by lifecycle outcomes. */
export function ConfigTemplates({ config }: { config: LifecycleConfigStore }) {
  const [viewing, setViewing] = useState<LetterTemplate | null>(null)

  return (
    <div>
      {CATEGORIES.map((category) => (
        <SectionCard
          key={category}
          title={`${category} templates`}
          description='Letters, emails and in-app notifications generated when the matching lifecycle outcome takes effect.'
          actions={
            <Button
              size='sm'
              variant='outline'
              onClick={() => toast.success('Templates refreshed — latest set shown')}
            >
              Refresh
            </Button>
          }
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template type</TableHead>
                <TableHead>Letter type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {config.letterTemplates.items
                .filter((t) => t.category === category)
                .map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <Badge variant='outline'>{t.kind}</Badge>
                    </TableCell>
                    <TableCell className='font-medium'>{t.letterType}</TableCell>
                    <TableCell className='text-neutral-1000 text-xs'>
                      {t.description}
                    </TableCell>
                    <TableCell>
                      <Button size='sm' variant='outline' onClick={() => setViewing(t)}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </SectionCard>
      ))}

      <Dialog open={viewing !== null} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className='max-h-[80vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>
              {viewing?.letterType}{' '}
              <span className='text-neutral-1000 text-xs font-normal'>
                ({viewing?.category} · {viewing?.kind})
              </span>
            </DialogTitle>
          </DialogHeader>
          <pre className='bg-neutral-200 rounded-[6px] p-3 text-xs whitespace-pre-wrap'>
            {viewing?.body}
          </pre>
          <p className='text-neutral-1000 text-xs'>
            Merge fields in {'{{double braces}}'} resolve from the workflow
            instance when the document is generated.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  )
}
