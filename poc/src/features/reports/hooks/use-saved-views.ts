import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { seedSavedViews, type SavedView } from '../data/builder'

export type SavedViewDraft = Omit<SavedView, 'id' | 'updatedOn'>

const TODAY = '2026-07-02'

/**
 * In-memory saved ad hoc report views (RPT-08) — field, filter and grouping
 * configurations that can be reopened, re-run, renamed, updated and deleted.
 */
export function useSavedViews() {
  const [views, setViews] = useState<SavedView[]>(seedSavedViews)

  const saveView = useCallback((draft: SavedViewDraft) => {
    const view: SavedView = {
      ...draft,
      id: `sv-${crypto.randomUUID().slice(0, 8)}`,
      updatedOn: TODAY,
    }
    setViews((prev) => [view, ...prev])
    toast.success(
      `View “${draft.name}” saved with its fields, filters and grouping`
    )
    return view
  }, [])

  /** Overwrite a view's configuration with the current builder state. */
  const updateView = useCallback(
    (id: string, draft: Omit<SavedViewDraft, 'name'>) => {
      setViews((prev) =>
        prev.map((v) =>
          v.id === id ? { ...v, ...draft, updatedOn: TODAY } : v
        )
      )
      toast.success('View configuration updated')
    },
    []
  )

  const renameView = useCallback((id: string, name: string) => {
    setViews((prev) =>
      prev.map((v) => (v.id === id ? { ...v, name, updatedOn: TODAY } : v))
    )
    toast.success('View renamed')
  }, [])

  const deleteView = useCallback((id: string) => {
    setViews((prev) => prev.filter((v) => v.id !== id))
    toast.success('View deleted')
  }, [])

  return { views, saveView, updateView, renameView, deleteView }
}

export type SavedViewsStore = ReturnType<typeof useSavedViews>
