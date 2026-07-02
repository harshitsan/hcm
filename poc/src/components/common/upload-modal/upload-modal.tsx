import { useState, useCallback, useRef } from 'react'
import { CloudArrowUp, CheckCircle, Plus, WarningCircle } from 'phosphor-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { UploadModalProps, UploadResult, UploadState } from './types'
import { UploadDetailsModal } from './upload-details-modal'

export function UploadModal({
  open,
  onOpenChange,
  onUpload,
  acceptedFileTypes = ['.xls', '.xlsx', '.csv'],
  maxFileSize = 200,
  title = 'Upload File',
}: UploadModalProps) {
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [progress, setProgress] = useState(0)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const handleFileSelect = useCallback(
    async (file: File | null) => {
      if (!file) return

      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!acceptedFileTypes.includes(fileExtension)) {
        alert(
          `Invalid file type. Please upload ${acceptedFileTypes.join(' or ')} files.`
        )
        return
      }

      const fileSizeMB = file.size / (1024 * 1024)
      if (fileSizeMB > maxFileSize) {
        toast.error(`File size exceeds ${maxFileSize}MB limit.`)
        return
      }

      setUploadState('uploading')
      setProgress(0)

      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            return 90
          }
          return prev + 10
        })
      }, 300)

      try {
        if (!onUpload) {
          throw new Error('Upload handler is required')
        }

        const result: UploadResult = await onUpload(file)

        clearInterval(progressInterval)
        setProgress(100)
        setUploadResult(result)
        setUploadState(result.state)
      } catch (error) {
        clearInterval(progressInterval)
        setProgress(0)
        setUploadState('failed')

        const errorMessage =
          error instanceof Error ? error.message : 'Something went wrong'

        toast.error('Failed to upload file', {
          description: errorMessage,
        })

        setUploadResult({
          state: 'failed',
          progress: 0,
        })
      }
    },
    [onUpload, acceptedFileTypes, maxFileSize]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      handleFileSelect(file)
    },
    [handleFileSelect]
  )

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null
      handleFileSelect(file)
    },
    [handleFileSelect]
  )

  const handleRetry = useCallback(() => {
    setUploadState('idle')
    setProgress(0)
    setUploadResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleClose = useCallback(() => {
    if (uploadState === 'uploading') return
    onOpenChange(false)
    setTimeout(() => {
      setUploadState('idle')
      setProgress(0)
      setUploadResult(null)
      setIsDragging(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }, 300)
  }, [uploadState, onOpenChange])

  const renderContent = () => {
    switch (uploadState) {
      case 'idle':
        return (
          <div className='h-full flex-col items-center justify-center'>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex h-[18.37rem] w-full flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 py-5 transition-colors ${
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'bg-neutral-150 border-gray-300'
              } `}
            >
              <CloudArrowUp
                size={52}
                weight='regular'
                className='mb-4 text-gray-400'
              />
              <p className='text-paragraph-lg text-grey-1100 mb-2 text-center font-normal'>
                Upload files from your computer or drag and drop them here.
              </p>
              <p className='text-neutral-1800 mb-4 text-xs font-medium'>
                Limit 200MB per file - .xls, .xlsx or .csv
              </p>
              <input
                ref={fileInputRef}
                type='file'
                accept={acceptedFileTypes.join(',')}
                onChange={handleFileInputChange}
                className='hidden'
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant='icon2'
                className='text-neutral-1600 mt-2 h-7 gap-0.5 px-1.5 text-xs font-medium'
              >
                <Plus size={9} /> Add files
              </Button>
            </div>
          </div>
        )

      case 'uploading':
        return (
          <div className='flex flex-col items-center justify-center py-12'>
            <div className='mb-4'>
              <div className='relative h-24 w-24'>
                <svg className='h-24 w-24 -rotate-90 transform'>
                  <circle
                    cx='48'
                    cy='48'
                    r='44'
                    stroke='#e5e7eb'
                    strokeWidth='4'
                    fill='none'
                  />
                  <circle
                    cx='48'
                    cy='48'
                    r='44'
                    stroke='#3b82f6'
                    strokeWidth='4'
                    fill='none'
                    strokeDasharray={`${2 * Math.PI * 44}`}
                    strokeDashoffset={`${
                      2 * Math.PI * 44 * (1 - progress / 100)
                    }`}
                    className='transition-all duration-300'
                  />
                </svg>
                <div className='absolute inset-0 flex items-center justify-center'>
                  <span className='text-sm font-semibold text-gray-700'>
                    {progress}%
                  </span>
                </div>
              </div>
            </div>
            <p className='text-paragraph-lg text-neutral-1800 text-center font-medium'>
              File Upload in <br /> progress
            </p>
          </div>
        )

      case 'success':
        return (
          <div className='flex h-full flex-col items-center justify-center rounded py-12'>
            <div className='mb-4 flex h-24 items-center justify-center rounded-full'>
              <div className='flex flex-col items-center justify-center'>
                <CheckCircle
                  size={52}
                  weight='fill'
                  className='text-green-1300'
                />
                <p className='text-paragraph-lg text-neutral-1800 mt-3 font-medium'>
                  File Uploaded
                </p>
              </div>
            </div>
          </div>
        )

      case 'failed':
        return (
          <div className='flex flex-col items-center justify-center py-12'>
            <div>
              <WarningCircle
                size={52}
                weight='regular'
                className='text-red-600'
              />
            </div>

            <p className='text-paragraph-lg text-neutral-1800 mt-2 mb-1 text-center font-medium'>
              File Upload Failed,
              <br />
              Please try again.
            </p>
            {uploadResult?.failedCount !== undefined && (
              <p className='text-neutral-1800 mb-6 text-center text-xs font-normal'>
                <span className='text-red-2200 font-medium'>
                  {uploadResult.failedCount} failed
                </span>
              </p>
            )}
            <div className='flex gap-2'>
              <Button
                onClick={handleRetry}
                variant='icon2'
                className='text-neutral-1600 h-7 gap-0.5 px-1.5 text-xs font-medium'
              >
                Retry Upload
              </Button>
              {uploadResult?.errors && uploadResult.errors.length > 0 && (
                <Button
                  onClick={() => setDetailsModalOpen(true)}
                  variant='icon2'
                  className='bg-red-2200 mt-0.5 h-7 gap-0.5 px-1.5 text-xs font-medium text-white hover:bg-red-600'
                >
                  See Details
                </Button>
              )}
            </div>
          </div>
        )

      case 'partial':
        return (
          <div className='flex h-full flex-col py-4'>
            <div className='mb-6 flex flex-col items-center justify-center'>
              <div>
                <img src='/svg/cloud-x.svg' alt='Cloud X' />
              </div>
              <p className='text-paragraph-lg text-neutral-1800 mt-2 mb-1 text-center font-medium'>
                File Partially uploaded
              </p>
              <p className='text-green-1300 mb-6 text-center text-xs font-medium'>
                {uploadResult?.successCount || 0} added •{' '}
                <span className='text-red-2200 font-medium'>
                  {uploadResult?.failedCount || 0} failed
                </span>
              </p>
              <Button
                onClick={() => setDetailsModalOpen(true)}
                variant='icon2'
                className='bg-red-2200 mt-2 h-7 gap-0.5 px-1.5 text-xs font-medium text-white hover:bg-red-600'
              >
                See Details
              </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          className='w-[424px]'
          showCloseButton={uploadState !== 'uploading'}
        >
          <DialogHeader>
            <DialogTitle className='text-paragraph-md text-neutral-1600 font-semibold'>
              {title}
            </DialogTitle>
          </DialogHeader>
          <div className='flex h-[300px] items-center justify-center overflow-hidden'>
            {renderContent()}
          </div>
        </DialogContent>
      </Dialog>

      {uploadResult?.errors && uploadResult.errors.length > 0 && (
        <UploadDetailsModal
          open={detailsModalOpen}
          onOpenChange={setDetailsModalOpen}
          errors={uploadResult.errors}
        />
      )}
    </>
  )
}
