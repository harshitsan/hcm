import { useState } from 'react'
import { DotsThree, Plus } from 'phosphor-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { shortId } from '@/features/leave/data/shared'
import type { SettingStatusChip } from './types'

export interface RuleClause {
  attributeId: string
  operator: string
  value: string
}

export interface Rule {
  id: string
  when: RuleClause[]
  outcomeId: string
  enabled: boolean
}

export interface RuleAttribute {
  id: string
  label: string
  operators: string[]
  values?: { id: string; label: string }[]
  valueType?: 'text' | 'number' | 'duration'
}

export interface RulePillBuilderProps {
  rules: Rule[]
  onChange: (r: Rule[]) => void
  attributes: RuleAttribute[]
  outcomes: { id: string; label: string; tone?: SettingStatusChip['tone'] }[]
  maxRules?: number
}

type BadgeVariant = 'outline' | 'completed' | 'open' | 'destructive'

function toneToVariant(tone?: SettingStatusChip['tone']): BadgeVariant {
  if (tone === 'positive') return 'completed'
  if (tone === 'warning') return 'open'
  if (tone === 'danger') return 'destructive'
  return 'outline'
}

interface ValuePickerProps {
  attr: RuleAttribute | undefined
  value: string
  onValue: (v: string) => void
}

function ValuePicker({ attr, value, onValue }: ValuePickerProps) {
  const [open, setOpen] = useState(false)

  if (!attr) {
    return <Badge variant='outline' className='cursor-pointer opacity-50'>value</Badge>
  }

  if (attr.valueType === 'text' || attr.valueType === 'number' || attr.valueType === 'duration') {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Badge variant='outline' className='cursor-pointer'>
            {value || `enter ${attr.valueType}`}
          </Badge>
        </PopoverTrigger>
        <PopoverContent className='w-[180px] p-2' align='start'>
          <Input
            autoFocus
            type={attr.valueType === 'number' ? 'number' : 'text'}
            placeholder={attr.valueType}
            value={value}
            onChange={(e) => onValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') setOpen(false) }}
            className='h-7 text-sm'
          />
        </PopoverContent>
      </Popover>
    )
  }

  const options = attr.values ?? []

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Badge variant='outline' className='cursor-pointer'>
          {options.find((o) => o.id === value)?.label ?? (value || 'pick value')}
        </Badge>
      </PopoverTrigger>
      <PopoverContent className='w-[200px] p-0' align='start'>
        <Command>
          <CommandInput placeholder='Search...' />
          <CommandList>
            <CommandEmpty>No options.</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.id}
                  onSelect={() => { onValue(o.id); setOpen(false) }}
                >
                  {o.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

interface ClausePillsProps {
  clause: RuleClause
  attributes: RuleAttribute[]
  onClause: (c: RuleClause) => void
}

function ClausePills({ clause, attributes, onClause }: ClausePillsProps) {
  const [attrOpen, setAttrOpen] = useState(false)
  const [opOpen, setOpOpen] = useState(false)

  const selectedAttr = attributes.find((a) => a.id === clause.attributeId)

  return (
    <span className='flex items-center gap-1 flex-wrap'>
      <Popover open={attrOpen} onOpenChange={setAttrOpen}>
        <PopoverTrigger asChild>
          <Badge variant='outline' className='cursor-pointer'>
            {selectedAttr?.label ?? 'attribute'}
          </Badge>
        </PopoverTrigger>
        <PopoverContent className='w-[200px] p-0' align='start'>
          <Command>
            <CommandInput placeholder='Search attributes...' />
            <CommandList>
              <CommandEmpty>No attributes.</CommandEmpty>
              <CommandGroup>
                {attributes.map((a) => (
                  <CommandItem
                    key={a.id}
                    onSelect={() => {
                      onClause({ attributeId: a.id, operator: a.operators[0] ?? '', value: '' })
                      setAttrOpen(false)
                    }}
                  >
                    {a.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Popover open={opOpen} onOpenChange={setOpOpen}>
        <PopoverTrigger asChild>
          <Badge variant='outline' className='cursor-pointer'>
            {clause.operator || 'operator'}
          </Badge>
        </PopoverTrigger>
        <PopoverContent className='w-[160px] p-0' align='start'>
          <Command>
            <CommandList>
              <CommandEmpty>No operators.</CommandEmpty>
              <CommandGroup>
                {(selectedAttr?.operators ?? []).map((op) => (
                  <CommandItem
                    key={op}
                    onSelect={() => { onClause({ ...clause, operator: op }); setOpOpen(false) }}
                  >
                    {op}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <ValuePicker
        attr={selectedAttr}
        value={clause.value}
        onValue={(v) => onClause({ ...clause, value: v })}
      />
    </span>
  )
}

export function RulePillBuilder({
  rules,
  onChange,
  attributes,
  outcomes,
  maxRules,
}: RulePillBuilderProps) {
  const [outcomeOpenFor, setOutcomeOpenFor] = useState<string | null>(null)

  const updateRule = (id: string, patch: Partial<Rule>) => {
    onChange(rules.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  const updateClause = (ruleId: string, clauseIdx: number, clause: RuleClause) => {
    onChange(
      rules.map((r) =>
        r.id === ruleId
          ? { ...r, when: r.when.map((c, i) => (i === clauseIdx ? clause : c)) }
          : r
      )
    )
  }

  const duplicateRule = (rule: Rule) => {
    const copy: Rule = { ...rule, id: shortId('rule') }
    const idx = rules.findIndex((r) => r.id === rule.id)
    const next = [...rules]
    next.splice(idx + 1, 0, copy)
    onChange(next)
  }

  const deleteRule = (id: string) => {
    onChange(rules.filter((r) => r.id !== id))
  }

  const addRule = () => {
    const firstAttr = attributes[0]
    const newRule: Rule = {
      id: shortId('rule'),
      when: firstAttr
        ? [{ attributeId: firstAttr.id, operator: firstAttr.operators[0] ?? '', value: '' }]
        : [],
      outcomeId: outcomes[0]?.id ?? '',
      enabled: true,
    }
    onChange([...rules, newRule])
  }

  const canAdd = maxRules === undefined || rules.length < maxRules

  if (rules.length === 0) {
    return (
      <div className='space-y-2'>
        <div className='rounded-[8px] border-2 border-dashed border-gray-200 p-4 text-center text-sm text-neutral-1000'>
          No rules configured. Add a rule to get started.
        </div>
        {canAdd && (
          <Button variant='outline' className='h-7 gap-1' onClick={addRule}>
            <Plus size={12} weight='bold' />
            Add rule
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className='space-y-2'>
      {rules.map((rule) => {
        const outcome = outcomes.find((o) => o.id === rule.outcomeId)
        return (
          <div
            key={rule.id}
            className='flex items-start gap-2 rounded-[8px] border border-gray-200 bg-white p-2 flex-wrap'
          >
            <Switch
              checked={rule.enabled}
              onCheckedChange={(v) => updateRule(rule.id, { enabled: v })}
              className='mt-0.5 flex-shrink-0'
            />

            <span className='text-xs text-neutral-1000 mt-1 flex-shrink-0'>When</span>

            <span className='flex items-center gap-1 flex-wrap flex-1 min-w-0'>
              {rule.when.map((clause, ci) => (
                <ClausePills
                  key={ci}
                  clause={clause}
                  attributes={attributes}
                  onClause={(c) => updateClause(rule.id, ci, c)}
                />
              ))}
            </span>

            <span className='text-neutral-1000 flex-shrink-0 mt-1'>→</span>

            <Popover
              open={outcomeOpenFor === rule.id}
              onOpenChange={(o) => setOutcomeOpenFor(o ? rule.id : null)}
            >
              <PopoverTrigger asChild>
                <Badge
                  variant={toneToVariant(outcome?.tone)}
                  className='cursor-pointer mt-0.5'
                >
                  {outcome?.label ?? 'pick outcome'}
                </Badge>
              </PopoverTrigger>
              <PopoverContent className='w-[200px] p-0' align='start'>
                <Command>
                  <CommandList>
                    <CommandEmpty>No outcomes.</CommandEmpty>
                    <CommandGroup>
                      {outcomes.map((o) => (
                        <CommandItem
                          key={o.id}
                          onSelect={() => {
                            updateRule(rule.id, { outcomeId: o.id })
                            setOutcomeOpenFor(null)
                          }}
                        >
                          {o.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' className='h-6 w-6 p-0 flex-shrink-0'>
                  <DotsThree size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem onSelect={() => duplicateRule(rule)}>
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant='destructive'
                  onSelect={() => deleteRule(rule.id)}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      })}

      {canAdd && (
        <Button variant='outline' className='h-7 gap-1' onClick={addRule}>
          <Plus size={12} weight='bold' />
          Add rule
        </Button>
      )}
    </div>
  )
}
