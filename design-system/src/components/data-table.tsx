import * as React from 'react'
import { cn } from '@/lib/cn'
import { Badge } from '@/components/badge'

export interface DataTableColumn<T> {
  id: string
  header: React.ReactNode
  cell: (row: T) => React.ReactNode
  align?: 'left' | 'right' | 'center'
  width?: string
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  getRowKey: (row: T) => string
  onRowClick?: (row: T) => void
  className?: string
}

const alignClasses = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
}

export function DataTable<T>({
  columns,
  data,
  getRowKey,
  onRowClick,
  className,
}: DataTableProps<T>) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-[var(--radius-ds-lg)] border border-border bg-ground',
        className
      )}
    >
      <table className='w-full border-collapse'>
        <thead>
          <tr className='border-b border-border bg-surface'>
            {columns.map((column) => (
              <th
                key={column.id}
                style={column.width ? { width: column.width } : undefined}
                className={cn(
                  'px-4 py-2.5 text-xs font-medium text-ink-muted',
                  alignClasses[column.align ?? 'left']
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={getRowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                'border-b border-border last:border-0 hover:bg-surface',
                onRowClick ? 'cursor-pointer' : undefined
              )}
            >
              {columns.map((column) => (
                <td
                  key={column.id}
                  className={cn(
                    'px-4 py-3 text-sm text-ink',
                    alignClasses[column.align ?? 'left']
                  )}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export interface TableGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  count?: number
  action?: React.ReactNode
}

export function TableGroup({
  title,
  count,
  action,
  className,
  children,
  ...props
}: TableGroupProps) {
  return (
    <div className={cn('flex flex-col gap-3', className)} {...props}>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <h2 className='text-sm font-semibold text-ink'>{title}</h2>
          {count !== undefined ? <Badge>{count}</Badge> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
      {children}
    </div>
  )
}
