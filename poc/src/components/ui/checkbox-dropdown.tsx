import * as React from 'react'
import { ChevronRight, Search } from 'lucide-react'
import { CaretDown } from 'phosphor-react'
import { cn } from '@/utils/helpers'
import { toTitleCase } from '@/utils/ui-helpers'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface CheckboxItem {
  id: string
  label: string
  children?: CheckboxItem[]
}

function filterItemsBySearch(
  items: CheckboxItem[],
  query: string
): CheckboxItem[] {
  const q = query.trim().toLowerCase()
  if (!q) return items

  const result: CheckboxItem[] = []
  for (const item of items) {
    const labelMatches = item.label.toLowerCase().includes(q)
    if (item.children?.length) {
      const filteredChildren = filterItemsBySearch(item.children, query)
      if (labelMatches) {
        result.push(item)
      } else if (filteredChildren.length > 0) {
        result.push({ ...item, children: filteredChildren })
      }
    } else {
      if (labelMatches) result.push(item)
    }
  }
  return result
}

interface CheckboxDropdownProps {
  items: CheckboxItem[]
  selectedIds: string[]
  onSelectionChange: (selectedIds: string[]) => void
  placeholder?: string
  className?: string
  showLabel?: boolean
  selectAllOption?: boolean
  allowUncheck?: boolean
  /** When true, shows a search bar and filters items by label (e.g. for Team dropdowns) */
  searchable?: boolean
  /** When true, only top-level items (e.g. manager names) are shown; children are hidden and user can only select from parents */
  parentsOnly?: boolean
}

