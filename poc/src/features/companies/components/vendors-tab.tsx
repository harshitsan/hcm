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
import { Switch } from '@/components/ui/switch'
import {
  VENDOR_CATEGORIES,
  type Vendor,
  type VendorCategory,
} from '../data/org-config'
import { type OrgConfigStore } from '../hooks/use-org-config'

interface VendorsTabProps {
  store: OrgConfigStore
}

/**
 * Configuration → Organization → Vendor. Dedicated vendor configuration
 * screen — browse, add, edit, activate/deactivate and delete vendor records
 * for the organization.
 */
export function VendorsTab({ store }: VendorsTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Vendor | null>(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState<VendorCategory>('IT services')
  const [contactPerson, setContactPerson] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [pendingDelete, setPendingDelete] = useState<Vendor | null>(null)

  const openNew = () => {
    setEditing(null)
    setName('')
    setCategory('IT services')
    setContactPerson('')
    setEmail('')
    setPhone('')
    setDialogOpen(true)
  }

  const openEdit = (vendor: Vendor) => {
    setEditing(vendor)
    setName(vendor.name)
    setCategory(vendor.category)
    setContactPerson(vendor.contactPerson)
    setEmail(vendor.email)
    setPhone(vendor.phone)
    setDialogOpen(true)
  }

  const submit = () => {
    if (!name.trim() || !contactPerson.trim()) {
      toast.error('Vendor name and contact person are required')
      return
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Enter a valid contact email address')
      return
    }
    const draft = {
      name: name.trim(),
      category,
      contactPerson: contactPerson.trim(),
      email: email.trim(),
      phone: phone.trim(),
      status: editing?.status ?? ('Active' as const),
    }
    if (editing) store.updateVendor(editing.id, draft)
    else store.addVendor(draft)
    setDialogOpen(false)
  }

  return (
    <div className='w-full space-y-4'>
      <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
        <div className='mb-3 flex items-center justify-between'>
          <div>
            <h3 className='text-neutral-1600 text-sm font-medium'>
              Vendors ({store.vendors.length})
            </h3>
            <p className='text-neutral-1000 text-xs'>
              Vendor records referenced by assets, staffing and facility
              workflows across the organization.
            </p>
          </div>
          <Button className='h-7' onClick={openNew}>
            New vendor
          </Button>
        </div>

        <div className='overflow-hidden rounded-[6px] border border-gray-200'>
          <div className='text-paragraph-sm text-neutral-1000 grid grid-cols-[1fr_120px_140px_170px_130px_80px_130px] gap-2 border-b border-gray-200 bg-neutral-100 px-3 py-2 font-medium'>
            <span>Vendor</span>
            <span>Category</span>
            <span>Contact person</span>
            <span>Email</span>
            <span>Phone</span>
            <span>Active</span>
            <span className='text-right'>Actions</span>
          </div>
          {store.vendors.length === 0 && (
            <p className='text-neutral-1000 px-3 py-4 text-sm'>
              No vendors configured yet.
            </p>
          )}
          {store.vendors.map((v) => (
            <div
              key={v.id}
              className='grid grid-cols-[1fr_120px_140px_170px_130px_80px_130px] items-center gap-2 border-b border-gray-100 px-3 py-2 text-sm last:border-b-0'
            >
              <span className='flex items-center gap-2'>
                <span className='text-neutral-1600 font-medium'>{v.name}</span>
                <Badge variant={v.status === 'Active' ? 'open' : 'dropped'}>
                  {v.status}
                </Badge>
              </span>
              <span className='text-neutral-1000'>{v.category}</span>
              <span className='text-neutral-1000'>{v.contactPerson}</span>
              <span className='text-neutral-1000 truncate' title={v.email}>
                {v.email || '—'}
              </span>
              <span className='text-neutral-1000'>{v.phone || '—'}</span>
              <span>
                <Switch
                  checked={v.status === 'Active'}
                  onCheckedChange={() => store.toggleVendorStatus(v.id)}
                />
              </span>
              <span className='flex justify-end gap-2'>
                <Button
                  variant='outline'
                  className='h-7 px-2 text-xs'
                  onClick={() => openEdit(v)}
                >
                  Edit
                </Button>
                <Button
                  variant='outline'
                  className='text-destructive h-7 px-2 text-xs'
                  onClick={() => setPendingDelete(v)}
                >
                  Delete
                </Button>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* New / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? `Edit ${editing.name}` : 'New vendor'}
            </DialogTitle>
            <DialogDescription>
              Vendor master record for the organization.
            </DialogDescription>
          </DialogHeader>
          <div className='grid grid-cols-2 gap-3'>
            <div className='space-y-1'>
              <Label className='text-paragraph-sm'>Vendor name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className='space-y-1'>
              <Label className='text-paragraph-sm'>Category</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as VendorCategory)}
              >
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VENDOR_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-1'>
              <Label className='text-paragraph-sm'>Contact person *</Label>
              <Input
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
              />
            </div>
            <div className='space-y-1'>
              <Label className='text-paragraph-sm'>Email</Label>
              <Input
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className='space-y-1'>
              <Label className='text-paragraph-sm'>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit}>
              {editing ? 'Save changes' : 'Add vendor'}
            </Button>
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
              Delete vendor “{pendingDelete?.name}”?
            </AlertDialogTitle>
            <AlertDialogDescription>
              The vendor record is permanently removed from the organization
              configuration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className='bg-destructive hover:bg-destructive/90 text-white'
              onClick={() => {
                if (pendingDelete) store.deleteVendor(pendingDelete.id)
                setPendingDelete(null)
              }}
            >
              Delete vendor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
