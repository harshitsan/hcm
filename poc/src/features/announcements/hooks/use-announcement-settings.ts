import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedConfigVersions,
  seedImages,
  seedThoughts,
  type AnnouncementImage,
  type ConfigVersion,
  type ThoughtOfTheDay,
} from '../data/announcements'
import {
  CURRENT_ADMIN,
  seedCoordinators,
  seedOrgConfig,
  type AnnouncementCoordinator,
  type Dimension,
  type OrgConfig,
} from '../data/org'
import { todayIso } from '../utils/audience'

export type ImageDraft = Omit<AnnouncementImage, 'id' | 'updatedAt'>
export type CoordinatorDraft = Omit<AnnouncementCoordinator, 'id'>
export type ThoughtDraft = Pick<ThoughtOfTheDay, 'date' | 'text'>

/**
 * In-memory settings store: the milestone image library (ANN-32/33), the
 * versioned effective-dated module toggle (ANN-18), the governed org
 * config that feeds the audience picker (ANN-17), and the Announcement
 * Coordinator role assignments.
 */
export function useAnnouncementSettings() {
  const [images, setImages] = useState<AnnouncementImage[]>(seedImages)
  const [configVersions, setConfigVersions] = useState<ConfigVersion[]>(seedConfigVersions)
  const [orgConfig, setOrgConfig] = useState<OrgConfig>(seedOrgConfig)
  const [coordinators, setCoordinators] = useState<AnnouncementCoordinator[]>(seedCoordinators)
  const [thoughts, setThoughts] = useState<ThoughtOfTheDay[]>(seedThoughts)

  /** Add (or replace) the thought of the day for a date — feeds kx-084's surface. */
  const saveThought = useCallback((draft: ThoughtDraft) => {
    const thought: ThoughtOfTheDay = {
      ...draft,
      id: `tod-${crypto.randomUUID().slice(0, 8)}`,
      author: CURRENT_ADMIN,
    }
    setThoughts((prev) => {
      const replacing = prev.some((t) => t.date === draft.date)
      toast.success(
        replacing
          ? `Thought of the day for ${draft.date} replaced`
          : `Thought of the day for ${draft.date} saved`
      )
      return [thought, ...prev.filter((t) => t.date !== draft.date)]
    })
  }, [])

  const deleteThought = useCallback((id: string) => {
    setThoughts((prev) => prev.filter((t) => t.id !== id))
    toast.success('Thought of the day removed')
  }, [])

  /** Assign the Announcement Coordinator/Reviewer role to an employee. */
  const addCoordinator = useCallback((draft: CoordinatorDraft) => {
    setCoordinators((prev) => [
      { ...draft, id: `coord-${crypto.randomUUID().slice(0, 8)}` },
      ...prev,
    ])
    toast.success(`Role “${draft.roleName}” saved — assigned to ${draft.employee}`)
  }, [])

  const removeCoordinator = useCallback((id: string) => {
    setCoordinators((prev) => prev.filter((c) => c.id !== id))
    toast.success('Coordinator role assignment removed')
  }, [])

  const moduleEnabled = configVersions[configVersions.length - 1]?.enabled ?? true

  const addImage = useCallback((draft: ImageDraft) => {
    const image: AnnouncementImage = {
      ...draft,
      id: `img-${crypto.randomUUID().slice(0, 8)}`,
      updatedAt: todayIso(),
    }
    setImages((prev) => [image, ...prev])
    toast.success(`Image “${draft.name}” added to the library`)
  }, [])

  const updateImage = useCallback((id: string, draft: ImageDraft) => {
    setImages((prev) =>
      prev.map((img) =>
        img.id === id ? { ...img, ...draft, updatedAt: todayIso() } : img
      )
    )
    toast.success('Image mapping updated')
  }, [])

  const deleteImage = useCallback((id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id))
    toast.success('Image removed from the library')
  }, [])

  const refreshImages = useCallback(() => {
    setImages((prev) => [...prev])
    toast.info('Image library refreshed')
  }, [])

  /** Toggling the module records a new version, never overwrites (ANN-18). */
  const setModuleEnabled = useCallback((enabled: boolean, changedBy: string) => {
    setConfigVersions((prev) => [
      ...prev,
      {
        version: (prev[prev.length - 1]?.version ?? 0) + 1,
        enabled,
        effectiveFrom: todayIso(),
        changedBy,
        note: enabled
          ? 'Announcements module enabled for tenant'
          : 'Announcements module disabled for tenant',
      },
    ])
    toast.success(
      enabled
        ? 'Announcements module enabled — change versioned and effective-dated'
        : 'Announcements module disabled — compose and view surfaces are now unavailable'
    )
  }, [])

  /** Deprecated values stay on old records but leave the picker (ANN-17). */
  const toggleDeprecated = useCallback((dimension: Dimension, value: string) => {
    setOrgConfig((prev) => ({
      ...prev,
      [dimension]: prev[dimension].map((v) =>
        v.value === value ? { ...v, deprecated: !v.deprecated } : v
      ),
    }))
    toast.success(`Targeting value “${value}” updated in governed config`)
  }, [])

  return {
    coordinators,
    addCoordinator,
    removeCoordinator,
    thoughts,
    saveThought,
    deleteThought,
    images,
    addImage,
    updateImage,
    deleteImage,
    refreshImages,
    configVersions,
    moduleEnabled,
    setModuleEnabled,
    orgConfig,
    toggleDeprecated,
  }
}

export type AnnouncementSettingsStore = ReturnType<typeof useAnnouncementSettings>
