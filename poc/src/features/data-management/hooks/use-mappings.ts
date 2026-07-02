import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { seedMappings, type MappingTemplate } from '../data/mappings'

export type MappingDraft = Omit<MappingTemplate, 'id' | 'createdAt'>

/** In-memory saved-mapping store (DM-20 / DM-31). */
export function useMappings() {
  const [mappings, setMappings] = useState<MappingTemplate[]>(seedMappings)

  const addMapping = useCallback((draft: MappingDraft) => {
    const mapping: MappingTemplate = {
      ...draft,
      id: `map-${crypto.randomUUID().slice(0, 8)}`,
      createdAt: new Date().toISOString().slice(0, 10),
    }
    setMappings((prev) => [mapping, ...prev])
    toast.success(`Mapping "${draft.name}" saved for future reuse`)
    return mapping
  }, [])

  const deleteMapping = useCallback((id: string) => {
    setMappings((prev) => prev.filter((m) => m.id !== id))
  }, [])

  return { mappings, addMapping, deleteMapping }
}
