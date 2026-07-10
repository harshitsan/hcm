import { useMemo, useState } from 'react'
import { ArrowsClockwise, Eye, PencilSimple, Plus } from 'phosphor-react'
import { toast } from 'sonner'
import { useRole } from '@/context/role-context'
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
import { HR_DOC_TYPES, type LetterTemplate } from '../data/hr-letters'
import {
  type LetterTemplatesStore,
  type TemplateDraft,
} from '../hooks/use-letter-templates'
import { TemplateOverlay } from './template-overlay'
import { TemplatePreviewDialog } from './template-preview-dialog'

const PAGE_SIZE = 5

interface TemplatesTabProps {
  store: LetterTemplatesStore
}

/**
 * HR letter/certificate template configuration (HLC-01): each of the eight
 * document types carries its own branded, versioned template. Editing is
 * Company Admin only; Group Company Admin reviews read-only for group
 * governance (HLC-15). View opens the read-only preview (HLC-26). The list
 * toolbar carries refresh (LT-03) and Previous/Next paging with a displayed
 * item range (LT-05).
 */
export function TemplatesTab({ store }: TemplatesTabProps) {
  const { role } = useRole()
  const canEdit = role === 'Company Admin'

  const [overlayOpen, setOverlayOpen] = useState(false)
  const [editing, setEditing] = useState<LetterTemplate | null>(null)
  const [previewing, setPreviewing] = useState<LetterTemplate | null>(null)
  const [page, setPage] = useState(0)

  const letterTemplates = useMemo(
    () =>
      store.templates.filter((t) =>
        (HR_DOC_TYPES as readonly string[]).includes(t.docType)
      ),
    [store.templates]
  )

  const coveredTypes = new Set(letterTemplates.map((t) => t.docType))

  const total = letterTemplates.length
  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1)
  const safePage = Math.min(page, lastPage)
  const pageStart = safePage * PAGE_SIZE
  const pageItems = letterTemplates.slice(pageStart, pageStart + PAGE_SIZE)

  const handleSubmit = (draft: TemplateDraft) => {
    if (editing) store.updateTemplate(editing.id, draft, 'Lakshmi Rao (Company Admin)')
    else store.addTemplate(draft, 'Lakshmi Rao (Company Admin)')
    setEditing(null)
  }

  return (
    <div className='w-full'>
      <div className='mb-3 flex items-center justify-between'>
        <div>
          <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
            Document templates ({letterTemplates.length})
          </h2>
          <p className='text-paragraph-sm text-neutral-1000'>
            {coveredTypes.size} of {HR_DOC_TYPES.length} standard document
            types have a configured template. Every save creates a new
            effective-dated version — generated documents keep referencing the
            version they were produced under.
          </p>
        </div>
        {canEdit && (
          <Button
            variant='red'
            onClick={() => {
              setEditing(null)
              setOverlayOpen(true)
            }}
            className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
          >
            <Plus size={10} weight='bold' />
            New template
          </Button>
        )}
      </div>

      <div className='rounded-[6px] border border-gray-200 bg-white'>
        <div className='flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-3 py-2'>
          <span className='text-neutral-1000 text-sm'>
            {total === 0
              ? 'No letter templates configured yet'
              : `Displaying items ${pageStart + 1} - ${Math.min(pageStart + PAGE_SIZE, total)} of ${total}`}
          </span>
          <div className='flex items-center gap-2'>
            <Button
              variant='icon2'
              className='text-neutral-1900 h-7 w-7'
              aria-label='Refresh'
              onClick={() => {
                setPage(0)
                toast.success(
                  'Templates refreshed — showing the latest saved versions'
                )
              }}
            >
              <ArrowsClockwise size={16} weight='bold' />
            </Button>
            <Button
              size='sm'
              variant='outline'
              disabled={safePage === 0}
              onClick={() => setPage(Math.max(0, safePage - 1))}
            >
              Previous
            </Button>
            <Button
              size='sm'
              variant='outline'
              disabled={safePage >= lastPage}
              onClick={() => setPage(Math.min(lastPage, safePage + 1))}
            >
              Next
            </Button>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Template</TableHead>
              <TableHead>Document type</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Workflow</TableHead>
              <TableHead>Signing authority</TableHead>
              <TableHead className='text-right'>Task</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.map((t) => (
              <TableRow key={t.id}>
                <TableCell className='font-medium'>{t.name}</TableCell>
                <TableCell>{t.docType}</TableCell>
                <TableCell>
                  <Badge variant='pending'>
                    v{t.currentVersion} · eff.{' '}
                    {t.versions[t.versions.length - 1]?.effectiveFrom}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={t.requiresApproval ? 'open' : 'badge_active'}>
                    {t.requiresApproval ? 'Approval required' : 'Finalizes directly'}
                  </Badge>
                </TableCell>
                <TableCell className='text-sm'>{t.signingAuthority}</TableCell>
                <TableCell>
                  <div className='flex justify-end gap-1'>
                    <Button
                      variant='icon2'
                      className='text-neutral-1900 h-7 w-7'
                      aria-label='View read-only'
                      onClick={() => setPreviewing(t)}
                    >
                      <Eye size={14} weight='bold' />
                    </Button>
                    {canEdit && (
                      <Button
                        variant='icon2'
                        className='text-neutral-1900 h-7 w-7'
                        aria-label='Edit'
                        onClick={() => {
                          setEditing(t)
                          setOverlayOpen(true)
                        }}
                      >
                        <PencilSimple size={14} weight='fill' />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <TemplateOverlay
        open={overlayOpen}
        onOpenChange={(open) => {
          setOverlayOpen(open)
          if (!open) setEditing(null)
        }}
        template={editing}
        onSubmit={handleSubmit}
      />

      <TemplatePreviewDialog
        template={previewing}
        onOpenChange={(open) => !open && setPreviewing(null)}
      />
    </div>
  )
}
