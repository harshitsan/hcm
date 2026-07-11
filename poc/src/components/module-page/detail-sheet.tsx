import React from 'react'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

export interface DetailField {
  label: string
  value: React.ReactNode
}

export interface DetailSection {
  title?: string
  /** Label/value grid — the common case. */
  fields?: DetailField[]
  /** Arbitrary content rendered below the fields (timelines, tables…). */
  content?: React.ReactNode
}

function FieldRow({ label, value }: DetailField) {
  return (
    <div className='flex flex-col gap-0.5'>
      <span className='text-neutral-1000 text-xs font-medium'>{label}</span>
      <span className='text-neutral-1600 text-sm'>{value ?? '—'}</span>
    </div>
  )
}

/**
 * Canonical row-click detail sheet (scaffold kit §3, modeled on workflows'
 * RequestDetailSheet): Sheet + FloatingSheetContent, SheetHeader, badge row,
 * Separator-divided label/value sections, optional decision footer.
 */
export function DetailSheet({
  open,
  onOpenChange,
  title,
  description,
  badges,
  sections,
  footer,
  width = 'sm:max-w-[520px]',
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  badges?: React.ReactNode
  sections: DetailSection[]
  /** Optional decision footer (mandatory-comment Textarea + action Select). */
  footer?: React.ReactNode
  width?: string
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent
        className={`flex w-full flex-col gap-0 p-0 ${width}`}
      >
        <SheetHeader className='border-b border-gray-200 px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            {title}
          </SheetTitle>
          {description && (
            <SheetDescription className='text-neutral-1000 text-xs'>
              {description}
            </SheetDescription>
          )}
        </SheetHeader>

        <div className='flex-1 space-y-5 overflow-y-auto px-5 py-5'>
          {badges && (
            <div className='flex flex-wrap items-center gap-2'>{badges}</div>
          )}
          {sections.map((section, i) => (
            <React.Fragment key={section.title ?? i}>
              {i > 0 && <Separator />}
              <div>
                {section.title && (
                  <h4 className='text-neutral-1600 mb-2 text-sm font-semibold'>
                    {section.title}
                  </h4>
                )}
                {section.fields && (
                  <div className='grid grid-cols-2 gap-x-4 gap-y-3'>
                    {section.fields.map((f) => (
                      <FieldRow key={f.label} {...f} />
                    ))}
                  </div>
                )}
                {section.content}
              </div>
            </React.Fragment>
          ))}
        </div>

        {footer && (
          <div className='border-t border-gray-200 px-5 py-4'>{footer}</div>
        )}
      </FloatingSheetContent>
    </Sheet>
  )
}
