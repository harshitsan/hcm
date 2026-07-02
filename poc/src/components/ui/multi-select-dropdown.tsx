import * as React from 'react'
import { CaretDown } from 'phosphor-react'
import { cn } from '@/utils/helpers'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface MultiSelectItem {
  id: string
  label: string
}

interface MultiSelectDropdownProps {
  items: MultiSelectItem[]
  selectedIds: string[]
  onSelectionChange: (selectedIds: string[]) => void
  placeholder?: string
  className?: string
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
}

export function MultiSelectDropdown({
  items,
  selectedIds,
  onSelectionChange,
  placeholder = 'Select options',
  className,
  onOpenChange,
  disabled = false,
}: MultiSelectDropdownProps) {
  const [open, setOpen] = React.useState(false)

  const handleOpenChange = (newOpen: boolean) => {
    if (disabled) return
    setOpen(newOpen)
    onOpenChange?.(newOpen)
  }

  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id))
    } else {
      onSelectionChange([...selectedIds, id])
    }
  }

  const getDisplayText = () => {
    if (selectedIds.length === 0) {
      return placeholder
    }
    if (selectedIds.length === 1) {
      const item = items.find((item) => item.id === selectedIds[0])
      return item?.label || selectedIds[0]
    }
    return `${selectedIds.length} selected`
  }

  return (
    <Popover
      open={open && !disabled}
      modal={false}
      onOpenChange={handleOpenChange}
    >
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between text-left font-normal',
            !selectedIds.length && 'text-muted-foreground',
            className
          )}
        >
          <span className='truncate'>{getDisplayText()}</span>
          <CaretDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className='w-[var(--radix-popover-trigger-width)] p-0'
        align='start'
        onScroll={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        <div className='max-h-[300px] overflow-x-hidden overflow-y-auto p-2'>
          {items.length === 0 ? (
            <div className='text-muted-foreground py-6 text-center text-sm'>
              No options available
            </div>
          ) : (
            <div className='space-y-2'>
              {items.map((item) => {
                const isSelected = selectedIds.includes(item.id)
                return (
                  <div
                    key={item.id}
                    className={cn(
                      'flex items-center space-x-2 rounded-md p-2',
                      !disabled && 'hover:bg-accent cursor-pointer',
                      disabled && 'cursor-not-allowed opacity-50'
                    )}
                    onClick={() => !disabled && handleToggle(item.id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      variant='blue'
                      className='pointer-events-none'
                    />
                    <label
                      className='flex-1 cursor-pointer text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                      onClick={(e) => e.preventDefault()}
                    >
                      {item.label}
                    </label>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
