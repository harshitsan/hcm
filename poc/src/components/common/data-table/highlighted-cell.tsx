import { highlightText } from '@/utils/highlight-text'
import { LongText } from '../long-text'
import { useDataTableContext } from './table'

interface HighlightedCellProps {
  value: string | number | null | undefined
  columnId: string
  children?: React.ReactNode
}

export function HighlightedCell({
  value,
  columnId,
  children,
}: HighlightedCellProps) {
  const { table, enableColumnSearch } = useDataTableContext()
  const column = table.getColumn(columnId)
  const filterValue = column?.getFilterValue() as string | undefined

  // If no filter or column search disabled, render normally
  if (!enableColumnSearch || !filterValue || !value) {
    return <>{children ?? String(value ?? '')}</>
  }

  const textValue = String(value)
  // Use case-insensitive highlighting (highlightText already handles this)
  const parts = highlightText(textValue, filterValue)

  return (
    <div className='flex'>
      {parts.map((part, index) =>
        part.highlight ? (
          <mark
            key={index}
            className='rounded bg-yellow-200 px-0.5 text-yellow-900'
          >
            <LongText>{part.text}</LongText>
          </mark>
        ) : (
          <LongText key={index}>{part.text}</LongText>
        )
      )}
    </div>
  )
}
