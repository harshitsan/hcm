import { cloneElement, isValidElement, Children } from 'react'
import type { Column } from '@tanstack/react-table'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { ColumnSearch } from './column-search'
import { useDataTableContext } from './table'

interface SearchableHeaderProps<TData> {
  column: Column<TData>
  columnName: string
  children: React.ReactNode
  isDateColumn?: boolean
  isDurationColumn?: boolean
  disabled?: boolean
}

export function SearchableHeader<TData>({
  column,
  columnName,
  children,
  isDateColumn = false,
  isDurationColumn = false,
  disabled = false,
}: SearchableHeaderProps<TData>) {
  const { data, onFilterChange, enableColumnSearch } = useDataTableContext()
  const accessorKey = (column.columnDef as { accessorKey?: string }).accessorKey
  const filterValue = column.getFilterValue() as string | undefined

  // Get date format and duration column flag from column meta
  const columnDef = column.columnDef as {
    meta?: {
      isDateColumn?: boolean
      dateFormat?: string
      isDurationColumn?: boolean
    }
  }
  const dateFormat = columnDef.meta?.dateFormat
  const isDurationFromMeta = columnDef.meta?.isDurationColumn ?? false
  const finalIsDurationColumn = isDurationColumn || isDurationFromMeta

  if (!enableColumnSearch) {
    return <>{children}</>
  }

  // Extract ArrowUpDown from children and separate it
  let buttonWithoutArrow: React.ReactNode = children
  let arrowElement: React.ReactNode = null

  if (isValidElement(children) && children.props) {
    const props = children.props as {
      children?: React.ReactNode
      onClick?: (e: React.MouseEvent) => void
      className?: string
    }
    const childrenArray = Children.toArray(props.children)

    // Find ArrowUpDown, ArrowUp, or ArrowDown - check by type match or by checking if it's a lucide icon
    const arrowIndex = childrenArray.findIndex((child: React.ReactNode) => {
      if (!isValidElement(child)) return false
      // Direct type comparison
      if (
        child.type === ArrowUpDown ||
        child.type === ArrowUp ||
        child.type === ArrowDown
      )
        return true
      // Also check if it's a function component that might be one of these icons
      if (typeof child.type === 'function') {
        const comp = child.type as { name?: string; displayName?: string }
        return (
          comp.name === 'ArrowUpDown' ||
          comp.displayName === 'ArrowUpDown' ||
          comp.name === 'ArrowUp' ||
          comp.displayName === 'ArrowUp' ||
          comp.name === 'ArrowDown' ||
          comp.displayName === 'ArrowDown'
        )
      }
      return false
    })

    if (arrowIndex !== -1) {
      // Split children: text before arrow, arrow, anything after
      const textContent = childrenArray.slice(0, arrowIndex)
      arrowElement = childrenArray[arrowIndex]
      const afterArrow = childrenArray.slice(arrowIndex + 1)

      // Create button without arrow, remove onClick to let search handle it
      const updatedClassName =
        props.className?.replace('w-full', 'flex-1') || 'flex-1'
      buttonWithoutArrow = cloneElement(
        children as React.ReactElement<{
          onClick?: (e: React.MouseEvent) => void
          children?: React.ReactNode
          className?: string
        }>,
        {
          ...props,
          onClick: undefined, // Remove onClick so search can handle clicks
          className: updatedClassName, // Replace w-full with flex-1
          children: [...textContent, ...afterArrow],
        }
      )
    }
  }

  return (
    <div className='flex h-7 w-full items-center'>
      <ColumnSearch
        columnId={column.id}
        columnName={columnName}
        data={data}
        accessorKey={accessorKey}
        onFilterChange={onFilterChange}
        filterValue={filterValue}
        isDateColumn={isDateColumn}
        dateFormat={dateFormat}
        isDurationColumn={finalIsDurationColumn}
        disabled={disabled}
      >
        {buttonWithoutArrow}
      </ColumnSearch>
      {arrowElement ? (
        <button
          type='button'
          onClick={(e) => {
            e.stopPropagation()
            column.toggleSorting(column.getIsSorted() === 'asc')
          }}
          className='text-neutral-2100 ml-2 flex h-8 shrink-0 items-center justify-center px-1 hover:bg-gray-100'
          aria-label='Sort column'
        >
          {isValidElement(arrowElement) &&
          (arrowElement.type === ArrowUp || arrowElement.type === ArrowDown) ? (
            // For conditional arrows, render based on current sort state
            column.getIsSorted() === 'asc' ? (
              <ArrowUp
                className={
                  (arrowElement.props as { className?: string })?.className ||
                  'text-grey-1200 ml-2 h-3 w-3'
                }
              />
            ) : (
              <ArrowDown
                className={
                  (arrowElement.props as { className?: string })?.className ||
                  'text-grey-1200 ml-2 h-3 w-3'
                }
              />
            )
          ) : (
            // For ArrowUpDown, just render as is
            arrowElement
          )}
        </button>
      ) : null}
    </div>
  )
}
