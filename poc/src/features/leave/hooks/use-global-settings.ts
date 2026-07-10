import { useState } from 'react'
import { toast } from 'sonner'
import {
  seedGlobalSettings,
  seedTimeOffAdmins,
  type TimeOffAdminAssignment,
  type TimeOffGlobalSettings,
} from '../data/global-settings'
import { shortId } from '../data/shared'

/**
 * Time Off Management global settings (Configuration → Time Off Management)
 * and Time Off Admin role assignments (Configuration → Organization → Role).
 */
export function useGlobalSettings() {
  const [settings, setSettings] =
    useState<TimeOffGlobalSettings>(seedGlobalSettings)
  const [admins, setAdmins] =
    useState<TimeOffAdminAssignment[]>(seedTimeOffAdmins)

  const updateSettings = (patch: Partial<TimeOffGlobalSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }))
    toast.success(
      'Time off management settings saved — applied at the organization level'
    )
  }

  const addAdmin = (draft: Omit<TimeOffAdminAssignment, 'id'>) => {
    setAdmins((prev) => [...prev, { ...draft, id: shortId('toadm') }])
    toast.success(
      `Role "${draft.roleName}" assigned to ${draft.assignedEmployee}`
    )
  }

  const updateAdmin = (id: string, draft: Omit<TimeOffAdminAssignment, 'id'>) => {
    setAdmins((prev) => prev.map((a) => (a.id === id ? { ...draft, id } : a)))
    toast.success(`Role "${draft.roleName}" updated`)
  }

  const removeAdmin = (id: string) => {
    const removed = admins.find((a) => a.id === id)
    setAdmins((prev) => prev.filter((a) => a.id !== id))
    toast.success(
      removed
        ? `Role "${removed.roleName}" removed — ${removed.assignedEmployee} no longer holds it`
        : 'Role assignment removed'
    )
  }

  return {
    settings,
    updateSettings,
    admins,
    addAdmin,
    updateAdmin,
    removeAdmin,
  }
}

export type GlobalSettingsStore = ReturnType<typeof useGlobalSettings>
