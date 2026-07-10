import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedBudgetConfig,
  seedLoginImages,
  seedThoughts,
  seedThoughtSettings,
  seedVendors,
  type BudgetPlannerConfig,
  type LoginImage,
  type Thought,
  type ThoughtSettings,
  type Vendor,
} from '../data/org-config'

export type LoginImageDraft = Omit<LoginImage, 'id' | 'uploadedOn' | 'uploadedBy'>
export type ThoughtDraft = Omit<Thought, 'id' | 'addedOn'>
export type VendorDraft = Omit<Vendor, 'id'>

/**
 * Organization configuration store — HR budget planner setup, login page
 * images, thought of the day and vendor records. In-memory, mirroring the
 * Kensium Configuration → Organization screens.
 */
export function useOrgConfig(actor: string) {
  const [budgetConfig, setBudgetConfig] =
    useState<BudgetPlannerConfig>(seedBudgetConfig)
  const [loginImages, setLoginImages] = useState<LoginImage[]>(seedLoginImages)
  const [thoughtSettings, setThoughtSettings] =
    useState<ThoughtSettings>(seedThoughtSettings)
  const [thoughts, setThoughts] = useState<Thought[]>(seedThoughts)
  const [vendors, setVendors] = useState<Vendor[]>(seedVendors)

  /* ------------------------------ HR budget ------------------------------ */

  const saveBudgetConfig = useCallback((next: BudgetPlannerConfig) => {
    setBudgetConfig(next)
    toast.success(
      `HR budget planner configuration saved — module ${next.enabled ? 'enabled' : 'disabled'}`
    )
  }, [])

  /* --------------------------- Login page images ------------------------- */

  const addLoginImage = useCallback(
    (draft: LoginImageDraft) => {
      setLoginImages((prev) => [
        ...prev,
        {
          ...draft,
          id: `img-${crypto.randomUUID().slice(0, 6)}`,
          uploadedOn: new Date().toISOString().slice(0, 10),
          uploadedBy: actor,
        },
      ])
      toast.success(`"${draft.name}" uploaded as ${draft.type}`)
    },
    [actor]
  )

  const deleteLoginImage = useCallback((id: string) => {
    setLoginImages((prev) => {
      const image = prev.find((i) => i.id === id)
      if (image) toast.success(`"${image.name}" deleted from login page images`)
      return prev.filter((i) => i.id !== id)
    })
  }, [])

  /* --------------------------- Thought of the day ------------------------ */

  const saveThoughtSettings = useCallback((next: ThoughtSettings) => {
    setThoughtSettings(next)
    toast.success(
      `Thought of the day ${next.enabled ? 'enabled' : 'disabled'} — ${next.publishType} publishing`
    )
  }, [])

  const addThought = useCallback((draft: ThoughtDraft) => {
    setThoughts((prev) => [
      ...prev,
      {
        ...draft,
        id: `tod-${crypto.randomUUID().slice(0, 6)}`,
        addedOn: new Date().toISOString().slice(0, 10),
      },
    ])
    toast.success('Thought added — it will appear on employee dashboards')
  }, [])

  const updateThought = useCallback((id: string, draft: ThoughtDraft) => {
    setThoughts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...draft } : t))
    )
    toast.success('Thought updated')
  }, [])

  const deleteThought = useCallback((id: string) => {
    setThoughts((prev) => prev.filter((t) => t.id !== id))
    toast.success('Thought deleted')
  }, [])

  /* -------------------------------- Vendors ------------------------------ */

  const addVendor = useCallback((draft: VendorDraft) => {
    setVendors((prev) => [
      ...prev,
      { ...draft, id: `ven-${crypto.randomUUID().slice(0, 6)}` },
    ])
    toast.success(`Vendor "${draft.name}" added`)
  }, [])

  const updateVendor = useCallback((id: string, draft: VendorDraft) => {
    setVendors((prev) => prev.map((v) => (v.id === id ? { ...v, ...draft } : v)))
    toast.success(`Vendor "${draft.name}" updated`)
  }, [])

  const deleteVendor = useCallback((id: string) => {
    setVendors((prev) => {
      const vendor = prev.find((v) => v.id === id)
      if (vendor) toast.success(`Vendor "${vendor.name}" deleted`)
      return prev.filter((v) => v.id !== id)
    })
  }, [])

  const toggleVendorStatus = useCallback((id: string) => {
    setVendors((prev) =>
      prev.map((v) => {
        if (v.id !== id) return v
        const status = v.status === 'Active' ? 'Inactive' : 'Active'
        toast.success(`Vendor "${v.name}" marked ${status}`)
        return { ...v, status }
      })
    )
  }, [])

  return {
    budgetConfig,
    saveBudgetConfig,
    loginImages,
    addLoginImage,
    deleteLoginImage,
    thoughtSettings,
    saveThoughtSettings,
    thoughts,
    addThought,
    updateThought,
    deleteThought,
    vendors,
    addVendor,
    updateVendor,
    deleteVendor,
    toggleVendorStatus,
  }
}

export type OrgConfigStore = ReturnType<typeof useOrgConfig>
