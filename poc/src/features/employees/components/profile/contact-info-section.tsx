import { useState } from 'react'
import { PencilSimple, Plus, Trash } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
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
import {
  EMERGENCY_RELATIONSHIPS,
  type ContactInfo,
  type EmergencyContact,
  type EmergencyContactDraft,
  type EmergencyRelationship,
} from '../../data/profile-extras'
import { type ProfileExtrasStore } from '../../hooks/use-profile-extras'
import { InfoField, SectionTitle } from '../shared'

const emptyContact: EmergencyContactDraft = {
  name: '',
  relationship: 'Spouse',
  phone: '',
  email: '',
}

/**
 * Kensium profile parity — structured contact & address details with an edit
 * dialog, plus the emergency contacts list (add / edit / delete).
 */
export function ContactInfoSection({ store }: { store: ProfileExtrasStore }) {
  const [editOpen, setEditOpen] = useState(false)
  const [draft, setDraft] = useState<ContactInfo>(store.contactInfo)
  const [contactOpen, setContactOpen] = useState(false)
  const [editingContactId, setEditingContactId] = useState<string | null>(null)
  const [contactDraft, setContactDraft] =
    useState<EmergencyContactDraft>(emptyContact)

  const set = (patch: Partial<ContactInfo>) =>
    setDraft((d) => ({ ...d, ...patch }))

  const openEdit = () => {
    setDraft(store.contactInfo)
    setEditOpen(true)
  }

  const contactValid =
    draft.addressLine1 && draft.city && draft.country && draft.personalPhone

  const saveContactInfo = () => {
    if (!contactValid) return
    store.updateContactInfo(draft)
    setEditOpen(false)
  }

  const openNewContact = () => {
    setEditingContactId(null)
    setContactDraft(emptyContact)
    setContactOpen(true)
  }

  const openEditContact = (entry: EmergencyContact) => {
    const { id: _id, ...rest } = entry
    setEditingContactId(entry.id)
    setContactDraft({ ...emptyContact, ...rest })
    setContactOpen(true)
  }

  const emergencyValid = contactDraft.name && contactDraft.phone

  const saveEmergencyContact = () => {
    if (!emergencyValid) return
    if (editingContactId)
      store.updateEmergencyContact(editingContactId, contactDraft)
    else store.addEmergencyContact(contactDraft)
    setContactOpen(false)
  }

  const c = store.contactInfo

  return (
    <Card className='border-gray-200'>
      <CardContent className='space-y-4 pt-4'>
        <div className='flex items-center justify-between'>
          <SectionTitle>My contact & address</SectionTitle>
          <Button variant='outline' size='sm' onClick={openEdit}>
            <PencilSimple size={14} />
            Edit details
          </Button>
        </div>

        <div className='grid grid-cols-2 gap-4'>
          <InfoField label='Address line 1' value={c.addressLine1} />
          <InfoField label='Address line 2' value={c.addressLine2} />
          <InfoField label='City' value={c.city} />
          <InfoField label='State' value={c.state} />
          <InfoField label='Country' value={c.country} />
          <InfoField label='PIN / Zip' value={c.pinZip} />
          <InfoField label='Personal email' value={c.personalEmail} />
          <InfoField label='Personal phone' value={c.personalPhone} />
          <InfoField label='Work email' value={c.workEmail} />
          <InfoField label='Work phone' value={c.workPhone} />
        </div>

        <div className='flex items-center justify-between'>
          <SectionTitle>Emergency contacts</SectionTitle>
          <Button size='sm' onClick={openNewContact}>
            <Plus size={12} weight='bold' />
            Add contact
          </Button>
        </div>
        {store.emergencyContacts.length === 0 && (
          <p className='text-paragraph-sm text-neutral-1000'>
            No emergency contacts recorded yet.
          </p>
        )}
        <ul className='space-y-1.5'>
          {store.emergencyContacts.map((e) => (
            <li
              key={e.id}
              className='flex items-center justify-between rounded-md border border-gray-200 px-3 py-1.5 text-sm'
            >
              <span className='flex items-center gap-2'>
                <span className='font-medium'>{e.name}</span>
                <Badge variant='open'>{e.relationship}</Badge>
                <span className='text-neutral-1000'>
                  {e.phone}
                  {e.email ? ` · ${e.email}` : ''}
                </span>
              </span>
              <span className='flex items-center gap-1'>
                <Button
                  variant='icon2'
                  className='h-7 w-7'
                  aria-label='Edit emergency contact'
                  onClick={() => openEditContact(e)}
                >
                  <PencilSimple size={14} />
                </Button>
                <Button
                  variant='icon2'
                  className='h-7 w-7'
                  aria-label='Remove emergency contact'
                  onClick={() => store.removeEmergencyContact(e.id)}
                >
                  <Trash size={14} />
                </Button>
              </span>
            </li>
          ))}
        </ul>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className='sm:max-w-[560px]'>
            <DialogHeader>
              <DialogTitle>Edit contact & address</DialogTitle>
            </DialogHeader>
            <div className='grid grid-cols-2 gap-3'>
              <div className='col-span-2 space-y-1'>
                <Label>Address line 1</Label>
                <Input
                  value={draft.addressLine1}
                  onChange={(e) => set({ addressLine1: e.target.value })}
                />
              </div>
              <div className='col-span-2 space-y-1'>
                <Label>Address line 2</Label>
                <Input
                  value={draft.addressLine2}
                  onChange={(e) => set({ addressLine2: e.target.value })}
                />
              </div>
              <div className='space-y-1'>
                <Label>City</Label>
                <Input
                  value={draft.city}
                  onChange={(e) => set({ city: e.target.value })}
                />
              </div>
              <div className='space-y-1'>
                <Label>State</Label>
                <Input
                  value={draft.state}
                  onChange={(e) => set({ state: e.target.value })}
                />
              </div>
              <div className='space-y-1'>
                <Label>Country</Label>
                <Input
                  value={draft.country}
                  onChange={(e) => set({ country: e.target.value })}
                />
              </div>
              <div className='space-y-1'>
                <Label>PIN / Zip</Label>
                <Input
                  value={draft.pinZip}
                  onChange={(e) => set({ pinZip: e.target.value })}
                />
              </div>
              <div className='space-y-1'>
                <Label>Personal email</Label>
                <Input
                  type='email'
                  value={draft.personalEmail}
                  onChange={(e) => set({ personalEmail: e.target.value })}
                />
              </div>
              <div className='space-y-1'>
                <Label>Personal phone</Label>
                <Input
                  value={draft.personalPhone}
                  onChange={(e) => set({ personalPhone: e.target.value })}
                />
              </div>
              <div className='space-y-1'>
                <Label>Work email</Label>
                <Input
                  type='email'
                  value={draft.workEmail}
                  onChange={(e) => set({ workEmail: e.target.value })}
                />
              </div>
              <div className='space-y-1'>
                <Label>Work phone</Label>
                <Input
                  value={draft.workPhone}
                  onChange={(e) => set({ workPhone: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveContactInfo} disabled={!contactValid}>
                Save details
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={contactOpen} onOpenChange={setContactOpen}>
          <DialogContent className='sm:max-w-[420px]'>
            <DialogHeader>
              <DialogTitle>
                {editingContactId
                  ? 'Edit Emergency Contact'
                  : 'Add Emergency Contact'}
              </DialogTitle>
            </DialogHeader>
            <div className='space-y-3'>
              <div className='space-y-1'>
                <Label>Name</Label>
                <Input
                  value={contactDraft.name}
                  onChange={(e) =>
                    setContactDraft((d) => ({ ...d, name: e.target.value }))
                  }
                />
              </div>
              <div className='space-y-1'>
                <Label>Relationship</Label>
                <Select
                  value={contactDraft.relationship}
                  onValueChange={(v) =>
                    setContactDraft((d) => ({
                      ...d,
                      relationship: v as EmergencyRelationship,
                    }))
                  }
                >
                  <SelectTrigger variant='secondary' className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EMERGENCY_RELATIONSHIPS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-1'>
                <Label>Phone</Label>
                <Input
                  value={contactDraft.phone}
                  onChange={(e) =>
                    setContactDraft((d) => ({ ...d, phone: e.target.value }))
                  }
                />
              </div>
              <div className='space-y-1'>
                <Label>Email (optional)</Label>
                <Input
                  type='email'
                  value={contactDraft.email ?? ''}
                  onChange={(e) =>
                    setContactDraft((d) => ({ ...d, email: e.target.value }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={() => setContactOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveEmergencyContact} disabled={!emergencyValid}>
                {editingContactId ? 'Save changes' : 'Add contact'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
