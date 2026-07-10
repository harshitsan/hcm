import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { Requisition } from '../data/requisitions'
import type { CandidatesStore } from '../hooks/use-candidates'

const RELATIONSHIPS = [
  'Former colleague',
  'Current colleague',
  'Friend',
  'Family',
  'Professional network',
] as const

interface SubmitReferralDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  requisition: Requisition | null
  candidatesStore: CandidatesStore
  referrerName: string
}

/**
 * Employee referral against a posted vacancy — sources the referred person
 * into the talent pool with source "Referral", linked to the requisition.
 * Duplicate email/phone is rejected by the store with a warning toast.
 */
export function SubmitReferralDialog({
  open,
  onOpenChange,
  requisition,
  candidatesStore,
  referrerName,
}: SubmitReferralDialogProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [currentRole, setCurrentRole] = useState('')
  const [experience, setExperience] = useState('')
  const [resume, setResume] = useState('')
  const [relationship, setRelationship] = useState<string>(RELATIONSHIPS[0])
  const [notes, setNotes] = useState('')

  // Reset for a fresh referral each time the dialog opens
  useEffect(() => {
    if (open) {
      setName('')
      setEmail('')
      setPhone('')
      setCurrentRole('')
      setExperience('')
      setResume('')
      setRelationship(RELATIONSHIPS[0])
      setNotes('')
    }
  }, [open])

  const valid =
    name.trim().length >= 2 &&
    email.includes('@') &&
    phone.trim().length >= 8 &&
    resume.trim().length >= 4

  const submit = () => {
    if (!requisition) return
    const created = candidatesStore.addCandidate({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      currentRole:
        currentRole.trim() ||
        `${experience || '?'} yrs experience (referred by ${referrerName})`,
      skills: [],
      source: 'Referral',
      folders: [],
      resume: resume.trim(),
      linkedRequisitionId: requisition.id,
    })
    // Duplicate email/phone → store toasts the duplicate warning and returns
    // null; keep the dialog open so the referrer can correct the details.
    if (!created) return
    toast.success(`Referral submitted for ${requisition.title}`)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[440px]'>
        <DialogHeader>
          <DialogTitle>Refer a candidate — {requisition?.title}</DialogTitle>
        </DialogHeader>
        <div className='space-y-3'>
          <div>
            <p className='mb-1 text-sm font-medium'>Candidate name</p>
            <Input
              placeholder='Asha Pillai'
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className='grid grid-cols-2 gap-3'>
            <div>
              <p className='mb-1 text-sm font-medium'>Email</p>
              <Input
                type='email'
                placeholder='asha@mail.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <p className='mb-1 text-sm font-medium'>Phone</p>
              <Input
                placeholder='+91 98xxx xxxxx'
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>
          <div className='grid grid-cols-2 gap-3'>
            <div>
              <p className='mb-1 text-sm font-medium'>Current role</p>
              <Input
                placeholder='Backend Engineer @ Acme'
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value)}
              />
            </div>
            <div>
              <p className='mb-1 text-sm font-medium'>Experience (years)</p>
              <Input
                type='number'
                min={0}
                placeholder='5'
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
              />
            </div>
          </div>
          <div>
            <p className='mb-1 text-sm font-medium'>Resume file</p>
            <Input
              placeholder='asha-pillai-resume.pdf'
              value={resume}
              onChange={(e) => setResume(e.target.value)}
            />
          </div>
          <div>
            <p className='mb-1 text-sm font-medium'>Relationship to candidate</p>
            <Select value={relationship} onValueChange={setRelationship}>
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIPS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className='mb-1 text-sm font-medium'>Notes for the recruiter</p>
            <Textarea
              placeholder='Why is this person a strong fit?'
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <p className='text-paragraph-sm text-neutral-1000'>
            Submitted as {referrerName} · {relationship.toLowerCase()} — the
            recruiter sees the referral in the talent pool with source
            “Referral”.
          </p>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!valid} onClick={submit}>
            Submit referral
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
