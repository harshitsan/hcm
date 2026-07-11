import { useMemo, useState } from 'react'
import { PencilSimple } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type FieldSection, type ProfileField } from '../data/profile'
import { type ProfileStore } from '../hooks/use-profile'
import { ProfileEditOverlay } from './profile-edit-overlay'

interface ProfileCardProps {
  store: ProfileStore
  /** Whether the active role may edit its authorized fields (ESS-03/08). */
  canManage: boolean
}

/**
 * Authorized personal + employment information (ESS-02/03/04): rendered from
 * the metadata field schema (ESS-16), hidden fields excluded, view-only fields
 * locked, and approval-required edits flagged (ESS-15).
 */
export function ProfileCard({ store, canManage }: ProfileCardProps) {
  const [editing, setEditing] = useState<ProfileField | null>(null)
  const [overlayOpen, setOverlayOpen] = useState(false)

  const visibleFields = useMemo(
    () => store.fields.filter((f) => f.mode !== 'hidden'),
    [store.fields]
  )
  const hiddenCount = store.fields.length - visibleFields.length

  const pendingFieldIds = useMemo(
    () =>
      new Set(
        store.changeRequests
          .filter((cr) => cr.status === 'Pending approval')
          .map((cr) => cr.fieldId)
      ),
    [store.changeRequests]
  )

  const renderSection = (section: FieldSection) => (
    <div>
      <h3 className='text-paragraph-sm text-neutral-1000 mb-2 font-medium'>
        {section} information
      </h3>
      <div className='grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-3'>
        {visibleFields
          .filter((f) => f.section === section)
          .map((field) => {
            const pending = pendingFieldIds.has(field.id)
            return (
              <div
                key={field.id}
                className='rounded-[6px] border border-gray-200 bg-white px-3 py-2'
              >
                <div className='flex items-center justify-between gap-2'>
                  <span className='text-paragraph-sm text-neutral-1000 truncate'>
                    {field.label}
                    {field.required && (
                      <span className='text-destructive'>*</span>
                    )}
                  </span>
                  <div className='flex shrink-0 items-center gap-1'>
                    {field.isUdf && <Badge variant='open'>Custom field</Badge>}
                    {field.mode === 'view-only' && (
                      <Badge variant='badge_inactive'>View only</Badge>
                    )}
                    {pending && <Badge variant='pending'>Pending approval</Badge>}
                    {canManage && field.mode === 'editable' && (
                      <Button
                        variant='icon2'
                        className='text-neutral-1900 h-6 w-6'
                        aria-label={`Edit ${field.label}`}
                        onClick={() => {
                          setEditing(field)
                          setOverlayOpen(true)
                        }}
                      >
                        <PencilSimple size={13} weight='fill' />
                      </Button>
                    )}
                  </div>
                </div>
                <p className='text-neutral-1600 mt-1 text-sm font-medium break-words'>
                  {store.values[field.id] ?? '—'}
                </p>
              </div>
            )
          })}
      </div>
    </div>
  )

  return (
    <Card className='mb-4 gap-3 border-gray-200 bg-white px-4 py-3'>
      <CardHeader className='flex items-center justify-between p-0'>
        <CardTitle className='text-neutral-1600 text-paragraph-md font-medium'>
          My profile
        </CardTitle>
        {hiddenCount > 0 && (
          <span className='text-paragraph-sm text-neutral-1000'>
            {hiddenCount} field{hiddenCount === 1 ? '' : 's'} you don't have
            permission to see {hiddenCount === 1 ? 'is' : 'are'} hidden
          </span>
        )}
      </CardHeader>
      <CardContent className='space-y-4 p-0'>
        {renderSection('Personal')}
        {renderSection('Employment')}
      </CardContent>

      <ProfileEditOverlay
        open={overlayOpen}
        onOpenChange={(open) => {
          setOverlayOpen(open)
          if (!open) setEditing(null)
        }}
        field={editing}
        currentValue={editing ? (store.values[editing.id] ?? '') : ''}
        onSubmit={store.submitChange}
      />
    </Card>
  )
}
