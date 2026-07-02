/**
 * SectionedDropdown - A multi-section dropdown component with collapsible sections
 *
 * @example
 * ```tsx
 * const sections = [
 *   {
 *     id: 'purchase-by',
 *     title: 'Purchase by',
 *     type: 'list',
 *     options: [
 *       { id: 'all', label: 'All' },
 *       { id: 'this-week', label: 'This week' },
 *       { id: 'this-month', label: 'This Month' },
 *       { id: 'next-month', label: 'Next Month' },
 *       { id: 'custom', label: 'Custom' },
 *     ],
 *   },
 *   {
 *     id: 'purchase-type',
 *     title: 'Purchase Type',
 *     type: 'list',
 *     options: [
 *       { id: 'self', label: 'Self' },
 *       { id: 'commercial', label: 'Commercial' },
 *       { id: 'exchange', label: 'Exchange' },
 *     ],
 *   },
 *   {
 *     id: 'inactivity',
 *     title: 'Inactivity for',
 *     type: 'pills',
 *     options: [
 *       { id: '3-days', label: '3 Days' },
 *       { id: '5-days', label: '5 Days' },
 *       { id: '7-days', label: '7 Days' },
 *       { id: '15-days', label: '15 Days' },
 *       { id: '30-days', label: '30 Days' },
 *       { id: 'custom', label: 'Custom' },
 *     ],
 *   },
 *   {
 *     id: 'no-call',
 *     title: 'No Call',
 *     type: 'list',
 *     options: [
 *       { id: 'no-call', label: 'No Call' },
 *       { id: 'no-call-or-attempt', label: 'No Call or Attempt for' },
 *       { id: 'no-call-attempt-chat', label: 'No Call, Attempt, or Chat' },
 *     ],
 *   },
 * ]
 *
 * <SectionedDropdown
 *   sections={sections}
 *   selectedIds={{
 *     'purchase-by': 'all',
 *     'purchase-type': 'self',
 *     'inactivity': '3-days',
 *     'no-call': undefined,
 *   }}
 *   onSelectionChange={(sectionId, optionId) => {
 *     // Handle selection change
 *   }}
 *   placeholder="Dropdown list"
 * />
 * ```
 */
import * as React from 'react'
import { format, endOfDay } from 'date-fns'
import { ChevronDown, CalendarIcon, X } from 'lucide-react'
import { CaretDown } from 'phosphor-react'
import { formatDateWithTimezone } from '@/utils/date'
import { cn } from '@/utils/helpers'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export interface SectionOption {
  id: string
  label: string
  hasSubmenu?: boolean // If true, this option will have a submenu
  submenuType?: 'dateRange' // Type of submenu
}

export interface DropdownSection {
  id: string
  title: string
  options: SectionOption[]
  type?: 'list' | 'pills' // 'list' for regular items, 'pills' for button-style items
  showHeader?: boolean // If false, section has no collapsible header, just a separator border
  renderSubmenu?: (sectionId: string, optionId: string) => React.ReactNode // Custom render function for submenu content
}

export interface DateRange {
  from: Date | undefined
  to: Date | undefined
}

interface SectionedDropdownProps {
  sections: DropdownSection[]
  selectedIds: Record<string, string | null> // sectionId -> optionId
  onSelectionChange: (sectionId: string, optionId: string) => void
  onSectionReset?: (sectionId: string) => void // Reset filter for a specific section
  placeholder?: string
  className?: string
  onExpandedChange?: (expandedSections: Record<string, boolean>) => void
  // Date range props
  dateRanges?: Record<string, DateRange> // sectionId -> DateRange
  onDateRangeChange?: (
    sectionId: string,
    optionId: string,
    range: DateRange
  ) => void
  formatDate?: (date: Date) => string // Custom date formatter
}