export function CheckboxDropdown({
  selectAllOption = true,
  items,
  selectedIds,
  onSelectionChange,
  placeholder = 'Dropdown list',
  className,
  showLabel = false,
  allowUncheck = false,
  searchable = false,
  parentsOnly = false,
}: CheckboxDropdownProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')

  const filteredItems = React.useMemo(
    () => (searchable ? filterItemsBySearch(items, searchQuery) : items),
    [items, searchQuery, searchable]
  )

  const itemsToRender = React.useMemo(
    () =>
      parentsOnly
        ? filteredItems.map(({ id, label }) => ({ id, label }))
        : filteredItems,
    [filteredItems, parentsOnly]
  )

  const resetSearchOnClose = React.useCallback(() => {
    setOpen(false)
    setSearchQuery('')
  }, [])

  // Helper function to find label by id (recursively)
  const findLabelById = React.useCallback(
    (id: string, itemsList: CheckboxItem[]): string | null => {
      for (const item of itemsList) {
        if (item.id === id) {
          return item.label
        }
        if (item.children) {
          const found = findLabelById(id, item.children)
          if (found) return found
        }
      }
      return null
    },
    []
  )

  // Get display text for button
  const getDisplayText = React.useMemo(() => {
    if (selectedIds.length === 0) {
      return placeholder
    }

    // If "All" is selected, show the placeholder/label name
    if (selectedIds.includes('All')) {
      return placeholder
    }

    // Single selection: show the label
    const label = findLabelById(selectedIds[0], items)
    return label || selectedIds[0]
  }, [selectedIds, items, placeholder, findLabelById])

  // Single-select logic with unselect capability:
  const handleSelect = (id: string) => {
    const isCurrentlySelected = selectedIds.includes(id)
    if (isCurrentlySelected) {
      // Unselect - clear selection (only if allowUncheck is true)
      if (allowUncheck) {
        onSelectionChange([])
      }
    } else {
      // Select - replace previous selection with new one (single select)
      onSelectionChange([id])
    }
    if (searchable) {
      resetSearchOnClose()
    } else {
      setOpen(false)
    }
  }

  const handleOpenChange = React.useCallback((next: boolean) => {
    setOpen(next)
    if (!next) setSearchQuery('')
  }, [])

  return (
    <Popover open={open} modal={false} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button
          onClick={(e) => e.stopPropagation()}
          variant='outline'
          role='combobox'
          aria-expanded={open}
          title={getDisplayText}
          className={cn(
            '!text-neutral-1600 !h-7 w-auto justify-start gap-0.5 !rounded-[4px] bg-neutral-200 !px-1.5 font-normal shadow-[inset_0_1px_0_0_#E3E3E3,inset_1px_0_0_0_#E3E3E3,inset_-1px_0_0_0_#E3E3E3,inset_0_-1px_0_0_#B5B5B5]',
            className
          )}
        >
          {getDisplayText.length > 8
            ? getDisplayText.slice(0, 8) + '...'
            : getDisplayText}{' '}
          <CaretDown className='text-neutral-1600 size-3' weight='fill' />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        onScroll={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        className='w-[240px] p-0'
        align='end'
        side='bottom'
      >
        {searchable && (
          <div className='border-gray-200 sticky top-0 z-10 border-b bg-white p-2'>
            <div className='relative'>
              <Search className='text-neutral-1600 absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2' />
              <Input
                type='text'
                placeholder='Search'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                className='h-8 rounded pr-2 pl-8'
              />
            </div>
          </div>
        )}
        <div className='max-h-[320px] space-y-0 overflow-y-auto p-2'>
          {showLabel && (
            <div className='text-neutral-1600 text-paragraph-sm font-normal'>
              {placeholder}
            </div>
          )}
          {/* Single select items only, no 'All' */}
          {selectAllOption && (
            <CheckboxItemComponent
              item={{ id: 'All', label: 'All' }}
              selectedId={selectedIds}
              onSelect={handleSelect}
              level={0}
            />
          )}
          {itemsToRender.map((item) => (
            <CheckboxItemComponent
              key={item.id}
              item={item}
              selectedId={selectedIds}
              onSelect={handleSelect}
              level={0}
            />
          ))}
          {itemsToRender.length === 0 && (
            <div className='text-muted-foreground py-2 text-center text-sm'>
              {searchable && searchQuery.trim()
                ? 'No matching options.'
                : 'No options available.'}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface CheckboxItemComponentProps {
  item: CheckboxItem
  selectedId: string | string[] | undefined
  onSelect: (id: string) => void
  level: number
}

function CheckboxItemComponent({
  item,
  selectedId,
  onSelect,
  level,
}: CheckboxItemComponentProps) {
  const hasChildren = item.children && item.children.length > 0

  // Helper function to check if any child (recursively) has the selectedId
  const hasSelectedChild = React.useMemo(() => {
    if (!hasChildren || !selectedId) return false
    const selectedIdsArray = Array.isArray(selectedId)
      ? selectedId
      : [selectedId]
    const checkChildren = (children: CheckboxItem[]): boolean => {
      return children.some(
        (child) =>
          selectedIdsArray.includes(child.id) ||
          (child.children && checkChildren(child.children))
      )
    }
    return checkChildren(item.children!)
  }, [item.children, selectedId, hasChildren])

  const [isExpanded, setIsExpanded] = React.useState(hasSelectedChild)
  const selectedIdsArray = Array.isArray(selectedId)
    ? selectedId
    : selectedId
      ? [selectedId]
      : []
  const isChecked = selectedIdsArray.includes(item.id)

  // Auto-expand parent if a child is selected
  React.useEffect(() => {
    if (hasSelectedChild) {
      setIsExpanded(true)
    }
  }, [hasSelectedChild])

  return (
    <div>
      <div
        className={cn(
          'hover:bg-accent relative flex h-8 cursor-pointer items-center gap-2 rounded-md px-2 py-2',
          level > 0 && 'ml-0'
        )}
        onClick={() => onSelect(item.id)}
      >
        {!hasChildren && level > 0 && <div className='w-4' />}
        <Checkbox
          id={item.id}
          checked={isChecked}
          className='data-[state=checked]:bg-blue-1700 data-[state=checked]:border-blue-1700 data-[state=unchecked]:border-grey-50 data-[state=checked]:text-white data-[state=unchecked]:text-white'
        />
        <label
          htmlFor={item.id}
          title={item.label}
          className='text-neutral-2300 flex-1 cursor-pointer text-sm select-none'
        >
          {item.label.length > 18
            ? toTitleCase(item.label.slice(0, 18) + '...')
            : toTitleCase(item.label)}
        </label>
        {hasChildren && (
          <button
            type='button'
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
            className='bg-blue-1700 hover:bg-blue-1700 flex h-4 w-4 items-center justify-center rounded-full p-0'
          >
            <ChevronRight
              className={cn(
                'h-3 w-3 text-white transition-transform',
                isExpanded && 'rotate-90'
              )}
            />
          </button>
        )}
      </div>
      {hasChildren && isExpanded && (
        <div className='relative'>
          {item.children!.map((child, index) => (
            <div key={child.id} className='relative'>
              <div
                className='bg-border absolute top-0 left-[15px] w-[1px]'
                style={{
                  height: index === item.children!.length - 1 ? '20px' : '100%',
                }}
              />
              <div className='bg-border absolute top-[20px] left-[5px] h-[1px]' />
              <CheckboxItemComponent
                item={child}
                selectedId={selectedId}
                onSelect={onSelect}
                level={level + 1}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
