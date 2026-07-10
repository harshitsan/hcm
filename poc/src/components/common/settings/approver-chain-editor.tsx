import { useState } from 'react'
import { CaretLeft, CaretRight, Plus, X } from 'phosphor-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

export interface ApproverStep {
  id: string
  label: string
  kind: 'role' | 'person' | 'group'
  avatarUrl?: string
  meta?: string
}

export interface ApproverChainEditorProps {
  title: string
  steps: ApproverStep[]
  onChange: (s: ApproverStep[]) => void
  stepOptions: ApproverStep[]
  maxSteps?: number
  readOnly?: boolean
}

function AvatarAbbr({ label }: { label: string }) {
  const initials = label
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
  return (
    <span className='inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700 flex-shrink-0'>
      {initials}
    </span>
  )
}

export function ApproverChainEditor({
  title,
  steps,
  onChange,
  stepOptions,
  maxSteps = 5,
  readOnly = false,
}: ApproverChainEditorProps) {
  const [pickerOpen, setPickerOpen] = useState(false)

  const moveLeft = (index: number) => {
    if (index === 0) return
    const next = [...steps]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    onChange(next)
  }

  const moveRight = (index: number) => {
    if (index === steps.length - 1) return
    const next = [...steps]
    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
    onChange(next)
  }

  const remove = (index: number) => {
    onChange(steps.filter((_, i) => i !== index))
  }

  const addStep = (option: ApproverStep) => {
    if (steps.length >= maxSteps) return
    // Clone with a unique id so the same option can be added twice without
    // colliding on React keys.
    const id = steps.some((s) => s.id === option.id)
      ? `${option.id}-${Date.now().toString(36)}`
      : option.id
    onChange([...steps, { ...option, id }])
    setPickerOpen(false)
  }

  const canAdd = !readOnly && steps.length < maxSteps

  if (steps.length === 0 && !readOnly) {
    return (
      <div className='mb-4'>
        <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>
          {title}
        </h3>
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <button className='w-full rounded-[8px] border-2 border-dashed border-gray-200 p-4 text-center text-sm text-neutral-1000 hover:border-gray-300 hover:text-neutral-1400 transition-colors'>
              + Add first approver
            </button>
          </PopoverTrigger>
          <PopoverContent className='w-[220px] p-0' align='start'>
            <Command>
              <CommandInput placeholder='Search roles...' />
              <CommandList>
                <CommandEmpty>No options found.</CommandEmpty>
                <CommandGroup>
                  {stepOptions.map((opt) => (
                    <CommandItem key={opt.id} onSelect={() => addStep(opt)}>
                      {opt.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    )
  }

  return (
    <div className='mb-4'>
      <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>
        {title}
      </h3>
      <div className='flex items-center gap-2 overflow-x-auto pb-1'>
        {steps.map((step, i) => (
          <div key={step.id} className='flex items-center gap-2 flex-shrink-0'>
            <div className='rounded-[8px] border border-gray-200 bg-white p-2 flex flex-col gap-1 min-w-[140px]'>
              <div className='flex items-center gap-1.5'>
                <AvatarAbbr label={step.label} />
                <span className='text-sm font-medium text-neutral-1400 truncate'>
                  {step.label}
                </span>
              </div>
              {step.meta && (
                <p className='text-xs text-neutral-1000 truncate'>{step.meta}</p>
              )}
              {!readOnly && (
                <div className='flex items-center gap-0.5 mt-0.5'>
                  <Button
                    variant='ghost'
                    className='h-5 px-1'
                    disabled={i === 0}
                    onClick={() => moveLeft(i)}
                    aria-label='Move left'
                  >
                    <CaretLeft size={12} />
                  </Button>
                  <Button
                    variant='ghost'
                    className='h-5 px-1'
                    disabled={i === steps.length - 1}
                    onClick={() => moveRight(i)}
                    aria-label='Move right'
                  >
                    <CaretRight size={12} />
                  </Button>
                  <Button
                    variant='ghost'
                    className='h-5 w-5 ml-auto'
                    onClick={() => remove(i)}
                    aria-label='Remove step'
                  >
                    <X size={12} />
                  </Button>
                </div>
              )}
            </div>
            {i < steps.length - 1 && (
              <span className='text-neutral-1000 font-medium flex-shrink-0'>›</span>
            )}
          </div>
        ))}

        {canAdd && (
          <>
            {steps.length > 0 && (
              <span className='text-neutral-1000 font-medium flex-shrink-0'>›</span>
            )}
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  className='h-8 gap-1 flex-shrink-0'
                  disabled={steps.length >= maxSteps}
                >
                  <Plus size={12} weight='bold' />
                  Add step
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-[220px] p-0' align='start'>
                <Command>
                  <CommandInput placeholder='Search roles...' />
                  <CommandList>
                    <CommandEmpty>No options found.</CommandEmpty>
                    <CommandGroup>
                      {stepOptions.map((opt) => (
                        <CommandItem key={opt.id} onSelect={() => addStep(opt)}>
                          {opt.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </>
        )}
      </div>
    </div>
  )
}
