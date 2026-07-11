import { useMemo, useState, useSyncExternalStore } from 'react'
import { Lightbulb, Trash } from 'phosphor-react'
import { toast } from 'sonner'
import { useRole } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  getSnapshot,
  subscribe,
} from '@/features/workflows/hooks/use-business-logic'
import { type AnnouncementSettingsStore } from '../hooks/use-announcement-settings'
import { todayIso } from '../utils/audience'

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

/** The Kensium catalog artifact this surface consumes (Organization > Add a new thought of the day). */
const THOUGHT_ARTIFACT_ID = 'kx-084'

/**
 * Live view of engine artifact kx-084 from the shared business-logic store —
 * the setting is authored/governed in the engine; this module only consumes
 * it (WFE-49).
 */
function useThoughtArtifact() {
  const artifacts = useSyncExternalStore(subscribe, getSnapshot)
  return artifacts.find((a) => a.id === THOUGHT_ARTIFACT_ID) ?? null
}

/** Effectively active only when every scope layer enables it (global → company). */
function artifactEnabled(scopes: Record<string, boolean> | undefined): boolean {
  if (!scopes) return false
  return Object.values(scopes).every(Boolean)
}

interface ThoughtOfTheDayCardProps {
  settings: AnnouncementSettingsStore
}

/**
 * "Thought of the day" feed card (kx-084): shows the latest thought published
 * on or before today, only while the engine artifact is enabled at every
 * scope level.
 */
export function ThoughtOfTheDayCard({ settings }: ThoughtOfTheDayCardProps) {
  const { role } = useRole()
  const artifact = useThoughtArtifact()

  const thought = useMemo(() => {
    const today = todayIso()
    return (
      [...settings.thoughts]
        .filter((t) => t.date <= today)
        .sort((a, b) => b.date.localeCompare(a.date))[0] ?? null
    )
  }, [settings.thoughts])

  // Non-users have no system access — the feed shows a blocked panel instead.
  if (role === 'Employee (Non-User)') return null
  if (!artifact || !artifactEnabled(artifact.scopes) || !thought) return null

  return (
    <div className='bg-blue-150 mb-3 rounded-[8px] border border-gray-200 px-4 py-3'>
      <div className='flex items-center gap-2'>
        <Lightbulb size={16} className='text-blue-1400' weight='fill' />
        <p className='text-blue-1400 text-sm font-medium'>Thought of the day</p>
      </div>
      <p className='text-neutral-1600 mt-1 text-sm'>“{thought.text}”</p>
      <p className='text-paragraph-sm text-neutral-1000 mt-0.5'>
        Shared by {thought.author} · {dateFmt.format(new Date(thought.date))}
      </p>
    </div>
  )
}

interface ThoughtOfTheDayAdminProps {
  settings: AnnouncementSettingsStore
}

/**
 * Admin surface for kx-084: reflects the governed engine artifact (version,
 * enablement, last update) and manages the dated thought entries the feed
 * card publishes. One entry per date — saving a duplicate date replaces it.
 */
export function ThoughtOfTheDayAdmin({ settings }: ThoughtOfTheDayAdminProps) {
  const artifact = useThoughtArtifact()
  const [date, setDate] = useState(todayIso())
  const [text, setText] = useState('')

  const enabled = artifactEnabled(artifact?.scopes)
  const sorted = [...settings.thoughts].sort((a, b) =>
    b.date.localeCompare(a.date)
  )

  const save = () => {
    if (!date) {
      toast.error('Pick the date the thought publishes on')
      return
    }
    if (!text.trim()) {
      toast.error('Write the thought of the day before saving')
      return
    }
    settings.saveThought({ date, text: text.trim() })
    setText('')
  }

  return (
    <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
        <div>
          <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
            Thought of the day ({sorted.length})
          </h2>
          <p className='text-paragraph-sm text-neutral-1000'>
            {artifact
              ? `Governed by engine artifact ${artifact.id} “${artifact.name}” (v${artifact.version}) — last updated ${dateFmt.format(new Date(artifact.updatedAt))} by ${artifact.updatedBy}. Manage its scopes from Workflows.`
              : 'Engine artifact kx-084 was not found in the catalog.'}
          </p>
        </div>
        <Badge variant={enabled ? 'badge_active' : 'badge_inactive'}>
          {enabled ? 'Enabled' : 'Disabled'}
        </Badge>
      </div>

      {!enabled && (
        <p className='text-paragraph-sm text-neutral-1000 mb-3'>
          The artifact is disabled at one or more scope levels, so the feed
          card is suppressed for employees. Entries below are retained.
        </p>
      )}

      <div className='mb-3 flex flex-wrap items-center gap-2'>
        <Input
          type='date'
          value={date}
          onChange={(e) => setDate(e.target.value)}
          aria-label='Publish date'
          className='h-7 w-[140px]'
        />
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              save()
            }
          }}
          placeholder='e.g. Small daily improvements are the key to staggering long-term results.'
          className='h-7 w-[360px] max-w-full flex-1'
        />
        <Button className='h-7 rounded-[6px] px-2.5' onClick={save}>
          Save thought
        </Button>
      </div>

      <div className='overflow-hidden rounded-[8px] border border-gray-200'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Publish date</TableHead>
              <TableHead>Thought</TableHead>
              <TableHead>Added by</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className='text-neutral-1000 py-8 text-center text-sm'
                >
                  No thoughts recorded yet — add the first one above.
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className='text-neutral-1900 text-sm'>
                    <span className='flex items-center gap-1.5'>
                      {dateFmt.format(new Date(t.date))}
                      {t.date === todayIso() && (
                        <Badge variant='badge_active'>Today</Badge>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className='text-neutral-1600 max-w-[420px] truncate text-sm'>
                    {t.text}
                  </TableCell>
                  <TableCell className='text-neutral-1000 text-sm'>
                    {t.author}
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center justify-end'>
                      <Button
                        variant='icon2'
                        className='text-neutral-1900 h-7 w-7'
                        aria-label={`Delete thought for ${t.date}`}
                        onClick={() => settings.deleteThought(t.id)}
                      >
                        <Trash size={14} weight='bold' />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
