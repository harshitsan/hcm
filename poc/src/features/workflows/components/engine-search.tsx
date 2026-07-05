import { useState } from 'react'
import { MagnifyingGlass } from 'phosphor-react'
import { Button } from '@/components/ui/button'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

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
  const groups = [...new Set(entries.map((e) => e.group))]

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
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title='Find a setting'
        description='Search across every workflow-engine surface'
      >
        <CommandInput placeholder='Workflows, rules, chains, SLAs, settings…' />
        <CommandList>
          <CommandEmpty>No matching configuration.</CommandEmpty>
          {groups.map((group) => (
            <CommandGroup key={group} heading={group}>
              {entries
                .filter((e) => e.group === group)
                .map((e) => (
                  <CommandItem
                    key={e.id}
                    value={`${e.label} ${e.hint} ${e.group}`}
                    onSelect={() => {
                      setOpen(false)
                      onNavigate(e.target)
                    }}
                  >
                    <div className='flex min-w-0 flex-col'>
                      <span className='truncate'>{e.label}</span>
                      <span className='text-muted-foreground truncate text-xs'>
                        {e.hint}
                      </span>
                    </div>
                  </CommandItem>
                ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  )
}
