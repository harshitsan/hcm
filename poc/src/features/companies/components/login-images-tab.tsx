import { useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { IMAGE_TYPES, type ImageType, type LoginImage } from '../data/org-config'
import { type OrgConfigStore } from '../hooks/use-org-config'

interface LoginImagesTabProps {
  store: OrgConfigStore
  /** LPI-04 — Save & Continue advances to the next setup step. */
  onContinue: () => void
}

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

/**
 * Configuration → Organization → Login Page Images. Upload branded wallpaper
 * images with an image-type selector, delete outdated ones, and Save &
 * Continue to the next setup step.
 */
export function LoginImagesTab({ store, onContinue }: LoginImagesTabProps) {
  const [uploadOpen, setUploadOpen] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<ImageType>('Wallpapers')
  const [fileName, setFileName] = useState('')
  const [sizeKb, setSizeKb] = useState(0)
  const [pendingDelete, setPendingDelete] = useState<LoginImage | null>(null)

  const resetForm = () => {
    setName('')
    setType('Wallpapers')
    setFileName('')
    setSizeKb(0)
  }

  const upload = () => {
    if (!name.trim() || !fileName) {
      toast.error('Provide an image name and choose an image file')
      return
    }
    store.addLoginImage({ name: name.trim(), type, fileName, sizeKb })
    setUploadOpen(false)
    resetForm()
  }

  const saveAndContinue = () => {
    toast.success(
      `Login page branding saved — ${store.loginImages.length} image${store.loginImages.length === 1 ? '' : 's'} configured`
    )
    onContinue()
  }

  return (
    <div className='w-full space-y-4'>
      <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
        <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
          <div>
            <h3 className='text-neutral-1600 text-sm font-medium'>
              Login Page Images
            </h3>
            <p className='text-neutral-1000 text-xs'>
              Uploaded wallpapers rotate on the sign-in screen; the correct
              context is picked from the image type.
            </p>
          </div>
          <Button className='h-7' onClick={() => setUploadOpen(true)}>
            Upload image
          </Button>
        </div>

        <div className='overflow-hidden rounded-[6px] border border-gray-200'>
          <div className='text-paragraph-sm text-neutral-1000 grid grid-cols-[1fr_140px_120px_120px_130px_90px] gap-2 border-b border-gray-200 bg-neutral-100 px-3 py-2 font-medium'>
            <span>Image</span>
            <span>Type</span>
            <span>File size</span>
            <span>Uploaded on</span>
            <span>Uploaded by</span>
            <span className='text-right'>Actions</span>
          </div>
          {store.loginImages.length === 0 && (
            <p className='text-neutral-1000 px-3 py-4 text-sm'>
              No login page images uploaded yet.
            </p>
          )}
          {store.loginImages.map((img) => (
            <div
              key={img.id}
              className='grid grid-cols-[1fr_140px_120px_120px_130px_90px] items-center gap-2 border-b border-gray-100 px-3 py-2 text-sm last:border-b-0'
            >
              <span>
                <span className='text-neutral-1600 font-medium'>{img.name}</span>
                <span className='text-neutral-1000 ml-2 text-xs'>
                  {img.fileName}
                </span>
              </span>
              <span>
                <Badge variant={img.type === 'Wallpapers' ? 'open' : 'outline'}>
                  {img.type}
                </Badge>
              </span>
              <span className='text-neutral-1000'>{img.sizeKb} KB</span>
              <span className='text-neutral-1000'>
                {dateFmt.format(new Date(img.uploadedOn))}
              </span>
              <span className='text-neutral-1000 truncate' title={img.uploadedBy}>
                {img.uploadedBy}
              </span>
              <span className='text-right'>
                <Button
                  variant='outline'
                  className='text-destructive h-7 px-2 text-xs'
                  onClick={() => setPendingDelete(img)}
                >
                  Delete
                </Button>
              </span>
            </div>
          ))}
        </div>

        <div className='mt-4 flex justify-end'>
          <Button className='h-7' onClick={saveAndContinue}>
            Save &amp; Continue to next step
          </Button>
        </div>
      </div>

      {/* Upload dialog */}
      <Dialog
        open={uploadOpen}
        onOpenChange={(open) => {
          setUploadOpen(open)
          if (!open) resetForm()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload login page image</DialogTitle>
            <DialogDescription>
              Choose the image type so the file is used in the correct context
              on the login screen.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1'>
              <Label className='text-paragraph-sm'>Image name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='e.g. Summer campus wallpaper'
              />
            </div>
            <div className='space-y-1'>
              <Label className='text-paragraph-sm'>Image type *</Label>
              <Select value={type} onValueChange={(v) => setType(v as ImageType)}>
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IMAGE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-1'>
              <Label className='text-paragraph-sm'>Image file *</Label>
              <Input
                type='file'
                accept='image/*'
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  setFileName(file?.name ?? '')
                  setSizeKb(file ? Math.max(1, Math.round(file.size / 1024)) : 0)
                }}
              />
              {fileName && (
                <p className='text-neutral-1000 text-xs'>
                  {fileName} · {sizeKb} KB (stored in-memory for this demo)
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setUploadOpen(false)}>
              Cancel
            </Button>
            <Button onClick={upload}>Upload</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete “{pendingDelete?.name}”?
            </AlertDialogTitle>
            <AlertDialogDescription>
              The image is removed from the login page rotation immediately.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className='bg-destructive hover:bg-destructive/90 text-white'
              onClick={() => {
                if (pendingDelete) store.deleteLoginImage(pendingDelete.id)
                setPendingDelete(null)
              }}
            >
              Delete image
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
