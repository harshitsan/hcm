/**
 * workflow-editor-context.tsx — Task 4: WorkflowEditorSheet global context
 *
 * Provides a single global WorkflowEditorProvider that owns {artifactId, open}
 * state and renders the WorkflowEditorSheet once, reachable from anywhere via
 * useWorkflowEditor().openEditor(id).
 */

import { createContext, useCallback, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { WorkflowEditorSheet } from './workflow-editor-sheet'

// ─── Context types ────────────────────────────────────────────────────────────

type WorkflowEditorContextValue = {
  openEditor: (artifactId: string) => void
}

const WorkflowEditorContext = createContext<WorkflowEditorContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

/**
 * Mount once — owns {artifactId, open} and renders WorkflowEditorSheet.
 * Place high in the tree (above any route that needs openEditor) but below
 * RoleProvider (the sheet's Save button uses hasRole).
 */
export function WorkflowEditorProvider({ children }: { children: ReactNode }): JSX.Element {
  const [artifactId, setArtifactId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const openEditor = useCallback((id: string) => {
    setArtifactId(id)
    setOpen(true)
  }, [])

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next)
    if (!next) {
      // Keep artifactId while animating closed; clear once fully closed
      // (handled by sheet's own unmount cleanup via effect)
    }
  }, [])

  return (
    <WorkflowEditorContext.Provider value={{ openEditor }}>
      {children}
      <WorkflowEditorSheet
        artifactId={artifactId}
        open={open}
        onOpenChange={handleOpenChange}
      />
    </WorkflowEditorContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useWorkflowEditor(): WorkflowEditorContextValue {
  const ctx = useContext(WorkflowEditorContext)
  if (!ctx) throw new Error('useWorkflowEditor must be used within <WorkflowEditorProvider>')
  return ctx
}
