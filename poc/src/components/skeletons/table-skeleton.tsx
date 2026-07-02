import type { ColumnDef } from '@tanstack/react-table'
import { Skeleton } from '@/components/ui/skeleton'
import { TableBody, TableCell, TableRow } from '@/components/ui/table'

interface TableSkeletonProps<TData> {
  columns: ColumnDef<TData, unknown>[]
  rowCount?: number
}

export function TableSkeleton<TData>({
  columns,
  rowCount = 8,
}: TableSkeletonProps<TData>) {
  // Estimate skeleton width based on column position
  const widthMap = ['w-32', 'w-24', 'w-28', 'w-32', 'w-28', 'w-24', 'w-28']

  return (
    <TableBody>
      {[...Array(rowCount)].map((_, index) => (
        <TableRow key={`skeleton-${index}`} className='h-10 bg-white'>
          {columns.map((_column, colIndex) => {
            const skeletonWidth = widthMap[colIndex % widthMap.length] || 'w-24'

            return (
              <TableCell key={colIndex} className='!h-10 border-b !py-0.5'>
                <Skeleton
                  className={`h-4 ${skeletonWidth} flex-shrink-0 rounded-none`}
                />
              </TableCell>
            )
          })}
        </TableRow>
      ))}
    </TableBody>
  )
}
