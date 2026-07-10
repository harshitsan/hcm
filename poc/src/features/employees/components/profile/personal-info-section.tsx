import { useState } from 'react'
import { Camera, Plus, Trash } from 'phosphor-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/utils/helpers'
import { AVATAR_PRESETS, type LanguageDraft } from '../../data/profile-extras'
import { type ProfileExtrasStore } from '../../hooks/use-profile-extras'
import { SectionTitle } from '../shared'

const emptyLanguage: LanguageDraft = {
  language: '',
  canRead: false,
  canWrite: false,
  canSpeak: false,
}

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/**
 * Kensium profile parity — personal info extras: profile photo (mock),
 * place of birth and known languages with read/write/speak abilities.
 */
export function PersonalInfoSection({
  store,
  name,
}: {
  store: ProfileExtrasStore
  name: string
}) {
  const [photoOpen, setPhotoOpen] = useState(false)
  const [photoPreset, setPhotoPreset] = useState(store.avatar.presetId)
  const [photoUrl, setPhotoUrl] = useState(store.avatar.imageUrl)
  const [langOpen, setLangOpen] = useState(false)
  const [langDraft, setLangDraft] = useState<LanguageDraft>(emptyLanguage)

  const activePreset =
    AVATAR_PRESETS.find((p) => p.id === store.avatar.presetId) ??
    AVATAR_PRESETS[0]

  const openPhoto = () => {
    setPhotoPreset(store.avatar.presetId)
    setPhotoUrl(store.avatar.imageUrl)
    setPhotoOpen(true)
  }

  const savePhoto = () => {
    store.updateAvatar({ presetId: photoPreset, imageUrl: photoUrl.trim() })
    setPhotoOpen(false)
  }

  const langValid =
    langDraft.language &&
    (langDraft.canRead || langDraft.canWrite || langDraft.canSpeak)

  const addLanguage = () => {
    if (!langValid) return
    store.addLanguage(langDraft)
    setLangDraft(emptyLanguage)
    setLangOpen(false)
  }

  return (
    <Card className='border-gray-200'>
      <CardContent className='space-y-4 pt-4'>
        <SectionTitle>My personal information</SectionTitle>

        <div className='flex items-center gap-4'>
          <Avatar className='h-16 w-16'>
            {store.avatar.imageUrl && (
              <AvatarImage src={store.avatar.imageUrl} alt={name} />
            )}
            <AvatarFallback
              className={cn('text-lg font-semibold', activePreset.className)}
            >
              {initials(name)}
            </AvatarFallback>
          </Avatar>
          <div className='space-y-1'>
            <p className='text-sm font-medium'>{name}</p>
            <Button variant='outline' size='sm' onClick={openPhoto}>
              <Camera size={14} />
              Upload photo
            </Button>
          </div>
        </div>

        <div className='space-y-1'>
          <Label>Place of birth</Label>
          <Input
            className='max-w-72'
            placeholder='City, State'
            value={store.placeOfBirth}
            onChange={(e) => store.setPlaceOfBirth(e.target.value)}
          />
        </div>

        <div className='flex items-center justify-between'>
          <SectionTitle>Languages I know</SectionTitle>
          <Button size='sm' onClick={() => setLangOpen(true)}>
            <Plus size={12} weight='bold' />
            Add language
          </Button>
        </div>
        {store.languages.length === 0 && (
          <p className='text-paragraph-sm text-neutral-1000'>
            No languages recorded yet.
          </p>
        )}
        <ul className='space-y-1.5'>
          {store.languages.map((l) => (
            <li
              key={l.id}
              className='flex items-center justify-between rounded-md border border-gray-200 px-3 py-1.5 text-sm'
            >
              <span className='flex items-center gap-2'>
                <span className='font-medium'>{l.language}</span>
                {l.canRead && <Badge variant='open'>Read</Badge>}
                {l.canWrite && <Badge variant='qualified'>Write</Badge>}
                {l.canSpeak && <Badge variant='completed'>Speak</Badge>}
              </span>
              <Button
                variant='icon2'
                className='h-7 w-7'
                aria-label='Remove language'
                onClick={() => store.removeLanguage(l.id)}
              >
                <Trash size={14} />
              </Button>
            </li>
          ))}
        </ul>

        {/* Mock photo picker — preset colour or pasted URL, no real upload. */}
        <Dialog open={photoOpen} onOpenChange={setPhotoOpen}>
          <DialogContent className='sm:max-w-[420px]'>
            <DialogHeader>
              <DialogTitle>Update profile photo</DialogTitle>
            </DialogHeader>
            <div className='space-y-3'>
              <div className='space-y-1'>
                <Label>Avatar style</Label>
                <div className='flex items-center gap-3'>
                  {AVATAR_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type='button'
                      onClick={() => setPhotoPreset(p.id)}
                      aria-label={`${p.label} avatar`}
                      className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-full border-2 text-sm font-semibold',
                        p.className,
                        photoPreset === p.id
                          ? 'border-blue-1400'
                          : 'border-transparent'
                      )}
                    >
                      {initials(name)}
                    </button>
                  ))}
                </div>
              </div>
              <div className='space-y-1'>
                <Label>Or paste an image URL</Label>
                <Input
                  placeholder='https://…'
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                />
              </div>
              <p className='text-paragraph-sm text-neutral-1000'>
                Frontend-only mock — no file is uploaded in the POC.
              </p>
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={() => setPhotoOpen(false)}>
                Cancel
              </Button>
              <Button onClick={savePhoto}>Save photo</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={langOpen} onOpenChange={setLangOpen}>
          <DialogContent className='sm:max-w-[420px]'>
            <DialogHeader>
              <DialogTitle>Add language</DialogTitle>
            </DialogHeader>
            <div className='space-y-3'>
              <div className='space-y-1'>
                <Label>Language</Label>
                <Input
                  placeholder='e.g. Hindi'
                  value={langDraft.language}
                  onChange={(e) =>
                    setLangDraft((d) => ({ ...d, language: e.target.value }))
                  }
                />
              </div>
              <div className='flex items-center gap-4'>
                {(
                  [
                    ['canRead', 'Read'],
                    ['canWrite', 'Write'],
                    ['canSpeak', 'Speak'],
                  ] as const
                ).map(([key, label]) => (
                  <label
                    key={key}
                    className='flex items-center gap-2 text-sm font-medium'
                  >
                    <Checkbox
                      checked={langDraft[key]}
                      onCheckedChange={(c) =>
                        setLangDraft((d) => ({ ...d, [key]: c === true }))
                      }
                    />
                    {label}
                  </label>
                ))}
              </div>
              <p className='text-paragraph-sm text-neutral-1000'>
                Select at least one ability — read, write or speak.
              </p>
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={() => setLangOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addLanguage} disabled={!langValid}>
                Add language
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
