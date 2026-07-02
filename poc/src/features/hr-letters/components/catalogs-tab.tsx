import { useMemo, useState } from 'react'
import { ArrowsClockwise, Eye, PencilSimple, Plus } from 'phosphor-react'
import { toast } from 'sonner'
import { useRole } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DOMAIN_CATALOGS,
  type CatalogChannel,
  type CatalogTemplate,
} from '../data/catalogs'
import { type CatalogsStore } from '../hooks/use-catalogs'
import { CatalogRoutingPanel } from './catalog-routing-panel'
import {
  CatalogTemplateDialog,
  type CatalogDialogMode,
  type CatalogTemplateSave,
} from './catalog-template-dialog'

const PAGE_SIZE = 5

interface CatalogsTabProps {
  store: CatalogsStore
}

/**
 * Domain-scoped template catalogs (HLC-23): pick a functional area, then
 * switch between per-channel Email / Notification grids (HLC-25). Each grid
 * shows the unique Template Type ID (HLC-24) with View (read-only, HLC-26),
 * Edit, and New tasks, plus paging, refresh, and item counts (HLC-27).
 * Domains with approver/receiver routing get a co-located tab (HLC-31).
 * Seeds cover recruitment, performance, resource, training, timesheet, and
 * travel catalogs (HLC-32..37).
 */
export function CatalogsTab({ store }: CatalogsTabProps) {
  const { role } = useRole()
  const canEdit = role === 'Company Admin'

  const [domainId, setDomainId] = useState(DOMAIN_CATALOGS[0].id)
  const [channelTab, setChannelTab] = useState('email')
  const [page, setPage] = useState(0)
  const [dialogTemplate, setDialogTemplate] = useState<CatalogTemplate | null>(null)
  const [dialogMode, setDialogMode] = useState<CatalogDialogMode | null>(null)

  const domain = DOMAIN_CATALOGS.find((d) => d.id === domainId) ?? DOMAIN_CATALOGS[0]

  const channelTemplates = useMemo(
    () =>
      store.catalogTemplates.filter(
        (t) => t.domainId === domainId && t.channel === channelTab
      ),
    [store.catalogTemplates, domainId, channelTab]
  )

  const total = channelTemplates.length
  const pageStart = page * PAGE_SIZE
  const pageItems = channelTemplates.slice(pageStart, pageStart + PAGE_SIZE)
  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1)

  const openDialog = (t: CatalogTemplate | null, mode: CatalogDialogMode) => {
    setDialogTemplate(t)
    setDialogMode(mode)
  }

  const closeDialog = () => {
    setDialogMode(null)
    setDialogTemplate(null)
  }

  const saveDialog = (values: CatalogTemplateSave) => {
    if (dialogMode === 'edit' && dialogTemplate) {
      store.updateCatalogTemplate(dialogTemplate.id, {
        description: values.description,
        body: values.body,
      })
    } else if (dialogMode === 'new') {
      store.addCatalogTemplate({
        domainId,
        channel: channelTab as CatalogChannel,
        templateType: values.templateType,
        description: values.description,
        body: values.body,
      })
    }
    closeDialog()
  }

  return (
    <div className='w-full'>
      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
        <div>
          <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
            Template catalogs — {domain.name}
          </h2>
          <p className='text-paragraph-sm text-neutral-1000'>
            Each functional area keeps its own catalog. The same event can have
            independent email and in-app wording; only channels with a
            configured template are dispatched.
          </p>
        </div>
        <Select
          value={domainId}
          onValueChange={(id) => {
            setDomainId(id)
            setChannelTab('email')
            setPage(0)
          }}
        >
          <SelectTrigger variant='secondary' className='h-7 w-[240px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DOMAIN_CATALOGS.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs
        value={channelTab}
        onValueChange={(value) => {
          setChannelTab(value)
          setPage(0)
        }}
        className='w-full'
      >
        <TabsList className='mb-3 bg-transparent p-0'>
          <TabsTrigger variant='primary' value='email'>
            Email Templates
          </TabsTrigger>
          <TabsTrigger variant='primary' value='notification'>
            Notification Templates
          </TabsTrigger>
          {domain.routingLabel && (
            <TabsTrigger variant='primary' value='routing'>
              {domain.routingLabel}
            </TabsTrigger>
          )}
        </TabsList>

        {(['email', 'notification'] as const).map((channel) => (
          <TabsContent key={channel} value={channel}>
            <div className='rounded-[6px] border border-gray-200 bg-white'>
              <div className='flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-3 py-2'>
                <span className='text-neutral-1000 text-sm'>
                  {total === 0
                    ? 'No templates for this channel — events fire on the other channel only'
                    : `Displaying items ${pageStart + 1} - ${Math.min(pageStart + PAGE_SIZE, total)} of ${total}`}
                </span>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='icon2'
                    className='text-neutral-1900 h-7 w-7'
                    aria-label='Refresh'
                    onClick={() =>
                      toast.success('Catalog refreshed — showing the latest saved templates')
                    }
                  >
                    <ArrowsClockwise size={16} weight='bold' />
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    disabled={page >= lastPage}
                    onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                  >
                    Next
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => {
                      setPage(0)
                      toast.info('Exited catalog without changes')
                    }}
                  >
                    Cancel
                  </Button>
                  {canEdit && (
                    <Button
                      variant='red'
                      onClick={() => openDialog(null, 'new')}
                      className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
                    >
                      <Plus size={10} weight='bold' />
                      New
                    </Button>
                  )}
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template Type ID</TableHead>
                    <TableHead>Template type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className='text-right'>Task</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <Badge variant='open'>{t.id}</Badge>
                      </TableCell>
                      <TableCell className='font-medium'>{t.templateType}</TableCell>
                      <TableCell className='text-sm'>{t.description}</TableCell>
                      <TableCell>
                        <div className='flex justify-end gap-1'>
                          <Button
                            variant='icon2'
                            className='text-neutral-1900 h-7 w-7'
                            aria-label='View'
                            onClick={() => openDialog(t, 'view')}
                          >
                            <Eye size={14} weight='bold' />
                          </Button>
                          {canEdit && (
                            <Button
                              variant='icon2'
                              className='text-neutral-1900 h-7 w-7'
                              aria-label='Edit'
                              onClick={() => openDialog(t, 'edit')}
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
          </TabsContent>
        ))}

        {domain.routingLabel && (
          <TabsContent value='routing'>
            <CatalogRoutingPanel domain={domain} store={store} canEdit={canEdit} />
          </TabsContent>
        )}
      </Tabs>

      <CatalogTemplateDialog
        mode={dialogMode}
        template={dialogTemplate}
        domainName={domain.name}
        channel={channelTab}
        onClose={closeDialog}
        onSave={saveDialog}
      />
    </div>
  )
}
