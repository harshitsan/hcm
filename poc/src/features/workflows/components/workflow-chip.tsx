/**
 * WorkflowChip — Task 5: a compact interactive chip that opens the
 * WorkflowEditorSheet for a given catalog artifact from anywhere in the app.
 *
 * Usage:
 *   <WorkflowChip artifactId="bl-abc123" />
 *   <WorkflowChip artifactId="bl-abc123" label="Leave Approval Flow" />
 *
 * - Calls e.stopPropagation() so the chip can sit inside a clickable row
 *   without triggering the row's onClick.
 * - Role gating: visible to everyone; Save inside the sheet is already
 *   role-gated (Task 4). Do NOT add gating here.
 */

import { Workflow } from 'lucide-react'
import { cn } from '@/utils/helpers'
import { useWorkflowEditor } from './workflow-editor-context'

interface WorkflowChipProps {
  /** Catalog artifact id, e.g. "bl-abc123". */
  artifactId: string
  /** Optional text label rendered beside the icon. */
  label?: string
  className?: string
}

export function WorkflowChip({ artifactId, label, className }: WorkflowChipProps) {
  const { openEditor } = useWorkflowEditor()

  return (
    <button
      type='button'
      title='Open workflow in visual builder'
      aria-label={label ? `Open workflow "${label}" in visual builder` : 'Open workflow in visual builder'}
      className={cn(
        'inline-flex items-center gap-1 rounded-[6px] border border-gray-200 bg-white',
        'px-1.5 py-0.5 text-[11px] font-medium text-neutral-1200',
        'hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700',
        'transition-colors shrink-0',
        'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
        className
      )}
      onClick={(e) => {
        e.stopPropagation()
        openEditor(artifactId)
      }}
    >
      <Workflow className='size-3' />
      {label && <span>{label}</span>}
    </button>
  )
}
