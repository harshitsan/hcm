import { useMemo, useState } from 'react'
import { MagnifyingGlass } from 'phosphor-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

/** Where a search hit lives: top-level tab, optional classic-admin sub-tab,
    and an optional query to pre-filter the Configure catalog. */
export interface SearchTarget {
  top: string
  admin?: string
  catalogQuery?: string
}

export interface SearchEntry {
  id: string
  label: string
  hint: string
  group: string
  target: SearchTarget
}

const MAX_RESULTS = 30

/**
 * Relevance scoring with names ranked first: an entry whose NAME matches the
 * query always outranks one that only mentions it in its hint or group —
 * searching "leave" surfaces the leave-named workflows before templates that
 * merely reference leave.
 */
function score(entry: SearchEntry, q: string): number {
  const label = entry.label.toLowerCase()
  if (label.startsWith(q)) return 4
  if (label.split(/[\s—·/-]+/).some((w) => w.startsWith(q))) return 3.5
  if (label.includes(q)) return 3
  if (entry.hint.toLowerCase().includes(q)) return 2
  if (entry.group.toLowerCase().includes(q)) return 1
  return 0
}

/**
 * One search box over every workflow-engine surface — artifacts, approval
 * workflows, routing rules, approver chains, SLAs, settings, history —
 * so nothing has to be remembered by tab location (the "where do I find
 * attendance rules?" fix). Selecting a result navigates to its surface.
 */
export function EngineSearch({
  entries,
  onNavigate,
}: {
  entries: SearchEntry[]
  onNavigate: (target: SearchTarget) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()

  /** Ranked results: name matches first, then hint, then group mentions. */
  const results = useMemo(() => {
    if (q === '') return null
    return entries
      .map((e) => ({ entry: e, s: score(e, q) }))
      .filter((r) => r.s > 0)
      .sort(
        (a, b) => b.s - a.s || a.entry.label.localeCompare(b.entry.label)
      )
      .slice(0, MAX_RESULTS)
      .map((r) => r.entry)
  }, [entries, q])

  const groups = [...new Set(entries.map((e) => e.group))]

  const pick = (e: SearchEntry) => {
    setOpen(false)
    setQuery('')
    onNavigate(e.target)
  }

  const item = (e: SearchEntry, showGroup: boolean) => (
    <CommandItem key={e.id} value={e.id} onSelect={() => pick(e)}>
      <div className='flex min-w-0 flex-col'>
        <span className='truncate'>{e.label}</span>
        <span className='text-muted-foreground truncate text-xs'>
          {showGroup ? `${e.hint} · ${e.group}` : e.hint}
        </span>
      </div>
    </CommandItem>
  )

  return (
    <>
      <Button
        variant='outline'
        className='text-neutral-1000 h-7 gap-1.5 font-normal'
        onClick={() => setOpen(true)}
      >
        <MagnifyingGlass size={13} />
        Find any setting…
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) setQuery('')
        }}
      >
        <DialogHeader className='sr-only'>
          <DialogTitle>Find a setting</DialogTitle>
          <DialogDescription>
            Search across every workflow-engine surface
          </DialogDescription>
        </DialogHeader>
        <DialogContent className='overflow-hidden p-0'>
          {/* Filtering and ranking are handled here (name matches first),
              so cmdk's own fuzzy matcher is switched off. */}
          <Command
            shouldFilter={false}
            className='[&_[cmdk-group-heading]]:text-muted-foreground **:data-[slot=command-input-wrapper]:h-12 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5'
          >
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder='Workflows, rules, chains, SLAs, settings…'
            />
            <CommandList>
              {results !== null ? (
                results.length === 0 ? (
                  <CommandEmpty>No matching configuration.</CommandEmpty>
                ) : (
                  <CommandGroup heading={`Best matches for "${query.trim()}"`}>
                    {results.map((e) => item(e, true))}
                  </CommandGroup>
                )
              ) : (
                groups.map((group) => (
                  <CommandGroup key={group} heading={group}>
                    {entries
                      .filter((e) => e.group === group)
                      .map((e) => item(e, false))}
                  </CommandGroup>
                ))
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  )
}
