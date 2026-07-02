import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { seedEmployees, type Employee } from '../data/directory'
import { seedSavedSearches, type SavedSearch } from '../data/directory-config'
import { type DirectoryFilters } from '../data/filters'

export type DirectoryViewMode = 'list' | 'card' | 'compact'

const VIEW_STORAGE_KEY = 'satellitehr-directory-view'

/**
 * In-memory directory store. Employees are read-only reference data for this
 * module; saved searches support full CRUD (DIR-07). The chosen display mode
 * persists so the directory stays consistent across visits (DIR-01 AC 5).
 */
export function useDirectory() {
  const [employees] = useState<Employee[]>(seedEmployees)
  const [savedSearches, setSavedSearches] =
    useState<SavedSearch[]>(seedSavedSearches)

  const [viewMode, _setViewMode] = useState<DirectoryViewMode>(() => {
    const saved = localStorage.getItem(VIEW_STORAGE_KEY)
    return saved === 'list' || saved === 'card' || saved === 'compact'
      ? saved
      : 'list'
  })

  const setViewMode = useCallback((mode: DirectoryViewMode) => {
    _setViewMode(mode)
    localStorage.setItem(VIEW_STORAGE_KEY, mode)
  }, [])

  const employeeById = useMemo(
    () => new Map(employees.map((e) => [e.id, e])),
    [employees]
  )

  const addSavedSearch = useCallback(
    (name: string, filters: DirectoryFilters) => {
      const search: SavedSearch = {
        id: `ss-${crypto.randomUUID().slice(0, 8)}`,
        name,
        createdAt: new Date().toISOString().slice(0, 10),
        filters,
      }
      setSavedSearches((prev) => [search, ...prev])
      toast.success(`Saved search "${name}" created`)
    },
    []
  )

  const updateSavedSearch = useCallback(
    (id: string, filters: DirectoryFilters) => {
      setSavedSearches((prev) =>
        prev.map((s) => (s.id === id ? { ...s, filters } : s))
      )
      const name =
        savedSearches.find((s) => s.id === id)?.name ?? 'Saved search'
      toast.success(`"${name}" updated with the current criteria`)
    },
    [savedSearches]
  )

  const deleteSavedSearch = useCallback((id: string) => {
    setSavedSearches((prev) => {
      const target = prev.find((s) => s.id === id)
      if (target) toast.success(`Saved search "${target.name}" deleted`)
      return prev.filter((s) => s.id !== id)
    })
  }, [])

  return {
    employees,
    employeeById,
    viewMode,
    setViewMode,
    savedSearches,
    addSavedSearch,
    updateSavedSearch,
    deleteSavedSearch,
  }
}

export type DirectoryStore = ReturnType<typeof useDirectory>
