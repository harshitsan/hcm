export type UploadState =
  | 'idle'
  | 'uploading'
  | 'success'
  | 'failed'
  | 'partial'

export interface UploadErrorDetail {
  row: number
  fieldName: string
  reason: string
}

export interface UploadResult {
  state: UploadState
  successCount?: number
  failedCount?: number
  errors?: UploadErrorDetail[]
  progress?: number
}

export interface UploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpload?: (file: File) => Promise<UploadResult>
  acceptedFileTypes?: string[]
  maxFileSize?: number // in MB
  title?: string
}
