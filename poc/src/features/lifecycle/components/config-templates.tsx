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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { ListPagination, SectionCard, pageSlice } from './config-widgets'

const CATEGORIES: LetterTemplate['category'][] = [
  'Exit',
  'Confirmation',
  'Disciplinary',
]

const KINDS: LetterTemplate['kind'][] = ['Letter', 'Email', 'Notification']

const PAGE_SIZE = 2

/** One category's template list with kind filter + pagination. */
function TemplateSection({
  category,
  templates,
  onView,
}: {
  category: LetterTemplate['category']
  templates: LetterTemplate[]
  onView: (t: LetterTemplate) => void
}) {
  const [kind, setKind] = useState('all')
  const [page, setPage] = useState(1)

  const filtered = templates.filter((t) => kind === 'all' || t.kind === kind)
  const pageSafe = Math.min(
    page,
    Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  )
  const rows = pageSlice(filtered, pageSafe, PAGE_SIZE)

  return (
    <SectionCard
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
      <div className='mb-3 flex flex-wrap items-center gap-2'>
        <Select
          value={kind}
          onValueChange={(v) => {
            setKind(v)
            setPage(1)
          }}
        >
          <SelectTrigger variant='secondary' className='h-7 w-[190px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All template types</SelectItem>
            {KINDS.map((k) => (
              <SelectItem key={k} value={k}>
                {k} templates
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
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
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className='text-neutral-1000 text-center text-sm'>
                No records found
              </TableCell>
            </TableRow>
          ) : (
            rows.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <Badge variant='outline'>{t.kind}</Badge>
                </TableCell>
                <TableCell className='font-medium'>{t.letterType}</TableCell>
                <TableCell className='text-neutral-1000 text-xs'>
                  {t.description}
                </TableCell>
                <TableCell>
                  <Button size='sm' variant='outline' onClick={() => onView(t)}>
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <ListPagination
        total={filtered.length}
        page={pageSafe}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />
    </SectionCard>
  )
}

/** Letter / email / notification templates used by lifecycle outcomes. */
export function ConfigTemplates({ config }: { config: LifecycleConfigStore }) {
  const [viewing, setViewing] = useState<LetterTemplate | null>(null)

  return (
    <div>
      {CATEGORIES.map((category) => (
        <TemplateSection
          key={category}
          category={category}
          templates={config.letterTemplates.items.filter(
            (t) => t.category === category
          )}
          onView={setViewing}
        />
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
