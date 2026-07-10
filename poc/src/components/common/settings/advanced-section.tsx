import { useState } from 'react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { CaretRight } from 'phosphor-react'
import { cn } from '@/utils/helpers'

interface AdvancedSectionProps {
  count?: number
  defaultOpen?: boolean
  children: React.ReactNode
}

export function AdvancedSection({
  count,
  defaultOpen = false,
  children,
}: AdvancedSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  const label = count !== undefined ? `Advanced (${count} settings)` : 'Advanced'

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className='flex items-center gap-1.5 text-paragraph-sm text-neutral-1000 hover:text-neutral-1400 transition-colors select-none cursor-pointer py-2'>
        <CaretRight
          size={14}
          weight='bold'
          className={cn('transition-transform duration-200', open && 'rotate-90')}
        />
        <span>{label}</span>
      </CollapsibleTrigger>
      <CollapsibleContent className='pt-2'>{children}</CollapsibleContent>
    </Collapsible>
  )
}
