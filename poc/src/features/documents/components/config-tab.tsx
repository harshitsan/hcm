import { useState } from 'react'
import { BellRinging, PaperPlaneTilt } from 'phosphor-react'
import { useRole } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { type DocumentsStore } from '../hooks/use-documents'
import { type DocumentSettingsStore } from '../hooks/use-document-settings'
import { ConfigPlatform } from './config-platform'
import { ConfigTaxonomy } from './config-taxonomy'

interface ConfigTabProps {
  store: DocumentsStore
  settings: DocumentSettingsStore
}

/**
 * Governed configuration surface. Company Admin sections: taxonomy + access
 * matrix (DOC-16/18), expiry alert lead time (DOC-19), and the notification
 * engine with its template (DOC-20). Platform Admin sections: upload policy
 * (DOC-17/21) and the security posture (DOC-10).
 */
export function ConfigTab({ store, settings }: ConfigTabProps) {
  const { role } = useRole()
  const isPlatformAdmin = role === 'Platform Admin'
  const isCompanyAdmin = role === 'Company Admin'

  const [draftLeadDays, setDraftLeadDays] = useState(
    String(settings.leadTimeDays)
  )
  const latestLeadVersion =
    settings.leadTimeVersions[settings.leadTimeVersions.length - 1]

  const saveLeadTime = () => {
    const days = Number(draftLeadDays)
    if (!Number.isInteger(days) || days <= 0) return
    settings.setLeadTimeDays(days)
  }

  return (
    <div className='grid w-full grid-cols-1 gap-4 xl:grid-cols-2'>
      {isCompanyAdmin && <ConfigTaxonomy settings={settings} />}

      {isCompanyAdmin && (
        <Card className='gap-3 border-none bg-white py-4'>
          <CardHeader className='px-4'>
            <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
              Expiry alert lead time (tenant-scoped, versioned)
            </CardTitle>
            <p className='text-paragraph-sm text-neutral-1000'>
              Documents whose expiry falls within this window are classified as
              upcoming-expiry for alerting. Platform default: 30 days.
            </p>
          </CardHeader>
          <CardContent className='space-y-3 px-4'>
            <div className='flex items-end gap-2'>
              <div>
                <Label htmlFor='lead-days' className='text-sm font-medium'>
                  Warning lead time (days before expiry)
                </Label>
                <Input
                  id='lead-days'
                  type='number'
                  min={1}
                  value={draftLeadDays}
                  onChange={(e) => setDraftLeadDays(e.target.value)}
                  className='mt-1 h-7 w-[120px]'
                />
              </div>
              <Button className='h-7 px-3' onClick={saveLeadTime}>
                Save lead time
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Effective from</TableHead>
                  <TableHead>Changed by</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...settings.leadTimeVersions].reverse().map((version) => (
                  <TableRow key={version.version}>
                    <TableCell className='text-sm font-medium'>
                      v{version.version}
                    </TableCell>
                    <TableCell className='text-sm'>
                      {version.effectiveFrom}
                    </TableCell>
                    <TableCell className='text-sm'>
                      {version.changedBy}
                    </TableCell>
                    <TableCell className='text-neutral-1000 text-sm'>
                      {version.note}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className='text-paragraph-sm text-neutral-1000'>
              Current: v{latestLeadVersion.version}, {settings.leadTimeDays}
              -day window governs the next evaluation.
            </p>
          </CardContent>
        </Card>
      )}

      {isCompanyAdmin && (
        <Card className='gap-3 border-none bg-white py-4 xl:col-span-2'>
          <CardHeader className='flex items-center justify-between px-4'>
            <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
              Expiry notification engine
            </CardTitle>
            <Button
              className='h-7 gap-1 rounded-[6px] px-2'
              onClick={() =>
                store.runExpiryEngine(
                  settings.leadTimeDays,
                  settings.notificationTemplate
                )
              }
            >
              <PaperPlaneTilt size={14} />
              Run notification engine
            </Button>
          </CardHeader>
          <CardContent className='space-y-3 px-4'>
            <div>
              <Label htmlFor='ntf-template' className='text-sm font-medium'>
                Notification template
              </Label>
              <Textarea
                id='ntf-template'
                rows={2}
                className='mt-1'
                value={settings.notificationTemplate}
                onChange={(e) => settings.setNotificationTemplate(e.target.value)}
              />
              <p className='text-paragraph-sm text-neutral-1000 mt-1'>
                Placeholders: {'{document}'}, {'{status}'}, {'{date}'}. The
                engine reads this template and the configured lead time — not
                hard-coded logic — and never re-alerts a document that was
                renewed or had its expiry cleared.
              </p>
            </div>
            <div>
              <p className='text-neutral-1600 mb-1 text-sm font-medium'>
                Generated notifications ({store.notifications.length})
              </p>
              {store.notifications.length === 0 ? (
                <div className='border-grey-200 flex items-center gap-2 rounded-[6px] border px-3 py-3'>
                  <BellRinging size={16} className='text-neutral-1000' />
                  <p className='text-paragraph-sm text-neutral-1000'>
                    No notifications yet — run the engine to evaluate documents
                    against the {settings.leadTimeDays}-day window.
                  </p>
                </div>
              ) : (
                <div className='space-y-2'>
                  {store.notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className='border-grey-200 rounded-[6px] border px-3 py-2'
                    >
                      <div className='mb-1 flex items-center gap-2'>
                        <Badge
                          variant={
                            notification.status === 'Expired'
                              ? 'dropped'
                              : 'overdue'
                          }
                        >
                          {notification.status}
                        </Badge>
                        <span className='text-neutral-1600 text-sm font-medium'>
                          {notification.documentName}
                        </span>
                        <span className='text-paragraph-sm text-neutral-1000 ml-auto'>
                          {notification.company} · {notification.generatedAt}
                        </span>
                      </div>
                      <p className='text-paragraph-sm text-neutral-1000'>
                        To: {notification.recipient} — {notification.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {isPlatformAdmin && <ConfigPlatform settings={settings} />}
    </div>
  )
}
