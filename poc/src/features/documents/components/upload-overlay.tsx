import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRole } from '@/context/role-context'
import { Button } from '@/components/ui/button'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { type DocumentFormat, type DocumentRecord } from '../data/documents'
import { type DocumentType } from '../data/masters'
import { CURRENT_EMPLOYEE } from '../data/org'
import { type DocumentDraft } from '../hooks/use-documents'
import { type DocumentSettingsStore } from '../hooks/use-document-settings'
import { UploadFields } from './upload-fields'
import { uploadFormSchema, type UploadFormValues } from './upload-schema'

interface UploadOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When set, the sheet edits this document's metadata. */
  document?: DocumentRecord | null
  settings: DocumentSettingsStore
  documentTypes: DocumentType[]
  /** Companies within the caller's tenant scope. */
  companies: string[]
  /** Self-service mode pins the upload to the signed-in employee (DOC-12). */
  mode?: 'admin' | 'self'
  onSubmit: (draft: DocumentDraft) => void
}

/**
 * Upload/edit sheet. The validation engine reads the governed upload policy
 * (allowed formats + max size, DOC-04/05/17/21) and rejects non-compliant
 * files with errors citing the configured rules — checked against the real
 * selected file's actual extension and size.
 */
export function UploadOverlay({
  open,
  onOpenChange,
  document,
  settings,
  documentTypes,
  companies,
  mode = 'admin',
  onSubmit,
}: UploadOverlayProps) {
  const { role } = useRole()
  const isEdit = Boolean(document)
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  const uploadableCategories = useMemo(
    () => settings.activeCategories.filter((c) => settings.canUpload(role, c)),
    [settings, role]
  )

  const emptyDraft: UploadFormValues = useMemo(
    () => ({
      name: '',
      entityType: mode === 'self' ? 'Employee' : 'Company',
      entityName: mode === 'self' ? CURRENT_EMPLOYEE.name : '',
      company:
        mode === 'self' ? CURRENT_EMPLOYEE.company : (companies[0] ?? ''),
      category: uploadableCategories[0] ?? '',
      documentType: '',
      expiryDate: '',
    }),
    [mode, companies, uploadableCategories]
  )

  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: emptyDraft,
  })

  useEffect(() => {
    if (!open) return
    setFile(null)
    setFileError(null)
    form.reset(
      document
        ? {
            name: document.name,
            entityType: document.entityType,
            entityName: document.entityName,
            company: document.company,
            category: document.category,
            documentType: document.documentType,
            expiryDate: document.expiryDate ?? '',
          }
        : emptyDraft
    )
  }, [open, document, form, emptyDraft])

  /** Engine check: actual file type + size against the governed policy. */
  function validateFile(candidate: File): string | null {
    const { allowedFormats, maxSizeMb } = settings.policy
    const ext = (candidate.name.split('.').pop() ?? '').toUpperCase()
    if (!allowedFormats.includes(ext as DocumentFormat)) {
      return `Unsupported format ".${ext.toLowerCase()}". Allowed formats: ${allowedFormats.join(', ')}.`
    }
    if (candidate.size > maxSizeMb * 1024 * 1024) {
      return `File is ${(candidate.size / (1024 * 1024)).toFixed(2)} MB — the policy limit is ${maxSizeMb} MB.`
    }
    return null
  }

  function handleSubmit(values: UploadFormValues) {
    let fileName = document?.fileName ?? ''
    let format = document?.format ?? ('PDF' as DocumentFormat)
    let sizeKb = document?.sizeKb ?? 0

    if (!isEdit && !file) {
      setFileError('Choose a file to upload')
      return
    }
    if (file) {
      const error = validateFile(file)
      if (error) {
        setFileError(error)
        return
      }
      fileName = file.name
      format = (file.name.split('.').pop() ?? '').toUpperCase() as DocumentFormat
      sizeKb = Math.max(1, Math.round(file.size / 1024))
    }

    onSubmit({
      name: values.name,
      fileName,
      format,
      sizeKb,
      entityType: values.entityType,
      entityName: values.entityName,
      company: values.company,
      category: values.category,
      documentType: values.documentType,
      expiryDate: values.expiryDate || null,
    })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[460px]'>
        <SheetHeader className='border-grey-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            {isEdit ? 'Edit document' : 'Upload document'}
          </SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='flex min-h-0 flex-1 flex-col'
          >
            <div className='flex-1 space-y-4 overflow-y-auto px-5 py-5'>
              <div className='space-y-1.5'>
                <Label htmlFor='doc-file'>
                  File{' '}
                  <span className='text-paragraph-sm text-neutral-1000 font-normal'>
                    (max {settings.policy.maxSizeMb} MB ·{' '}
                    {settings.policy.allowedFormats.join(', ')})
                  </span>
                </Label>
                <Input
                  id='doc-file'
                  type='file'
                  onChange={(e) => {
                    const next = e.target.files?.[0] ?? null
                    setFile(next)
                    setFileError(next ? validateFile(next) : null)
                  }}
                />
                {isEdit && !file && (
                  <p className='text-paragraph-sm text-neutral-1000'>
                    Keeping existing file: {document?.fileName}
                  </p>
                )}
                {fileError && (
                  <p className='text-destructive text-sm font-medium'>
                    {fileError}
                  </p>
                )}
              </div>

              <UploadFields
                form={form}
                mode={mode}
                companies={companies}
                uploadableCategories={uploadableCategories}
                documentTypes={documentTypes}
              />
            </div>

            <div className='border-grey-200 flex items-center justify-end gap-3 border-t px-5 py-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>
                {isEdit ? 'Save changes' : 'Upload'}
              </Button>
            </div>
          </form>
        </Form>
      </FloatingSheetContent>
    </Sheet>
  )
}
