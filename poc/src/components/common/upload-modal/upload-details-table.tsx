import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/common/data-table/table'
import type { UploadErrorDetail } from './types'

interface UploadDetailsTableProps {
  errors: UploadErrorDetail[]
}

export function UploadDetailsTable({ errors }: UploadDetailsTableProps) {
  const columns: ColumnDef<UploadErrorDetail>[] = [
    {
      accessorKey: 'row',
      header: 'Row',
      cell: ({ row }) => {
        const rowNum = row.getValue('row') as number
        return (
          <div className='text-neutral-1800 text-xs font-normal'>{rowNum}</div>
        )
      },
    },
    {
      accessorKey: 'fieldName',
      header: 'Field Name',
      cell: ({ row }) => {
        const fieldName = row.getValue('fieldName') as string
        return (
          <div className='text-neutral-1800 text-xs font-normal'>
            {fieldName}
          </div>
        )
      },
    },
    {
      accessorKey: 'reason',
      header: 'Reason',
      cell: ({ row }) => {
        const reason = row.getValue('reason') as string
        return <div className='text-red-2000 text-xs font-normal'>{reason}</div>
      },
    },
  ]

  return (
    <div className='w-full'>
      <DataTable columns={columns} data={errors} variant='no-status' />
    </div>
  )
}
