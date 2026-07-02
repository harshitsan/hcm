import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedConfigVersions,
  seedImages,
  type AnnouncementImage,
  type ConfigVersion,
} from '../data/announcements'
import { seedOrgConfig, type Dimension, type OrgConfig } from '../data/org'
import { todayIso } from '../utils/audience'

export type ImageDraft = Omit<AnnouncementImage, 'id' | 'updatedAt'>

/**
 * In-memory settings store: the milestone image library (ANN-32/33), the
 * versioned effective-dated module toggle (ANN-18), and the governed org
 * config that feeds the audience picker (ANN-17).
 */
export function useAnnouncementSettings() {
  const [images, setImages] = useState<AnnouncementImage[]>(seedImages)
  const [configVersions, setConfigVersions] = useState<ConfigVersion[]>(seedConfigVersions)
  const [orgConfig, setOrgConfig] = useState<OrgConfig>(seedOrgConfig)

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
