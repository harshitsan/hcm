import { toast } from 'sonner'
import { exportToExcel } from '@/utils/excel-export'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { UploadErrorDetail } from './types'
import { UploadDetailsTable } from './upload-details-table'

interface UploadDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  errors: UploadErrorDetail[]
}

const uploadErrorExcelColumns = [
  { key: 'row', header: 'Row' },
  { key: 'fieldName', header: 'Field Name' },
  { key: 'reason', header: 'Reason' },
]

export function UploadDetailsModal({
  open,
  onOpenChange,
  errors,
}: UploadDetailsModalProps) {
  const handleDownload = () => {
    try {
      if (errors.length === 0) {
        toast.error('No error details to download')
        return
      }

      exportToExcel<UploadErrorDetail>(errors, uploadErrorExcelColumns, {
        filename: 'upload-error-details.xlsx',
        sheetName: 'Error Details',
      })

      toast.success('Error details downloaded successfully')
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to download error details'
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='min-w-[500px]' showCloseButton>
        <DialogHeader>
          <DialogTitle className='text-paragraph-md text-neutral-1600 font-semibold'>
            Details
          </DialogTitle>
        </DialogHeader>
        <div className='max-h-[600px] overflow-y-auto'>
          <UploadDetailsTable errors={errors} />
        </div>
        <div className='border-t border-gray-200 py-2'>
          <div className='bg-neutral-150 flex h-[52px] items-center gap-3 overflow-hidden rounded-lg border border-gray-200 p-3'>
            <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded'>
              <svg
                width='40'
                height='40'
                viewBox='0 0 40 40'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
                className='h-10 w-10'
              >
                <path
                  d='M0 5.33333C0 2.38781 2.38781 0 5.33333 0H34.6667C37.6122 0 40 2.38781 40 5.33333V34.6667C40 37.6122 37.6122 40 34.6667 40H5.33333C2.38781 40 0 37.6122 0 34.6667V5.33333Z'
                  fill='#F1F1F1'
                />
                <path
                  d='M28.9216 15.2438L23.0883 9.41044C23.0108 9.33308 22.9189 9.27173 22.8177 9.22991C22.7166 9.18808 22.6082 9.1666 22.4987 9.16669H12.4987C12.0567 9.16669 11.6327 9.34228 11.3202 9.65484C11.0076 9.9674 10.832 10.3913 10.832 10.8334V29.1667C10.832 29.6087 11.0076 30.0326 11.3202 30.3452C11.6327 30.6578 12.0567 30.8334 12.4987 30.8334H27.4987C27.9407 30.8334 28.3646 30.6578 28.6772 30.3452C28.9898 30.0326 29.1654 29.6087 29.1654 29.1667V15.8334C29.1655 15.7239 29.144 15.6155 29.1021 15.5143C29.0603 15.4132 28.999 15.3212 28.9216 15.2438ZM22.4987 15.8334V11.25L27.082 15.8334H22.4987Z'
                  fill='#ACACAC'
                />
              </svg>
            </div>

            <div className='min-w-0 flex-1 overflow-hidden'>
              <p className='text-paragraph-sm text-neutral-1600 truncate font-semibold'>
                upload-error-details.xlsx
              </p>
            </div>

            <Button
              onClick={handleDownload}
              className='bg-orange-1200 hover:bg-orange-1300 flex h-[24px] w-[73px] shrink-0 items-center justify-center rounded-md text-sm font-medium text-white shadow-sm'
            >
              <span className='whitespace-nowrap'>Download</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
