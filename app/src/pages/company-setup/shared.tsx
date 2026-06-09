/**
 * Shared building blocks for the company-setup steps.
 *
 * `RowList` is the workhorse: a compact, inline-editable table with add/remove,
 * reused by ~10 of the 14 steps so each step is just a column definition.
 */
import { Plus, Trash2 } from 'lucide-react'
import { Button, Input, Select, Switch, Table, Td, Th, Tr } from '../../components/ui'
import { cn } from '../../lib/cn'
import type { SetupState } from './model'

/** Contract every step component is rendered with. */
export type StepProps = {
  state: SetupState
  update: (patch: Partial<SetupState>) => void
}

/* ----------------------------------------------------------------- section heading */
export function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-3">
      <h4 className="text-[13px] font-bold tracking-tight text-fg">{children}</h4>
      {hint && <p className="mt-0.5 text-xs text-muted-fg">{hint}</p>}
    </div>
  )
}

/* ----------------------------------------------------------------- chip multi-select */
export function ChipMultiSelect({
  options,
  selected,
  onToggle,
}: {
  options: readonly string[]
  selected: string[]
  onToggle: (value: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = selected.includes(o)
        return (
          <button
            key={o}
            type="button"
            onClick={() => onToggle(o)}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-[13px] font-semibold transition-colors cursor-pointer',
              on ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-fg hover:bg-muted',
            )}
          >
            {o}
          </button>
        )
      })}
    </div>
  )
}

/* ----------------------------------------------------------------- editable row table */
export type Col<T> = {
  key: keyof T & string
  label: string
  type?: 'text' | 'number' | 'select' | 'switch' | 'date'
  options?: readonly string[]
  width?: string
  placeholder?: string
}

export function RowList<T extends { id: string }>({
  rows,
  cols,
  onChange,
  makeRow,
  addLabel = 'Add row',
  empty = 'Nothing here yet — add a row to get started.',
}: {
  rows: T[]
  cols: Col<T>[]
  onChange: (rows: T[]) => void
  // NoInfer keeps T anchored to `rows`/`cols` so literal row values (e.g. 'Branch')
  // stay narrowed to their union type instead of widening to string.
  makeRow: () => NoInfer<T>
  addLabel?: string
  empty?: string
}) {
  const setCell = (id: string, key: string, value: unknown) =>
    onChange(rows.map((r) => (r.id === id ? { ...r, [key]: value } : r)))
  const remove = (id: string) => onChange(rows.filter((r) => r.id !== id))

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border">
        <Table>
          <thead>
            <Tr className="border-t-0">
              {cols.map((c) => (
                <Th key={c.key} style={c.width ? { width: c.width } : undefined}>
                  {c.label}
                </Th>
              ))}
              <Th className="w-10" />
            </Tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <Tr>
                <td colSpan={cols.length + 1} className="px-4 py-6 text-center text-sm text-muted-fg">
                  {empty}
                </td>
              </Tr>
            )}
            {rows.map((r) => (
              <Tr key={r.id}>
                {cols.map((c) => (
                  <Td key={c.key} className="py-2">
                    <Cell row={r} col={c} onSet={(v) => setCell(r.id, c.key, v)} />
                  </Td>
                ))}
                <Td className="py-2">
                  <button
                    type="button"
                    onClick={() => remove(r.id)}
                    aria-label="Remove row"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-fg transition-colors hover:bg-danger/10 hover:text-danger cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </div>
      <Button variant="outline" size="sm" onClick={() => onChange([...rows, makeRow()])}>
        <Plus className="h-4 w-4" /> {addLabel}
      </Button>
    </div>
  )
}

function Cell<T extends { id: string }>({
  row,
  col,
  onSet,
}: {
  row: T
  col: Col<T>
  onSet: (value: unknown) => void
}) {
  const value = row[col.key] as unknown
  if (col.type === 'switch') {
    return <Switch checked={Boolean(value)} onChange={onSet} />
  }
  if (col.type === 'select') {
    return (
      <Select value={String(value ?? '')} onChange={(e) => onSet(e.target.value)} className="h-8 min-w-[8rem]">
        {(col.options ?? []).map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </Select>
    )
  }
  if (col.type === 'number') {
    return (
      <Input
        type="number"
        value={String(value ?? '')}
        onChange={(e) => onSet(Number(e.target.value))}
        className="h-8 w-20"
        placeholder={col.placeholder}
      />
    )
  }
  return (
    <Input
      type={col.type === 'date' ? 'date' : 'text'}
      value={String(value ?? '')}
      onChange={(e) => onSet(e.target.value)}
      className="h-8 min-w-[8rem]"
      placeholder={col.placeholder}
    />
  )
}