export function SectionedDropdown({
  sections,
  selectedIds,
  onSelectionChange,
  onSectionReset,
  placeholder = 'Dropdown list',
  className,
  onExpandedChange,
  dateRanges = {},
  onDateRangeChange,
  formatDate = (date: Date) => format(date, 'MMM d, yyyy'),
}: SectionedDropdownProps) {
  const [open, setOpen] = React.useState(false)
  // Start with all sections expanded by default
  const [expandedSections, setExpandedSections] = React.useState<
    Record<string, boolean>
  >(() => {
    const initial: Record<string, boolean> = {}
    sections.forEach((section) => {
      initial[section.id] = true
    })
    return initial
  })

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const newExpanded = {
        ...prev,
        [sectionId]: !prev[sectionId],
      }
      // Notify parent of expanded state changes
      onExpandedChange?.(newExpanded)
      return newExpanded
    })
  }

  // Notify parent of initial expanded state
  React.useEffect(() => {
    onExpandedChange?.(expandedSections)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleOptionSelect = (sectionId: string, optionId: string) => {
    onSelectionChange(sectionId, optionId)
  }

  return (
    <Popover open={open} modal={false} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className={cn(
            '!text-neutral-1600 !h-7 w-auto justify-start gap-0.5 !rounded-[4px] bg-neutral-200 !px-1.5 font-normal shadow-[inset_0_1px_0_0_#E3E3E3,inset_1px_0_0_0_#E3E3E3,inset_-1px_0_0_0_#E3E3E3,inset_0_-1px_0_0_#B5B5B5]',
            className
          )}
        >
          {placeholder}{' '}
          <CaretDown className='text-neutral-1600 size-3.5' weight='fill' />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        onScroll={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        className='w-[240px] rounded-[8px] p-0'
        align='end'
        side='bottom'
      >
        <div className='max-h-[320px] space-y-0 overflow-y-auto rounded-[8px] p-0'>
          {sections.map((section) => (
            <SectionComponent
              key={section.id}
              section={section}
              isExpanded={expandedSections[section.id] ?? true}
              onToggle={() => toggleSection(section.id)}
              selectedId={selectedIds[section.id] ?? undefined}
              onSelect={(optionId) => handleOptionSelect(section.id, optionId)}
              onReset={
                onSectionReset ? () => onSectionReset(section.id) : undefined
              }
              dateRange={dateRanges[section.id]}
              onDateRangeChange={onDateRangeChange}
              formatDate={formatDate}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface SectionComponentProps {
  section: DropdownSection
  isExpanded: boolean
  onToggle: () => void
  selectedId: string | undefined
  onSelect: (optionId: string) => void
  onReset?: () => void
  dateRange?: DateRange
  onDateRangeChange?: (
    sectionId: string,
    optionId: string,
    range: DateRange
  ) => void
  formatDate?: (date: Date) => string
}

const SubmenuWrapper = ({
  children,
  trigger,
}: {
  children: React.ReactNode
  trigger: React.ReactNode
}) => {
  const [submenuOpen, setSubmenuOpen] = React.useState(false)

  return (
    <Popover open={submenuOpen} onOpenChange={setSubmenuOpen} modal={false}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        className='w-auto p-0'
        side='right'
        align='start'
        sideOffset={15}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {children}
      </PopoverContent>
    </Popover>
  )
}

function SectionComponent({
  section,
  isExpanded,
  onToggle,
  selectedId,
  onSelect,
  onReset,
  dateRange,
  onDateRangeChange,
  formatDate = (date: Date) => formatDateWithTimezone(date, 'MMM d, yyyy'),
}: SectionComponentProps) {
  const isPills = section.type === 'pills'
  const showHeader = section.showHeader !== false // Default to true if not specified
  const hasSelection = selectedId !== undefined && selectedId !== null

  const renderDateRangeSubmenu = (optionId: string) => {
    const currentRange = dateRange || { from: undefined, to: undefined }

    return (
      <div className='p-3'>
        <div className='space-y-2'>
          <div className='flex gap-2'>
            <div className='flex-1'>
              <label className='text-paragraph-sm text-neutral-1800 mb-1 block font-medium'>
                From
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    className='text-paragraph-sm text-neutral-1800 h-8 w-full justify-between font-normal'
                  >
                    {currentRange.from
                      ? formatDate(currentRange.from)
                      : 'Select Date'}
                    <CalendarIcon className='text-neutral-1800 mr-1 h-3 w-3' />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='start'>
                  <Calendar
                    mode='single'
                    selected={currentRange.from}
                    onSelect={(date) => {
                      const newRange = {
                        from: date,
                        to: currentRange.to,
                      }
                      onDateRangeChange?.(section.id, optionId, newRange)
                    }}
                    disabled={(date: Date) =>
                      date > endOfDay(new Date()) ||
                      date < new Date('1900-01-01')
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className='flex-1'>
              <label className='text-paragraph-sm text-neutral-1800 mb-1 block font-medium'>
                To
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    className='text-paragraph-sm text-neutral-1800 h-8 w-full justify-between font-normal'
                  >
                    {currentRange.to
                      ? formatDate(currentRange.to)
                      : 'Select Date'}
                    <CalendarIcon className='text-neutral-1800 mr-1 h-3 w-3' />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='start'>
                  <Calendar
                    mode='single'
                    selected={currentRange.to}
                    onSelect={(date) => {
                      const newRange = {
                        from: currentRange.from,
                        to: date,
                      }
                      onDateRangeChange?.(section.id, optionId, newRange)
                    }}
                    disabled={(date: Date) =>
                      date > endOfDay(new Date()) ||
                      date < new Date('1900-01-01') ||
                      (currentRange.from ? date < currentRange.from : false)
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='mb-0'>
      {showHeader ? (
        <>
          {/* Section Header */}
          <div
            className='bg-neutral-150 mt-0 flex cursor-pointer items-center justify-between px-2 py-1'
            onClick={onToggle}
          >
            <h3 className='text-paragraph-sm text-neutral-1600 leading-tight font-medium'>
              {section.title}
            </h3>
            <div className='flex items-center gap-1'>
              {hasSelection && onReset && (
                <button
                  type='button'
                  onClick={(e) => {
                    e.stopPropagation()
                    onReset()
                  }}
                  className='flex h-4 w-4 items-center justify-center rounded-full bg-neutral-400 p-0 hover:bg-neutral-500'
                  title={`Reset ${section.title}`}
                >
                  <X className='h-2.5 w-2.5 text-white' />
                </button>
              )}
              <button
                type='button'
                onClick={(e) => {
                  e.stopPropagation()
                  onToggle()
                }}
                className='bg-blue-1700 hover:bg-blue-1700 flex h-4 w-4 items-center justify-center rounded-full p-0'
              >
                <ChevronDown
                  className={cn(
                    'h-3 w-3 text-white transition-transform',
                    isExpanded && 'rotate-180'
                  )}
                />
              </button>
            </div>
          </div>

          {/* Section Content */}
          {isExpanded && (
            <div className={cn(isPills ? 'px-2 pt-2 pb-2' : 'px-2')}>
              {isPills ? (
                <div className='grid grid-cols-3 gap-2'>
                  {section.options.map((option) => {
                    const isSelected = selectedId === option.id
                    return (
                      <button
                        key={option.id}
                        type='button'
                        onClick={() => onSelect(option.id)}
                        className={cn(
                          'border-neutral-2000 rounded-[32px] border px-1.5 py-1 text-xs transition-colors',
                          isSelected
                            ? 'bg-blue-1400 font-medium text-white'
                            : 'text-neutral-1600 bg-grey-1500 hover:bg-neutral-300'
                        )}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className='space-y-0'>
                  {section.options.map((option) => {
                    const isSelected = selectedId === option.id
                    const hasSubmenu =
                      option.hasSubmenu &&
                      (option.submenuType === 'dateRange' ||
                        section.renderSubmenu)

                    if (hasSubmenu) {
                      const submenuContent =
                        option.submenuType === 'dateRange'
                          ? renderDateRangeSubmenu(option.id)
                          : section.renderSubmenu?.(section.id, option.id)

                      return (
                        <SubmenuWrapper
                          key={option.id}
                          trigger={
                            <div
                              className={cn(
                                'hover:bg-accent relative flex h-8 w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2',
                                isSelected && 'bg-accent'
                              )}
                              onClick={(e) => {
                                e.stopPropagation()
                                // Don't call onSelect for submenu items
                              }}
                            >
                              <span
                                className={cn(
                                  'text-neutral-1600 flex w-full flex-1 cursor-pointer items-center justify-between text-sm font-normal select-none',
                                  isSelected && 'text-neutral-1600 font-medium'
                                )}
                                title={option.label}
                              >
                                <span>{option.label}</span>
                              </span>
                            </div>
                          }
                        >
                          {submenuContent}
                        </SubmenuWrapper>
                      )
                    }

                    return (
                      <div
                        key={option.id}
                        onClick={() => onSelect(option.id)}
                        className={cn(
                          'hover:bg-accent relative flex h-8 cursor-pointer items-center gap-2 rounded-md px-2 py-2'
                        )}
                      >
                        <span
                          className={cn(
                            'text-neutral-1600 flex-1 cursor-pointer text-sm font-normal select-none',
                            isSelected && 'text-neutral-1600 font-medium'
                          )}
                          title={option.label}
                        >
                          {option.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Separator Border */}
          <div className='my-1 border-t border-neutral-200' />
          {/* Section Content without header */}
          <div className={cn(isPills ? 'px-2 pt-2 pb-2' : 'px-2')}>
            {isPills ? (
              <div className='grid grid-cols-3 gap-2'>
                {section.options.map((option) => {
                  const isSelected = selectedId === option.id
                  return (
                    <button
                      key={option.id}
                      type='button'
                      onClick={() => onSelect(option.id)}
                      className={cn(
                        'rounded-[32px] px-1.5 py-1 text-xs transition-colors',
                        isSelected
                          ? 'bg-blue-1400 font-medium text-white'
                          : 'text-neutral-1600 bg-neutral-200 hover:bg-neutral-300'
                      )}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className='space-y-0'>
                {section.options.map((option) => {
                  const isSelected = selectedId === option.id
                  const hasSubmenu =
                    option.hasSubmenu &&
                    (option.submenuType === 'dateRange' ||
                      section.renderSubmenu)

                  if (hasSubmenu) {
                    const submenuContent =
                      option.submenuType === 'dateRange'
                        ? renderDateRangeSubmenu(option.id)
                        : section.renderSubmenu?.(section.id, option.id)

                    return (
                      <SubmenuWrapper
                        key={option.id}
                        trigger={
                          <div
                            className={cn(
                              'hover:bg-accent relative flex h-8 w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2',
                              isSelected && 'bg-accent'
                            )}
                            onClick={(e) => {
                              e.stopPropagation()
                              // Don't call onSelect for submenu items
                            }}
                          >
                            <span
                              className={cn(
                                'text-neutral-1600 flex w-full flex-1 cursor-pointer items-center justify-between text-sm font-normal select-none',
                                isSelected && 'text-neutral-1600 font-medium'
                              )}
                              title={option.label}
                            >
                              <span>{option.label}</span>
                              <ChevronDown className='ml-1 h-3 w-3' />
                            </span>
                          </div>
                        }
                      >
                        {submenuContent}
                      </SubmenuWrapper>
                    )
                  }

                  return (
                    <div
                      key={option.id}
                      onClick={() => onSelect(option.id)}
                      className={cn(
                        'hover:bg-accent relative flex h-8 cursor-pointer items-center gap-2 rounded-md px-2 py-2'
                      )}
                    >
                      <span
                        className={cn(
                          'text-neutral-1600 flex-1 cursor-pointer text-sm font-normal select-none',
                          isSelected && 'text-neutral-1600 font-medium'
                        )}
                        title={option.label}
                      >
                        {option.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
